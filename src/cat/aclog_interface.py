import socket
from cat.icat import ICat
import logging as L
import re

logger = L.getLogger(__name__)


class aclog(ICat):
    '''
    CAT control class for N3FJP Amateur Contact Log (AcLog) using its TCP API

    see https://www.n3fjp.com/help/api.html
    '''

    def init_cat(self, **kwargs):
        '''
        Initializes the ACLOG CAT control interface.

        :param: **kwargs
            keywords required:
                host = string ip address
                port = integer port number
        '''
        self.host = kwargs['host']
        self.port = kwargs['port']

        try:
            self.aclog_sock = socket.socket()
            self.aclog_sock.settimeout(0.5)
            self.aclog_sock.connect((self.host, self.port))
            self.online = True
            logger.info("Connected to aclog socket")
        except (socket.timeout, socket.error) as exception:
            self.aclog_sock = None
            self.online = False
            logger.error("initializing aclog socket: %s", exception)

    @property
    def is_online(self) -> bool:
        return self.online

    def set_mode(self, mode: str) -> bool:
        """sets the radios mode using AClog API"""
        self.aclog_new_mode = mode
        return True

    def set_vfo(self, freq: str) -> bool:
        """sets the radios vfo"""

        mode = self.aclog_new_mode if self.aclog_new_mode else "CW"

        # convert the hz to MHz
        fMHz = float(freq) / 1_000_000

        cmd = f'<CMD><CHANGEMODE><VALUE>{mode}</VALUE></CMD>'
        cmd += f'<CMD><CHANGEFREQ><VALUE>{fMHz}</VALUE><SUPPRESSMODEDEFAULT>TRUE</SUPPRESSMODEDEFAULT></CMD>\r\n'
        self.aclog_new_mode = None

        if self.aclog_sock:
            try:
                self.aclog_sock.send(bytes(cmd, "utf-8"))
                _ = self.aclog_sock.recv(1024).decode().strip()
                # logger.debug("__setvfo_aclog: %s", _)
                return True
            except socket.timeout as timeout:
                logger.warning("set_vfo timed out", exc_info=timeout)
                return False
            except socket.error as exception:
                self.online = False
                logger.error("set_vfo: %s", exception)
                self.aclog_sock = None
                return False

        return False

    def get_vfo(self, freq: str) -> str:
        """gets the radios vfo"""        
        cmd = '<CMD><READBMF></CMD>'
        pat = r'<FREQ>(.*)<\/FREQ>'

        if self.aclog_sock:
            try:
                self.aclog_sock.send(bytes(cmd, "utf-8"))
                resp = self.aclog_sock.recv(1024).decode().strip()
                logger.debug("get_vfo: %s", resp)

                match = re.search(pat, resp)
                if match:
                    fx_str = match.group(0)
                    fx = float(fx_str) * 1000000
                    return fx
                return '0'
            except socket.timeout as timeout:
                logger.warning("get_vfo timed out", exc_info=timeout)
                return '0'
            except socket.error as exception:
                self.online = False
                logger.error("get_vfo: %s", exception)
                self.aclog_sock = None
                return '0'        

    def get_ptt(self) -> bool:
        raise NotImplementedError

    def set_cw_speed(self, speed_wpm: int):
        cmd = f'<CMD><CWSETSPEED><VALUE>{speed_wpm}</VALUE></CMD>'

        if self.aclog_sock:
            try:
                self.aclog_sock.send(bytes(cmd, "utf-8"))
                _ = self.aclog_sock.recv(1024).decode().strip()
            except socket.timeout as timeout:
                logger.warning("set_cw_speed timed out", exc_info=timeout)
            except socket.error as exception:
                self.online = False
                logger.error("set_cw_speed: %s", exception)
                self.aclog_sock = None
