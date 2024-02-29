
import datetime
import logging as L
import os
import socket
import bands

from db.models.qsos import Qso
from db.models.user_config import UserConfig
from version import __version__

logging = L.getLogger("adif_log")
BACKUP_LOG_FN = "hunter.adi"


class AdifLog():
    def __init__(self):
        self._init_adif_log()

    def log_qso(self, qso: Qso, config: UserConfig):
        adif = self._get_adif(qso, config)
        self._send_msg(adif, config.adif_host, config.adif_port)
        self.write_adif_log(adif)

    def write_adif_log(self, adif):
        with open(BACKUP_LOG_FN, "a", encoding='UTF-8') as file:
            file.write(adif + "\n")

    def _init_adif_log(self):
        if not os.path.exists(BACKUP_LOG_FN):
            with open(BACKUP_LOG_FN, "w", encoding='UTF-8') as f:
                v = self._get_adif_field("programversion", __version__)
                pid = self._get_adif_field("programid", "hunterlog")

                f.write("HUNTER LOG backup log\n")
                f.write(f"Created {datetime.datetime.now()}\n")
                f.write(pid)
                f.write(v)
                f.write("<EOH>\n")

    def _send_msg(self, msg: str, host: str, port: int):
        """
        Send a UDP adif message to a remote endpoint
        """
        type = socket.SOCK_DGRAM
        logging.debug(f"logging to {host}:{port}")

        try:
            with socket.socket(socket.AF_INET, type) as sock:
                sock.connect((host, port))
                sock.send(msg.encode())
        except Exception as err:
            logging.error("_send_msg exception:", err)

    def _get_adif_field(self, field_name: str, field_data: str) -> str:
        return f"<{field_name.upper()}:{len(field_data)}>{field_data}\n"

    def _get_adif(self, qso: Qso, config: UserConfig) -> str:
        band_name = bands.get_band_name(qso.freq)

        # todo:
        # self._get_adif_field("distance", qso.sig_info) +
        # self._get_adif_field("STATE", qso.park_state) +

        # silly but w/e
        f: float = float(qso.freq) / 1000.0
        fs = str(f)
        q_date = qso.qso_date.strftime('%Y%m%d')
        q_time_on = qso.time_on.strftime('%H%M%S')

        adif = self._get_adif_field("band", band_name) + \
            self._get_adif_field("call", qso.call) + \
            self._get_adif_field("name", qso.name) + \
            self._get_adif_field("comment", qso.comment) + \
            self._get_adif_field("sig", qso.sig) + \
            self._get_adif_field("sig_info", qso.sig_info) + \
            self._get_adif_field("gridsquare", qso.gridsquare) + \
            self._get_adif_field("distance", str(qso.distance)) + \
            self._get_adif_field("mode", qso.mode) + \
            self._get_adif_field("operator", config.my_call) + \
            self._get_adif_field("rst_rcvd", qso.rst_recv) + \
            self._get_adif_field("rst_sent", qso.rst_sent) + \
            self._get_adif_field("freq", fs) + \
            self._get_adif_field("qso_date", q_date) + \
            self._get_adif_field("time_on", q_time_on) + \
            self._get_adif_field("my_gridsquare", config.my_grid6) + \
            "<EOR>\n"

        return adif
