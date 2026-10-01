from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import os
import logging as L
import urllib.request

from fs.data_file import DataFile

log = L.getLogger(__name__)


class HunterlogFiles():
    '''
    This class handles the operations related to the callsign note files that
    are configured by the user.
    '''

    _files = [{
        'file': 'wwbota_continents.json',
        'source': 'https://hunterlog.us/v1/wwbota',
        'source_date': 'https://hunterlog.us/v1/wwbota/date',
    }]

    def __init__(self):
        '''
        Create new instance of HunterlogFiles class and inits all files.

        This will download any missing files or newer files from Hunterlog API.
        '''
        try:
            for file in self._files:
                log.debug(f"initializing file {file}")
                self.init_file(file)
        except Exception as ex:
            log.error('error initializing Hunterlog files', exc_info=ex)

    def init_file(self, file: any):
        df = DataFile(file['file'])
        log.debug(df)

        if (not df.exists):
            log.info(f'{df.name} does not exist. downloading...')
            url = file['source']
            self._download_file(df.full_path, url)
        else:
            src_date = self._get_source_date(file['source_date'])
            file_date_tza = df.modified_date.astimezone()

            if file_date_tza < src_date:
                url = file['source']
                log.info(f'{df.name} is old. updating from source...')
                self._download_file(df.full_path, url)

    def _download_file(self, full_path, url):
        try:
            fn = Path(full_path)
            with urllib.request.urlopen(url, timeout=10.0) as resp:
                text = resp.read().decode('utf-8')
                log.debug(f'downloaded text {text[0:100]}...')
                log.debug(f'saving to {fn}')
                with open(fn, 'wt', encoding='utf-8') as file:
                    file.writelines(text)
        except Exception as ex:
            log.error('error downloading Hunterlog file', exc_info=ex)

    def _get_source_date(self, date_url) -> datetime:
        try:
            with urllib.request.urlopen(date_url, timeout=10.0) as resp:
                data = resp.read()
                encoding = resp.info().get_content_charset("utf-8")
                json_obj = json.loads(data.decode(encoding))

                # log.debug(f"response {data} {json_obj} {encoding}")

                # we want to make it tz aware with tz as UTC.
                lastMod = json_obj.get('last_modified')
                dt = datetime.strptime(lastMod, "%Y-%m-%dT%H:%M:%S%z")
                return dt.replace(tzinfo=timezone.utc)
        except Exception as ex:
            log.error('error in _get_source_date', exc_info=ex)
            return None

    def _get_app_global_path(self):
        '''stolen from alembic/versions/__init__.py'''
        if getattr(sys, 'frozen', False):
            return os.path.abspath(os.path.dirname(sys.executable))
        elif __file__:
            # were running from source (npm run start) and this file is in
            # so we need to back up a little so the code works
            return os.path.dirname(__file__) + "/../../"
