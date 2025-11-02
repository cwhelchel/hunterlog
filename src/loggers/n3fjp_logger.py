import logging
from loggers.adif_provider import AdifProvider
from loggers.generic_logger import GenericFileLogger
from loggers.util import send_tcp_msg

log = logging.getLogger(__name__)


class N3fjpLogger(GenericFileLogger, AdifProvider):
    def init_logger(self, **kwargs):
        self.host = kwargs['host']
        self.port = kwargs['port']
        return super().init_logger(**kwargs)

    def log_qso(self, qso) -> str:
        adif = super().get_adif(qso)

        # TODO: needs to be even more granular for ACLOG b/c there is a
        # more feature rich version that can pull in more QSO data, send to
        # LOTW, QRZ, etc (its FROM WD4DAN)
        ac_adif = f"<CMD><ADDADIFRECORD><VALUE>{adif}</VALUE></CMD>"

        send_tcp_msg(ac_adif, self.host, self.port)

        super().log_qso(qso)
