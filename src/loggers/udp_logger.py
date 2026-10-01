import logging
from loggers.generic_logger import GenericFileLogger
from loggers.util import send_udp_msg

log = logging.getLogger(__name__)


class UdpLogger(GenericFileLogger):
    def init_logger(self, **kwargs):
        self.host = kwargs['host']
        self.port = kwargs['port']
        return super().init_logger(**kwargs)

    def log_qso(self, qso) -> str:
        adif = super().log_qso(qso)

        send_udp_msg(adif, self.host, self.port)

        return adif

    def stage_qso(self, qso: any) -> str:
        pass

    def clear_staged(self):
        pass
