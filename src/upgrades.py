import time
import shutil
from alembic_src import versions
import logging as L

# not having this in the file seemed to mess up logging to index.log
# in index.py. alembic issue?
logging = L.getLogger(__name__)


def do_upgrade():
    logging.info('upgrading to head')

    # backup spot file
    try:
        logging.info('backing up spots.db')
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        fn = f"spots-{timestamp}.db-back"
        shutil.copy2("spots.db", fn)
    except Exception as ex:
        logging.error("Couldnot back up spots.db", exc_info=ex)

    versions.upgrade()


def get_version(verbose: bool = False):
    logging.info('getting current db version')
    return versions.current(verbose)
