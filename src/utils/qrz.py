import requests
import logging
from version import __version__

log = logging.getLogger(__name__)

QRZ_URL = "https://logbook.qrz.com/api"

# Define required headers
headers = {
    "User-Agent": f"hunterlog/{__version__}",
    "Content-Type": "application/x-www-form-urlencoded"
}


def send_adif(api_key: str, adif: str) -> bool:
    '''
    Sends the adif string to the wavelog instance.

    :param str api_key: generated api key for wavelog API access
    :param str adif: good adif
    '''

    payload = {
        "KEY": api_key,
        "ACTION": "INSERT",
        "ADIF": adif
    }

    try:
        endpoint = QRZ_URL

        response = requests.post(
            endpoint,
            data=payload,
            headers=headers)

        if response.status_code == 200:
            log.debug(
                f"Request successful! Response {response} {response.text}")
            # ex response text: RESULT=OK&LOGID=1402481313&COUNT=1
            if response.text is not None:
                res = response.text.split('&')
                if 'RESULT=OK' not in res:
                    log.error(f'Error returned from QRZ logbook API: {response.text}')  # NOQA
                    return False
        else:
            log.warning(
                f"Request failed with status \
                    code: {response.status_code} \
                    text: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        log.error("requests error occurred sending to qrz", exc_info=e)
        return False

    return True
