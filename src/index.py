import os
import sys
import threading
import time
import traceback
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
from utils.hl_files import HunterlogFiles
from utils.streamlogger import StreamToLogger
from version import __version__


def configure_logging():

    def get_app_global_path():
        '''stolen from alembic/versions/__init__.py'''
        if getattr(sys, 'frozen', False):
            print('frozen')
            return os.path.abspath(os.path.dirname(sys.executable))
        elif __file__:
            print(f'not frozen {__file__}')
            # were running from source (npm run start) and this file is in
            # so we need to back up a little so the code works
            return os.path.dirname(__file__) + "./../"

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

log = logging.getLogger("root")
sys.stdout = StreamToLogger(log, logging.INFO)
sys.stderr = StreamToLogger(log, logging.INFO)

log.info(f"!!!!!!!!!!!! Starting Hunterlog {__version__}")

the_api = JsApi()
started = False

parser = argparse.ArgumentParser()
parser.add_argument("-w", "--reset-win", action="store_true",
                    help="reset the window size and position to default")


def do_update(spots: dict):
    log.debug('updating db')
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
            log.debug('setWorking called in frontend')
            webview.windows[0].evaluate_js(js)
    except Exception as ex:
        log.error("error in setWorking")
        log.exception(ex)
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
            log.debug('refreshing spots in frontend')
            webview.windows[0].evaluate_js(js)
    except Exception as ex:
        log.error("error in refresh_frontend")
        log.exception(ex)
        raise


@set_interval(60)
def update_ticker(t: DownloadThread):
    '''
    This is the main update thread. It handles the critical main update task 
    where the database is updated with the latests spots.
    '''
    log.debug("thread heartbeat")

    spot_arr = t.get_spots()
    show_frontend_work()
    do_update(spot_arr)
    refresh_frontend()

    global started
    if not started:
        # this has to be kicked once to start the thread. And it needs to be
        # run after the main update
        background_update_ticker()
        started = True


@set_interval(60)
def background_update_ticker():

    log.debug("background update heartbeat")
    the_api.do_background_update()


def on_closing():
    # this crashes on linux
    sz = (window.width, window.height)
    pos = (window.x, window.y)
    log.debug(f"close: saving window data: {sz}")
    the_api._store_win_size(sz)
    the_api._store_win_pos(pos)


def on_maximized():
    the_api._store_win_maxi(True)


def on_restore():
    the_api._store_win_maxi(False)


def dl_callback(spots: dict[str, any]):
    the_api.update_metadata(spots)


def global_exception_handler(exctype, value, tb):
    '''
    This global exception handler catches all uncaught exceptions in the
    Python process and logs them.
    '''
    x = "UNHANDLED GLOBAL EXCEPTION CAUGHT"

    error_msg = "".join(traceback.format_exception(exctype, value, tb))

    print(f"{x}:\n{error_msg}", file=sys.stderr)

    # Optional: Pop up a native error dialog before closing
    try:
        log.error(f"{x}:\n{error_msg}")
        webview.windows[0].create_confirmation_dialog(
            "Application Error",
            "An unexpected error occurred. Check index.log")
    except Exception:
        pass

    # Exit or handle recovery
    # sys.exit(1)


def threading_exception_handler(args):
    '''
    This global exception handler catches all uncaught exceptions in spawned
    Python threads.
    '''
    error_msg = "".join(
        traceback.format_exception(args.exc_type,
                                   args.exc_value,
                                   args.exc_traceback)
    )

    x = "UNHANDLED THREADING EXCEPTION CAUGHT"
    print(f"{x}:\n{error_msg}", file=sys.stderr)

    # Optional: Pop up a native error dialog before closing
    try:
        log.error(f"{x}:\n{error_msg}")
        webview.windows[0].create_confirmation_dialog(
            "Application Thread Error",
            "An unhandled error occurred in a thread. Check index.log")
    except Exception:
        pass


# Assign the hook to the system execution hook before anything else happens
log.debug("setting global exception handler")
sys.excepthook = global_exception_handler
threading.excepthook = threading_exception_handler

if __name__ == '__main__':
    args = parser.parse_args()

    entry = get_entrypoint()

    (width, height) = the_api._get_win_size()
    (x, y) = the_api._get_win_pos()
    maxi = the_api._get_win_maximized()
    progs = the_api._get_program_cfg()

    if args.reset_win:
        log.info('resetting window size and position to defaults')
        (width, height) = (800, 600)
        (x, y) = (0, 0)

    log.debug(f"load window data: {width} x {height} - {maxi}")

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

    the_system = platform.system()
    if the_system == 'Windows' or the_system == 'Darwin':
        window.events.closing += on_closing
        window.events.maximized += on_maximized
        window.events.restored += on_restore

    log.info('checking for file downloads...')
    hl_files = HunterlogFiles()

    log.debug('starting dl thread')
    stopFlag = threading.Event()
    dl = DownloadThread(event=stopFlag, progs=progs, post_callback=dl_callback)
    dl.start()

    # test first run. download and parse metadata before starting
    time.sleep(5.5)

    if the_system == "Linux":
        webview.start(update_ticker, args=dl, private_mode=False, debug=True, gui="gtk")  # noqa E501
    elif the_system == "Windows":
        webview.start(update_ticker, args=dl, private_mode=False, debug=True)
    elif the_system == "Darwin":
        webview.start(update_ticker, args=dl, private_mode=False, debug=True)

    stopFlag.set()
