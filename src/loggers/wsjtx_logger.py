import logging
from db.models.qsos import Qso
from lib.pywsjtx.wsjtx_packets import LoggedADIFPacket, QSOLoggedPacket
from lib.pywsjtx.wsjtx_packets import PacketWriter
from loggers.generic_logger import GenericFileLogger
from loggers.util import send_udp_bytes

log = logging.getLogger(__name__)


class MyQsoLoggedPacket(QSOLoggedPacket):
    '''
    The lib version of QSOLoggedPacket does not provide a builder method for
    this packet. With my mods to the lib it should work now.
    '''

    @classmethod
    def Builder(cls, qso: Qso, my_call: str, my_grid: str):
        pkt = PacketWriter()
        pkt.write_QInt32(QSOLoggedPacket.TYPE_VALUE)
        pkt.write_QString("WSJT-X")
        pkt.write_QDateTime(qso.time_on)
        pkt.write_QString(qso.call)
        pkt.write_QString(qso.gridsquare)
        fx_hz = float(qso.freq) * 1000.0
        pkt.write_QInt64(int(fx_hz))
        pkt.write_QString(qso.mode)
        pkt.write_QString(qso.rst_sent)
        pkt.write_QString(qso.rst_recv)
        pkt.write_QString(str(qso.tx_pwr))
        pkt.write_QString(qso.comment)
        pkt.write_QString(qso.name)
        pkt.write_QDateTime(qso.time_on)
        pkt.write_QString("")
        pkt.write_QString(my_call)
        pkt.write_QString(my_grid)
        pkt.write_QString(qso.rst_sent)
        pkt.write_QString(qso.rst_recv)
        return pkt.packet


class WsjtxLogger(GenericFileLogger):
    def init_logger(self, **kwargs):
        self.host = kwargs['host']
        self.port = kwargs['port']
        return super().init_logger(**kwargs)

    def log_qso(self, qso: Qso) -> str:
        adif = super().log_qso(qso)

        # mac logger dx should use this
        bytes = MyQsoLoggedPacket.Builder(qso, self.my_call, self.my_grid6)
        log.debug(f'bytes: {bytes.hex()}')
        send_udp_bytes(bytes, self.host, self.port)

        # log4om uses this packet but others may not
        adif_msg = LoggedADIFPacket.Builder(adif_text=adif)
        log.debug(f'adif bytes: {adif_msg.hex()}')
        send_udp_bytes(adif_msg, self.host, self.port)

        return adif

    def stage_qso(self, qso: any) -> str:
        pass

    def clear_staged(self):
        pass
