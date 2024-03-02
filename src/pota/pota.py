import requests
import logging as L
import urllib.parse

logging = L.getLogger("potaApi")


SPOT_URL = "https://api.pota.app/spot/activator"
SPOT_COMMENTS_URL = "https://api.pota.app/spot/comments/{act}/{park}"
ACTIVATOR_URL = "https://api.pota.app/stats/user/{call}"
PARK_URL = "https://api.pota.app/park/{park}"


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
        x = activator.split('/')
        if len(x) == 3:
            s = x[1]
        else:
            s = x[0]

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

    # def get_user_hunt(self, id_token: str, cookies: dict):
    #     page = 1
    #     size = 25
    #     searchCall = "WB0RLJ"
    #     url = f"https://api.pota.app/user/logbook?hunterOnly=1&page={page}
    #             &size={size}"
    #     headers = {
    #         'authorization': id_token,
    #         'origin': "https://pota.app",
    #         'referer': "https://pota.app",
    #         # 'accept': "application/json, text/plain, */*",
    #         # 'Accept-Encoding': 'gzip, deflate, br, zstd',
    #         # "Sec-Fetch-Dest": "empty",
    #         # "Sec-Fetch-Mode": "cors",
    #         # "Sec-Fetch-Site": "same-site",
    #     }

    #     with requests.Session() as s:
    #         s.headers.update(headers)
    #         s.cookies.update(cookies)
    #         response = s.options(url)

    #         if response.status_code == 200:
    #             json = response.json()
    #             logging.debug(response.headers)
    #             logging.debug(response.content)

    #             response = s.get(url)
    #             json = response.json()
    #             logging.debug(response.headers)
    #             logging.debug(response.content)
    #             logging.debug(json)
    #             return json

    #     logging.debug(response.json())
