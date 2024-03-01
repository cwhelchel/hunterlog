import socket
import webview
import logging as L
import datetime
from datetime import timedelta

from db.db import DataBase
from db.models.activators import Activator, ActivatorSchema
from db.models.parks import ParkSchema
from db.models.qsos import QsoSchema
from db.models.spot_comments import SpotCommentSchema
from db.models.spots import SpotSchema
from db.models.user_config import UserConfigSchema
from pota import PotaApi, PotaStats
from utils import AdifLog
from version import __version__

from cat import CAT
from utils.distance import Distance

logging = L.getLogger("api")
# IDTOKENPAT = r"^.*CognitoIdentityServiceProvider\..+\.idToken=([\w\.-]*\;)"


class JsApi:
    def __init__(self, the_db: DataBase, pota_api: PotaApi):
        self.db = the_db
        self.pota = pota_api
        self.adif_log = AdifLog()
        logging.debug("init CAT...")
        cfg = self.db.get_user_config()
        self.cat = CAT("flrig", cfg.flr_host, cfg.flr_port)
        self.pw = None

    def get_spots(self):
        logging.debug('py getting spots')
        spots = self.db.get_spots()
        ss = SpotSchema(many=True)
        return ss.dumps(spots)

    def get_spot_comments(self, spot_id: int):
        spot = self.db.get_spot(spot_id)
        comms = self.pota.get_spot_comments(spot.activator, spot.reference)
        self.db.insert_spot_comments(spot.activator, spot.reference, comms)

        x = self.db.get_spot_comments(spot.activator, spot.reference)
        ss = SpotCommentSchema(many=True)
        return ss.dumps(x)

    def get_qso_from_spot(self, id: int):
        logging.debug('py getting qso data')
        q = self.db.build_qso_from_spot(id)
        if q is None:
            return {"success": False}

        cfg = self.db.get_user_config()
        d = Distance.distance_miles(cfg.my_grid6, q.gridsquare)
        q.distance = d
        qs = QsoSchema()
        return qs.dumps(q)

    def get_activator_stats(self, callsign):
        logging.debug("getting activator stats...")
        ac = self._get_activator(callsign)
        return ActivatorSchema().dumps(ac)

    def get_activator_hunts(self, callsign):
        logging.debug("getting hunt count stats...")
        return self.db.get_activator_hunts(callsign)

    def get_park(self, ref: str) -> str:
        '''
        Returns the JSON for the park if found in the db

        :param str ref: the POTA park reference designator string

        :returns JSON of park object in db or None if not found
        '''
        park = self.db.get_park(ref)
        if park is None:
            return None
        ps = ParkSchema()
        return ps.dumps(park)

    def get_user_config(self):
        '''
        Returns the JSON for the user configuration record in the db
        '''
        cfg = self.db.get_user_config()
        return UserConfigSchema().dumps(cfg)
    
    def get_version_num(self):
        return __version__

    def import_adif(self):
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
            return

        logging.info("starting import of ADIF file...")
        adif = AdifLog()
        adif.import_from_log(filename[0], self.db)

    def log_qso(self, qso_data):
        '''
        Logs the QSO to the database, adif file, and updates stats. Will force
        a reload of the currently displayed spots.

        :param any qso_data: dict of qso data from the UI
        '''
        park_json = self.pota.get_park(qso_data['sig_info'])
        logging.debug(f"updating park stat for: {park_json}")
        self.db.inc_park_hunt(park_json)

        logging.debug(f"logging qso: {qso_data}")
        id = self.db.log_qso(qso_data)

        j = self.pota.get_spots()
        self.db.update_all_spots(j)

        # get the data to log to the adif file and remote adif host
        qso = self.db.get_qso(id)
        cfg = self.db.get_user_config()
        act = self.db.get_activator_name(qso_data['call'])
        qso.name = act
        self.adif_log.log_qso(qso, cfg)

        webview.windows[0].evaluate_js(
            'window.pywebview.state.getSpots()')

    def set_user_config(self, config_json: any):
        logging.debug(f"setting config {config_json}")
        self.db.update_user_config(config_json)

    def set_band_filter(self, band: int):
        logging.debug(f"api setting band filter to: {band}")
        self.db.set_band_filter(band)

    def set_region_filter(self, region: str):
        logging.debug(f"api setting region filter to: {region}")
        self.db.set_region_filter(region)

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

        # self.pw.evaluate_js
        # (token, cookies) = self.get_id_token(self.pw)
        # logging.debug(f"token: {token}")

        # self.pota.get_user_hunt(token, cookies)

        # self.pw.js_api_endpoint.e

    # def get_id_token(self, win: webview.Window) -> tuple[str, any]:
    #     logging.debug("looking thru cookies for idToken...")
    #     cookies = win.get_cookies()
    #     tok = None
    #     jar = {}

    #     for c in cookies:
    #         co = c.output()
    #         x = co.split('=')
    #         k = x[0][12:]
    #         jar[k] = x[1]
    #         m = re.match(IDTOKENPAT, co)
    #         if m:
    #             # logging.debug(f"matched group {m.group(1)}")
    #             tok = m.group(1)

    #     logging.debug(jar)
    #     if tok is None:
    #         logging.warn("no POTA idToken found in cookies!")
    #     return (tok, jar)

    def qsy_to(self, freq, mode: str):
        '''Use CAT control to QSY'''
        logging.debug(f"qsy_to {freq} {mode}")
        x = float(freq) * 1000.0
        logging.debug(f"adjusted freq {x}")
        if mode == "SSB" and x > 10000000:
            mode = "USB"
        elif mode == "SSB":
            mode = "LSB"
        logging.debug(f"adjusted mode {mode}")
        self.cat.set_mode(mode)
        self.cat.set_vfo(x)

    def update_park(self, park: any):
        '''The UI will only try to update parks when they're clicked on.'''
        self.db.update_park_data(park)

    def update_park_hunts(self):
        '''
        Will use the current pota stats from hunter.csv to update the db with
        new park hunt numbers
        '''
        ft = ('CSV files (*.csv;*.txt)', 'All files (*.*)')
        filename = webview.windows[0] \
            .create_file_dialog(
                webview.OPEN_DIALOG,
            file_types=ft)
        if not filename:
            return

        logging.info(f"updating park hunts from {filename[0]}")
        stats = PotaStats(filename[0])
        hunts = stats.get_all_hunts()

        for park in hunts:
            count = stats.get_park_hunt_count(park)
            j = {'reference': park, 'hunts': count}
            self.db.update_park_hunts(j, count)

        self.db.commit_session()

    def _send_msg(self, msg: str):
        """
        Send a UDP adif message to a remote endpoint
        """
        host = self.settings.get("host", "127.0.0.1")
        port = self.settings.get("port", 8073)
        type = socket.SOCK_DGRAM

        try:
            with socket.socket(socket.AF_INET, type) as sock:
                sock.connect((host, port))
                sock.send(msg.encode())
        except Exception as err:
            logging.warn("send_msg exception:", err)

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

        ac = self.db.get_activator(callsign)
        if (ac is None):
            # not found pull new data
            return update()
        else:
            # check timestamp
            if (datetime.datetime.utcnow() - ac.updated < timedelta(days=1)):
                return update()

        return ac
