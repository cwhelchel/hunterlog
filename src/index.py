import os
import threading
import webview
import logging
import platform

from api import JsApi

# put filename='index.log' for deployment
logging.basicConfig(filename='index.log',
                    encoding='utf-8',
                    format='%(asctime)s = %(levelname)-7.7s [%(name)s]: %(message)s',  # noqa E501
                    level=logging.DEBUG)
# logging.basicConfig(level=logging.DEBUG)

the_api = JsApi()


def do_update():
    logging.debug('updating db')

    the_api._do_update()

    # try:
    #     json = pota.get_spots()
    #     the_db.update_all_spots(json)
    # except ConnectionError as con_ex:
    #     logging.warning("Connection error in do_update: ")
    #     logging.exception(con_ex)
    # except Exception as ex:
    #     logging.error("Unhandled error caught in do_update: ")
    #     logging.error(type(ex).__name__)
    #     logging.exception(ex)
    #     raise


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


def on_closing():
    sz = (window.width, window.height)
    logging.debug(f"close: saving winow data: {sz}")
    the_api._store_win_size(sz)


def on_maximized():
    the_api._store_win_maxi(True)


def on_restore():
    the_api._store_win_maxi(False)


if __name__ == '__main__':
    (x, y) = the_api._get_win_size()
    maxi = the_api._get_win_maximized()

    logging.debug(f"load winow data: {x} x {y} - {maxi}")

    window = webview.create_window(
        'HUNTER LOG',
        entry,
        js_api=the_api,
        maximized=maxi,
        width=x,
        height=y,
        min_size=(800, 600),
        text_select=True)

    window.events.closing += on_closing
    window.events.maximized += on_maximized
    window.events.restored += on_restore

    if platform.system() == "Linux":
        webview.start(update_ticker, private_mode=False, debug=False, gui="gtk")
    elif platform.system() == "Windows":
        webview.start(update_ticker, private_mode=False, debug=False)
    elif platform.system() == "Darwin":
        webview.start(update_ticker, private_mode=False, debug=False)
