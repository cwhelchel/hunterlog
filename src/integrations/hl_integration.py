from abc import ABC, abstractmethod


class IHlIntegration(ABC):
    '''
    Interface class for HL integration objects
    '''

    @abstractmethod
    def init(self, **kwargs):
        '''
        Initializes the integration

        :param: kwargs: dict of variable number of args needed for integration
        '''
        raise NotImplementedError

    @abstractmethod
    def start(self):
        '''
        Starts the integration processing
        '''
        raise NotImplementedError

    @abstractmethod
    def update(self):
        '''
        Perform update for integration. This is called via a background thread.
        '''
        raise NotImplementedError
