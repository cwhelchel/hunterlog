from datetime import datetime
import json
import logging
from typing import List
import sqlalchemy as sa
from sqlalchemy.orm import scoped_session

from db.models.qsos import Qso, QsoSchema
from bands import Bands, get_band, bandLimits, bandNames


class QsoQuery:
    '''Store Queries for the QSO table here.'''

    def __init__(self, session: scoped_session):
        self.session = session

    def insert_qso(self, qso: Qso, delay_commit: bool = True):
        self.session.add(qso)
        if not delay_commit:
            self.session.commit()

    def insert_new_qso(self, qso: any) -> int:
        '''
        Logs the QSO passed in from UI.

        :param any qso: json from the frontend.
        '''

        def trim_z(input: str):
            temp: str = input
            if temp.endswith('Z'):
                # fromisoformat doesn't like trailing Z
                temp = temp[:-1]
            return temp

        def check_float(input: str):
            try:
                float(input)
            except ValueError:
                return False
            return True

        # passing in the QSO object from init_from_spot
        # doesn't seem to ever work. recreate a QSO object
        # and add it directly
        logging.debug(f"inserting qso: {qso}")
        q = Qso()
        q.call = qso['call']
        if q.call is None or not q.call.strip():
            raise ValueError("Empty Callsign")
        q.rst_sent = qso['rst_sent']
        q.rst_recv = qso['rst_recv']
        q.freq = qso['freq']
        if q.freq is None or not q.freq.strip():
            raise ValueError("Empty Frequency")
        elif not check_float(q.freq):
            raise ValueError("Invalid Frequency number")
        q.freq_rx = qso['freq_rx']
        q.mode = qso['mode']
        if q.mode is None or not q.mode.strip():
            raise ValueError("Empty Mode")
        q.comment = qso['comment']
        temp: str = trim_z(qso['qso_date'])
        q.qso_date = datetime.fromisoformat(temp)
        temp: str = trim_z(qso['time_on'])
        q.time_on = datetime.fromisoformat(temp)
        q.tx_pwr = qso['tx_pwr']
        q.rx_pwr = qso['rx_pwr']
        q.gridsquare = qso['gridsquare']
        q.state = qso['state']
        q.sig = qso['sig']
        q.sig_info = qso['sig_info']
        q.distance = qso['distance']
        q.bearing = qso['bearing']
        q.from_app = True
        q.cnfm_hunt = False
        q.pota_ref = qso['pota_ref'] if q.sig == 'POTA' else None
        q.sota_ref = qso['sota_ref'] if q.sig == 'SOTA' else None
        self.session.add(q)
        self.session.commit()
        return q.qso_id

    def get_op_qso_count(self, call: str) -> int:
        return self.session.query(Qso) \
            .filter(Qso.call == call) \
            .count()

    def get_activator_hunts(self, callsign: str) -> int:
        return self.session.query(Qso) \
            .filter(Qso.call == callsign) \
            .count()

    def get_qso(self, id: int) -> Qso:
        return self.session.query(Qso).get(id)

    def get_qso_transient(self, qso_data) -> Qso:
        schema = QsoSchema()
        dic = json.loads(qso_data)
        dic['qso_id'] = 0
        q = schema.load(
            dic,
            session=self.session,
            transient=True)
        return q

    def get_qsos_from_app(self) -> List[Qso]:
        x = self.session.query(Qso) \
            .filter(Qso.from_app == True).all()   # noqa E712
        return x

    def get_spot_hunted_flag(self,
                             activator: str,
                             freq: str,
                             ref: str) -> bool:
        '''
        Gets the flag indicating if a given spot has been hunted already today

        :param str activator: activators callsign
        :param str freq: frequency in MHz
        :param str ref: the park reference (ex K-7465)
        :returns true if the spot has already been hunted
        '''
        now = datetime.utcnow()
        band = get_band(freq)
        # logging.debug(f"using band {band} for freq {freq}")

        if band is not None:
            terms = QsoQuery.get_band_lmt_terms(band, Qso.freq)
        else:
            terms = [1 == 1]

        flag = self.session.query(Qso) \
            .filter(Qso.call == activator,
                    Qso.time_on > now.date(),
                    Qso.sig_info == ref,
                    sa.and_(*terms)) \
            .count() > 0
        return flag

    def get_spot_hunted_bands(self, activator: str, ref: str) -> str:
        '''
        Gets the string of all hunted bands, this spot has been hunted today

        :param str activator: activators callsign
        :param str ref: park reference
        :returns list of hunted bands for today
        '''
        now = datetime.utcnow()
        result = ""
        hunted_b = []

        qsos = self.session.query(Qso) \
            .filter(Qso.call == activator,
                    Qso.sig_info == ref,
                    Qso.time_on > now.date()) \
            .all()

        for q in qsos:
            band = get_band(q.freq)
            if band is None:
                logging.warn(f"unknown band for freq {q.freq}")
            else:
                hunted_b.append(bandNames[band.value])

        result = ",".join(hunted_b)

        return result

    def get_ref_hunted_bands(self, ref: str) -> list[Bands]:
        '''
        Queries the stored QSO data for all hunted bands for a reference

        :param str ref: park reference
        :returns list of hunted bands
        '''
        hunted_bands = []

        qsos = self.session.query(Qso) \
            .filter(Qso.sig_info == ref) \
            .all()

        for q in qsos:
            band = get_band(q.freq)
            if band is None:
                logging.warning(f"unknown band for freq {q.freq}")
            elif band.value not in hunted_bands:
                logging.debug(f"appending band {band.value}")
                hunted_bands.append(band.value)

        return hunted_bands

    @staticmethod
    def get_band_lmt_terms(band: Bands, col: sa.Column) \
            -> list[sa.ColumnElement[bool]]:
        if band == Bands.NOBAND:
            return []
        ll = bandLimits[band][0]
        ul = bandLimits[band][1]
        terms = [sa.cast(col, sa.Float) < ul,
                 sa.cast(col, sa.Float) > ll]
        return terms
