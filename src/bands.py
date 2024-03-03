'''
This file contains data about the Ham radio bands.

Import Bands for the main enum values, import bandNames for a string of names
import bandLimits for the band edges (not currently configurable). Import
get_band(freq) for a method to take a freq and return a BAND enum.

'''

from enum import Enum
import logging as L
logging = L.getLogger("bands")


class Bands(Enum):
    NOBAND = 0
    ONESIXTY = 1
    EIGHTY = 2
    SIXTY = 3
    FOURTY = 4
    THIRTY = 5
    TWENTY = 6
    SEVENTEEN = 7
    FIFTEEN = 8
    TWELVE = 9
    TEN = 10
    SIX = 11
    TWO = 12
    ONEPTWOFIVE = 13
    SEVENTYCM = 14
    THIRTYTHREECM = 15
    TWENTYTHREECM = 16


bandNames = [
    'NA', '160m', '80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m',
    '10m', '6m', '1.25m', '70cm', '33cm', '23cm'
]

bandLimits = {
    Bands.ONESIXTY: (1800.0, 2000.0),
    Bands.EIGHTY: (3500.0, 4000.0),
    Bands.SIXTY: (5330.0, 5410.0),
    Bands.FOURTY: (7000.0, 7300.0),
    Bands.THIRTY: (10100.0, 10150.0),
    Bands.TWENTY: (14000.0, 14350.0),
    Bands.SEVENTEEN: (18068.0, 18168.0),
    Bands.FIFTEEN: (21000.0, 21450.0),
    Bands.TWELVE: (24890.0, 24990.0),
    Bands.TEN: (28000.0, 29700.0),
    Bands.SIX: (50000.0, 54000.0),
    Bands.TWO: (144_000.0, 148_000.0),
    Bands.ONEPTWOFIVE: (219_000.0, 225_000.0),
    Bands.SEVENTYCM:  (420_000.0, 450_000.0),
    Bands.THIRTYTHREECM: (902_000.0, 928_000.0),
    Bands.TWENTYTHREECM: (1_270_000.0, 1_300_000.0)
}


def get_band(freq: str) -> Bands:
    '''
    Get the enumerated Bands value for the given frequency

    :param str freq: string of the frequency in MHz
    '''
    try:
        f = float(freq)
        for band, lmt in bandLimits.items():
            if (f > lmt[0] and f < lmt[1]):
                return band
    except ValueError:
        logging.error("invalid str to float conv in get_band(freq)")
        return Bands.NOBAND


def get_band_name(freq: str) -> str:
    '''
    Get band name for the given frequency.

    :param str freq: string of the frequency in MHz
    '''
    try:
        f = float(freq)
        for band, lmt in bandLimits.items():
            if (f > lmt[0] and f < lmt[1]):
                return bandNames[band.value]
    except ValueError:
        logging.error("invalid str to float conv in get_band_name(freq)")
        return bandNames[Bands.NOBAND]
