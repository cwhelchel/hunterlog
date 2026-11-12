
import json
import logging
from threading import Event, Thread

from api_cat import CatApi
from db.db import DataBase
from utils.wavelog import send_radio


log = logging.getLogger(__name__)


class WavelogIntegration():
    def __init__(self) -> None:
        self.stop_event = Event()
        self.last_freq = None

    def init(self, **kwargs):
        log.info("WaveLog integration initializing...")

        db_temp = kwargs.get('db')
        if db_temp is None:
            raise ValueError("WavelogIntegration requires a DataBase object")

        db: DataBase = db_temp
        self.enabled = db.config.get_value('enable_wavelog_int')
        self.wavelog_url = db.config.get_value('wl_url')
        self.wavelog_api_key = db.config.get_value('wl_api_key')

        cat_temp = kwargs.get('cat')
        if cat_temp is None:
            raise ValueError("WavelogIntegration requires a CAT interface")

        self.cat: CatApi = cat_temp

    def start(self):
        log.info("WaveLog integration started")

        t = Thread(target=self._read_vfo_thread)
        t.daemon = True
        t.start()

    def update(self):
        # this happens once a minute. and we need to send the freq more often
        pass

    def _check_and_send(self):
        freq_json = self.cat.get_freq()
        res = json.loads(freq_json)

        if res['success']:
            freq = res['fx']

            # TODO add get_mode to ICat and all the CAT objects
            # mode = res['mode']

            if (freq != self.last_freq) and (freq is not None):
                log.debug(f"WaveLog integration sending freq: {freq}")
                self.last_freq = freq

                # convert kHz to Hz for wavelog radio api
                fx = float(freq)
                fx = fx * 1000.0
                self._send_to_wavelog(str(fx), "")

    def _send_to_wavelog(self, freq: str, mode: str):
        send_radio(self.wavelog_url, self.wavelog_api_key, freq, mode)

    def _read_vfo_thread(self):
        while True:
            self._check_and_send()

            if self.stop_event.wait(2.0):
                break
