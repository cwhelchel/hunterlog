
import datetime
import logging as L
import os
import socket
import bands
import adif_io
import re

from db.db import DataBase
from db.models.qsos import Qso
from db.models.user_config import UserConfig
from version import __version__

logging = L.getLogger("adif_log")
BACKUP_LOG_FN = "hunter.adi"


class AdifLog():
    def __init__(self, filename: str = BACKUP_LOG_FN):
        self.filename = filename
        self._init_adif_log()

    def log_qso_and_send(self, qso: Qso, config: UserConfig):
        '''
        Logs the QSO the the ADIF file and sends a UDP msg to the remote host.
        '''
        logging.debug(f"logging as {config.logger_type}")
        if config.logger_type == config.LoggerType.Aclog.value:
            type = socket.SOCK_STREAM
            qso_adif = self._get_adif(qso, config.my_call, config.my_grid6)

            # TODO: needs to be even more granular for ACLOG b/c there is a
            # more feature rich version that can pull in more QSO data, send to
            # LOTW, QRZ, etc (its FROM WD4DAN)
            adif = f"<CMD><ADDADIFRECORD><VALUE>{qso_adif}</VALUE></CMD>"
        else:
            type = socket.SOCK_DGRAM
            adif = self._get_adif(qso, config.my_call, config.my_grid6)
        self._send_msg(adif, config.adif_host, config.adif_port, type)
        self.write_adif_log(adif)

    def log_qso(self, qso: Qso, config: UserConfig):
        '''
        Logs the QSO the the ADIF file.
        '''
        adif = self._get_adif(qso, config.my_call, config.my_grid6)
        self.write_adif_log(adif)

    def write_adif_log(self, adif):
        with open(self.filename, "a", encoding='UTF-8') as file:
            file.write(adif + "\n")

    @staticmethod
    def import_from_log(file_name: str, the_db: DataBase):
        '''
        Imports the ADIF records from the given file into the given Database.

        :param str file_name: the path of the ADIF file to import.
        :param DataBase the_db: the instance of the DataBase object to insert
            qso records into.
        '''
        logging.info(f"importing adif from {file_name}")
        pattern = r'([A-Z0-9]+-[0-9]*)'
        if os.path.exists(file_name):
            qsos, header = adif_io.read_from_file(file_name)
            logging.debug(f"adif hdr {header}")
            for qso in qsos:
                q = Qso()
                sig_check = ('SIG' in qso.keys() and qso['SIG'] == 'POTA')
                sig_info_check = ('SIG_INFO' in qso.keys()
                                  and re.match(pattern, qso["SIG_INFO"]))
                if (sig_check or sig_info_check):
                    if not sig_info_check:
                        # we got pota sig but no sig_info
                        # check the comments
                        if 'COMMENT' in qso.keys():
                            m = re.findall(pattern, qso['COMMENT'])
                            sig_info = m[0]
                            qso['SIG_INFO'] = sig_info
                    q.init_from_adif(qso)
                    the_db.qsos.insert_qso(q)

            the_db.commit_session()

    def _init_adif_log(self):
        filename = self.filename

        if not os.path.exists(filename):
            with open(filename, "w", encoding='UTF-8') as f:
                v = self._get_adif_field("programversion", __version__)
                pid = self._get_adif_field("programid", "hunterlog")

                f.write("HUNTER LOG backup log\n")
                f.write(f"Created {datetime.datetime.now()}\n")
                f.write(pid)
                f.write(v)
                f.write("<EOH>\n")

    def _send_msg(self, msg: str, host: str, port: int, type: int):
        """
        Send a UDP adif message to a remote endpoint
        """
        logging.debug(f"logging to {host}:{port} with data {msg}")

        try:
            with socket.socket(socket.AF_INET, type) as sock:
                sock.connect((host, port))
                sock.send(msg.encode())
        except Exception as err:
            logging.error("_send_msg exception:", err)

    def _get_adif_field(self, field_name: str, field_data: str) -> str:
        return f"<{field_name.upper()}:{len(field_data)}>{field_data}\n"

    def _get_adif(self, qso: Qso, my_call: str, my_grid6: str) -> str:
        band_name = bands.get_band_name(qso.freq)

        # todo:
        # self._get_adif_field("distance", qso.sig_info) +
        # self._get_adif_field("STATE", qso.park_state) +

        # silly but w/e
        f: float = float(qso.freq) / 1000.0
        fs = str(f)
        q_date = qso.qso_date.strftime('%Y%m%d')
        q_time_on = qso.time_on.strftime('%H%M%S')
        state = qso.state if qso.state else ''

        adif = self._get_adif_field("band", band_name) + \
            self._get_adif_field("call", qso.call) + \
            self._get_adif_field("name", qso.name if qso.name else '') + \
            self._get_adif_field("comment", qso.comment) + \
            self._get_adif_field("sig", qso.sig) + \
            self._get_adif_field("sig_info", qso.sig_info) + \
            self._get_adif_field("gridsquare", qso.gridsquare) + \
            self._get_adif_field("state", state) + \
            self._get_adif_field("distance", str(qso.distance)) + \
            self._get_adif_field("tx_pwr", str(qso.tx_pwr)) + \
            self._get_adif_field("mode", qso.mode) + \
            self._get_adif_field("operator", my_call) + \
            self._get_adif_field("rst_rcvd", qso.rst_recv) + \
            self._get_adif_field("rst_sent", qso.rst_sent) + \
            self._get_adif_field("freq", fs) + \
            self._get_adif_field("qso_date", q_date) + \
            self._get_adif_field("time_on", q_time_on) + \
            self._get_adif_field("my_gridsquare", my_grid6) + \
            "<EOR>\n"

        return adif
