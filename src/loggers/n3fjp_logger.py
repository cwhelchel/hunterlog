import logging
import time
from bands import get_band_name
from db.models.qsos import Qso
from loggers.generic_logger import GenericFileLogger
from loggers.util import send_tcp_msg

log = logging.getLogger(__name__)


class N3fjpLogger(GenericFileLogger):
    def init_logger(self, **kwargs):
        self.host = kwargs['host']
        self.port = kwargs['port']
        self.staged = None
        return super().init_logger(**kwargs)

    def log_qso(self, qso: Qso) -> str:
        if (self.staged and self.staged['call'] == qso.call):
            # log a staged QSO
            self.update_control(qso.freq, 'TXTENTRYFREQUENCY')
            self.update_control(qso.sig_info, 'TXTENTRYOTHER1')
            self.update_control(qso.comment, 'TXTENTRYCOMMENTS')
            cmd = '<CMD><ACTION><VALUE>ENTER</VALUE></CMD>'
            send_tcp_msg(cmd, self.host, self.port)
        else:
            adif = self.ap.get_adif(qso)
            ac_adif = f"<CMD><ADDADIFRECORD><VALUE>{adif}</VALUE></CMD>"
            send_tcp_msg(ac_adif, self.host, self.port)

        super().log_qso(qso)

    def stage_qso(self, qso: any) -> str:
        self.clear_staged()

        if 'call' not in qso:
            return

        self.staged = qso
        call = str.upper(qso['call'])

        self.update_control(call, 'TXTENTRYCALL')

        # this performs the ACLog lookup stuff it does
        call_tab = '<CMD><ACTION><VALUE>CALLTAB</VALUE></CMD>'
        self.send_and_wait(call_tab)

        # LOAD POTA template -> sig_info in OTHER1: txtEntryOther1
        sig_info = str.upper(qso['sig_info'])
        self.update_control(sig_info, 'TXTENTRYOTHER1')

        if 'freq' in qso and 'mode' in qso:
            self.update_band_mode(qso)

            # convert kHz to Mhz
            f = float(qso['freq'])
            f = f / 1000.0
            self.update_control(str(f), 'TXTENTRYFREQUENCY')

    def clear_staged(self):
        self.staged = None
        clr_cmd = '<CMD><ACTION><VALUE>CLEAR</VALUE></CMD>'
        self.send_and_wait(clr_cmd)

    def send_and_wait(self, cmd: str):
        send_tcp_msg(cmd, self.host, self.port)
        time.sleep(10 / 1000)  # sleep 5ms so says aclog docs. lets go 10ms

    def update_control(self, val: str, control: str):
        v = val.upper()
        c = control.upper()
        cmd = f'<CMD><UPDATE><CONTROL>{c}</CONTROL><VALUE>{v}</VALUE></CMD>'
        self.send_and_wait(cmd)

    def update_band_mode(self, qso):
        mode = str.upper(qso['mode'])
        band = get_band_name(qso['freq']).replace(
            'cm', '').replace('m', '')
        bm = f'<CMD><CHANGEBM><BAND>{band}</BAND><MODE>{mode}</MODE></CMD>'
        self.send_and_wait(bm)

    def get_extra_field_adif(self, qso):
        pass
