import json
import time
from typing import Any
import webview
import logging as L
import datetime
import threading
from datetime import timedelta

from api_callnotes import CallNotesApi
from api_cat import CatApi
from api_hidden_spots import HiddenSpotsApi
from api_imports import ImportApi
from bands import get_band, get_name_of_band, bandNames
from db.db import DataBase
from db.models.activators import Activator, ActivatorSchema
from db.models.alerts import AlertsSchema
from db.models.parks import Park, ParkSchema
from db.models.qsos import Qso, QsoSchema
from db.models.spot_comments import SpotCommentSchema
from db.models.spots import Spot, SpotSchema
from integrations.wsjtx.integration import ColorConfig, Integration
from loggers import LoggerInterface
from loggers.logger_interface import LoggerParams
from programs.apis import PotaApi
from programs import Program, SotaProgram, WwffProgram, PotaProgram, WwbotaProgram, NoProgram  # NOQA
from utils.distance import Distance
from utils.adif import AdifLog
from utils.wavelog import get_stations
from version import __version__

logging = L.getLogger(__name__)


class JsApi:
    def __init__(self):
        self.lock = threading.Lock()
        self.db = DataBase()
        self.pota = PotaApi()
        self.programs: dict[str, Program] = {
            "POTA": PotaProgram(self.db),
            "SOTA": SotaProgram(self.db),
            "WWFF": WwffProgram(self.db),
            "WWBOTA": WwbotaProgram(self.db),
            '': NoProgram(self.db)
        }
        self.seen_regions = [""]

        # refactored APIs for js use
        self.imports = ImportApi(self.db, self.programs)
        self.hidden_spots = HiddenSpotsApi(self.db, self.programs)
        self.callsign_notes = CallNotesApi(self.db, self.programs)

        logging.debug("init logger...")
        lp = LoggerParams(
            self.db.config.get_value('logger_type'),
            self.db.config.get_value('my_call'),
            self.db.config.get_value('my_grid6'),
            self.db.config.get_value('adif_host'),
            self.db.config.get_value('adif_port'),
            self.db.config.get_value('wl_url'),
            self.db.config.get_value('wl_api_key'),
            self.db.config.get_value('wl_station_id'),
            self.db.config.get_value('qrz_api_key')
        )
        self.adif_log = LoggerInterface.get_logger(lp, __version__)
        logging.debug(f"got logger {self.adif_log}")

        try:
            logging.debug("getting CAT params")
            rig_if = self.db.config.get_value('rig_if_type')
            ip = self.db.config.get_value('flr_host')
            port = self.db.config.get_value('flr_port')
            self.cat = CatApi(self.db, rig_if, ip, port)
        except Exception:
            logging.error("Error creating CAT object: ", exc_info=True)
            self.cat = None
        self.pw = None

        ws_int = self.db.config.get_value('enable_wsjtx_int')
        if ws_int:
            logging.debug('starting wsjtx integration...')
            ip = self.db.config.get_value('wsjtx_ip_addr')
            port = self.db.config.get_value('wsjtx_udp_port')
            self.db.config.get_value('enable_wsjtx_int')
            self._wsjtx = Integration(
                log_handler=self._wsjtx_log_handle,
                status_handler=self._wsjtx_status_handler,
                ip=ip,
                port=port
            )
            self._wsjtx.start()
        else:
            self._wsjtx = None

    def get_spot(self, spot_id: int):
        logging.debug('py get_spot')
        spot = self.db.spots.get_spot(spot_id)
        ss = SpotSchema()
        return ss.dumps(spot)

    def get_spots(self):
        logging.debug('py get_spots')
        spots = self.db.spots.get_spots()
        ss = SpotSchema(many=True)
        return ss.dumps(spots)

    def get_spot_comments(self, spot_id: int):
        spot = self.db.spots.get_spot(spot_id)

        if spot is None:
            return json.dumps([])

        x = self.db.get_spot_comments(spot.activator, spot.reference)
        ss = SpotCommentSchema(many=True)
        return ss.dumps(x)

    def insert_spot_comments(self, spot_id: int):
        '''
        Pulls the spot comments from the POTA api and inserts them into our
        database.

        :param int spot_id: spot id. pk in db
        '''
        spot = self.db.spots.get_spot(spot_id)
        if spot is None:
            return

        # other program dont have this (AFAIK) so unlock and return
        if spot.spot_source != 'POTA':
            return

        comms = self.pota.get_spot_comments(spot.activator, spot.reference)
        try:
            logging.debug('getting lock insert spot comments')
            if not self.lock.acquire(timeout=4.00):
                # self.db.session.rollback()
                logging.warning("insert_spot_comments: lock not acquired")
                return
            self.db.insert_spot_comments(spot.activator, spot.reference, comms)
        finally:
            if self.lock.locked():
                self.lock.release()

    def get_qso_from_spot(self, id: int):
        # cfg = self.db.get_user_config()
        # my_grid = self.db.config.get_value("my_grid6")

        # if we cant get a lock return null
        logging.debug('getting lock for qso from spot')
        if not self.lock.acquire(timeout=4.00):
            # self.db.session.rollback()
            # [cmw] when we get in this segment, HL doesn't recover without
            # refresh. maybe we add some way to fiddle w/ timeout value. idk
            # remove rollback() for now as its probably a problem.
            logging.warning("timed out lock acquisition. session rollback")
            return self._response(False, "failed to get db lock. timed out.")

        spot = self.db.spots.get_spot(id)
        if spot is None:
            logging.warning(f"spot not found {id}")
            if self.lock.locked():
                self.lock.release()
            return self._response(False, "failed to get spot.")

        prog = spot.spot_source
        q = self.programs[prog].build_qso(spot)

        if q is None:
            logging.error(f"failed to build qso from spot {spot}")
            if self.lock.locked():
                self.lock.release()
            return self._response(False, "failed to build qso from spot.")

        # if q.gridsquare:
        #     dist = Distance.distance(my_grid, q.gridsquare)
        #     bearing = Distance.bearing(my_grid, q.gridsquare)
        #     q.distance = dist
        #     q.bearing = bearing
        qs = QsoSchema()
        result = qs.dumps(q)

        if self.lock.locked():
            self.lock.release()
        return self._response(True, "", qso=result)

    def get_activator_stats(self, callsign):
        # logging.debug("getting activator stats...")
        ac = self._get_activator(callsign)
        if ac is None:
            return self._response(
                False,
                f"POTA account for {callsign} not found",
                transient=True)
        return ActivatorSchema().dumps(ac)

    def get_activator_hunts(self, callsign):
        logging.debug("getting hunt count stats...")
        return self.db.qsos.get_activator_hunts(callsign)

    def get_reference(
            self,
            sig: str,
            ref: str,
            pull_from_api: bool = True) -> str:
        '''
        Returns the JSON for the location reference if found in the db. If not
        it can be downloaded from the program's API

        :param str sig: the SIG id of the program
        :param str ref: the programs reference designator string
        :param bool pull_from_pota: True (default) to try to download data when
            a reference is not in the db.

        :returns API response containing the JSON of park object. Or None if
            not found and not downloaded. the park JSON is in
            result.park_data field
        '''
        try:
            prog = self.programs[sig]
            ref = prog.get_reference(ref, pull_from_api)
            ps = ParkSchema()
            json = ps.dumps(ref)
            return self._response(True, "", park_data=json)
        except Exception as ex:
            logging.error("error getting ref", exc_info=ex)
            return self._response(False, f"Error getting reference: {ref}")

    def get_park_hunts(self, ref: str) -> str:
        '''
        Returns a JSON object containing the number of QSOs with activators at
        the given park reference.

        :param str ref: the POTA park reference designator string

        :returns JSON of park object in db or None if not found
        '''
        if ref is None:
            logging.error("get_park: ref param was None")
            return self._response(False, "park references invalid")

        park = self.db.parks.get_park(ref)

        if park is None:
            return self._response(True, "", count=0)
        else:
            return self._response(True, "", count=park.hunts)

    def get_park_hunted_bands(self, freq: str, ref: str) -> str:
        '''
        Gets data about a references hunted bands.

        :param str freq: current freq in MHz. used to test for previously
                         hunted bands
        :param str ref: the park/summit reference designator string

        :returns JSON with two fields, bands (string) and new_band (bool)
        '''
        if ref is None:
            logging.error("get_park_hunted_bands: ref param was None")
            return self._response(False, "park references invalid")

        hunted_bands = self.db.qsos.get_ref_hunted_bands(ref)

        current_band = get_band(freq)
        new_band = True
        if current_band is not None and current_band.value in hunted_bands:
            new_band = False

        if hunted_bands is None:
            return self._response(True, "", bands='unknown qso data',
                                  new_band=True)
        else:
            txt = ",".join(map(get_name_of_band, hunted_bands))
            return self._response(True, "", bands=txt,
                                  new_band=new_band)

    # def get_user_config(self):
    #     '''
    #     Returns the JSON for the user configuration record in the db
    #     '''
    #     cfg = self.db.get_user_config()
    #     return UserConfigSchema().dumps(cfg)

    def get_user_config2(self):
        '''
        Returns the JSON for the user configuration record in the db
        '''
        x = self.db.config.get_editable_json()
        return x

    def get_user_config_val(self, k: str):
        '''
        Returns API response with the value of a given config setting in the
        `val` property.

        If config key is not found, returns error API response.
        '''
        try:
            x = self.db.config.get_value(k)
        except KeyError as ke:
            logging.error('get_user_config_val caught KeyError', exc_info=ke)
            return self._response(False, f"Config Key {k} not found")

        return self._response(True, "", val=x)

    def get_version_num(self):
        db_ver = self.db.get_version()
        logging.debug(f'get_version_num {__version__} - {db_ver} ')
        return self._response(
            True,
            "",
            app_ver=__version__,
            db_ver=db_ver)

    def spot_activator(self, qso_data, park: str) -> str:
        '''
        Spots the activator at the given park. The QSO data needs to be filled
        out for this to work properly. Needs freq, call, and mode

        :param any qso_data: dict of qso data from the UI
        :param string spot_comment: the comment to add to the spot.
        '''
        f = qso_data['freq']
        a = qso_data['call']
        m = qso_data['mode']
        r = qso_data['rst_sent']
        c = str(qso_data['comment'])

        logging.debug(f"sending spot for {a} on {f}")

        # cfg = self.db.get_user_config()

        # if spot+log is used the comment is modified before coming here.
        # remove boilerplate fluff and get the users comments for spot
        if c.startswith("["):
            x = c.index("]") + 1
            c = c[x:]

        include_rst = self.db.config.get_value("include_rst")
        qth = self.db.config.get_value("qth_string")
        my_call = self.db.config.get_value("my_call")

        if include_rst:
            r += ' '  # add space between rst and qth str
        else:
            r = ''

        if qth is not None:
            spot_comment = f"[{r}{qth}] {c}"
        else:
            spot_comment = f"[{r}] {c}"

        try:
            # logging.debug(f"posting spot with {spot_comment}")
            PotaApi.post_spot(activator_call=a,
                              park_ref=park,
                              freq=f,
                              mode=m,
                              spotter_call=my_call,
                              spotter_comments=spot_comment)
        except Exception as ex:
            msg = "Error posting spot to pota api!"
            logging.error(msg)
            logging.exception(ex)
            return self._response(False, msg)

        return self._response(True, "spot posted")

    def stage_qso(self, qso_data):
        logging.debug('staging qso')

        do_stage = self.db.config.get_value('stage_qsos')

        if not do_stage:
            return self._response(True, '')

        try:
            qso_dic = json.loads(qso_data)
            self.adif_log.stage_qso(qso_dic)
        except Exception as log_ex:
            logging.exception(
                msg="Error staging QSO:",
                exc_info=log_ex)
            self.lock.release()
            return self._response(False, f"Error staging qso: {log_ex}")

        return self._response(True, '')

    def clear_staged_qso(self):
        logging.debug('clear_staged_qso qso')
        try:
            self.adif_log.clear_staged()
        except Exception as log_ex:
            logging.exception(
                msg="Error clearing staged qsos:",
                exc_info=log_ex)
            self.lock.release()
            return self._response(False, "Error clearing staged qsos")

        return self._response(True, '')

    def _log_qso_internal(self, qso_data) -> tuple[bool, Any]:
        logging.info('acquiring lock to log qso')
        self.lock.acquire()

        def_pwr = self.db.config.get_value('default_pwr')

        try:
            program = qso_data['sig']
            ref = qso_data['sig_info']
            pota_ref = qso_data['pota_ref'] if 'pota_ref' in qso_data else ''

            self.programs[program].inc_ref_hunt(ref, pota_ref)

            qso_data['tx_pwr'] = def_pwr
            logging.debug(f"logging qso: {qso_data}")
            id = self.db.qsos.insert_new_qso(qso_data)
        except Exception as ex:
            logging.error("Error logging QSO to db:")
            logging.exception(ex)
            self.lock.release()
            return False, self._response(False, f"Error logging QSO: {ex}")

        # get the data to log to the adif file and remote adif host
        qso = self.db.qsos.get_qso(id)
        act = self.db.get_activator_name(qso_data['call'])
        qso.name = act if act is not None else 'ERROR NO NAME'

        # db written so commit & release lock
        self.db.commit_session()
        self.lock.release()
        return True, qso

    def _log_qso_remote(self, qso) -> tuple[bool, str]:
        try:
            self.adif_log.log_qso(qso)
        except Exception as ex:
            logging.exception(
                msg="Error logging QSO to as adif (local/remote):",
                exc_info=ex)
            return False, self._response(False, f"Error logging as ADIF: {ex}")

        return True, ''

    def log_qso(self, qso_data):
        '''
        Logs the QSO to the database, adif file, and updates stats. Will force
        a reload of the currently displayed spots.

        :param any qso_data: dict of qso data from the UI
        '''
        # logging.info('acquiring lock to log qso')
        # self.lock.acquire()

        # def_pwr = self.db.config.get_value('default_pwr')

        # try:
        #     program = qso_data['sig']
        #     ref = qso_data['sig_info']
        #     pota_ref = qso_data['pota_ref'] if 'pota_ref' in qso_data else ''

        #     self.programs[program].inc_ref_hunt(ref, pota_ref)

        #     qso_data['tx_pwr'] = def_pwr
        #     logging.debug(f"logging qso: {qso_data}")
        #     id = self.db.qsos.insert_new_qso(qso_data)
        # except Exception as ex:
        #     logging.error("Error logging QSO to db:")
        #     logging.exception(ex)
        #     self.lock.release()
        #     return self._response(False, f"Error logging QSO: {ex}")

        # # get the data to log to the adif file and remote adif host
        # qso = self.db.qsos.get_qso(id)
        # act = self.db.get_activator_name(qso_data['call'])
        # qso.name = act if act is not None else 'ERROR NO NAME'

        # # db written so commit & release lock
        # self.db.commit_session()
        # self.lock.release()

        success, resp = self._log_qso_internal(qso_data)

        if not success:
            # resp here is api error str
            return resp

        # here resp is qso obj
        qso = resp

        success, resp = self._log_qso_remote(qso)
        if not success:
            # resp here is api error str
            return resp

        # try:
        #     self.adif_log.log_qso(qso)
        # except Exception as log_ex:
        #     logging.exception(
        #         msg="Error logging QSO to as adif (local/remote):",
        #         exc_info=log_ex)
        #     self.lock.release()
        #     return self._response(False, f"Error logging as ADIF: {log_ex}")

        return self._response(True, "QSO logged successfully")

    def log_mulitop_qso(self, qso_data, other_ops: list[str]):
        '''
        Logs the QSO to the database, adif file, and updates stats. Will log
        the same qso but change the callsign to each call given in the multi-op
        list

        :param any qso_data: dict of qso data from the UI
        :param list[str] other_ops: array of other op callsigns
        '''
        logging.info('acquiring lock to log multi-OP qso')
        self.lock.acquire()

        def_pwr = self.db.config.get_value('default_pwr')

        try:
            program = qso_data['sig']
            ref = qso_data['sig_info']
            pota_ref = qso_data['pota_ref'] if 'pota_ref' in qso_data else ''

            self.programs[program].inc_ref_hunt(ref, pota_ref)

            qso_data['tx_pwr'] = def_pwr
            logging.debug(f"logging qso: {qso_data}")
            ids = self.db.qsos.insert_new_qso_multi(qso_data, other_ops)
        except Exception as ex:
            logging.error("Error logging QSO to db:")
            logging.exception(ex)
            self.lock.release()
            return self._response(False, f"Error logging QSO: {ex}")

        for id in ids:
            # get the data to log to the adif file and remote adif host
            qso = self.db.qsos.get_qso(id)
            act = self.db.get_activator_name(qso_data['call'])
            qso.name = act if act is not None else 'ERROR NO NAME'
            self.db.commit_session()
            try:
                self.adif_log.log_qso(qso)
            except Exception as log_ex:
                logging.exception(
                    msg="Error logging QSO to as adif (local/remote):",
                    exc_info=log_ex)
                self.lock.release()
                return self._response(False, f"Error logging ADIF: {log_ex}")

            # delay here - the remote logger may need to catch its breath
            time.sleep(1.0)

        logging.info('releasing multi-op lock')
        self.lock.release()
        return self._response(True, "QSO logged successfully")

    def refresh_spot(self, spot_id: int, call: str, ref: str):
        '''
        Refreshes the data for a given spot. If the spot_id is out of date from
        a refresh, this will lookup the new spot by call and ref.

        :param int spot_id: valid id of spot in db (this id from endpoints)
        :param str call: callsign of activator
        :param str ref:  sig_info ie. park reference

        :return: see API._response(). `False` if a bad id was given
        '''
        logging.debug(f"spot id = {spot_id}")

        if spot_id <= 0:
            logging.warning('bad spot id passed to refresh_spot')
            return self._response(False, "")

        logging.info(f"doing single spot update {spot_id}")

        to_mod: Spot = self.db.spots.get_spot(spot_id)

        if to_mod is None:
            logging.warning("refresh_spot: didn't find a spot for this id")
            spot = self.db.spots.get_spot_by_actx(call, ref)
            if spot is None:
                logging.warning("refresh_spot: didn't find a spot for actx")
                return self._response(False, "")

            spot_id = spot.spotId
            to_mod = self.db.spots.get_spot(spot_id)
            if to_mod is None:
                self.db.session.commit()
                return self._response(False, "")

        x = to_mod.spot_source
        self.programs[x].update_spot_metadata(to_mod)
        self.db.session.commit()
        return self._response(True, "")

    def export_qsos(self):
        '''
        Exports the QSOs logged with this logger app into a file.
        '''
        try:
            qs = self.db.qsos.get_qsos_from_app()
            my_call = self.db.config.get_value('my_call')
            my_grid6 = self.db.config.get_value('my_grid6')

            dt = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            log = AdifLog(filename=f"{dt}_export.adi")
            for q in qs:
                log.log_qso(q, my_call, my_grid6)

            return self._response(True, "QSOs exported successfully")
        except Exception as ex:
            logging.exception("Error exporting the DB")
            return self._response(
                False, "Error exporting QSOs from DB", ext=str(ex))

    # def set_user_config(self, config_json: any):
    #     logging.debug(f"setting config {config_json}")
    #     self.db.update_user_config(config_json)

    #     lp = LoggerParams(
    #         self.db.config.get_value('logger_type'),
    #         self.db.config.get_value('my_call'),
    #         self.db.config.get_value('my_grid6'),
    #         self.db.config.get_value('adif_host'),
    #         self.db.config.get_value('adif_port'),
    #     )
    #     self.adif_log = LoggerInterface.get_logger(lp, __version__)
    #     logging.debug(f"updating logger {self.adif_log}")

    def set_user_config2(self, config2_json: any):
        logging.debug(f"setting config2 {config2_json}")
        # self.db.update_user_config(config2_json)
        self.db.config.set_editable_json(config2_json)

        lp = LoggerParams(
            self.db.config.get_value('logger_type'),
            self.db.config.get_value('my_call'),
            self.db.config.get_value('my_grid6'),
            self.db.config.get_value('adif_host'),
            self.db.config.get_value('adif_port'),
            self.db.config.get_value('wl_url'),
            self.db.config.get_value('wl_api_key'),
            self.db.config.get_value('wl_station_id'),
            self.db.config.get_value('qrz_api_key'),
        )
        self.adif_log = LoggerInterface.get_logger(lp, __version__)
        logging.debug(f"updating logger {self.adif_log}")

    def get_wavelog_stations(self, url: str, api_key: str) -> str:
        '''
        Gets the list of station profiles from a Wavelog instance, so the
        config UI can offer them in a drop down.

        The url and api key are passed in from the UI rather than read from
        the config, so the user can populate the drop down before saving.

        :param str url: url of Wavelog instance (without endpoints appended)
        :param str api_key: generated api key for wavelog API access

        :returns str: json with either a `stations` list or an `error` string
        '''
        logging.debug(f"getting wavelog stations from {url}")

        try:
            stations = get_stations(url, api_key)
        except Exception as ex:
            logging.warning(f"error getting wavelog stations: {ex}")
            return json.dumps({"error": str(ex)})

        return json.dumps({"stations": stations})

    def set_mode_filter(self, modes: list[str]):
        logging.debug(f"api setting modes filter to: {modes}")
        self.db.filters.set_mode_filter(modes)

    def set_band_filter(self, bands: list[int]):
        logging.debug(f"api setting band filter to: {bands}")
        self.db.filters.set_band_filter(bands)

    def set_region_filter(self, region: list[str]):
        logging.debug(f"api setting region filter to: {region}")
        self.db.filters.set_region_filter(region)

    def set_continent_filter(self, continents: list[str]):
        logging.debug(f"api setting cont filter to: {continents}")
        self.db.filters.set_continent_filter(continents)

    def set_location_filter(self, location: str):
        logging.debug(f"setting region filter to {location}")
        self.db.filters.set_location_filter(location)

    def set_qrt_filter(self, is_qrt: bool):
        logging.debug(f"api setting qrt filter to: {is_qrt}")
        self.db.filters.set_qrt_filter(is_qrt)

    def set_hidden_filter(self, show_hidden: bool):
        logging.debug(f"api setting hidden filter to: {not show_hidden}")

        # if show_hidden is true, then the filter needs to be turned off
        self.db.filters.set_hidden_filter(not show_hidden)

    def set_hunted_filter(self, filter_hunted: bool):
        logging.debug(f"api setting hunted filter to: {filter_hunted}")
        self.db.filters.set_hunted_filter(filter_hunted)

    def set_only_new_filter(self, filter_only_new: bool):
        logging.debug(f"api setting ATNO filter to: {filter_only_new}")
        self.db.filters.set_only_new_filter(filter_only_new)

    def set_sig_filter(self, sig_filter: str):
        '''
        Set the Special Interest Group (sig) filter.

        :param string sig_filter: only POTA or SOTA or WWFF
        '''
        logging.debug(f"api setting SIG filter to: {sig_filter}")
        self.db.filters.set_sig_filter(sig_filter)

    def update_activator_stats(self, callsign: str) -> int:
        j = self.pota.get_activator_stats(callsign)

        if j is not None:
            # the json will be none if say the call doesn't return success
            # from api. probably they dont have an account
            return self.db.update_activator_stat(j)
        else:
            logging.warning(f"activator callsign {callsign} not found")
            return -1

    def export_park_data(self) -> str:
        '''
        Dumps the entire parks table into a file named 'park_export.json'.

        This can then be later used to import. This is useful to avoid having
        to download park info from the POTA endpoints.
        '''
        logging.debug("export_park_data: dumping parks table...")
        parks = self.db.parks.get_parks()
        schema = ParkSchema()
        data = schema.dumps(parks, many=True)

        with open("park_export.json", "w") as out:
            out.write(data)

        return self._response(
            True, "Park data exported successfully")

    def import_park_data(self) -> str:
        '''
        Loads previously exported park data from a file into the parks table.

        The opposite of :meth:`export_park_data`
        '''
        logging.debug("import_park_data: loading table...")

        ft = ('JSON files (*.json)', 'All files (*.*)')
        filename = webview.windows[0] \
            .create_file_dialog(
                webview.OPEN_DIALOG,
            file_types=ft)

        if not filename:
            # user cancelled
            return self._response(True, "")

        with open(filename[0], "r") as input:
            text = input.read()
            obj = json.loads(text)
            self.db.parks.import_park_data(obj)

        logging.debug("import_park_data: import finished")

        return self._response(
            True, "Park data imported successfully", persist=True)

    def get_seen_regions(self) -> str:
        '''
        Gets a sorted list of distinct regions (POTA) and associations (SOTA)
        that are in the current set of spots.
        '''
        x = self.seen_regions
        # logging.debug(f"return seen regions: {x}")
        return self._response(True, '', seen_regions=x)

    def get_alerts(self):
        '''
        Gets the list of user configured alert filters.
        '''
        logging.debug('py get_alerts')
        alerts = self.db.alerts.get_alerts()
        schema = AlertsSchema(many=True)
        return schema.dumps(alerts)

    def set_alerts(self, alerts: str):
        '''
        Sets the list of user configured alert filters.
        '''
        logging.debug('py set_alerts ' + alerts)
        new_alerts = json.loads(alerts)
        logging.debug(new_alerts)
        schema = AlertsSchema(many=True)
        to_load = schema.load(new_alerts, session=self.db.session,
                              many=True, partial=True)
        self.db.session.add_all(to_load)
        self.db.commit_session()

    def delete_alert(self, alert_id: int):
        '''
        Delete the given alert.
        '''
        logging.debug(f'py delete_alerts {alert_id}')
        self.db.alerts.delete_alert(alert_id)
        self.db.commit_session()

    def snooze_alert(self, alert_id: int) -> str:
        '''
        Snooze the given alert for a period of time.
        '''
        logging.debug(f'py snooze_alert {alert_id}')
        self.db.alerts.snooze_alert(alert_id)
        self.db.commit_session()

        return self._response(True, "Alert snoozed!")

    def get_pota_locations(self) -> str:
        locs = self.db.locations.get_all_locations()
        return self._response(True, '', locations=locs)

    def get_band_names(self) -> str:
        bns = bandNames
        return self._response(True, '', band_names=bns)

    def get_hamalert_text(self, location: str) -> str:
        hunted = self.db.parks.get_hunted_parks(location)
        self.pota.check_and_download_parks(location)
        with open(f"data\\parks-{location}.json", 'r', encoding='utf-8') as r:
            text = r.read()
            obj = json.loads(text)
            all_parks: list[str] = list(map(lambda x: x['reference'], obj))
            # logging.debug(all_parks)

            hunted_set = set(hunted)
            all_set = set(all_parks)
            unhunted = list(all_set - hunted_set)
            return self._response(True, '',
                                  hunted_refs=hunted,
                                  unhunted_refs=unhunted)

        return self._response(False, 'Error getting hamalert text')

    def grid_to_ll(self, grid6: str):
        '''
        Convert 6-digit Maidenhead gridsquare to lat long coordinate.

        :param str grid6: 6-digit maidenhead grid locator
        '''
        try:
            lat, lon = Distance.grid_to_latlon(grid6)
        except Exception as ex:
            logging.error('Error converting grid', exc_info=ex)
            return self._response(False, 'Error converting grid')
        return self._response(True, '', latitude=lat, longitude=lon)

    def get_daily_qsos(self, date: str):
        '''
        Get the QSOs for the users current day, not UTC day.

        :param date: ISO formatted date string
        :type date: str
        '''
        try:
            logging.debug(f'get_daily_qsos {date} UTC. converting to local')
            if date.endswith('Z'):
                date = date.replace('Z', '+00:00')
            dt = datetime.datetime.fromisoformat(date)
            dt = dt.astimezone(None)
            logging.debug(f'get_daily_qsos {dt} local')
            x = self.db.qsos.get_qsos_for_local_date(dt)
            qs = QsoSchema(many=True)
            result = qs.dumps(x)
            logging.debug(f'daily qsos = {x}')
            return self._response(True, '', qsos=result)
        except Exception as ex:
            logging.error('Error getting QSOs', exc_info=ex)
            return self._response(False, 'Error getting QSOs')

    def _do_update(self, spots: dict[any]):
        '''
        The main update method. Called on a timer

        First will delete all previous spots, then read the ones passed in
        and perform the logic to update meta info about the spots

        :param dict pota: the dict from the pota api
        :param dict sota: the dict from the sota api
        :param dict wwff: the dict from the wwff api. wwff['RCD']
        '''
        logging.debug('updating db')

        try:
            # json = self.pota.get_spots()
            # sota = self.sota.get_spots()
            # wwff = self.wwff.get_spots()

            logging.info("acquiring lock for update")
            if not self.lock.acquire(timeout=4.0):
                logging.error('no lock aquired')
                return
            self.db.delete_spots()
            self.programs["POTA"].update_spots(spots["POTA"])
            self.programs["SOTA"].update_spots(spots["SOTA"])
            self.programs["WWFF"].update_spots(spots["WWFF"])
            self.programs["WWBOTA"].update_spots(spots["WWBOTA"])

            # handle half-loaded parks from program imports
            self._empty_park_updater()

            # handle WSJT-X integration. use decoded CQs
            self._handle_wsjtx()

            self.db.session.commit()
            logging.info("spots updated for programs")
            self.lock.release()
            logging.info("update lock released")

            self.seen_regions.clear()

            for p in self.programs.values():
                unique_reg = list(set(p.seen_regions))
                self.seen_regions += unique_reg

            self._handle_alerts()
        except ConnectionError as con_ex:
            logging.warning("Connection error in do_update: ")
            logging.exception(con_ex)
        except Exception as ex:
            logging.error("Unhandled error caught in do_update: ")
            logging.error(type(ex).__name__)
            logging.exception(ex)
        finally:
            if self.lock.locked():
                self.lock.release()

            # trigger front end to know the main update method is over.
            self._call_js('workingDone')

    def _empty_park_updater(self):
        def get_park(park: Park):
            logging.debug(f"empty park found: {park.reference}")

            for p in self.programs.values():
                x = str(park.reference).strip()
                b = p.test_reference_str(x)
                if b:
                    logging.debug(f"empty park updater: using {p}")
                    p.get_reference(x)
                    break

        limit = 10
        needs_update = self.db.parks.get_half_loaded_parks(limit)
        logging.debug(f"empty park updater. list: {needs_update[:3]}...")

        for park in needs_update:
            get_park(park)

    def _update_all_parks(self) -> str:
        logging.info("updating all parks in db")

        parks = self.db.parks.get_parks()
        for park in parks:
            if park.name is not None:
                continue

            api_res = self.pota.get_park(park.reference)
            self.db.parks.update_park_data(api_res)  # delay_commit=True

            time.sleep(0.001)  # dont want to hurt POTA

        return self._response(
            True, "Park Data updated successfully", persist=True)

    def _get_activator(self, callsign: str) -> Activator:
        ''''
        Gets the activator model from the db or pulls the data to create a
        new one or update and old one.
        '''
        def update():
            logging.info("activator needs update from POTA API...")
            id = self.update_activator_stats(callsign)
            if id > 0:
                activator = self.db.get_activator_by_id(id)
                return activator
            return None

        ac = self.db.get_activator(callsign)
        if (ac is None):
            # not found pull new data
            return update()
        else:
            # check timestamp
            if (datetime.datetime.utcnow() - ac.updated > timedelta(days=1)):
                return update()

        return ac

    def _response(self, success: bool, message: str, **kwargs) -> str:
        '''
        Returns a dumped json string from the given inputs.

        :param bool success: indicates if response is pass or fail
        :param str message: default message to return
        :param any kwargs: any keyword arguments are included in the json
        '''
        return json.dumps({
            'success': success,
            'message': message,
            **kwargs
        })

    def _get_win_size(self) -> tuple[int, int]:
        '''
        Get the stored windows size.
        '''
        x = self.db.config.get_value('size_x')
        y = self.db.config.get_value('size_y')
        return (x, y)

    def _get_win_pos(self) -> tuple[int, int]:
        '''
        Get the stored windows position.
        '''
        x = self.db.config.get_value('pos_x')
        y = self.db.config.get_value('pos_y')
        return (x, y)

    def _get_win_maximized(self) -> bool:
        '''
        Get the stored windows size.
        '''
        return self.db.config.get_value('is_max')

    def _get_program_cfg(self) -> Any:
        '''
        Get the program configuration
        '''
        s = self.db.config.get_value('enabled_programs')
        # json config values are stringify-d have to loads here too
        return s

    def _store_win_size(self, size: tuple[int, int]):
        '''
        Save the window size to the database
        '''
        self.db.config.set_value('size_x', size[0])
        self.db.config.set_value('size_y', size[1], commit=True)

    def _store_win_pos(self, position: tuple[int, int]):
        '''
        Save the window position to the database
        '''
        self.db.config.set_value('pos_x', position[0])
        self.db.config.set_value('pos_y', position[1], commit=True)

    def _store_win_maxi(self, is_max: bool):
        self.db.config.set_value('is_max', is_max, commit=True)

    def _handle_alerts(self):
        def get_str(spot: Spot) -> str:
            obj = {
                'location': spot.locationDesc,
                'activator': spot.activator,
                'reference': spot.reference,
                'freq': spot.frequency,
                'mode': spot.mode,
                'spotId': spot.spotId
            }
            return obj

        to_alert = self.db.check_alerts()

        # this is obj to get send to JS side via showSpotAlert()
        res: dict[str, list[str]] = {}

        for key in to_alert:
            spots = to_alert[key]
            res[key] = list(map(get_str, spots))

        # logging.debug(f"dict to send {res}")
        # logging.debug(f"dict to send {json.dumps(res)}")

        if len(webview.windows) > 0 and len(res) > 0:
            js = """if (window.pywebview.state !== undefined && 
                        window.pywebview.state.showSpotAlert !== undefined)  {{  // # noqa
                            window.pywebview.state.showSpotAlert('{obj}'); // # noqa
                    }}
                """.format(obj=json.dumps(res))
            # logging.debug(f"alerting w this {js}")
            webview.windows[0].evaluate_js(js)

    def _handle_wsjtx(self):
        if self._wsjtx is None:
            return

        if self._wsjtx.is_wsjtx_alive() > 1:
            logging.error("WSJTX is offline. Missed heartbeat packets")
            self._call_js_param('set_wsjtx_status', 0)
            return

        self._call_js_param('set_wsjtx_status', 1)

        colors = ColorConfig(
            self.db.config.get_value('wsjtx_hunted_fg'),
            self.db.config.get_value('wsjtx_hunted_bg'),
            self.db.config.get_value('wsjtx_spot_fg'),
            self.db.config.get_value('wsjtx_spot_bg'),
            self.db.config.get_value('wsjtx_new_ref_fg'),
            self.db.config.get_value('wsjtx_new_ref_bg')
        )

        # tell wsjtx-to highlight these calls
        x = self.db.spots.get_wsjtx_spots()
        logging.debug(f"highlighting wsjtx #{len(x)} spots")
        for s in x:
            self._wsjtx.highlight_call(
                s.activator, s.hunted, s.park_hunts == 0, colors)

    def _wsjtx_log_handle(self, adif: str):
        # take the adif from clicking log qso button on wsjtx and
        # stuff it into hunterlog
        logging.info("got adif to log from wsjtx")
        logging.debug(adif)

        self._call_js('setWorking')

        enriched = False
        qso, spot = self._adif_to_enriched_qso(adif)

        with self.lock:
            program = qso.sig
            if program != '':
                ref = qso.sig_info
                # known deficiency: logs from wsjtx dont have multi-ref info bc
                # that is pulled in from front end
                self.programs[program].inc_ref_hunt(ref, None)

            self.db.qsos.insert_qso(qso, delay_commit=False)

            if spot:
                enriched = True
                self.refresh_spot(spot.spotId, qso.call, qso.sig_info)

        # if config flag is true, log to configured logger

        log_remote: bool = self.db.config.get_value('wsjtx_fwd_remote_logger')

        if log_remote:
            success, resp = self._log_qso_remote(qso)
            if not success:
                logging.error(f"error sending WSJT-X QSO to logger: {resp}")
                self._call_js_param('showFailurePopup', f'Logging error: {resp}')  # noqa: E501
                self._call_js('getSpots')
                return

        msg = 'WSJT-X QSO (e) Logged' if enriched else 'WSJT-X QSO Logged'
        self._call_js_param('showSuccessPopup', msg)
        self._call_js('getSpots')

    def _wsjtx_status_handler(self, status: int):
        if status == 2:
            # wsjtx most likely offline. prob set a value in api
            logging.warning("wsjtx down")

        self._call_js_param('set_wsjtx_status', status)

    def _call_js(self, method: str):
        '''
        Executes the JS method on the pywebview state object.

        Method must take no parameters and the return is ignored.
        '''
        def get_js(m: str):
            return """
                if (window.pywebview.state !== undefined &&
                    window.pywebview.state.{m} !== undefined) {{
                    window.pywebview.state.{m}();
                }}
                """.format(m=method)

        if len(webview.windows) > 0:
            js = get_js(method)
            logging.debug(f'calling {method} in frontend')
            try:
                webview.windows[0].evaluate_js(js)
            except Exception as ex:
                logging.error(f'error executing JS {js}', exc_info=ex)

    def _call_js_param(self, method: str, param):
        '''
        Executes the JS method on the pywebview state object.

        Target js method must take 1 parameter. Passed in param Will be
        json.dumps'd
        '''
        def get_js(m: str):
            return """
                if (window.pywebview.state !== undefined &&
                    window.pywebview.state.{m} !== undefined) {{
                    window.pywebview.state.{m}({p});
                }}
                """.format(m=method, p=json.dumps(param))

        if len(webview.windows) > 0:
            js = get_js(method)
            logging.debug(f'calling {method} in frontend')
            try:
                webview.windows[0].evaluate_js(js)
            except Exception as ex:
                logging.error(f'error executing JS {js}', exc_info=ex)

    def _adif_to_enriched_qso(self, adif: str) -> tuple[Qso, Spot]:
        '''
        Take the given adif string and return enriched QSO data for Hunterlog
        '''

        adif_obj = AdifLog.adif_to_obj(adif)
        q = Qso()
        q.init_from_adif(adif_obj)
        def_pwr = self.db.config.get_value('default_pwr')

        q.sig = ''
        q.sig_info = ''
        q.tx_pwr = def_pwr
        q.rx_pwr = def_pwr

        # find a spot in current spots to enrich the qso data
        spot = self.db.spots.get_wsjtx_spot(callsign=q.call)
        if spot is not None:
            logging.debug(f"spot found to enrich wsjtx qso {spot.spotId}")
            sig = spot.spot_source
            sig_info = spot.reference
            q.sig = sig
            q.sig_info = sig_info
            q.pota_ref = sig_info if sig == 'POTA' else ''  # NOQA
            q.sota_ref = sig_info if sig == 'SOTA' else ''  # NOQA
            q.wwff_ref = sig_info if sig == 'WWFF' else ''  # NOQA
            q.comment = f"[{sig} {sig_info}]"  # NOQA

            q.state = spot.get_state_or_province()

        q.name = self.db.get_activator_name(q.call)

        return q, spot
