
import logging as L

from integrations.hl_integrations_cfg import IntegrationCfg
from integrations.wavelog.wavelog_integration import WavelogIntegration
from integrations.wsjtx.wsjtx_integration import WsjtxIntegration

log = L.getLogger(__name__)


class HlIntegrations():
    # marked so JS API doesn't serialize for frontend
    #  - not for our pinned ver of pywebview. update for this to work
    _serializable = False

    def __init__(self, integration_config: IntegrationCfg) -> None:
        self.int_cfg = integration_config
        self._integrations = []

        log.debug(f'creating advanced integrations: {self.int_cfg}...')

        ws_int = self.int_cfg.db.config.get_value('enable_wsjtx_int')
        if ws_int:
            self._wsjtx = WsjtxIntegration()
            self._integrations.append(self._wsjtx)

        wl_int = self.int_cfg.db.config.get_value('enable_wavelog_int')
        if wl_int:
            self._wavelog = WavelogIntegration()
            self._integrations.append(self._wavelog)

    def init_all(self):
        log.debug('initializing advanced integrations...')
        for i in self._integrations:
            if i is not None:
                i.init(**self.int_cfg.__dict__)

    def start_all(self):
        log.debug('starting advanced integrations...')
        for i in self._integrations:
            if i is not None:
                i.start()

    def update_all(self):
        for i in self._integrations:
            if i is not None:
                i.update()
