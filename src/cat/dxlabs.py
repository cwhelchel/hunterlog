import socket
from cat.icat import ICat
import logging as L


logger = L.getLogger(__name__)


class dxlabs(ICat):

    def init_cat(self, **kwargs):
        '''
        Initializes the DXLABS CAT control interface.

        :param: **kwargs
            keywords required:
                host = string ip address
                port = integer port number
        '''
        self.host = kwargs['host']
        self.port = kwargs['port']

        try:
            self.dxlabs_sock = socket.socket()
            self.dxlabs_sock.settimeout(0.5)
            self.dxlabs_sock.connect((self.host, self.port))
            logger.info(
                f"Connected to dxlabs socket - {self.host}:{self.port}")
            self.online = True
        except (socket.timeout, socket.error) as e:
            self.dxlabs_sock = None
            self.online = False
            logger.error("init_cat", exc_info=e)

    def set_mode(self, mode: str) -> bool:
        """sets the radios mode using DxLabs API"""

        # <command:10>CmdSetMode<parameters:7><1:2>CW
        # Valid modes are (AM, CW, CW-R, DATA-L, DATA-U, FM, LSB, USB, RTTY, RTTY-R, WBFM)

        t = f'<1:2>{mode}'
        cmd = f'<command:10>CmdSetMode<parameters:{len(t)}>{t}'

        logger.debug(f"dxlabs mode cmd: {cmd}")

        if self.dxlabs_sock:
            try:
                self.online = True
                # logger.debug(f"mode cmd sending...")
                sent = self.dxlabs_sock.send(bytes(cmd, "utf-8"))
                # logger.debug(f"mode cmd sent {sent}")
                return True
            except socket.error as e:
                self.online = False
                logger.error("set_mode", exc_info=e)
                self.dxlabs_sock = None
                return False

        return False

    def set_vfo(self, freq: str) -> bool:
        """sets the radios vfo"""

        # convert the hz to kHz
        fMHz = float(freq) / 1_000

        # <command:10>CmdSetFreq<parameters:17><xcvrfreq:5>21230
        fMHz_size = len(str(fMHz))
        t = f'<xcvrfreq:{fMHz_size}>{fMHz}'
        cmd = f'<command:10>CmdSetFreq<parameters:{len(t)}>{t}'
        
        # logger.debug(f"dxlabs vfocmd: {cmd}")

        if self.dxlabs_sock:
            try:
                self.online = True
                # logger.debug("dxlabs sending to sock")
                sent = self.dxlabs_sock.send(bytes(cmd, "utf-8"))
                # logger.debug(f"dxlabs sent # bytes: {sent}")
                _ = self.dxlabs_sock.recv(0).decode().strip()
                # logger.debug("dxlabs recv: %s", _)
                return True
            except socket.error as e:
                self.online = False
                logger.error("set_vfo", exc_info=e)
                self.dxlabs_sock = None
                return False
        
        return False

