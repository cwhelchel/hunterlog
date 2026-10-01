import logging
from loggers.generic_logger import GenericFileLogger
from utils.qrz import send_adif

log = logging.getLogger(__name__)


class QrzLogger(GenericFileLogger):
    def init_logger(self, **kwargs):
        self.api_key = kwargs['qrz_api_key']
        return super().init_logger(**kwargs)

    def log_qso(self, qso) -> str:
        adif = super().log_qso(qso)

        ok = send_adif(self.api_key, adif)

        if ok is False:
            raise Exception('Error logging to QRZ.com')

        return adif

    def stage_qso(self, qso: any) -> str:
        pass

    def clear_staged(self):
        pass
