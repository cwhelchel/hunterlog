
import os
import sys
import threading
import logging as L

log = L.getLogger(__name__)


def res_path(rel_path):
    try:
        base_path = sys._MEIPASS
    except:  # NOQA E722
        base_path = os.path.abspath('.')

    return os.path.join(base_path, rel_path)


def get_entrypoint():
    '''
    Get the path to the entrypoint html file needed for pywebview.

    This path is different depending on various states of deployment ie running
    from a frozen path, development tree, or a bundled app
    '''
    def exists(path):
        p = os.path.join(os.path.dirname(__file__) or '.', path)
        b = os.path.exists(p)
        return b

    # now that this is in the utils module folder we have to check for
    # existence of files up one directory BUT return the path relative to
    # index.py

    root = res_path('gui')
    x = os.path.join(root, 'index.html')

    if os.path.exists(x):
        return x

    if exists('../../gui/index.html'):  # unfrozen development
        return '../gui/index.html'

    if exists('../../Resources/gui/index.html'):  # frozen py2app
        return '../Resources/gui/index.html'

    if exists('../gui/index.html'):
        return '../gui/index.html'

    if exists('./gui/index.html'):
        return './gui/index.html'

    raise Exception('No index.html found')


def set_interval(interval):
    """
    Decorator that sets executes the decorated function in a separate thread
    waiting the given interval between executions.
    """
    def decorator(function):
        def wrapper(*args, **kwargs):
            stopped = threading.Event()

            def loop():  # executed in another thread
                while True:
                    function(*args, **kwargs)
                    if stopped.wait(interval):  # until stopped
                        break
            t = threading.Thread(target=loop)
            t.daemon = True  # stop if the program exits
            t.start()
            return stopped
        return wrapper
    return decorator
