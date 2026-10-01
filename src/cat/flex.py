import math
import socket
from cat.icat import ICat
import logging as L


logger = L.getLogger(__name__)


class flex(ICat):
    '''
    The Flex cat object interacts using the Flex enhanced CAT commands over a 
    TCP port

    It has enhanced flex commands and a subset of the Kenwood TS-2000 CAT 
    command set

    see https://edge.flexradio.com/www/uploads/20200818184954/SmartSDR-CAT-User-Guide.pdf

    The CAT port is setup in SmartSDR's CAT program as a TCP port using CAT 
    protocol and the slice you want to control

    '''

    def init_cat(self, **kwargs):
        '''
        Initializes the Flex radio CAT control interface.

        :param: **kwargs
            keywords required:
                host = string ip address
                port = integer port number
        '''
        self.host = kwargs['host']
        self.port = kwargs['port']

        try:
            self.socket = socket.socket()
            self.socket.settimeout(0.5)
            self.socket.connect((self.host, self.port))
            logger.info(f"Connected to flex - {self.host}:{self.port}")
            self.online = True
        except (socket.timeout, socket.error) as e:
            self.socket = None
            self.online = False
            logger.warning("init_cat", exc_info=e)

    @property
    def is_online(self) -> bool:
        return self.online

    def set_mode(self, mode: str) -> bool:
        """
        sets the radios mode
        Expects valid FLEX radio string modes. see SmartSDR CAT User Guide.
        """
        cmd = "ZZMD"
        mode_map = {
            "LSB": "00",
            "USB": "01",
            "CWL": "03",
            "CWU": "04",
            "FM": "05",
            "AM": "06",
            "DIGU": "07",
            "DIGL": "09",
            "SAM": "10",
            "NFM": "11",
            "DFM": "12",
            "FDV": "20",
            "RTTY": "30",
            "DSTR": "40"
        }
        mm = mode_map.get(mode)
        if mm:
            cmd = f"{cmd}{mm};"
        else:
            # TODO: handle better
            raise Exception("Unknown mode given to FLEX cat obj")

        logger.debug(cmd)

        if self.socket:
            try:
                self.socket.send(bytes(cmd, "ascii"))
                # _ = self.socket.recv(1024).decode().strip()
                return True
            except socket.error as e:
                self.online = False
                logger.debug("set_mode", exc_info=e)
                self.socket = None
                return False

        self.init_cat(host=self.host, port=self.port)
        return False

    def set_vfo(self, freq: str) -> bool:
        """sets the radios vfo"""

        cmd = "ZZFA"
        s = str(math.trunc(freq))
        cmd = f"{cmd}{s.rjust(11, '0')};"

        logger.debug(cmd)

        if self.socket:
            try:
                self.socket.send(bytes(cmd, "ascii"))
                # _ = self.socket.recv(1024).decode().strip()
                return True
            except socket.timeout as timeout:
                logger.warning("set_vfo timed out", exc_info=timeout)
                return False
            except socket.error as e:
                self.online = False
                logger.debug("set_vfo", exc_info=e)
                self.socket = None
                return False

        self.init_cat(host=self.host, port=self.port)
        return False

    def get_vfo(self) -> str:
        '''
        Gets the radios vfo frequency in hz

        :returns: fx in hz or empty str on error
        '''
        cmd = "ZZFA;"
        if self.socket:
            try:
                self.socket.send(bytes(cmd, "ascii"))
                fx = self.socket.recv(1024).decode().strip()
                logger.debug(f"got freq {fx}")
                if fx[:4] != 'ZZFA':
                    logger.warning('incorrect freq format returned')
                    return '0'

                freq = fx[4:-1]  # ZZFA to semicolon terminator
                # logger.debug(f"stripped freq {freq}")
                return freq
            except socket.error as e:
                self.online = False
                logger.debug("get_vfo", exc_info=e)
                self.socket = None
                return "0"

    def get_ptt(self):
        """Returns ptt state via rigctld"""

        # this flex cmd returns RX state. we have to invert this for TX state
        cmd = "ZZRX;"
        if self.socket:
            try:
                self.socket.send(bytes(cmd, "ascii"))
                ptt = self.socket.recv(1024).decode()
                logger.debug("%s", ptt)
                if ptt[:4] != 'ZZRX':
                    logger.warning('incorrect PTT format returned')
                    return False
                res = ptt[4:-1]
                logger.debug(f'get_ptt -> {res}')

                # inverted
                if res == '1':
                    # were in receive mode. return false for ptt
                    return '0'
                return '1'
            except socket.error as exception:
                self.online = False
                logger.debug("%s", exception)
                self.socket = None
        return False

    def set_cw_speed(self, speed_wpm: int):
        cmd = "KS"
        s = str(speed_wpm).rjust(3, '0')
        cmd = f"{cmd}{s};"
        # logger.debug(cmd)
        if self.socket:
            try:
                payload = bytes(cmd, 'ascii')
                # logger.debug(f"cw speed cmd: {payload}")
                self.socket.send(payload)
            except socket.error as exception:
                self.online = False
                logger.warning("set_cw_speed exception: %s", exception)
                self.socket = None
        return False
