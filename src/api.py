import os
import socket
import webview
import logging as L
import datetime
import re
from datetime import timedelta

from db.db import Bands
from db.db import DataBase
from db.models.activators import ActivatorSchema
from db.models.qsos import QsoSchema
from db.models.spots import SpotSchema
from pota import Api as PotaApi

from cat import CAT

logging = L.getLogger("api")
IDTOKENPAT = r"^.*CognitoIdentityServiceProvider\..+\.idToken=([\w\.-]*\;)"


class JsApi:
    def __init__(self, the_db: DataBase, pota_api: PotaApi):
        self.db = the_db
        self.pota = pota_api
        logging.debug("init CAT...")
        self.cat = CAT("flrig", "127.0.0.1", 12345)
        self.pw = None

    def get_spots(self):
        logging.debug('py getting spots')
        # if self.band_filter != Bands.NOBAND:
        #     spots = self.db.get_by_band(band=self.band_filter)
        # else:
        spots = self.db.get_spots()
        ss = SpotSchema(many=True)
        return ss.dumps(spots)

    def qso_data(self, id: int):
        logging.debug('py getting qso data')
        q = self.db.build_qso_from_spot(id)
        if q is None:
            return {"success": False}
        qs = QsoSchema()
        return qs.dumps(q)

    def log_qso(self, qso_data):
        logging.debug("logging qso:")
        logging.debug(qso_data)
        json = self.pota.get_park(qso_data['sig_info'])
        logging.debug(f"log_qso park: {json}")
        self.db.inc_park_hunt(json)

    def get_activator_stats(self, callsign):
        logging.debug("getting activator stats...")

        def update():
            id = self.update_activator_stats(callsign)
            if id > 0:
                activator = self.db.get_activator_by_id(id)
                s = ActivatorSchema()
                return s.dumps(activator)

        ac = self.db.get_activator(callsign)
        if (ac is None):
            # not found pull new data
            return update()
        else:
            # check timestamp
            if (datetime.datetime.utcnow() - ac.updated < timedelta(days=1)):
                return update()

        return ActivatorSchema().dumps(ac)

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

    def _get_adif(self) -> str:
        pass
        # qso = (
        #     f"<BAND:{len(self.band_field.text())}>{self.band_field.text()}\n"
        #     f"<CALL:{len(self.activator_call.text())}>{self.activator_call.text()}\n"
        #     f"<COMMENT:{len(self.comments.document().toPlainText())}>{self.comments.document().toPlainText()}\n"
        #     "<SIG:4>POTA\n"
        #     f"<SIG_INFO:{len(self.park_designator.text())}>{self.park_designator.text()}\n"
        #     f"<DISTANCE:{len(self.park_distance.text())}>{self.park_distance.text()}\n"
        #     f"<GRIDSQUARE:{len(self.park_grid.text())}>{self.park_grid.text()}\n"
        #     f"<MODE:{len(self.mode_field.text())}>{self.mode_field.text()}\n"
        #     f"<NAME:{len(self.activator_name.text())}>{self.activator_name.text()}\n"
        #     f"<OPERATOR:{len(self.mycall_field.text())}>{self.mycall_field.text()}\n"
        #     f"<RST_RCVD:{len(self.rst_recieved.text())}>{self.rst_recieved.text()}\n"
        #     f"<RST_SENT:{len(self.rst_sent.text())}>{self.rst_sent.text()}\n"
        #     f"<STATE:{len(self.park_state.text())}>{self.park_state.text()}\n"
        #     f"<FREQ:{len(freq)}>{freq}\n"
        #     f"<QSO_DATE:{len(self.date_field.text())}>{self.date_field.text()}\n"
        #     f"<TIME_ON:{len(self.time_field.text())}>{self.time_field.text()}\n"
        #     f"<MY_GRIDSQUARE:{len(self.mygrid_field.text())}>{self.mygrid_field.text()}\n"
        #     "<EOR>\n"
