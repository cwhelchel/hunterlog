from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
import os
import logging as L
import urllib.request
from urllib.parse import urlparse

from db.models.callsign_notes import CallsignNote

log = L.getLogger(__name__)


class CallsignNotes():
    '''
    This class handles the operations related to the callsign note files that
    are configured by the user.
    '''

    def __init__(self, rows: list[CallsignNote]):
        '''
        Create new instance of CallsignNotes class

        :param rows: list of rows from db. should be sorted by col `order` asc
        :type rows: list[CallsignNote]
        '''
        self.map = defaultdict(list)
        root = self._get_app_global_path()
        self.notes_root = Path(str(root), 'data/', 'notes/')
        self.notes_root.mkdir(exist_ok=True)
        log.debug(f'data root = {self.notes_root} for {rows}')
        self._init_notes(rows)

    def get_notes(self, callsign: str) -> str:
        x = self.map[callsign]
        str_lst = [str(s) for s in x]
        return str.join('\n', str_lst)

    def _is_uri(self, uri_string):
        try:
            result = urlparse(uri_string)
            # A valid URI needs at least a scheme and a non-empty network location (netloc)  # NOQA
            # or a path that makes sense as an absolute URN if no netloc/scheme present # NOQA
            # This simple check focuses on common web URLs but can be adapted for other URI types.  # NOQA
            return all([result.scheme, result.netloc])
        except ValueError:
            return False

    def _init_notes(self, rows: list[CallsignNote]):
        for row in rows:
            path = row.path
            is_url = self._is_uri(path)
            if is_url:
                log.debug(f'checking download for {path}')
                # check download date.
                if row.last_download is None:
                    log.debug(f'first download of {row}')
                    self._download_file(row)
                else:
                    dt = row.last_download_tz + timedelta(days=5)
                    log.debug(f'expiration date {dt}')
                    if datetime.now(timezone.utc) > dt:
                        self._download_file(row)

            self._load_file(row.name)

    def _get_app_global_path(self):
        '''stolen from alembic/versions/__init__.py'''
        if getattr(sys, 'frozen', False):
            return os.path.abspath(os.path.dirname(sys.executable))
        elif __file__:
            # were running from source (npm run start) and this file is in
            # so we need to back up a little so the code works
            return os.path.dirname(__file__) + "/../../"

    def _download_file(self, row: CallsignNote):
        path = row.path
        try:
            fn = Path(self.notes_root, row.name + ".txt")
            with urllib.request.urlopen(path, timeout=10.0) as resp:
                text = resp.read().decode('utf-8')
                t = str(text).replace('\n', ' ')[0:255]
                log.debug(f'downloaded text {t}...')
                log.debug(f'saving to {fn}')
                with open(fn, 'wt', encoding='utf-8') as file:
                    file.writelines(text)
        except Exception as ex:
            log.error('error downloading callsign note file', exc_info=ex)
        finally:
            row.last_download = datetime.now(timezone.utc)

    def _load_file(self, name: str):
        fn = Path(self.notes_root, name + ".txt")
        with open(fn, 'rt', encoding='utf-8') as file:
            all_lines = file.readlines()

            for line in all_lines:
                if line.startswith('#') or line == '' or line.isspace():
                    continue

                x = line.split(' ', maxsplit=1)
                call = x[0].strip()
                note = x[1].strip()
                self.map[call].append(note)
