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

    @abstractmethod
    def stage_qso(self, qso: any) -> str:
        '''
        Stages the QSO into the logger program. This is usually done by sending
        the callsign of the station worked on air to logger and some other
        command

        qso: the JSON data for a qso. Not a QSO object b/c logger may only need
             partial data for staging

        returns adif of logged qso
        '''
        raise NotImplementedError

    @abstractmethod
    def clear_staged(self):
        '''
        Clears any staged QSOs in the logger
        '''
        raise NotImplementedError
