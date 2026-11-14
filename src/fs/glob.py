"""
glob.py

Global Hunterlog file information.

This file contains important file path specifications for the hunterlog. It
uses the platformdirs library to determine the appropriate directories for
storing user data and logs, ensuring that files are placed in the correct
locations based on the operating system.

All file and directories should be accessed via the functions and variables
defined in this module to maintain consistency.
"""

import logging
import logging.config
import shutil
import sys
from pathlib import Path
from platformdirs import PlatformDirs


# Define your app name and author/company
dirs = PlatformDirs(appname="hunterlog", appauthor=False, ensure_exists=True)

dirs.user_log_path.mkdir(parents=True, exist_ok=True)
dirs.user_data_path.mkdir(parents=True, exist_ok=True)

# Get pathlib.Path objects for different storage needs
log_file = dirs.user_log_path / "index.log"
database_file = dirs.user_data_path / "spots.db"
log_conf_file = dirs.user_data_path / "logging.conf"

# paths for the Hunterlog data dir. in {platformdirs.user_data_path}/data/
hl_data_dir = dirs.user_data_path / "data"
hl_data_dir.mkdir(parents=True, exist_ok=True)

# known data files. these can use fs.data_file to access
adif_log_file = hl_data_dir / "hunter.adi"


def get_app_dir() -> Path:
    '''
    Get the directory containing the executable or main script.
    '''
    if getattr(sys, "frozen", False):
        print("Running in a frozen environment.")
        return Path(sys.executable).resolve().parent

    # /fs/global.py is in the src/fs directory, so we need to go up two levels
    # to get to the root of the project. We want the dir above src (the project
    # root)
    this_file_dir = Path(__file__).resolve().parent
    res = this_file_dir.parent.parent
    print(f"Running in a non-frozen environment. Returning {res}")
    return res


def migrate_old_files(user_dir: Path, force: bool = False) -> bool:
    '''
    Migrate files (spots.db, logging.conf) from the application executable
    directory to the platformdirs user data directory.
    '''

    def _copy2(old_file: Path, new_file: Path, ) -> bool:
        if (not new_file.exists() and old_file.exists()) or \
                (old_file.exists() and force):
            print(f"Migrating file from {old_file} to {new_file}")
            if new_file.exists():
                shutil.copy2(new_file, new_file.with_name(f"{new_file.name}.bak"))  # NOQA
            shutil.copy2(old_file, new_file)
            return True
        return False

    print("starting file migration...")

    old_db_file = user_dir / "spots.db"
    old_log_conf_file = user_dir / "logging.conf"
    old_adif_log_file = user_dir / "hunter.adi"
    old_data_dir = user_dir / "data"
    res: list[bool] = []

    res.append(_copy2(old_db_file, database_file))
    res.append(_copy2(old_log_conf_file, log_conf_file))

    # this one is special. it moves from program_dir/hunter.adi to
    # program_dir/data/hunter.adi
    res.append(_copy2(old_adif_log_file, adif_log_file))

    hl_data_is_empty = not any(hl_data_dir.iterdir())

    if (hl_data_is_empty and old_data_dir.exists()):
        print(f"Migrating directory from {old_data_dir} to {hl_data_dir}")
        shutil.copytree(old_data_dir, hl_data_dir, dirs_exist_ok=True)
        res.append(True)

    return any(res)


def migrate_to_platformdirs(folder):
    try:
        old_dir = Path(folder)
        print(f"migrating from old install {old_dir}")
        migrate_old_files(old_dir, force=True)
        return True
    except Exception as ex:
        print(f"Error migrating from old install {old_dir}")
        print(f"exception {ex}")
        return False


def configure_logging():
    '''
    Configure the global logging system for Hunterlog.

    This attempts to sort out the location for logging.conf and use it. First
    it tries the platformdirs log file, then a file near the executable, then
    a default basic file logger.

    It should always find the platformdirs one b/c migrate_files should happen
    before logging is configured.
    '''

    # when running from source, logging.conf is up one more dir
    local_conf = Path(get_app_dir(), 'logging.conf')

    print(f"logging.conf - platformdirs : {log_conf_file} ")
    print(f"logging.conf - local : {local_conf}")

    # for .conf files, file name should always point to platformdirs log file
    defaults = {
        "logfilename": str(log_file)
    }

    if log_conf_file.exists():
        print('using platformdirs logging.conf')
        # Use the logging configuration from platformdirs
        logging.config.fileConfig(
            fname=log_conf_file,
            defaults=defaults,
            disable_existing_loggers=False)
    elif local_conf.exists():
        print('using local logging.conf')
        # use the logging configuration next to the executable
        logging.config.fileConfig(
            fname=local_conf,
            defaults=defaults,
            disable_existing_loggers=False)
    else:
        print('using default basic config')
        logging.basicConfig(
            filename=log_file,
            encoding='utf-8',
            format='%(asctime)s = %(levelname)-7.7s [%(name)s]: %(message)s',  # noqa E501
            level=logging.DEBUG)

    print(f'logging configured. see {log_file}')
