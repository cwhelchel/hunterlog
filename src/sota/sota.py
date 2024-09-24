import requests
import logging as L
from cachetools.func import ttl_cache
# import urllib.parse
# from utils.callsigns import get_basecall

logging = L.getLogger("sotaApi")

SPOT_URL = "https://api2.sota.org.uk/api/spots/-1/all"
SUMMIT_URL = "https://api2.sota.org.uk/api/summits/"


class SotaApi():
    '''Class that calls the POTA endpoints and returns their results'''

    def get_spots(self):
        '''Return all current spots from POTA API'''
        response = requests.get(SPOT_URL)
        logging.debug(response)
        if response.status_code == 200:
            json = response.json()
            return json

    @ttl_cache(ttl=24*60*60)  # 24 hours of cache
    def get_summit(self, summit_ref: str):
        '''Return all current spots from POTA API'''
        response = requests.get(SUMMIT_URL + summit_ref)
        if response.status_code == 200:
            json = response.json()
            return json
