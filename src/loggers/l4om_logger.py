import logging
from db.models.qsos import Qso
from loggers.adif_provider import AdifProvider
from loggers.generic_logger import GenericFileLogger
from loggers.util import send_udp_msg

log = logging.getLogger(__name__)


class Log4omLogger(GenericFileLogger, AdifProvider):
    def init_logger(self, **kwargs):
        self.host = kwargs['host']
        self.port = kwargs['port']
        return super().init_logger(**kwargs)

    def log_qso(self, qso: Qso) -> str:
        adif = super().get_adif(qso)

        wrapper = super().get_adif_field("command", "log")

        l4om_adif = f"{wrapper}{adif}"

        send_udp_msg(l4om_adif, self.host, self.port)

        super().log_qso(qso)

    def get_extra_field_adif(self) -> str:
        # return super().get_adif_field("APP_L4ONG_QSO_AWARD_REFERENCES", "")

        # TODO need to pass in multi-park references. probably use
        # POTA_REF and just split it up for log4om award ref
        return ''
