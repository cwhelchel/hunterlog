import socket
from cat.icat import ICat
import logging as L


logger = L.getLogger(__name__)


class aclog(ICat):

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
                self.online = True
                self.aclog_sock.send(bytes(cmd, "utf-8"))
                _ = self.aclog_sock.recv(1024).decode().strip()
                # logger.debug("__setvfo_aclog: %s", _)
                return True
            except socket.error as exception:
                self.online = False
                logger.error("__setvfo_aclog: %s", exception)
                self.aclog_sock = None
                return False

        return False

    def get_ptt(self) -> bool:
        raise NotImplementedError
