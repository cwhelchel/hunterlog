import os
import threading
import webview
import logging
from time import time

from db import DataBase, SpotSchema
from pota import Api as PotaApi

pota = PotaApi()
db = DataBase(pota)
# first lets update our spots w/ api data
db.update_all_spots()

counter = 0


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
        spots = db.get_spots()
        ss = SpotSchema(many=True)
        return ss.dumps(spots)
    
    def qso_data(self):
        logging.debug('py getting qso dat')
        spots = db.get_spots()
        ss = SpotSchema(many=True)
        return ss.dumps(spots)


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


@set_interval(1)
def update_ticker():
    global counter
    counter += 1
    if counter > 30:
        print('updating db')
        db.update_all_spots()
        counter = 0

    if len(webview.windows) > 0:
        webview.windows[0].evaluate_js(
            'window.pywebview.state.setTicker("%d")' % time())
        webview.windows[0].evaluate_js(
            'window.pywebview.state.hookGetSpots('')')


if __name__ == '__main__':
    window = webview.create_window(
        'BIG BAG HUNTER', entry, js_api=Api())
    webview.start(update_ticker, debug=True)
