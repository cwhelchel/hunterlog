from threading import Thread, Event
from queue import Queue
import logging

from lib.pywsjtx.wsjtx_packets import DecodePacket, HeartBeatPacket, InvalidPacket, LoggedADIFPacket  # NOQA

log = logging.getLogger(__name__)


class PacketProcessor():
    def __init__(self):
        self.q = Queue()
        self.stop_event = Event()
        self._handlers = {}

    def add_packet(self, packet):
        self.q.put(packet)

    def subscribe(self, event_name, handler):
        '''
        Subscribe a callback to a Packet Processor event.
        '''
        if event_name not in self._handlers:
            self._handlers[event_name] = []
        self._handlers[event_name].append(handler)

    def process_queue(self):
        while True:
            pkt = self.q.get()
            if isinstance(pkt, InvalidPacket):
                log.warning(f"invalid packet from wsjtx server: {pkt}")
                continue

            if isinstance(pkt, DecodePacket):
                decode: DecodePacket = pkt
                self._process_decode(decode)
            elif isinstance(pkt, LoggedADIFPacket):
                logged: LoggedADIFPacket = pkt
                self._process_logged_adif(logged)
            elif isinstance(pkt, HeartBeatPacket):
                hb: HeartBeatPacket = pkt
                self._process_hb_pkt(hb)

            if self.stop_event.wait(0.01):
                break

    def start_processing(self):
        t = Thread(target=self.process_queue)
        t.daemon = True
        t.start()

    def _process_decode(self, decode: DecodePacket):
        if decode.low_confidence:
            log.debug('low confidence decode seen. ignoring packet')
            return

        self._emit('decode_pkt', decode)

    def _process_logged_adif(self, pkt: LoggedADIFPacket):
        self._emit('logged_adif_pkt', pkt)

    def _process_hb_pkt(self, pkt: HeartBeatPacket):
        self._emit('heartbeat_pkt', pkt)

    def _emit(self, event_name, packet):
        if event_name in self._handlers:
            for handler in self._handlers[event_name]:
                handler(packet)
