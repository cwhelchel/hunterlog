from abc import ABC, abstractmethod

from db.models.qsos import Qso


class IAdifLogger(ABC):
    '''
    Interface class for the CAT control methods hunterlog will use.
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
        Sets the radios mode using the supplied string.

        qso: Qso: The QSO db model object to log

        returns True on success
        '''
        raise NotImplementedError
