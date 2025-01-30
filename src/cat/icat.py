from abc import ABC, abstractmethod


class ICat(ABC):
    '''
    Interface class for the CAT control methods hunterlog will use.
    '''

    @abstractmethod
    def init_cat(self, **kwargs):
        '''
        Initializes the CAT control interface.

        :param: kwargs: dict of variable number of args needed for 
                        the CAT interface
        '''
        raise NotImplementedError

    @abstractmethod
    def set_mode(self, mode: str) -> bool:
        '''
        Sets the radios mode using the supplied string.

        mode: str: mode string (CW, USB, CW-U, USB-D)

        returns True on success
        '''
        raise NotImplementedError

    @abstractmethod
    def set_vfo(self, freq_Hz: str) -> bool:
        '''
        Sets the radios VFO frequency frequency string.

        freq_Hz: str: Frequency in Hz supplied as a string

        returns True on success
        '''
        raise NotImplementedError
