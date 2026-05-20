from integrations.wsjtx.packet_processor import PacketProcessor
from integrations.wsjtx.wsjtx_server import WsjtxServer
from lib import pywsjtx
from lib.pywsjtx.wsjtx_packets import DecodePacket, LoggedADIFPacket
import logging

log = logging.getLogger(__name__)

black = pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, 200, 0, 0, 0)
green = pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, 255, 0, 255, 0)
blue_gray = pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, 200, 50, 100, 150)


class Integration:
    def __init__(self, log_handler):
        self.pkt_q = PacketProcessor()
        self.pkt_q.subscribe('logged_adif_pkt', self.logged_packet)
        self.pkt_q.subscribe('decode_pkt', self.decode_packet)
        self.server = WsjtxServer(queue=self.pkt_q)
        self._lhandler = log_handler
        self._cq = {}

    def start(self):
        self.server.start()
        self.pkt_q.start_processing()

    def get_cq_decodes(self):
        return self._cq

    def highlight_call(self, callsign: str, is_hunted: bool):
        if is_hunted:
            self.server.send_highlight_pkt(
                callsign, background=blue_gray, foreground=green)
        else:
            self.server.send_highlight_pkt(
                callsign,  background=black, foreground=green)

    def logged_packet(self, packet: LoggedADIFPacket):
        log.debug(f"got logged_packet {packet}")
        adif = packet.logged_adif
        if self._lhandler:
            self._lhandler(adif)

    def decode_packet(self, decode: DecodePacket):
        if decode.new_decode:
            msg: str = decode.message
            if msg.startswith("CQ"):
                # log.debug(f'got new CQ decode {decode.message}')
                tok = msg.split()
                call = tok[1]
                self._cq[call] = {
                    'snr': decode.snr,
                    'time': decode.time,
                    'mode': decode.mode,
                    'delta_f': decode.delta_f,
                    'delta_t': decode.delta_t,
                    'msg': msg
                }

    def _flush_cqs(self):
        for decode in self._cq:
            pass
