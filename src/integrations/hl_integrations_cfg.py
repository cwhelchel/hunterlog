from api_cat import CatApi
from db.db import DataBase


from collections.abc import Callable
from dataclasses import dataclass


@dataclass
class IntegrationCfg:
    '''
    The IntegrationCfg class is a dataclass that holds configuration
    information for integrations. ALL Fields are automatically sent to the
    `init` method of IHlIntegration implementations via `kwargs`.

    Implementation classes unpack the kwargs by the names given here:
        kwargs.get('db')
        kwargs.get('cat')
        kwargs.get('wsjt_log_handler')
        kwargs.get('wsjtx_status_handler')
        etc...
    '''
    db: DataBase
    cat: CatApi
    wsjt_log_handler: Callable[[str], None]
    wsjtx_status_handler: Callable[[int], None]
