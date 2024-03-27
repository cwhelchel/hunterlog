import requests
import logging as L
import urllib.parse
from utils.callsigns import get_basecall
from version import __version__

logging = L.getLogger("potaApi")


SPOT_URL = "https://api.pota.app/spot/activator"
SPOT_COMMENTS_URL = "https://api.pota.app/spot/comments/{act}/{park}"
ACTIVATOR_URL = "https://api.pota.app/stats/user/{call}"
PARK_URL = "https://api.pota.app/park/{park}"
LOCATIONS_URL = "https://api.pota.app/programs/locations/"
POST_SPOT_URL = "https://api.pota.app/spot/"


class Api():
    '''Class that calls the POTA endpoints and returns their results'''

    def get_spots(self):
        '''Return all current spots from POTA API'''
        response = requests.get(SPOT_URL)
        if response.status_code == 200:
            json = response.json()
            return json

    def get_spot_comments(self, activator, park):
        '''
        Return all spot + comments from a given activation

        :param str activator: Full call of activator including stroke pre and
            suffixes. Will be URL encoded for the request.
        :param str park: the park reference.
        '''
        quoted = urllib.parse.quote_plus(activator)
        url = SPOT_COMMENTS_URL.format(act=quoted, park=park)
        response = requests.get(url)
        if response.status_code == 200:
            json = response.json()
            return json

    def get_activator_stats(self, activator: str):
        '''Return all spot + comments from a given activation'''
        s = get_basecall(activator)

        url = ACTIVATOR_URL.format(call=s)
        response = requests.get(url)
        if response.status_code == 200:
            json = response.json()
            return json
        else:
            return None

    def get_park(self, park_ref: str):
        url = PARK_URL.format(park=park_ref)
        response = requests.get(url)
        if response.status_code == 200:
            json = response.json()
            return json

    @staticmethod
    def get_locations():
        '''
        This file is quite large
        '''
        url = LOCATIONS_URL
        response = requests.get(url)
        if response.status_code == 200:
            json = response.json()
            return json

    @staticmethod
    def post_spot(activator_call: str, park_ref: str,
                  freq: str, mode: str,
                  spotter_call: str, spotter_comments: str):
        '''
        Posts a spot to the POTA spot endpoint. Adding or re-spotting a
        activation.
        '''
        url = POST_SPOT_URL
        headers = {
            "accept": "application/json, text/plain, */*",
            "accept-encoding": "gzip, deflate, br, zstd",
            "Content-Type": "application/json",
            "origin": "https://pota.app",
            "referer": "https://pota.app/",
            'user-agent': f"hunterlog/{__version__}"
        }

        json_data = {
            'activator': activator_call,
            'spotter': spotter_call,
            'frequency': freq,
            'reference': park_ref,
            'mode': mode,
            'source': 'hunterlog',
            'comments': spotter_comments
        }

        r = requests.post(url=url, json=json_data, headers=headers)
        logging.debug(f"code: {r.status_code} : {r.reason}")
