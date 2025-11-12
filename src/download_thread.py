
import threading
import logging as L
from programs.apis import SotaApi, PotaApi, WwffApi, WwbotaApi

logging = L.getLogger(__name__)


class DownloadThread(threading.Thread):
    def __init__(self, event: threading.Event):
        threading.Thread.__init__(self, daemon=True)
        self.lock = threading.Lock()
        self.pota = PotaApi()
        self.sota = SotaApi()
        self.wwff = WwffApi()
        self.wwbota = WwbotaApi()
        self.pota_spots = None
        self.sota_spots = None
        self.wwff_spots = None
        self.stopped = event

    def run(self):
        logging.debug("download thread run")
        while True:
            with self.lock:
                self.download()

            if self.stopped.wait(45.0):
                break

    def download(self):
        try:
            self.pota_spots = self.pota.get_spots()
            self.sota_spots = self.sota.get_spots()
            self.wwff_spots = self.wwff.get_spots()
            self.wwbota_spots = self.wwbota.get_spots()
        except Exception as e:
            logging.error("error in download thread", exc_info=e)

    def get_spots(self) -> dict[any]:
        with self.lock:
            return {
                "POTA": self.pota_spots,
                "SOTA": self.sota_spots,
                "WWFF": self.wwff_spots,
                "WWBOTA": self.wwbota_spots
            }
