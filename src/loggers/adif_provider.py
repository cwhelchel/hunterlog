import bands
from db.models.qsos import Qso
import logging as L

log = L.getLogger(__name__)


class AdifProvider():

    def __init__(self, my_call, my_grid6):
        self.my_call = my_call
        self.my_grid6 = my_grid6

    def get_adif_field(self, field_name: str, field_data: str) -> str:
        '''
        Get a properly formatted ADIF field.
        '''
        return f"<{field_name.upper()}:{len(field_data)}>{field_data}\n"

    def get_adif(self, qso: Qso, extra: str = '') -> str:
        '''
        Get the adif fields for a generic QSO. Child class can provide extra
        adif fields by defining method `get_extra_field_adif() -> str` which
        will be called here.
        '''
        band_name = bands.get_band_name(qso.freq)

        # silly but w/e
        f: float = float(qso.freq) / 1000.0
        fs = str(f)
        q_date = qso.qso_date.strftime('%Y%m%d')
        q_time_on = qso.time_on.strftime('%H%M%S')
        state = qso.state if qso.state else ''

        # if hasattr(self, "get_extra_field_adif"):
        #     extra = self.get_extra_field_adif(qso)
        log.debug(f"extraaaaaa {extra}")
        # else:
        #     extra = ''

        # if these are logged with just SIG info but missing the xota_ref,
        # we just set the xota_ref to the sig_info
        if qso.sig == 'POTA' and qso.pota_ref is None:
            qso.pota_ref = qso.sig_info

        if qso.sig == 'SOTA' and qso.sota_ref is None:
            qso.sota_ref = qso.sig_info

        if qso.sig == 'WWFF' and qso.wwff_ref is None:
            qso.wwff_ref = qso.sig_info

        adif = \
            self.get_adif_field("call", qso.call) + \
            self.get_adif_field("band", band_name) + \
            self.get_adif_field("name", qso.name if qso.name else '') + \
            self.get_adif_field("comment", qso.comment) + \
            self.get_adif_field("sig", qso.sig) + \
            self.get_adif_field("sig_info", qso.sig_info) + \
            self.get_adif_field("gridsquare", qso.gridsquare) + \
            self.get_adif_field("state", state) + \
            self.get_adif_field("distance", str(qso.distance)) + \
            self.get_adif_field("ant_az", str(qso.bearing)) + \
            self.get_adif_field("tx_pwr", str(qso.tx_pwr)) + \
            self.get_adif_field("mode", qso.mode) + \
            self.get_adif_field("operator", self.my_call) + \
            self.get_adif_field("rst_rcvd", qso.rst_recv) + \
            self.get_adif_field("rst_sent", qso.rst_sent) + \
            self.get_adif_field("freq", fs) + \
            self.get_adif_field("qso_date", q_date) + \
            self.get_adif_field("time_on", q_time_on) + \
            self.get_adif_field("my_gridsquare", self.my_grid6) + \
            self.get_adif_field("pota_ref", qso.pota_ref or '') + \
            self.get_adif_field("sota_ref", qso.sota_ref or '') + \
            self.get_adif_field("wwff_ref", qso.wwff_ref or '') + \
            extra +\
            "<EOR>\n"

        return adif
