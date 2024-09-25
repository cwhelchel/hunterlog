import json
import time
import webview
import logging as L
import datetime
import threading
from datetime import timedelta

from db.db import DataBase
from db.models.activators import Activator, ActivatorSchema
from db.models.parks import ParkSchema
from db.models.qsos import QsoSchema
from db.models.spot_comments import SpotCommentSchema
from db.models.spots import SpotSchema
from db.models.user_config import UserConfigSchema
from pota import PotaApi, PotaStats
from sota import SotaApi
from utils.adif import AdifLog
from version import __version__

from cat import CAT
from utils.distance import Distance

logging = L.getLogger("api")
# IDTOKENPAT = r"^.*CognitoIdentityServiceProvider\..+\.idToken=([\w\.-]*\;)"


class JsApi:
    def __init__(self):
        self.lock = threading.Lock()
        self.db = DataBase()
        self.pota = PotaApi()
        self.sota = SotaApi()
        self.adif_log = AdifLog()
        logging.debug("init CAT...")
        cfg = self.db.get_user_config()
        try:
            self.cat = CAT(cfg.rig_if_type, cfg.flr_host, cfg.flr_port)
        except Exception:
            logging.error("Error creating CAT object: ", exc_info=True)
            self.cat = None
        self.pw = None

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

        x = self.db.get_spot_comments(spot.activator, spot.reference)
        ss = SpotCommentSchema(many=True)
        return ss.dumps(x)

    def insert_spot_comments(self, spot_id: int):
        '''
        Pulls the spot comments from the POTA api and inserts them into our
        database.

        :param int spot_id: spot id. pk in db
        '''
        self.lock.acquire()
        spot = self.db.spots.get_spot(spot_id)

        if spot is None:
            self.lock.release()
            return

        if spot.spot_source == 'SOTA':
            self.lock.release()
            return

        comms = self.pota.get_spot_comments(spot.activator, spot.reference)
        try:
            self.db.insert_spot_comments(spot.activator, spot.reference, comms)
        finally:
            self.lock.release()

    def get_qso_from_spot(self, id: int):
        self.lock.acquire()

        q = self.db.build_qso_from_spot(id)
        if q is None:
            return {"success": False}

        cfg = self.db.get_user_config()
        if q.gridsquare:
            dist = Distance.distance(cfg.my_grid6, q.gridsquare)
            bearing = Distance.bearing(cfg.my_grid6, q.gridsquare)
            q.distance = dist
            q.bearing = bearing
        qs = QsoSchema()
        result = qs.dumps(q)

        self.lock.release()
        return result

    def get_activator_stats(self, callsign):
        logging.debug("getting activator stats...")
        ac = self._get_activator(callsign)
        if ac is None:
            return self._response(False, f"Activator {callsign} not found")
        return ActivatorSchema().dumps(ac)

    def get_activator_hunts(self, callsign):
        logging.debug("getting hunt count stats...")
        return self.db.qsos.get_activator_hunts(callsign)

    def get_park(self, ref: str, pull_from_pota: bool = True) -> str:
        '''
        Returns the JSON for the park if found in the db

        :param str ref: the POTA park reference designator string
        :param bool pull_from_pota: True (default) to try to update when a park
            is not in the db.

        :returns JSON of park object in db or None if not found
        '''
        if ref is None:
            logging.error("get_park: ref param was None")
            return

        logging.debug(f"get_park: getting park {ref}")

        park = self.db.parks.get_park(ref)

        if park is None and pull_from_pota:
            logging.debug(f"get_park: park was None {ref}")
            api_res = self.pota.get_park(ref)
            logging.debug(f"get_park: park from api {api_res}")
            self.db.parks.update_park_data(api_res)
            park = self.db.parks.get_park(ref)
        elif park.name is None:
            logging.debug(f"get_park: park Name was None {ref}")
            api_res = self.pota.get_park(ref)
            logging.debug(f"get_park: park from api {api_res}")
            self.db.parks.update_park_data(api_res)
            park = self.db.parks.get_park(ref)

        ps = ParkSchema()
        return ps.dumps(park)

    def get_summit(self, ref: str, pull_from_sota: bool = True) -> str:
        '''
        Returns the JSON for the summit (same schema as park) if in the db

        :param str ref: the SOTA summit reference string
        :param bool pull_from_pota: True (default) to force API query for 
            summit

        :returns JSON of park object in db or None if not found
        '''
        if ref is None:
            logging.error("get_summit: ref param was None")
            return

        logging.debug(f"get_park: getting summit {ref}")

        summit = self.db.parks.get_park(ref)

        if summit is None and pull_from_sota:
            api_res = self.sota.get_summit(ref)
            logging.debug(f"get_park: summit pulled from api {api_res}")
            self.db.parks.update_summit_data(api_res)
            summit = self.db.parks.get_park(ref)
        # we dont import any SOTA qsos yet so not needed
        # elif summit.name is None:
        #     logging.debug(f"get_park: park Name was None {ref}")
        #     api_res = self.pota.get_park(ref)
        #     logging.debug(f"get_park: park from api {api_res}")
        #     self.db.parks.update_park_data(api_res)
        #     summit = self.db.parks.get_park(ref)

        ps = ParkSchema()
        return ps.dumps(summit)

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

    def get_user_config(self):
        '''
        Returns the JSON for the user configuration record in the db
        '''
        cfg = self.db.get_user_config()
        return UserConfigSchema().dumps(cfg)

    def get_version_num(self):
        return self._response(
            True,
            "",
            app_ver=__version__,
            db_ver=self.db.get_version())

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

        cfg = self.db.get_user_config()

        # if spot+log is used the comment is modified before coming here.
        # remove boilerplate fluff and get the users comments for spot
        if c.startswith("["):
            x = c.index("]") + 1
            c = c[x:]

        qth = cfg.qth_string

        if qth is not None:
            spot_comment = f"[{r} {qth}] {c}"
        else:
            spot_comment = f"[{r}] {c}"

        try:
            PotaApi.post_spot(activator_call=a,
                              park_ref=park,
                              freq=f,
                              mode=m,
                              spotter_call=cfg.my_call,
                              spotter_comments=spot_comment)
        except Exception as ex:
            msg = "Error posting spot to pota api!"
            logging.error(msg)
            logging.exception(ex)
            return self._response(False, msg)

        return self._response(True, "spot posted")

    def import_adif(self) -> str:
        '''
        Opens a Open File Dialog to allow the user to select a ADIF file
        containing POTA QSOs to be imported into the app's database.
        '''
        ft = ('ADIF files (*.adi;*.adif)', 'All files (*.*)')
        filename = webview.windows[0] \
            .create_file_dialog(
                webview.OPEN_DIALOG,
            file_types=ft)
        if not filename:
            return self._response(True, "")

        logging.info("starting import of ADIF file...")
        AdifLog.import_from_log(filename[0], self.db)

        return self._response(True, "Completed ADIF import")

    def log_qso(self, qso_data, update_spots: bool = True):
        '''
        Logs the QSO to the database, adif file, and updates stats. Will force
        a reload of the currently displayed spots.

        :param any qso_data: dict of qso data from the UI
        :param bool update_spots: True to query the spots api and refresh the
            current spots
        '''
        logging.debug('acquiring lock to log qso')
        self.lock.acquire()

        cfg = self.db.get_user_config()

        try:
            if qso_data['sig'] == 'POTA':
                park_json = self.pota.get_park(qso_data['sig_info'])
                logging.debug(f"updating park stat for: {park_json}")
                self.db.parks.inc_park_hunt(park_json)
            elif qso_data['sig'] == 'SOTA':
                summit_code = qso_data['sig_info']
                ok = self.db.parks.inc_summit_hunt(summit_code)
                if not ok:
                    summit = self.sota.get_summit(summit_code)
                    self.db.parks.update_summit_data(summit)
                    self.db.parks.inc_summit_hunt(summit_code)

            qso_data['tx_pwr'] = cfg.default_pwr
            logging.debug(f"logging qso: {qso_data}")
            id = self.db.qsos.insert_new_qso(qso_data)
        except Exception as ex:
            logging.error("Error logging QSO to db:")
            logging.exception(ex)
            self.lock.release()
            return self._response(False, f"Error logging QSO: {ex}")

        # get the data to log to the adif file and remote adif host
        qso = self.db.qsos.get_qso(id)
        act = self.db.get_activator_name(qso_data['call'])
        qso.name = act if act is not None else 'ERROR NO NAME'

        try:
            self.adif_log.log_qso_and_send(qso, cfg)
        except Exception as log_ex:
            logging.exception(
                msg="Error logging QSO to as adif (local/remote):",
                exc_info=log_ex)
            self.lock.release()
            return self._response(False, f"Error logging as ADIF: {log_ex}")

        self.lock.release()

        if update_spots:
            self._do_update()
            webview.windows[0].evaluate_js('window.pywebview.state.getSpots()')

        return self._response(True, "QSO logged successfully")

    def export_qsos(self):
        '''
        Exports the QSOs logged with this logger app into a file.
        '''
        try:
            qs = self.db.qsos.get_qsos_from_app()
            cfg = self.db.get_user_config()

            dt = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            log = AdifLog(filename=f"{dt}_export.adi")
            for q in qs:
                log.log_qso(q, cfg)

            return self._response(True, "QSOs exported successfully")
        except Exception as ex:
            logging.exception("Error exporting the DB")
            return self._response(
                False, "Error exporting QSOs from DB", ext=str(ex))

    def set_user_config(self, config_json: any):
        logging.debug(f"setting config {config_json}")
        self.db.update_user_config(config_json)

    def set_band_filter(self, band: int):
        logging.debug(f"api setting band filter to: {band}")
        self.db.set_band_filter(band)

    def set_region_filter(self, region: str):
        logging.debug(f"api setting region filter to: {region}")
        self.db.set_region_filter(region)

    def set_location_filter(self, location: str):
        logging.debug(f"setting region filter to {location}")
        self.db.set_location_filter(location)

    def set_qrt_filter(self, is_qrt: bool):
        logging.debug(f"api setting qrt filter to: {is_qrt}")
        self.db.set_qrt_filter(is_qrt)

    def set_hunted_filter(self, filter_hunted: bool):
        logging.debug(f"api setting qrt filter to: {filter_hunted}")
        self.db.set_hunted_filter(filter_hunted)

    def set_only_new_filter(self, filter_only_new: bool):
        logging.debug(f"api setting ATNO filter to: {filter_only_new}")
        self.db.set_only_new_filter(filter_only_new)

    def set_sig_filter(self, sig_filter: str):
        '''
        Set the Special Interest Group (sig) filter.

        :param string sig_filter: only POTA or SOTA
        '''
        logging.debug(f"api setting SIG filter to: {sig_filter}")
        self.db.set_sig_filter(sig_filter)

    def update_activator_stats(self, callsign: str) -> int:
        j = self.pota.get_activator_stats(callsign)

        if j is not None:
            # the json will be none if say the call doesn't return success
            # from api. probably they dont have an account
            return self.db.update_activator_stat(j)
        else:
            logging.warn(f"activator callsign {callsign} not found")
            return -1

    def launch_pota_window(self):
        self.pw = webview.create_window(
            title='POTA APP', url='https://pota.app/#/user/stats')

    def load_location_data(self):
        logging.debug("downloading location data...")
        locations = PotaApi.get_locations()
        self.db.locations.load_location_data(locations)
        return self._response(True, "Downloaded location data successfully")

    def qsy_to(self, freq, mode: str):
        '''Use CAT control to QSY'''
        logging.debug(f"qsy_to {freq} {mode}")

        if self.cat is None:
            logging.warn("CAT is None. not qsy-ing")
            return self._response(False, "CAT control failure.")

        cfg = self.db.get_user_config()
        hrz = float(freq) * 1000.0
        logging.debug(f"adjusted freq {hrz}")
        if mode == "SSB" and hrz >= 10000000:
            mode = "USB"
        elif mode == "SSB" and hrz < 10000000:
            mode = "LSB"
        elif mode == "CW":
            mode = cfg.cw_mode
        elif mode.startswith("FT"):
            mode = cfg.ftx_mode
        logging.debug(f"adjusted mode {mode}")
        self.cat.set_mode(mode)
        self.cat.set_vfo(hrz)

        return self._response(True, "")

    def update_park_hunts_from_csv(self) -> str:
        '''
        Will use the current pota stats from hunter.csv to update the db with
        new park hunt numbers. It will then update all the parks with data from
        the POTA API. This method will run a while depending on how many parks
        are in the csv file.
        '''
        ft = ('CSV files (*.csv;*.txt)', 'All files (*.*)')
        filename = webview.windows[0] \
            .create_file_dialog(
                webview.OPEN_DIALOG,
                file_types=ft)
        if not filename:
            return self._response(True, "user cancelled")

        logging.info(f"updating park hunts from {filename[0]}")
        stats = PotaStats(filename[0])
        hunts = stats.get_all_hunts()

        for park in hunts:
            count = stats.get_park_hunt_count(park)
            j = {'reference': park, 'hunts': count}
            self.db.parks.update_park_hunts(j, count)

        self.db.commit_session()

        return self._update_all_parks()

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

    def _do_update(self):
        '''
        The main update method. Called on a timer
        '''
        logging.debug('updating db')
        self.lock.acquire()

        try:
            json = self.pota.get_spots()
            sota = self.sota.get_spots()
            self.db.update_all_spots(json, sota)
        except ConnectionError as con_ex:
            logging.warning("Connection error in do_update: ")
            logging.exception(con_ex)
        except Exception as ex:
            logging.error("Unhandled error caught in do_update: ")
            logging.error(type(ex).__name__)
            logging.exception(ex)
        finally:
            self.lock.release()

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
        cfg = self.db.get_user_config()
        return (cfg.size_x, cfg.size_y)

    def _get_win_pos(self) -> tuple[int, int]:
        '''
        Get the stored windows position.
        '''
        cfg = self.db.get_user_config()
        return (cfg.pos_x, cfg.pos_y)

    def _get_win_maximized(self) -> bool:
        '''
        Get the stored windows size.
        '''
        cfg = self.db.get_user_config()
        return cfg.is_max

    def _store_win_size(self, size: tuple[int, int]):
        '''
        Save the window size to the database
        '''
        cfg = self.db.get_user_config()
        cfg.size_x = size[0]
        cfg.size_y = size[1]
        self.db.commit_session()

    def _store_win_pos(self, position: tuple[int, int]):
        '''
        Save the window position to the database
        '''
        cfg = self.db.get_user_config()
        cfg.pos_x = position[0]
        cfg.pos_y = position[1]
        self.db.commit_session()

    def _store_win_maxi(self, is_max: bool):
        cfg = self.db.get_user_config()
        cfg.is_max = 1 if is_max else 0
        self.db.commit_session()
