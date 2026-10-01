import json
import requests
import logging as L
from cachetools.func import ttl_cache

logging = L.getLogger(__name__)

# 1 = gets last hour of spots
SPOT_URL = "https://api.wwbota.org/spots/?age=23"
BUNKERS_URL = "https://api.wwbota.org/bunkers/"


class WwbotaApi():
    '''Class that calls the GMA WWFF endpoints and returns their results'''

    def get_spots(self):
        '''Return current spots from WWBOTA API'''
        response = requests.get(SPOT_URL)
        logging.debug(response)
        if response.status_code == 200:
            try:
                # this threw on JSON decode before. even w/ 200 status
                # the error indicated an empty response json
                json = response.json()
            except requests.JSONDecodeError as ex:
                logging.warning("bad json in get_spots", exc_info=ex)
                return None
            return json

    @ttl_cache(ttl=24*60*60)  # 24 hours of cache
    def get_bunker(self, bunker_ref: str):
        '''Return all current spots from GMA WWFF API'''
        response = requests.get(BUNKERS_URL + bunker_ref)
        if response.status_code == 200:
            json = response.json()
            return json

    def get_test_spots(self):
        # a spot with a new unknown bunker ref
        # return this from get_spots for testing
        return json.loads(
            """
            [{
                "freq": 7.134,
                "comment": "B/ON-9999",
                "spotter": "ON7DQ/P",
                "references": [
                    {
                        "scheme": null,
                        "dxcc": 0,
                        "reference": "B/ON-9999",
                        "name": null,
                        "type": null,
                        "locator": null,
                        "lat": null,
                        "long": null
                    }
                ],
                "call": "ON7DQ/P",
                "mode": "SSB",
                "type": "Live",
                "time": "2026-01-05T14:57:19.237062Z"
            }]
            """
        )
