from dataclasses import dataclass
from threading import Event, Thread
import time

from db.db import DataBase
from integrations.hl_integration import IHlIntegration
from integrations.wsjtx.packet_processor import PacketProcessor
from integrations.wsjtx.wsjtx_server import WsjtxServer
from lib import pywsjtx
from lib.pywsjtx.wsjtx_packets import DecodePacket, HeartBeatPacket, LoggedADIFPacket  # NOQA
import logging

from utils.pywebview_util import call_js_param

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


class WsjtxIntegration(IHlIntegration):
    # marked so JS API doesn't serialize for frontend
    #  - not for our pinned ver of pywebview. update for this to work
    _serializable = False

    def __init__(self):
        self.pkt_q = PacketProcessor()
        self.pkt_q.subscribe('logged_adif_pkt', self.logged_packet)
        self.pkt_q.subscribe('heartbeat_pkt', self.heartbeat_packet)
        self.pkt_q.subscribe('decode_pkt', self.decode_packet)
        self._cq = {}
        self._last_hb_time = 0
        self.stop_event = Event()

    def init(self, **kwargs):
        db = kwargs.get('db')
        if db is None:
            raise ValueError("WsjtxIntegration requires a DataBase object")

        self.db: DataBase = db
        self._log_handler_callback = kwargs.get('wsjt_log_handler')
        self._status_handler_callback = kwargs.get('wsjtx_status_handler')

        if (
            self._log_handler_callback is None or
            self._status_handler_callback is None
        ):
            raise ValueError(
                "WsjtxIntegration requires log and status handler callbacks"
            )

        ip = self.db.config.get_value('wsjtx_ip_addr')
        port = self.db.config.get_value('wsjtx_udp_port')

        if ip is None or port is None:
            raise ValueError("WsjtxIntegration requires ip and port values")

        log.debug(f"WsjtxServer starting: ip={ip}, port={port}")
        self.server = WsjtxServer(ip_address=ip, udp_port=port, queue=self.pkt_q)  # NOQA E501

    def start(self):
        self.server.start()
        self.pkt_q.start_processing()

        t = Thread(target=self._status_check_thread)
        t.daemon = True
        t.start()

    def update(self):
        if self.is_wsjtx_alive() > 1:
            logging.info("WSJTX is offline. Missed heartbeat packets")
            call_js_param('set_wsjtx_status', 2)
            return

        call_js_param('set_wsjtx_status', 0)

        colors = ColorConfig(
            self.db.config.get_value('wsjtx_hunted_fg'),
            self.db.config.get_value('wsjtx_hunted_bg'),
            self.db.config.get_value('wsjtx_spot_fg'),
            self.db.config.get_value('wsjtx_spot_bg'),
            self.db.config.get_value('wsjtx_new_ref_fg'),
            self.db.config.get_value('wsjtx_new_ref_bg')
        )

        # tell wsjtx-to highlight these calls
        x = self.db.spots.get_wsjtx_spots()
        logging.debug(f"highlighting wsjtx #{len(x)} spots")
        for s in x:
            self.highlight_call(
                s.activator, s.hunted, s.park_hunts == 0, colors)

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

    def is_wsjtx_alive(self) -> int:
        '''
        Returns status enum: 0 = wsjtx heartbeat packets received.
        1 = last packet > 45 sec ago
        2 = last hb packet > 60 sec. wsjtx most likely down
        '''
        last = self._last_hb_time
        now = time.time()
        # log.debug(f"checking wsjtx heartbeat {now} - {self._last_hb_time}")
        if (now - last) > 60:
            log.warning(">60 secs since last wsjtx heartbeat packet")
            return 2
        elif (now - last) > 45:
            log.info(">45 secs since last wsjtx heartbeat packet")
            return 1

        return 0

    def logged_packet(self, packet: LoggedADIFPacket):
        log.debug(f"got logged_packet {packet}")
        adif = packet.logged_adif
        if self._log_handler_callback:
            self._log_handler_callback(adif)

    def heartbeat_packet(self, packet: HeartBeatPacket):
        log.debug(f"got heartbeat pkt {packet}")
        now = time.time()
        self._last_hb_time = now

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

    def _status_check_thread(self):
        while True:
            # check status here
            status = self.is_wsjtx_alive()

            if self._status_handler_callback:
                self._status_handler_callback(status)

            if self.stop_event.wait(10.0):
                break
