import json

import requests
import logging
from datetime import datetime

log = logging.getLogger(__name__)

WAVELOG_API_URL = ""
WAVELOG_API_KEY = ""
WL_API_LOG = "/index.php/api/qso/"
WL_API_RIG = '/index.php/api/radio'
RADIO_NAME = "HUNTERLOG"

# Define required headers
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}


def send_radio(url: str, api_key: str, freq_hz: str, mode: str):

    radio_payload = {
        "key": api_key,
        "radio": RADIO_NAME,
        "frequency": freq_hz,
        "mode": mode,
        "power": '',  # Optional field defined in watts
        "timestamp": datetime.now().strftime("%Y/%m/%d %H:%M")
    }

    # Send the POST request
    try:
        if url.endswith('/'):
            endpoint = url[:-1] + WL_API_RIG
        else:
            endpoint = url + WL_API_RIG

        response = requests.post(
            endpoint, json=radio_payload, headers=headers)

        # Check if the request was successful
        if response.status_code == 200:
            log.debug("Request successful! Response %s", response)
        else:
            log.warning(
                f"Request failed with status \
                    code: {response.status_code} \
                    text: {response.text}")
    except requests.exceptions.RequestException as e:
        log.error(f"An error occurred sending to wavelog: {freq_hz} {mode}",
                  exc_info=e)


def send_adif(url: str, api_key: str, adif: str):
    '''
    Sends the adif string to the wavelog instance.

    :param str url: url of Wavelog instance (without endpoints appended)
    :param str api_key: generated api key for wavelog API access
    :param str adif: good adif
    '''

    adif_payload = {
        "key": api_key,
        "station_profile_id": "1",
        "type": "adif",
        "string": adif
    }

    try:
        if url.endswith('/'):
            endpoint = url[:-1] + WL_API_LOG
        else:
            endpoint = url + WL_API_LOG

        response = requests.post(
            endpoint, json=adif_payload, headers=headers)

        # Check if the request was successful.
        # Create resource response 201
        if response.status_code == 201:
            log.debug("Request successful! Response %s", response)
        elif response.status_code == 400:
            log.warning(
                f"Error logging to wavelog \
                    code: {response.status_code} \
                    text: {response.text}")
            obj = json.loads(response.text)
            raise Exception('.'.join(obj['messages']))
        else:
            log.warning(
                f"Request failed with status \
                    code: {response.status_code} \
                    text: {response.text}")
    except requests.exceptions.RequestException as e:
        log.error(f"An error occurred sending to wavelog: {url}", exc_info=e)
