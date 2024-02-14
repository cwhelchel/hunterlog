import os
import threading
import webview
import logging
from time import time

from db import SpotSchema, QsoSchema, DataBase
from pota import Api as PotaApi

pota = PotaApi()
the_db = DataBase()

# first lets update our spots w/ api data
the_db.update_all_spots(pota.get_spots())


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
        spots = the_db.get_spots()
        ss = SpotSchema(many=True)
        return ss.dumps(spots)

    def qso_data(self, id: int):
        logging.debug('py getting qso data')
        q = the_db.build_qso_from_spot(id)
        qs = QsoSchema()
        return qs.dumps(q)


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


@set_interval(30)
def update_ticker():

    logging.debug('updating db')
    json = pota.get_spots()
    the_db.update_all_spots(json)

    if len(webview.windows) > 0:
        webview.windows[0].evaluate_js(
            'window.pywebview.state.setTicker("%d")' % time())


if __name__ == '__main__':
    window = webview.create_window(
        'BIG BAG HUNTER', entry, js_api=Api())
    webview.start(update_ticker, debug=True)
