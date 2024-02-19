import os
import threading
import webview
import logging
from time import time

from db import SpotSchema, QsoSchema, DataBase
from db.db import Bands
from db.models.activators import ActivatorSchema
from pota import Api as PotaApi

logging.basicConfig(level=logging.DEBUG)
pota = PotaApi()
the_db = DataBase()
band_filter = Bands.NOBAND


def do_update():
    json = pota.get_spots()
    the_db.update_all_spots(json)

    # loop thru the new spots and update activator info
    # for i in the_db.get_spots():
    #     update_activator_stats(i.activator)


def update_activator_stats(callsign: str) -> int:
    j = pota.get_activator_stats(callsign)

    if j is not None:
        # the json will be none if say the call doesn't return success
        # from api. probably they dont have an account
        return the_db.update_activator_stat(j)
    else:
        logging.warn(f"activator callsign {callsign} not found")
        return -1


# first lets update our spots w/ api data
do_update()


class Api:
    def fullscreen(self):
        webview.windows[0].toggle_fullscreen()

    def save_content(self, content):
        filename = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG)
        if not filename:
            return

        with open(filename, 'w') as f:
            f.write(content)

    def ls(self):
        return os.listdir('.')

    def get_spots(self):
        logging.debug('py getting spots')
        if band_filter != Bands.NOBAND:
            spots = the_db.get_by_band(band=band_filter)
        else:
            spots = the_db.get_spots()
        ss = SpotSchema(many=True)
        return ss.dumps(spots)

    def qso_data(self, id: int):
        logging.debug('py getting qso data')
        q = the_db.build_qso_from_spot(id)
        if q is None:
            return {"success": False}
        qs = QsoSchema()
        return qs.dumps(q)

    def log_qso(self, qso_data):
        logging.debug("logging qso:")
        logging.debug(qso_data)

    def get_activator_stats(self, callsign):
        logging.debug("getting activator stats...")
        id = update_activator_stats(callsign)
        if id > 0:
            activator = the_db.get_activator_by_id(id)
            s = ActivatorSchema()
            return s.dumps(activator)
        return None

    def set_band_filter(self, band: int):
        logging.debug(f"setting band filter to: {band}")
        x = Bands(band)
        global band_filter
        band_filter = x


def get_entrypoint():
    def exists(path):
        return os.path.exists(os.path.join(os.path.dirname(__file__), path))

    if exists('../gui/index.html'):  # unfrozen development
        return '../gui/index.html'

    if exists('../Resources/gui/index.html'):  # frozen py2app
        return '../Resources/gui/index.html'

    if exists('./gui/index.html'):
        return './gui/index.html'

    raise Exception('No index.html found')


def set_interval(interval):
    def decorator(function):
        def wrapper(*args, **kwargs):
            stopped = threading.Event()

            def loop():  # executed in another thread
                while not stopped.wait(interval):  # until stopped
                    function(*args, **kwargs)

            t = threading.Thread(target=loop)
            t.daemon = True  # stop if the program exits
            t.start()
            return stopped
        return wrapper
    return decorator


entry = get_entrypoint()


@set_interval(60)
def update_ticker():

    logging.debug('updating db')
    do_update()

    if len(webview.windows) > 0:
        webview.windows[0].evaluate_js(
            'window.pywebview.state.setTicker("%d")' % time())


if __name__ == '__main__':
    window = webview.create_window(
        'BIG BAG HUNTER', entry, js_api=Api())
    webview.start(update_ticker, debug=True)
