import os
import threading
import webview
import logging
from time import time

from api import JsApi
from db import DataBase
from pota import Api as PotaApi

# put filename='index.log' for deployment
logging.basicConfig(level=logging.DEBUG)

pota = PotaApi()
the_db = DataBase()
the_api = JsApi(the_db, pota)


def do_update():
    json = pota.get_spots()
    the_db.update_all_spots(json)


# first lets update our spots w/ api data
do_update()


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
        'HUNTER LOG',
        entry,
        js_api=the_api,
        min_size=(800, 600),
        text_select=True)
    webview.start(update_ticker, private_mode=False, debug=True)
