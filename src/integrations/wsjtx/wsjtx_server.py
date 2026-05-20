#
# In WSJTX parlance, the 'network server' is a program external to the
# wsjtx.exe program that handles packets emitted by wsjtx
#
# TODO: handle multicast groups.
#
# see dump_wsjtx_packets.py example for some simple usage
#
import socket
import struct
import threading
from integrations.wsjtx.packet_processor import PacketProcessor
import lib.pywsjtx as pywsjtx
import logging
import ipaddress

from lib.pywsjtx.wsjtx_packets import HighlightCallsignPacket


class WsjtxServer(threading.Thread):
    '''
    Class that handles the packets coming from WSJT-X on the local machine.

    Based off the provided example from pywsjtx
    '''

    logger = logging.getLogger(__name__)

    MAX_BUFFER_SIZE = pywsjtx.GenericWSJTXPacket.MAXIMUM_NETWORK_MESSAGE_SIZE
    DEFAULT_UDP_PORT = 2237

    def __init__(self, ip_address='127.0.0.1', udp_port=DEFAULT_UDP_PORT, queue: PacketProcessor = None, **kwargs):  # NOQA
        '''
        :param str ip_address: UDP server address (leave as loopback really)
        :param str udp_port: WSJT-X server port

        :param **kwargs:
            * *timeout* (``float``) --
            non-negative floating point timeout value in seconds.
            sock.settimeout

            * *verbose* (``bool``) -- true to debug log timeouts
        '''
        threading.Thread.__init__(self, daemon=True)
        self.stop_event = threading.Event()
        self.timeout = None
        self.verbose = kwargs.get("verbose", False)
        self.pkt_q = queue
        self.return_port = 0

        if kwargs.get("timeout") is not None:
            self.timeout = kwargs.get("timeout")

        the_address = ipaddress.ip_address(ip_address)
        if not the_address.is_multicast:
            self.sock = socket.socket(socket.AF_INET,  # Internet
                                      socket.SOCK_DGRAM)  # UDP

            self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            self.sock.bind((ip_address, int(udp_port)))
        else:
            self.multicast_setup(ip_address, udp_port)

        if self.timeout is not None:
            self.sock.settimeout(self.timeout)

    def multicast_setup(self, group, port=''):
        self.sock = socket.socket(
            socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind(('', port))
        mreq = struct.pack("4sl", socket.inet_aton(group), socket.INADDR_ANY)
        self.sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

    def rx_packet(self):
        try:
            pkt, addr_port = self.sock.recvfrom(
                self.MAX_BUFFER_SIZE)  # buffer size is 1024 bytes
            return (pkt, addr_port)
        except socket.timeout:
            if self.verbose:
                logging.debug("rx_packet: socket.timeout")
            return (None, None)

    def send_packet(self, addr_port, pkt):
        bytes_sent = self.sock.sendto(pkt, addr_port)
        if self.verbose:
            self.logger.debug("send_packet: Bytes sent {} ".format(bytes_sent))

    def stop_thread(self):
        self.stop_event.set()

    def run(self):
        logging.info("wsjt-x server thread starting")

        while True:
            if self.stop_event.is_set():
                logging.info("wsjt-x thread stopping")
                return

            (pkt, addr_port) = self.rx_packet()
            if pkt is not None:
                the_packet = pywsjtx.WSJTXPacketClassFactory.from_udp_packet(
                    addr_port, pkt)

                self.return_port = addr_port

                if self.pkt_q:
                    self.pkt_q.add_packet(the_packet)

    def send_highlight_pkt(
            self,
            callsign: str,
            background: pywsjtx.QCOLOR,
            foreground: pywsjtx.QCOLOR):

        x = HighlightCallsignPacket.Builder(
            callsign=callsign,
            background_color=background,
            foreground_color=foreground,
            highlight_last_only=False)

        self.send_packet(self.return_port, x)
