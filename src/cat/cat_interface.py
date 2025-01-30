"""
K6GTE, CAT interface abstraction
Email: michael.bridak@gmail.com
GPL V3
"""

import logging
import socket
import xmlrpc.client

from cat.icat import ICat
from cat.aclog_interface import aclog
from cat.dxlabs import dxlabs
from cat.flrig import flrig
from cat.rigctld import rigctld

if __name__ == "__main__":
    print("I'm not the program you are looking for.")

logger = logging.getLogger(__name__)


class CAT:
    """CAT control rigctld or flrig"""

    @staticmethod
    def get_interface(interface_type: str) -> ICat:
        '''
        The main factory method for returning the proper ICat object to be used
        by hunterlog to do CAT control.

        The ICat object should be initialized after this method is called by 
        calling ICat.init_cat() with `**kwargs** host = 'someipstr' and port = 
        someportinteger. For other keyword arguments see the respective cat
        objects init_cat method.

        :param str interface_type: arbitrary string name for the CAT type

        :returns ICat: a usable CAT control obj
        '''
        interface = interface_type.lower()

        if interface == "flrig":
            return flrig()
        elif interface == "rigctld":
            return rigctld()
        elif interface == "aclog":
            return aclog()
        elif interface == "dxlabs":
            return dxlabs()

        return None
    
    ## everything below is now just for historical purposes.

    def __init__(self, interface: str, host: str, port: int) -> None:
        """
        Computer Aided Tranceiver abstraction class.
        Offers a normalized rigctld or flrig interface.

        Takes 3 inputs to setup the class.

        A string defining the type of interface, either 'flrig' or 'rigctld'.

        A string defining the host, example: 'localhost' or '127.0.0.1'

        An interger defining the network port used.
        Commonly 12345 for flrig, or 4532 for rigctld.

        Exposed methods are:

        get_vfo()

        get_mode()

        get_power()

        get_ptt()

        set_vfo()

        set_mode()

        set_power()

        A variable 'online' is set to True if no error was encountered,
        otherwise False.
        """
        self.server = None
        self.rigctrlsocket = None
        self.interface = interface.lower()
        self.host = host
        self.port = port
        self.online = False
        if self.interface == "flrig":
            target = f"http://{host}:{port}"
            logger.debug("%s", target)
            self.server = xmlrpc.client.ServerProxy(target)
            self.online = True
            try:
                ver = self.server.main.get_version()
                logger.debug(ver)
            except ConnectionRefusedError:
                self.online = False
        if self.interface == "rigctld":
            self.__initialize_rigctrld()
        if self.interface == "aclog":
            self.__initialize_aclog()
        if self.interface == "dxlabs":
            self.__initialize_dxlabs()

    def __initialize_rigctrld(self):
        try:
            self.rigctrlsocket = socket.socket()
            self.rigctrlsocket.settimeout(0.5)
            self.rigctrlsocket.connect((self.host, self.port))
            logger.debug("Connected to rigctrld")
            self.online = True
        except ConnectionRefusedError as exception:
            self.rigctrlsocket = None
            self.online = False
            logger.debug("%s", exception)
        except TimeoutError as exception:
            self.rigctrlsocket = None
            self.online = False
            logger.debug("%s", exception)

    def __initialize_aclog(self):
        try:
            self.aclog_sock = socket.socket()
            self.aclog_sock.settimeout(0.5)
            self.aclog_sock.connect((self.host, self.port))
            logger.debug("Connected to aclog socket")
            self.online = True
        except (ConnectionRefusedError, TimeoutError) as exception:
            self.aclog_sock = None
            self.online = False
            logger.error("initializing aclog socket: %s", exception)

    def __initialize_dxlabs(self):
        try:
            self.dxlabs_sock = socket.socket()
            self.dxlabs_sock.settimeout(0.5)
            self.dxlabs_sock.connect((self.host, self.port))
            logger.debug("Connected to dxlabs socket")
            self.online = True
        except (ConnectionRefusedError, TimeoutError) as exception:
            self.dxlabs_sock = None
            self.online = False
            logger.error("initializing dxlabs socket: %s", exception)            

    def get_vfo(self) -> str:
        """Poll the radio for current vfo using the interface"""
        vfo = ""
        if self.interface == "flrig":
            vfo = self.__getvfo_flrig()
        if self.interface == "rigctld":
            vfo = self.__getvfo_rigctld()
            if "RPRT -" in vfo:
                vfo = ""
        if self.interface == "aclog":
            vfo = self.__getvfo_aclog()
        if self.interface == "dxlabs":
            vfo = self.__getvfo_dxlabs()
        return vfo

    def __getvfo_flrig(self) -> str:
        """Poll the radio using flrig"""
        try:
            self.online = True
            return self.server.rig.get_vfo()
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("getvfo_flrig: %s", exception)
        return ""

    def __getvfo_rigctld(self) -> str:
        """Returns VFO freq returned from rigctld"""
        if self.rigctrlsocket:
            try:
                self.online = True
                self.rigctrlsocket.send(b"\nf\n")
                return self.rigctrlsocket.recv(1024).decode().strip()
            except socket.error as exception:
                self.online = False
                logger.debug("getvfo_rigctld: %s", exception)
                self.rigctrlsocket = None
            return ""

        self.__initialize_rigctrld()
        return ""

    def __getvfo_aclog(self) -> str:
        '''Returns the VFO freq by querying ACLog API'''
        cmd = b'<CMD><READBMF></CMD>'
        try:
            if self.aclog_sock:
                self.aclog_sock.send(cmd)
                resp = self.aclog_sock.recv(1024).decode().strip()
                logger.debug(resp)
                return resp
        except socket.error as ex:
            logger.error("getvfo_aclog", exc_info=ex)
        return ''
    
    def __getvfo_dxlabs(self) -> str:
        '''Returns the VFO freq by querying DXLabs API'''
        cmd = b'<command:10>CmdGetFreq<parameters:0>'
        try:
            if self.dxlabs_sock:
                self.dxlabs_sock.send(cmd)
                resp = self.dxlabs_sock.recv(1024).decode().strip()
                logger.debug(resp)
                return resp
        except socket.error as ex:
            logger.error("getvfo_dxlabs", exc_info=ex)
        return ''

    def get_mode(self) -> str:
        """Returns the current mode filter width of the radio"""
        mode = ""
        if self.interface == "flrig":
            mode = self.__getmode_flrig()
        if self.interface == "rigctld":
            mode = self.__getmode_rigctld()
        # TODO: add this for aclog and dxlabs
        return mode

    def __getmode_flrig(self) -> str:
        """Returns mode via flrig"""
        try:
            self.online = True
            return self.server.rig.get_mode()
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("%s", exception)
        return ""

    def __getmode_rigctld(self) -> str:
        """Returns mode vai rigctld"""
        if self.rigctrlsocket:
            try:
                self.online = True
                self.rigctrlsocket.send(b"m\n")
                mode = self.rigctrlsocket.recv(1024).decode()
                mode = mode.strip().split()[0]
                logger.debug("%s", mode)
                return mode
            except IndexError as exception:
                logger.debug("%s", exception)
            except socket.error as exception:
                self.online = False
                logger.debug("%s", exception)
                self.rigctrlsocket = None
            return ""
        self.__initialize_rigctrld()
        return ""

    def get_bw(self):
        """Get current vfo bandwidth"""
        if self.interface == "flrig":
            return self.__getbw_flrig()
        if self.interface == "rigctld":
            return self.__getbw_rigctld()
        return False

    def __getbw_flrig(self):
        """ccc"""
        try:
            self.online = True
            return self.server.rig.get_bw()
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("getbw_flrig: %s", exception)
            return ""

    def __getbw_rigctld(self):
        """ccc"""
        if self.rigctrlsocket:
            try:
                self.online = True
                self.rigctrlsocket.send(b"m\n")
                mode = self.rigctrlsocket.recv(1024).decode()
                mode = mode.strip().split()[1]
                logger.debug("%s", mode)
                return mode
            except IndexError as exception:
                logger.debug("%s", exception)
            except socket.error as exception:
                self.online = False
                logger.debug("%s", exception)
                self.rigctrlsocket = None
            return ""
        self.__initialize_rigctrld()
        return ""

    def get_power(self):
        """Get power level from rig"""
        if self.interface == "flrig":
            return self.__getpower_flrig()
        if self.interface == "rigctld":
            return self.__getpower_rigctld()
        return False

    def __getpower_flrig(self):
        try:
            self.online = True
            return self.server.rig.get_power()
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("getpower_flrig: %s", exception)
            return ""

    def __getpower_rigctld(self):
        if self.rigctrlsocket:
            try:
                self.online = True
                self.rigctrlsocket.send(b"l RFPOWER\n")
                return int(float(self.rigctrlsocket.recv(1024).decode().strip()) * 100)
            except socket.error as exception:
                self.online = False
                logger.debug("getpower_rigctld: %s", exception)
                self.rigctrlsocket = None
            return ""

    def get_ptt(self):
        """Get PTT state"""
        if self.interface == "flrig":
            return self.__getptt_flrig()
        if self.interface == "rigctld":
            return self.__getptt_rigctld()
        return False

    def __getptt_flrig(self):
        """Returns ptt state via flrig"""
        try:
            self.online = True
            return self.server.rig.get_ptt()
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("%s", exception)
        return "0"

    def __getptt_rigctld(self):
        """Returns ptt state via rigctld"""
        if self.rigctrlsocket:
            try:
                self.online = True
                self.rigctrlsocket.send(b"t\n")
                ptt = self.rigctrlsocket.recv(1024).decode()
                logger.debug("%s", ptt)
                ptt = ptt.strip()
                return ptt
            except socket.error as exception:
                self.online = False
                logger.debug("%s", exception)
                self.rigctrlsocket = None
        return "0"

    def set_vfo(self, freq: str) -> bool:
        """Sets the radios vfo"""
        if self.interface == "flrig":
            return self.__setvfo_flrig(freq)
        if self.interface == "rigctld":
            return self.__setvfo_rigctld(freq)
        if self.interface == "aclog":
            return self.__setvfo_aclog(freq)
        if self.interface == "dxlabs":
            return self.__setvfo_dxlabs(freq)
        return False

    def __setvfo_flrig(self, freq: str) -> bool:
        """Sets the radios vfo"""
        try:
            self.online = True
            return self.server.rig.set_frequency(float(freq))
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("setvfo_flrig: %s", exception)
        return False

    def __setvfo_rigctld(self, freq: str) -> bool:
        """sets the radios vfo"""
        if self.rigctrlsocket:
            try:
                self.online = True
                self.rigctrlsocket.send(bytes(f"F {freq}\n", "utf-8"))
                _ = self.rigctrlsocket.recv(1024).decode().strip()
                return True
            except socket.error as exception:
                self.online = False
                logger.debug("setvfo_rigctld: %s", exception)
                self.rigctrlsocket = None
                return False
        self.__initialize_rigctrld()
        return False

    def __setvfo_aclog(self, freq: str) -> bool:
        """sets the radios vfo"""

        # convert the hz to MHz
        mode = self.aclog_new_mode if self.aclog_new_mode else "CW"
        fMHz = float(freq) / 1_000_000
        # logger.debug("__setvfo_aclog freq MHz: %s", fMHz)
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
        # self.__initialize_rigctrld()
        return False

    def __setvfo_dxlabs(self, freq: str) -> bool:
        """sets the radios vfo"""

        # convert the hz to kHz
        fMHz = float(freq) / 1_000
        # <command:10>CmdSetFreq<parameters:17><xcvrfreq:5>21230
        fMHz_size = len(str(fMHz))
        t = f'<xcvrfreq:{fMHz_size}>{fMHz}'
        cmd = f'<command:10>CmdSetFreq<parameters:{len(t)}>{t}'
        
        logger.debug(f"dxlabs vfocmd: {cmd}")

        if self.dxlabs_sock:
            try:
                self.online = True
                logger.debug("dxlabs sending to sock")
                sent = self.dxlabs_sock.send(bytes(cmd, "utf-8"))
                logger.debug(f"dxlabs sent # bytes: {sent}")
                _ = self.dxlabs_sock.recv(0).decode().strip()
                logger.debug("dxlabs recv: %s", _)
                return True
            except socket.error as exception:
                self.online = False
                logger.error("__setvfo_dxlabs: %s", exception)
                self.dxlabs_sock = None
                return False
        # self.__initialize_rigctrld()
        return False


    def set_mode(self, mode: str) -> bool:
        """Sets the radios mode"""
        if self.interface == "flrig":
            return self.__setmode_flrig(mode)
        if self.interface == "rigctld":
            return self.__setmode_rigctld(mode)
        if self.interface == "aclog":
            return self.__setmode_aclog(mode)
        if self.interface == "dxlabs":
            return self.__setmode_dxlabs(mode)

        return False

    def __setmode_flrig(self, mode: str) -> bool:
        """Sets the radios mode"""
        try:
            self.online = True
            return self.server.rig.set_mode(mode)
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("setmode_flrig: %s", exception)
        return False

    def __setmode_rigctld(self, mode: str) -> bool:
        """sets the radios mode"""
        if self.rigctrlsocket:
            try:
                self.online = True
                self.rigctrlsocket.send(bytes(f"M {mode} 0\n", "utf-8"))
                _ = self.rigctrlsocket.recv(1024).decode().strip()
                return True
            except socket.error as exception:
                self.online = False
                logger.debug("setmode_rigctld: %s", exception)
                self.rigctrlsocket = None
                return False
        self.__initialize_rigctrld()
        return False

    def __setmode_aclog(self, mode: str) -> bool:
        """sets the radios mode using AClog API"""

        # logger.debug("__setmode_aclog storing new mode: %s", mode)
        self.aclog_new_mode = mode

        return True
    
    def __setmode_dxlabs(self, mode: str) -> bool:
        """sets the radios mode using DxLabs API"""

        #<command:10>CmdSetMode<parameters:7><1:2>CW
        #Valid modes are (AM, CW, CW-R, DATA-L, DATA-U, FM, LSB, USB, RTTY, RTTY-R, WBFM)
        
        # mode = self.aclog_new_mode if self.aclog_new_mode else "CW"
        t = f'<1:2>{mode}'
        cmd = f'<command:10>CmdSetMode<parameters:{len(t)}>{t}'

        logger.debug(f"dxlabs mode cmd: {cmd}")

        if self.dxlabs_sock:
            try:
                self.online = True
                logger.debug(f"mode cmd sending...")
                sent = self.dxlabs_sock.send(bytes(cmd, "utf-8"))
                logger.debug(f"mode cmd sent {sent}")
                # _ = self.dxlabs_sock.recv(0).decode().strip()
                # logger.debug("__setmode_dxlabs recv return: %s", _)
                return True
            except socket.error as exception:
                self.online = False
                logger.error("__setmode_dxlabs: %s", exception)
                self.dxlabs_sock = None
                return False

        return False

    def set_power(self, power):
        """Sets the radios power"""
        if self.interface == "flrig":
            return self.__setpower_flrig(power)
        if self.interface == "rigctld":
            return self.__setpower_rigctld(power)
        return False

    def __setpower_flrig(self, power):
        try:
            self.online = True
            return self.server.rig.set_power(power)
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("setmode_flrig: %s", exception)
            return False

    def __setpower_rigctld(self, power):
        if power.isnumeric() and int(power) >= 1 and int(power) <= 100:
            rig_cmd = bytes(f"L RFPOWER {str(float(power) / 100)}\n", "utf-8")
            try:
                self.online = True
                self.rigctrlsocket.send(rig_cmd)
                _ = self.rigctrlsocket.recv(1024).decode().strip()
            except socket.error:
                self.online = False
                self.rigctrlsocket = None

    def ptt_on(self):
        """turn ptt on/off"""
        if self.interface == "flrig":
            return self.__ptt_on_flrig()
        if self.interface == "rigctld":
            return self.__ptt_on_rigctld()
        return False

    def __ptt_on_rigctld(self):
        """Toggle PTT state on"""

        # T, set_ptt 'PTT'
        # Set 'PTT'.
        # PTT is a value: ‘0’ (RX), ‘1’ (TX), ‘2’ (TX mic), or ‘3’ (TX data).

        # t, get_ptt
        # Get 'PTT' status.
        # Returns PTT as a value in set_ptt above.

        rig_cmd = bytes("T 1\n", "utf-8")
        logger.debug("%s", f"{rig_cmd}")
        try:
            self.online = True
            self.rigctrlsocket.send(rig_cmd)
            _ = self.rigctrlsocket.recv(1024).decode().strip()
        except socket.error:
            self.online = False
            self.rigctrlsocket = None

    def __ptt_on_flrig(self):
        """Toggle PTT state on"""
        try:
            self.online = True
            return self.server.rig.set_ptt(1)
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("%s", exception)
        return "0"

    def ptt_off(self):
        """turn ptt on/off"""
        if self.interface == "flrig":
            return self.__ptt_off_flrig()
        if self.interface == "rigctld":
            return self.__ptt_off_rigctld()
        return False

    def __ptt_off_rigctld(self):
        """Toggle PTT state off"""
        rig_cmd = bytes("T 0\n", "utf-8")
        logger.debug("%s", f"{rig_cmd}")
        try:
            self.online = True
            self.rigctrlsocket.send(rig_cmd)
            _ = self.rigctrlsocket.recv(1024).decode().strip()
        except socket.error:
            self.online = False
            self.rigctrlsocket = None

    def __ptt_off_flrig(self):
        """Toggle PTT state off"""
        try:
            self.online = True
            return self.server.rig.set_ptt(0)
        except ConnectionRefusedError as exception:
            self.online = False
            logger.debug("%s", exception)
        return "0"
