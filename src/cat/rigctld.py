import socket
from cat.icat import ICat
import logging as L


logger = L.getLogger(__name__)


class rigctld(ICat):

    def init_cat(self, **kwargs):
        '''
        Initializes the RIGCTLD CAT control interface.

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
            logger.info(f"Connected to rigctrld - {self.host}:{self.port}")
            self.online = True
        except (socket.timeout, socket.error) as e:
            self.socket = None
            self.online = False
            logger.warning("init_cat", exc_info=e)

    def set_mode(self, mode: str) -> bool:
        """sets the radios mode"""
        if self.socket:
            try:
                self.online = True
                self.socket.send(bytes(f"M {mode} 0\n", "utf-8"))
                _ = self.socket.recv(1024).decode().strip()
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
        if self.socket:
            try:
                self.online = True
                self.socket.send(bytes(f"F {freq}\n", "utf-8"))
                _ = self.socket.recv(1024).decode().strip()
                return True
            except socket.error as e:
                self.online = False
                logger.debug("set_vfo", exc_info=e)
                self.socket = None
                return False

        self.init_cat(host=self.host, port=self.port)
        return False

    def get_ptt(self):
        """Returns ptt state via rigctld"""
        if self.socket:
            try:
                self.online = True
                self.socket.send(b"t\n")
                ptt = self.socket.recv(1024).decode()
                logger.debug("%s", ptt)
                ptt = ptt.strip()
                logger.debug(f'get_ptt -> {ptt}')
                return ptt
            except socket.error as exception:
                self.online = False
                logger.debug("%s", exception)
                self.socket = None
        return False
