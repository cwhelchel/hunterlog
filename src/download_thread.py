
import threading
import logging as L
from programs.apis import SotaApi, PotaApi, WwffApi, WwbotaApi

logging = L.getLogger(__name__)


class DownloadThread(threading.Thread):
    def __init__(self, event: threading.Event, progs: any):
        '''
        Creates a new instance of DownloadThread

        :param threading.Event event: the stopper event.
        :param any progs: the configured list of enabled programs. stored in db
        '''
        threading.Thread.__init__(self, daemon=True)
        self.lock = threading.Lock()
        self.stopped = event

        self.config = {}

        # progs is like dict like: {"POTA": true, "SOTA": false, ... }
        for sig, enabled in progs.items():
            is_enabled = enabled
            self.config[sig] = is_enabled

        # all apis must have method get_spots()
        self.apis = {
            "POTA": PotaApi(),
            "SOTA": SotaApi(),
            "WWFF": WwffApi(),
            "WWBOTA": WwbotaApi()
        }

        self.spots = {
            "POTA": None,
            "SOTA": None,
            "WWFF": None,
            "WWBOTA": None
        }

    def run(self):
        logging.debug("download thread run")
        while True:
            with self.lock:
                self.download()

            if self.stopped.wait(45.0):
                break

    def download(self):
        for sig, api in self.apis.items():
            try:
                if self.config[sig]:
                    self.spots[sig] = api.get_spots()
            except Exception as e:
                logging.error(
                    "error in getting spots for: " + sig,
                    exc_info=e)
                self.spots[sig] = None

    def get_spots(self) -> dict[any]:
        with self.lock:
            return self.spots
