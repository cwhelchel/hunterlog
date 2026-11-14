import time
import shutil
from alembic_src import versions
import logging as L

from fs.glob import database_file, hl_data_dir

# not having this in the file seemed to mess up logging to index.log
# in index.py. alembic issue?
logging = L.getLogger(__name__)


def do_upgrade():
    logging.info('upgrading to head')

    # backup spot file
    try:
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        fn = hl_data_dir / f"spots-{timestamp}.db-back"
        logging.info(f'backing up {database_file} to {fn}')
        shutil.copy2(database_file, fn)
    except Exception as ex:
        logging.error("Couldnot back up spots.db", exc_info=ex)

    versions.upgrade()


def get_version(verbose: bool = False):
    logging.info('getting current db version')
    return versions.current(verbose)
