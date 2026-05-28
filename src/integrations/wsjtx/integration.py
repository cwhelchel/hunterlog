from dataclasses import dataclass

from integrations.wsjtx.packet_processor import PacketProcessor
from integrations.wsjtx.wsjtx_server import WsjtxServer
from lib import pywsjtx
from lib.pywsjtx.wsjtx_packets import DecodePacket, LoggedADIFPacket
import logging

log = logging.getLogger(__name__)

black = pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, 200, 0, 0, 0)
purple = pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, 255, 138, 0, 103)
green = pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, 255, 0, 255, 0)
blue_gray = pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, 200, 50, 100, 150)
white = pywsjtx.QCOLOR.White


@dataclass
class CallHighlightColor:
    alpha: int
    r: int
    g: int
    b: int

    def to_qcolor(self):
        return pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, self.alpha, self.r, self.g, self.b)  # NOQA

    @staticmethod
    def from_string(d: str):
        try:
            d = d.removeprefix('#')
            r = int(d[:2], base=16)
            g = int(d[2:4], base=16)
            b = int(d[4:6], base=16)
            a = int(d[6:], base=16)
            return pywsjtx.QCOLOR(pywsjtx.QCOLOR.SPEC_RGB, a, r, g, b)
        except Exception as ex:
            log.warning("from_string exception", exc_info=ex)
            return None


@dataclass
class ColorConfig:
    hunted_fore: str
    hunted_back: str
    spotted_fore: str
    spotted_back: str
    new_fore: str
    new_back: str


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

    def highlight_call(
            self,
            callsign: str,
            is_hunted: bool,
            new_park: bool,
            colors: ColorConfig):

        hunted_bg = CallHighlightColor.from_string(
            colors.hunted_back) or blue_gray
        hunted_fg = CallHighlightColor.from_string(colors.hunted_fore) or green
        spotted_bg = CallHighlightColor.from_string(
            colors.spotted_back) or black
        spotted_fg = CallHighlightColor.from_string(
            colors.spotted_fore) or green

        new_bg = CallHighlightColor.from_string(
            colors.new_back) or purple
        new_fg = CallHighlightColor.from_string(
            colors.new_fore) or white

        if is_hunted:
            self.server.send_highlight_pkt(
                callsign,
                background=hunted_bg,
                foreground=hunted_fg)
        elif new_park:
            self.server.send_highlight_pkt(
                callsign,
                background=new_bg,
                foreground=new_fg)
        else:
            self.server.send_highlight_pkt(
                callsign,
                background=spotted_bg,
                foreground=spotted_fg)

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
