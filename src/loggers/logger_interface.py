"""
K6GTE, CAT interface abstraction
Email: michael.bridak@gmail.com
GPL V3
"""

from dataclasses import dataclass
import logging
from db.models.user_config import UserConfig

from loggers.iadif_logger import IAdifLogger
from loggers.generic_logger import GenericFileLogger
from loggers.l4om_logger import Log4omLogger
from loggers.n3fjp_logger import N3fjpLogger
from loggers.tcp_logger import TcpLogger
from loggers.udp_logger import UdpLogger
from loggers.wsjtx_logger import WsjtxLogger

log = logging.getLogger(__name__)


@dataclass
class LoggerParams:
    logger_if: int
    my_call: str
    my_grid6: str
    adif_host: str
    adif_port: int


class LoggerInterface:
    """QSO Logger interface"""

    @staticmethod
    def get_logger(config: LoggerParams,
                   app_ver: str) -> IAdifLogger:
        '''
        The main factory method for returning the proper IAdifLogger object to
        be used by hunterlog to handle QSO logging.

        The IAdifLogger object will be initialized here via calling
        IAdifLogger.init_logger() with **kwargs** set properly using settings
        from `config` param

        :param LoggerParams config: config data
        :param str app_ver: hunterlog version from__version__

        :returns IAdifLogger: a usable logger obj
        '''
        interface = config.logger_if

        logger = None
        if interface == UserConfig.LoggerType.Tcp.value:
            logger = TcpLogger()
        elif interface == UserConfig.LoggerType.UdpLog4om.value:
            logger = UdpLogger()
        elif interface == UserConfig.LoggerType.Aclog.value:
            logger = N3fjpLogger()
        elif interface == UserConfig.LoggerType.Log4om.value:
            logger = Log4omLogger()
        elif interface == UserConfig.LoggerType.WsjtxUdp.value:
            logger = WsjtxLogger()
        else:
            log.warning(f"unknown logger type: {interface}")
            logger = GenericFileLogger()

        logger.init_logger(
            my_call=config.my_call,
            my_grid6=config.my_grid6,
            log_filename='hunter.adi',
            app_ver=app_ver,
            host=config.adif_host,
            port=config.adif_port
        )

        return logger
