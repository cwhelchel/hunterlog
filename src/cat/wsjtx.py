import socket
from cat.icat import ICat
import logging as L


logger = L.getLogger(__name__)


class wsjtx(ICat):
    '''
    This class emulated the udp cat commands that wsjt-x emits. 

    It's a copy of dxlabs.py because the wsjt-x is based off of dxlabs protocol
    except the freq is different.
    '''

    def init_cat(self, **kwargs):
        '''
        Initializes the wsjtx CAT control interface.

        :param: **kwargs
            keywords required:
                host = string ip address
                port = integer port number
        '''
        self.host = kwargs['host']
        self.port = kwargs['port']

        try:
            self.wsjtx_sock = socket.socket()
            self.wsjtx_sock.settimeout(0.5)
            self.wsjtx_sock.connect((self.host, self.port))
            logger.info(
                f"Connected to wsjtx socket - {self.host}:{self.port}")
            self.online = True
        except (socket.timeout, socket.error) as e:
            self.wsjtx_sock = None
            self.online = False
            logger.error("init_cat", exc_info=e)

    def set_mode(self, mode: str) -> bool:
        """sets the radios mode using DxLabs API"""

        # <command:10>CmdSetMode<parameters:7><1:2>CW
        # Valid modes are (AM, CW, CW-R, DATA-L, DATA-U, FM, LSB, USB, RTTY, RTTY-R, WBFM)

        t = f'<1:{len(mode)}>{mode}'
        cmd = f'<command:10>CmdSetMode<parameters:{len(t)}>{t}'

        logger.debug(f"wsjtx mode cmd: {cmd}")

        if self.wsjtx_sock:
            try:
                self.online = True
                # logger.debug(f"mode cmd sending...")
                sent = self.wsjtx_sock.send(bytes(cmd, "utf-8"))
                # logger.debug(f"mode cmd sent {sent}")
                return True
            except socket.error as e:
                self.online = False
                logger.error("set_mode", exc_info=e)
                self.wsjtx_sock = None
                return False

        return False

    def set_vfo(self, freq: str) -> bool:
        """sets the radios vfo"""

        # convert the hz to kHz
        fkHz = float(freq) / 1_000

        # heres where wsjt-x differs. we need to add a localized separator to
        # the string or mcloggerdx will truncate it.
        format_kHz = "{:,.3f}".format(fkHz)

        # note: i dont know how macloggerdx will work if in a locale that the
        # comma is not the thousands separator. this maybe a future bug where
        # i need to use the real locale separator

        # <command:10>CmdSetFreq<parameters:17><xcvrfreq:5>21230
        fMHz_size = len(format_kHz)
        t = f'<xcvrfreq:{fMHz_size}>{format_kHz}'
        cmd = f'<command:10>CmdSetFreq<parameters:{len(t)}>{t}'

        logger.debug(f"wjstx vfocmd: {cmd}")

        if self.wsjtx_sock:
            try:
                self.online = True
                # logger.debug("dxlabs sending to sock")
                sent = self.wsjtx_sock.send(bytes(cmd, "utf-8"))
                # logger.debug(f"dxlabs sent # bytes: {sent}")
                _ = self.wsjtx_sock.recv(0).decode().strip()
                # logger.debug("dxlabs recv: %s", _)
                return True
            except socket.error as e:
                self.online = False
                logger.error("set_vfo", exc_info=e)
                self.wsjtx_sock = None
                return False

        return False

    def get_ptt(self) -> bool:
        raise NotImplementedError
