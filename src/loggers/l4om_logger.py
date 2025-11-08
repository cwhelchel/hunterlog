import json
import logging
from db.models.qsos import Qso
from loggers.generic_logger import GenericFileLogger
from loggers.util import send_udp_msg

log = logging.getLogger(__name__)


class Log4omLogger(GenericFileLogger):
    def init_logger(self, **kwargs):
        self.host = kwargs['host']
        self.port = kwargs['port']
        return super().init_logger(**kwargs)

    def log_qso(self, qso: Qso) -> str:
        l4om_extra = self.get_extra_field_adif(qso)
        log.debug(f"l4om ex: {l4om_extra}")

        adif = self.ap.get_adif(qso, extra=l4om_extra)

        wrapper = self.ap.get_adif_field("command", "log")

        l4om_adif = f"{wrapper}{adif}"

        send_udp_msg(l4om_adif, self.host, self.port)

        super().log_qso(qso)

        # even tho we can stage qsos with log4om there isn't a mechanism to
        # command it to log. so we log the regular adif way, but we have to
        # clear the staged callsign here
        self.clear_staged()

    def get_extra_field_adif(self, qso: Qso) -> str:
        def to_award(r: str) -> any:
            return {
                "AC": "POTA",
                "R": r,
                "G": r,  # park_region
                "SUB": [],
                "GRA": []
            }

        if qso.pota_ref:
            rs = str(qso.pota_ref).split(',')
            objs = list(map(to_award, rs))
            log.debug(f"pota nfer ref for awards: {objs}")

            s = json.dumps(objs)
            log.debug(f"awards str: {s}")
            extra = self.ap.get_adif_field("APP_L4ONG_QSO_AWARD_REFERENCES", s)
            log.debug(f"awards extra: {extra}")
            return extra
        else:
            s = json.dumps([to_award(qso.sig_info)])
            log.debug(f"awards str: {s}")
            extra = self.ap.get_adif_field("APP_L4ONG_QSO_AWARD_REFERENCES", s)
            log.debug(f"awards extra: {extra}")
            return extra

    def stage_qso(self, qso) -> str:
        # we could hook WSJT-X JT_MESSAGES here in python
        # see https://github.com/bd8bzy/ft8monitor/blob/d18e3f8e152b4f4d49a052999b109f56991c6938/monitor/wsjtx_msg_server.py   # NOQA
        # and https://github.com/saitohirga/WSJT-X/blob/master/Network/NetworkMessage.hpp  # NOQA

        # there is also this https://www.log4om.com/l4ong/usermanual/RemoteControlInterface_1_1.pdf  # NOQA
        # it would work but recent forum posts indicate its buggy:
        # https://forum.log4om.com/viewtopic.php?t=9984

        their_call = qso['call']
        call = f'<RemoteControlRequest><MessageId>C0FC027F-D09E-49F5-9CA6-33A11E05A053</MessageId><RemoteControlMessage>SetCallsign</RemoteControlMessage><Callsign>{their_call}</Callsign></RemoteControlRequest>'  # NOQA
        send_udp_msg(call, self.host, 2241)

        # time.sleep(50 / 1000)  # 10 ms

        # all this stuff below does not appear to work in Log4om 2.34.0
        # forum post above indicates the same (from may 2025)
        # no errors seen in log4om debug logs

        # freq = qso['freq']
        # log.debug(f"freq needs to be hz {freq}")
        # f = float(freq) * 1000
        # freq = str(int(f))
        # log.debug(f"freq needs to be hz {freq}")
        # freq_cmd = f'<RemoteControlRequest><MessageId>C0FC027F-D09E-49F5-9CA6-33A11E05A053</MessageId><RemoteControlMessage>SetRxFrequency</RemoteControlMessage><Frequency>{freq}</Frequency></RemoteControlRequest>'  # NOQA
        # send_udp_msg(freq_cmd, self.host, 2241)
        # freq_cmd = f'<RemoteControlRequest><MessageId>C0FC027F-D09E-49F5-9CA6-33A11E05A053</MessageId><RemoteControlMessage>SetTxFrequency</RemoteControlMessage><Frequency>{freq}</Frequency></RemoteControlRequest>'  # NOQA
        # send_udp_msg(freq_cmd, self.host, 2241)

    def clear_staged(self):
        clear = '<RemoteControlRequest><MessageId>C0FC027F-D09E-49F5-9CA6-33A11E05A053</MessageId><RemoteControlMessage>ClearUI</RemoteControlMessage></RemoteControlRequest>'  # NOQA
        send_udp_msg(clear, self.host, 2241)
