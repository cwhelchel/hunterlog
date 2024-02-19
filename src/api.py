import os
import webview
import logging
import datetime
from datetime import timedelta

from db.db import Bands
from db.db import DataBase
from db.models.activators import ActivatorSchema
from db.models.qsos import QsoSchema
from db.models.spots import SpotSchema
from pota import Api as PotaApi

band_filter = Bands.NOBAND


class JsApi:
    def __init__(self, the_db: DataBase, pota_api: PotaApi):
        self.db = the_db
        self.pota = pota_api

    def fullscreen(self):
        webview.windows[0].toggle_fullscreen()

    def save_content(self, content):
        filename = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG)
        if not filename:
            return

        with open(filename, 'w') as f:
            f.write(content)

    def ls(self):
        return os.listdir('.')

    def get_spots(self):
        logging.debug('py getting spots')
        if band_filter != Bands.NOBAND:
            spots = self.db.get_by_band(band=band_filter)
        else:
            spots = self.db.get_spots()
        ss = SpotSchema(many=True)
        return ss.dumps(spots)

    def qso_data(self, id: int):
        logging.debug('py getting qso data')
        q = self.db.build_qso_from_spot(id)
        if q is None:
            return {"success": False}
        qs = QsoSchema()
        return qs.dumps(q)

    def log_qso(self, qso_data):
        logging.debug("logging qso:")
        logging.debug(qso_data)

    def get_activator_stats(self, callsign):
        logging.debug("getting activator stats...")

        def update():
            id = self.update_activator_stats(callsign)
            if id > 0:
                activator = self.db.get_activator_by_id(id)
                s = ActivatorSchema()
                return s.dumps(activator)

        ac = self.db.get_activator(callsign)
        if (ac is None):
            # not found pull new data
            return update()
        else:
            # check timestamp
            if (datetime.datetime.utcnow() - ac.updated < timedelta(days=1)):
                return update()

        return ActivatorSchema().dumps(ac)

    def set_band_filter(self, band: int):
        logging.debug(f"setting band filter to: {band}")
        x = Bands(band)
        global band_filter
        band_filter = x

    def update_activator_stats(self, callsign: str) -> int:
        j = self.pota.get_activator_stats(callsign)

        if j is not None:
            # the json will be none if say the call doesn't return success
            # from api. probably they dont have an account
            return self.db.update_activator_stat(j)
        else:
            logging.warn(f"activator callsign {callsign} not found")
            return -1

    def launch_pota_window(self):
        webview.create_window(title='POTA APP', url='https://pota.app/')
