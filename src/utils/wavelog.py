import json

import requests
import logging
from datetime import datetime

log = logging.getLogger(__name__)

WAVELOG_API_URL = ""
WAVELOG_API_KEY = ""
WL_API_LOG = "/index.php/api/qso/"
WL_API_RIG = '/index.php/api/radio'
WL_API_STATIONS = '/index.php/api/station_info/'
RADIO_NAME = "HUNTERLOG"

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}


def _endpoint(url: str, api_path: str) -> str:
    '''
    Joins the user configured Wavelog base url with an API path, tolerating a
    trailing slash on the base url.

    :param str url: url of Wavelog instance (without endpoints appended)
    :param str api_path: one of the WL_API_* constants

    :returns str: the full endpoint url
    '''
    if url.endswith('/'):
        return url[:-1] + api_path

    return url + api_path


def get_stations(url: str, api_key: str) -> list:
    '''
    Gets the station profiles (aka station locations) belonging to the owner of
    the given API key.

    Wavelog serves this endpoint over GET with the API key embedded in the
    path, so there is no JSON payload. A read only key is sufficient.

    :param str url: url of Wavelog instance (without endpoints appended)
    :param str api_key: generated api key for wavelog API access

    :returns list: station profile dicts as returned by Wavelog. The keys used
        by hunterlog are station_id, station_profile_name, station_callsign and
        station_active.

    :raises Exception: if the request fails or the response cannot be parsed
    '''
    if not url or not api_key:
        raise Exception("Wavelog URL and API key must both be set")

    endpoint = _endpoint(url, WL_API_STATIONS) + api_key

    try:
        response = requests.get(endpoint, headers=headers, timeout=10)
    except requests.exceptions.RequestException as e:
        log.error(f"An error occurred getting stations from: {url}",
                  exc_info=e)
        raise Exception(f"Could not reach Wavelog at {url}")

    if response.status_code != 200:
        log.warning(
            f"Getting Wavelog stations failed with status \
                code: {response.status_code} \
                text: {response.text}")
        raise Exception(
            f"Wavelog returned status {response.status_code}. "
            "Check the URL and that the API key is valid.")

    try:
        stations = json.loads(response.text)
    except json.JSONDecodeError as e:
        log.error("Could not parse Wavelog station_info response",
                  exc_info=e)
        raise Exception("Wavelog returned a response that was not JSON")

    if not isinstance(stations, list):
        log.warning(f"Unexpected station_info response: {response.text}")
        raise Exception("Wavelog did not return a list of stations")

    log.debug(f"got {len(stations)} station profiles from wavelog")

    return stations


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
        endpoint = _endpoint(url, WL_API_RIG)

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


def send_adif(url: str, api_key: str, adif: str, station_id: str):
    '''
    Sends the adif string to the wavelog instance.

    :param str url: url of Wavelog instance (without endpoints appended)
    :param str api_key: generated api key for wavelog API access
    :param str adif: good adif
    :param str station_id: the Wavelog station profile id to log the QSO
        against. Wavelog requires this field, it does not fall back on the
        currently active station profile.
    '''

    adif_payload = {
        "key": api_key,
        "station_profile_id": station_id,
        "type": "adif",
        "string": adif
    }

    try:
        endpoint = _endpoint(url, WL_API_LOG)

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
