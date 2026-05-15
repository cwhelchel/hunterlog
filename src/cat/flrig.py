import socket
from typing import Optional
import xmlrpc
from cat.icat import ICat
import logging as L


logger = L.getLogger(__name__)


class flrig(ICat):

    def init_cat(self, **kwargs):
        '''
        Initializes the FLRIG CAT control interface.

        :param: **kwargs
            keywords required:
                host = string ip address
                port = integer port number
        '''
        self.host = kwargs['host']
        self.port = kwargs['port']

        target = f"http://{self.host}:{self.port}"
        logger.debug("flrig url: %s", target)

        self.server = xmlrpc.client.ServerProxy(target)
        self.online = True
        try:
            ver = self.server.main.get_version()
            logger.info(f"flrig version: {ver}")
            info = self.server.rig.get_info()
            logger.debug(f"rig.get_info: {info}")
        except (ConnectionRefusedError, TimeoutError) as e:
            self.online = False
            self.server = None
            logger.warning("no flrig connection", exc_info=e)

    @property
    def is_online(self) -> bool:
        return self.online

    def set_mode(self, mode: str) -> bool:
        """Sets the radios mode"""
        try:
            return self.server.rig.set_mode(mode)
        except ConnectionRefusedError as e:
            self.online = False
            logger.warning("set_mode", exc_info=e)
        return False

    def set_vfo(self, freq: str) -> bool:
        """Sets the radios vfo"""
        try:
            return self.server.rig.set_frequency(float(freq))
        except ConnectionRefusedError as e:
            self.online = False
            logger.warning("set_vfo", exc_info=e)
        return False

    def get_vfo(self) -> str:
        '''
        Gets the radios vfo frequency in hz

        :returns: fx in hz or empty str on error
        '''
        try:
            resp = self.server.rig.get_vfo()
            logger.debug(f'get_vfo -> {resp}hz')
            return resp
        except ConnectionRefusedError as e:
            self.online = False
            logger.warning("get_vfo", exc_info=e)
        return ""

    def get_ptt(self):
        """Returns ptt state via flrig"""
        try:
            res = self.server.rig.get_ptt()
            logger.debug(f'get_ptt -> {res}')
            return res
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("%s", exception)
        return False

    def set_cw_speed(self, speed_wpm: int):
        if speed_wpm < 6 or speed_wpm > 48:
            raise ValueError("CW speed outside of acceptable range")

        try:
            logger.debug(f"setting cw wpm: {speed_wpm}")
            res = self.server.rig.cwio_set_wpm(speed_wpm)

            # this CWIO shit sets the keyer UI for the cw text sending in FLRIG.
            # useful but does not set the rigs keyer speed for normal CW

            # this is for ftdx10
            # todo: add config setting
            cmd = f"KS0{speed_wpm:02};"
            self.server.rig.cat_string(cmd)

            # cmd for ICOM: FEFE00E0140C++++FD  bcd 0000=6 0255=48 wpm                                                                                             test
            # presumably all icom's max here is 48???
            # this is untested
            temp = (speed_wpm - 6) * 6.071
            x = int(abs(temp))
            cmd = f"FEFE00E0140C{x:04d}FD"
            logger.debug(f"setting cw wpm CI-V: {cmd}")
            self.server.rig.cat_string(cmd)

            return res
        except Exception as e:
            logger.error('error setting cw wpm', exc_info=e)
