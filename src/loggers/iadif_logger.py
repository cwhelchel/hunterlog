from abc import ABC, abstractmethod

from db.models.qsos import Qso


class IAdifLogger(ABC):
    '''
    Interface class for the ADIF logger hunterlog will use.
    '''

    @abstractmethod
    def init_logger(self, **kwargs):
        '''
        Initializes the adif logger interface.

        :param: kwargs: dict of variable number of args needed for
                        the adif logger interface
        '''
        raise NotImplementedError

    @abstractmethod
    def log_qso(self, qso: Qso) -> str:
        '''
        Logs the QSO.

        qso: Qso: The QSO db model object to log

        returns adif of logged qso
        '''
        raise NotImplementedError
