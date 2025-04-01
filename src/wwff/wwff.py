import requests
import logging as L
from cachetools.func import ttl_cache
# import urllib.parse
# from utils.callsigns import get_basecall

logging = L.getLogger(__name__)

# -1 gets last hour of spots
SPOT_URL = "https://www.cqgma.org/api/spots/wwff/"
WWFF_INFO__URL = "https://www.cqgma.org/api/wwff/?"


class WwffApi():
    '''Class that calls the GMA WWFF endpoints and returns their results'''

    def get_spots(self):
        '''Return all current spots from GMA WWFF API'''
        response = requests.get(SPOT_URL)
        logging.debug(response)
        if response.status_code == 200:
            json = response.json()
            return json

    @ttl_cache(ttl=24*60*60)  # 24 hours of cache
    def get_wwff_info(self, wwff_ref: str):
        '''Return all current spots from GMA WWFF API'''
        response = requests.get(WWFF_INFO__URL + wwff_ref)
        if response.status_code == 200:
            json = response.json()
            return json
