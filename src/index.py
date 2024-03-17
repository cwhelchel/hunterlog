import os
import threading
import webview
import logging
import platform

from api import JsApi
from db import DataBase
from pota import PotaApi

# put filename='index.log' for deployment
logging.basicConfig(filename='index.log',
                    encoding='utf-8',
                    format='%(asctime)s %(message)s',
                    level=logging.DEBUG)
# logging.basicConfig(level=logging.DEBUG)

pota = PotaApi()
the_db = DataBase()
the_api = JsApi(the_db, pota)


def do_update():
    logging.debug('updating db')

    try:
        json = pota.get_spots()
        the_db.update_all_spots(json)
    except Exception as ex:
        logging.error("error caught in do_update")
        logging.exception(ex)
        raise


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


def refresh_frontend():
    try:
        if len(webview.windows) > 0:
            js = 'window.pywebview.state.getSpots()'
            logging.debug('refreshing spots in frontend: ' + js)
            webview.windows[0].evaluate_js(js)
    except Exception as ex:
        logging.error("error in refresh_frontend")
        logging.exception(ex)
        raise


@set_interval(60)
def update_ticker():
    logging.info("thread heartbeat")
    do_update()
    refresh_frontend()


if __name__ == '__main__':
    window = webview.create_window(
        'HUNTER LOG',
        entry,
        js_api=the_api,
        min_size=(800, 600),
        text_select=True)
    if platform.system() == "Linux":
        webview.start(update_ticker, private_mode=False, debug=True, gui="gtk")
    elif platform.system() == "Windows":
        webview.start(update_ticker, private_mode=False, debug=True)
