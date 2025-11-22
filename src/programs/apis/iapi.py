from abc import ABC, abstractmethod
import logging as L

log = L.getLogger(__name__)


class IApi(ABC):
    '''
    On-the-Air Program API interface definition class
    '''

    @abstractmethod
    def get_spots(self) -> any:
        '''
        Downloads the spots from the program's API.

        :returns any: spot data
        '''
        raise NotImplementedError

    @abstractmethod
    def get_reference(self, ref_id: str) -> any:
        '''
        Get the data for the given reference

        :param str ref_id: reference id string for program
        :returns: reference data from API
        '''
        raise NotImplementedError
