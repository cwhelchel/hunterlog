import os
import sys
import threading
import webview
import logging
import logging.config
import platform
import argparse
import mimetypes
from pathlib import Path

from api import JsApi
from download_thread import DownloadThread
from utils.entrypoint import get_entrypoint, set_interval


def configure_logging():

    def get_app_global_path():
        '''stolen from alembic/versions/__init__.py'''
        if getattr(sys, 'frozen', False):
            return os.path.abspath(os.path.dirname(sys.executable))
        elif __file__:
            # were running from source (npm run start) and this file is in
            # so we need to back up a little so the code works
            return os.path.dirname(__file__) + "../../"

    conf = Path(get_app_global_path(), 'logging.conf')
    if conf.exists():
        logging.config.fileConfig(fname=conf, disable_existing_loggers=False)
    else:
        logging.basicConfig(
            filename='index.log',
            encoding='utf-8',
            format='%(asctime)s = %(levelname)-7.7s [%(name)s]: %(message)s',  # noqa E501
            level=logging.DEBUG)


configure_logging()

the_api = JsApi()

parser = argparse.ArgumentParser()
parser.add_argument("-w", "--reset-win", action="store_true",
                    help="reset the window size and position to default")


def do_update(spots: dict):
    logging.debug('updating db')
    the_api._do_update(spots)


def show_frontend_work():
    try:
        if len(webview.windows) > 0:
            js = r"""
            if (window.pywebview.state !== undefined &&
                window.pywebview.state.setWorking !== undefined) {
                window.pywebview.state.setWorking();
            }
            """
            logging.debug('setWorking called in frontend')
            webview.windows[0].evaluate_js(js)
    except Exception as ex:
        logging.error("error in setWorking")
        logging.exception(ex)
        raise


def refresh_frontend():
    try:
        if len(webview.windows) > 0:
            js = r"""
            if (window.pywebview.state !== undefined &&
                window.pywebview.state.getSpots !== undefined) {
                window.pywebview.state.getSpots();
            }
            """
            logging.debug('refreshing spots in frontend')
            webview.windows[0].evaluate_js(js)
    except Exception as ex:
        logging.error("error in refresh_frontend")
        logging.exception(ex)
        raise


@set_interval(60)
def update_ticker(t: DownloadThread):
    logging.info("thread heartbeat")

    spot_arr = t.get_spots()
    show_frontend_work()
    do_update(spot_arr)
    refresh_frontend()


def on_closing():
    # this crashes on linux
    sz = (window.width, window.height)
    pos = (window.x, window.y)
    logging.debug(f"close: saving winow data: {sz}")
    the_api._store_win_size(sz)
    the_api._store_win_pos(pos)


def on_maximized():
    the_api._store_win_maxi(True)


def on_restore():
    the_api._store_win_maxi(False)


if __name__ == '__main__':
    args = parser.parse_args()

    entry = get_entrypoint()

    (width, height) = the_api._get_win_size()
    (x, y) = the_api._get_win_pos()
    maxi = the_api._get_win_maximized()

    if args.reset_win:
        logging.info('resetting window size and position to defaults')
        (width, height) = (800, 600)
        (x, y) = (0, 0)

    logging.debug(f"load window data: {width} x {height} - {maxi}")

    webview.settings = {
        'ALLOW_DOWNLOADS': False,  # Allow file downloads
        'ALLOW_FILE_URLS': True,  # Allow access to file:// urls
        # Open target=_blank links in an external browser
        'OPEN_EXTERNAL_LINKS_IN_BROWSER': True,
        # Automatically open devtools when `start(debug=True)`.
        'OPEN_DEVTOOLS_IN_DEBUG': False,
    }

    # fix for random users with white screen
    # error seen is this:
    # Failed to load module script: Expected a JavaScript module script but the
    # server responded with a MIME type of "text/plain". Strict MIME type
    # checking is enforced for module scripts per HTML spec.
    mimetypes.add_type("application/javascript", ".js")

    window = webview.create_window(
        'HUNTER LOG',
        entry,
        js_api=the_api,
        maximized=maxi,
        width=width,
        height=height,
        x=x,
        y=y,
        min_size=(800, 600),
        text_select=True)

    if platform.system() == 'Windows':
        window.events.closing += on_closing
        window.events.maximized += on_maximized
        window.events.restored += on_restore

    logging.debug('starting dl thread')
    stopFlag = threading.Event()
    dl = DownloadThread(event=stopFlag)
    dl.start()

    if platform.system() == "Linux":
        webview.start(update_ticker, args=dl, private_mode=False, debug=True, gui="gtk")  # noqa E501
    elif platform.system() == "Windows":
        webview.start(update_ticker, args=dl, private_mode=False, debug=True)
    elif platform.system() == "Darwin":
        webview.start(update_ticker, args=dl, private_mode=False, debug=True)

    stopFlag.set()
