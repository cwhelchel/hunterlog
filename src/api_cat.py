
import json
import random
from cat.cat_interface import CAT
from db.db import DataBase
import logging as L


log = L.getLogger(__name__)


def _response(success: bool, message: str, **kwargs) -> str:
    '''
    Returns a dumped json string from the given inputs.

    :param bool success: indicates if response is pass or fail
    :param str message: default message to return
    :param any kwargs: any keyword arguments are included in the json
    '''
    return json.dumps({
        'success': success,
        'message': message,
        **kwargs
    })


class CatApi:
    def __init__(self, db: DataBase, interface: str, host: str, port: str):
        log.debug("initializing CAT")

        self.db = db

        try:
            self.cat = CAT.get_interface(interface)
            self.cat.init_cat(host=host, port=port)
        except Exception:
            self.cat = None
            log.error("Error creating CAT object: ", exc_info=True)

    def qsy_to(self, freq, mode: str):
        '''
        Use CAT control to QSY. Will adjust mode based on freq and stored
        config values.

        :param freq str: freq in kilohertz
        :param mode str: common mode string
        :returns: API response object
        '''
        log.debug(f"qsy_to {freq} {mode} cat status: {self.cat.is_online}")

        if self.cat is None:
            log.warning("CAT is None. not qsy-ing")
            return _response(False, "CAT control failure.")

        if not self.cat.is_online:
            return _response(False, "CAT offline.", transient=True)

        hrz = float(freq) * 1000.0

        rit = self.db.config.get_value('use_cw_offset')

        if rit and mode == "CW":
            offset = self._get_rit_offset()
            hrz = hrz + offset

        log.debug(f"adjusted freq {hrz}")

        # default to SSB if no mode is given
        # mode = 'SSB' if mode is None or mode == '' else mode

        if mode == "SSB" and hrz >= 10000000:
            mode = "USB"
        elif mode == "SSB" and hrz < 10000000:
            mode = "LSB"
            if hrz > 5330000 and hrz < 5404000:  # 60m SSB is USB
                mode = "USB"
        elif mode == "CW":
            mode = self.db.config.get_value('cw_mode')
        elif mode.startswith("FT"):
            mode = self.db.config.get_value('ftx_mode')

        log.debug(f"adjusted mode {mode}")
        self.cat.set_mode(mode)
        self.cat.set_vfo(hrz)

        return _response(True, "")

    def get_ptt(self):
        '''Returns the PTT state from CAT control'''
        if self.cat is None:
            return _response(False, "CAT control failure.")

        if not self.cat.is_online:
            return _response(False, "CAT offline.", transient=True)

        try:
            ptt = self.cat.get_ptt()
        except NotImplementedError as nie:
            log.error(
                'get_ptt not available for this CAT mode',
                exc_info=nie)
            return _response(False, '', not_implemented=True)

        return _response(True, "", ptt=ptt)

    def set_cw_speed(self, mod_amount: int):
        if self.cat is None:
            return _response(False, "CAT control failure.")

        if not self.cat.is_online:
            return _response(False, "CAT offline.", transient=True)

        try:
            self.cat.set_cw_speed(mod_amount)
        except NotImplementedError as nie:
            log.warning(
                'set_cw_speed not available for this CAT mode',
                exc_info=nie)
            return _response(False, 'set_cw_speed not available for this CAT mode', transient=True)  # NOQA
        except Exception as ex:
            log.error('error mod cw speed', exc_info=ex)
            return _response(False, 'Error setting CW speed', transient=True)

        return _response(True, "")

    def get_freq(self) -> str:
        '''
        Use CAT control to read the freq from the radio

        :returns: API response object. freq in fx kwarg
        '''
        if self.cat is None:
            return _response(False, "CAT control failure.")

        if not self.cat.is_online:
            return _response(False, "CAT offline.", transient=True)

        fx_str = self.cat.get_vfo()

        fx = float(fx_str)
        fx = fx / 1000.0

        return _response(True, "", fx=str(fx))

    def _get_rit_offset(self) -> int:
        r_min = self.db.config.get_value('cw_offset_min')
        r_max = self.db.config.get_value('cw_offset_max')

        if r_min < 10:
            r_min = 10
        if r_max > 100:
            r_max = 100

        offset = random.randint(r_min, r_max)
        neg = random.randint(0, 1)

        if (neg == 1):
            offset = offset * -1

        log.debug(f'random HZ offset {offset}')

        return offset
