import json
from pathlib import Path
import sys
import os
import logging as L
from typing import Any

from programs.apis import SotaApi

logging = L.getLogger(__name__)


class Continents():
    '''
    This class handles mapping the reference of POTA and SOTA (parks / summits)
    to continents they are in.

    For POTA, it uses continents.json data file which maps the ISO 3166-1
    2 character country codes (US, GB, NL) to the respective continent codes
    (NA, SA, EU, etc). This is b/c now POTA uses the country codes for the
    prefix for park references (there maybe exceptions)

    For SOTA, it downloads the associations list from the SOTA API. This list
    maps association codes (W0C, W4G, F) to continents. This is saved and
    re-used.
    '''

    def __init__(self):
        root = self._get_app_global_path()
        self.data_root = Path(str(root), 'data/')
        pota_f = Path(str(root), 'data/', 'continents.json')
        if pota_f.exists():
            with open(file=pota_f) as f:
                self.pota: dict[str, Any] = json.load(f)
        else:
            logging.warning(f'no continent file found at {pota_f}')

        self._init_sota(root)
        self.wwbota: dict[str, Any] = None

    def find_continent(self, ccode: str) -> str:
        if ccode not in self.pota.keys():
            logging.error(f"country code {ccode} not found in continents file")
            return None

        cont = self.pota[ccode]['continent']
        return cont

    def find_continent_sota(self, association_code: str) -> str:
        if association_code not in self.sota.keys():
            logging.error(
                f'SOTA association {association_code} not found in file')
            return None

        cont = self.sota[association_code]
        return cont

    def find_continent_wwbota(self, scheme: str) -> str:
        fn = Path(str(self.data_root), 'wwbota_continents.json')

        if self.wwbota is None:
            with open(file=fn, mode='r', encoding='utf-8') as f:
                self.wwbota = json.load(f)

        return self.wwbota[scheme]['continent'].upper()

    def _init_sota(self, root: str):
        sota_f = Path(root, 'data/', 'sota_associations.json')

        if sota_f.exists():
            with open(file=sota_f) as f:
                self.sota = json.load(f)
        else:
            logging.info(
                f'no continent file at {sota_f}. downloading from api')
            api = SotaApi()
            o = api.get_associations()
            c = {}

            for association in o:
                k = association['associationCode']
                v = association['continent']
                c[k] = v

            self.sota = c
            with open(sota_f, 'w', encoding='utf-8') as output:
                json.dump(c, output)

    def _get_app_global_path(self):
        '''stolen from alembic/versions/__init__.py'''
        if getattr(sys, 'frozen', False):
            return os.path.abspath(os.path.dirname(sys.executable))
        elif __file__:
            # were running from source (npm run start) and this file is in
            # so we need to back up a little so the code works
            return os.path.dirname(__file__) + "/../../"
