import logging
from loggers.generic_logger import GenericFileLogger
from utils.wavelog import send_adif

log = logging.getLogger(__name__)


class WavelogLogger(GenericFileLogger):
    def init_logger(self, **kwargs):
        self.url = kwargs['wl_url']
        self.api_key = kwargs['wl_api_key']
        return super().init_logger(**kwargs)

    def log_qso(self, qso) -> str:
        adif = super().log_qso(qso)

        send_adif(self.url, self.api_key, adif)

        return adif

    def stage_qso(self, qso: any) -> str:
        pass

    def clear_staged(self):
        pass
