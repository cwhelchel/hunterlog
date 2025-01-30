import socket
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
        logger.debug("%s", target)

        self.server = xmlrpc.client.ServerProxy(target)
        self.online = True
        try:
            ver = self.server.main.get_version()
            logger.debug(ver)
        except (ConnectionRefusedError, TimeoutError) as e:
            self.online = False
            self.server = None
            logger.warning("no flrig connection", exc_info=e)

    def set_mode(self, mode: str) -> bool:
        """Sets the radios mode"""
        try:
            self.online = True
            return self.server.rig.set_mode(mode)
        except ConnectionRefusedError as e:
            self.online = False
            logger.warning("set_mode", exc_info=e)
        return False

    def set_vfo(self, freq: str) -> bool:
        """Sets the radios vfo"""
        try:
            self.online = True
            return self.server.rig.set_frequency(float(freq))
        except ConnectionRefusedError as e:
            self.online = False
            logger.warning("set_vfo", exc_info=e)
        return False
