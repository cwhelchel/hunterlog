import * as React from 'react';
import { AppContextType, ContextData } from '../@types/ContextTypes';

const defData: ContextData = {
    qso: null,
    park: null,
    filter: {
        items: [{
            field: 'mode',
            operator: 'equals',
            value: ''
        }]
    },
    bandFilter: 0,
    regions: [],
    regionFilter: '',
    locationFilter: '',
    qrtFilter: true,
    locations: [],
    huntedFilter: false,
    spotId: 0,
    errorMsg: '',
    errorSeverity: '',
    themeMode: 'dark',
    onlyNewFilter: false,
    otherOperators: '',
    summit: null,
    sigFilter: '',
};

export const AppContext = React.createContext<AppContextType | null>(null);

export const AppContextProvider = ( {children}: any ) => {
    const [contextData, setContextData] = React.useState<ContextData>(defData);
    const [qsyButtonId, setQsyButtonId] = React.useState<string>('');

    const setData = (ctx: ContextData) => {
        const newContext: ContextData = {
            qso: ctx.qso,
            filter: ctx.filter,
            bandFilter: ctx.bandFilter,
            regions: ctx.regions,
            regionFilter: ctx.regionFilter,
            park: ctx.park,
            locationFilter: ctx.locationFilter,
            qrtFilter: ctx.qrtFilter,
            locations: ctx.locations,
            huntedFilter: ctx.huntedFilter,
            spotId: ctx.spotId,
            errorMsg: ctx.errorMsg,
            errorSeverity: ctx.errorSeverity,
            themeMode: ctx.themeMode,
            onlyNewFilter: ctx.onlyNewFilter,
            otherOperators: ctx.otherOperators,
            summit: ctx.summit,
            sigFilter: ctx.sigFilter,
        }
        setContextData(newContext);
    };

    const setLastQsyBtnId = (newId: string) => {
        // setting this via existing context sucks as the event propagates
        // to the button first then the row
        setQsyButtonId(newId);
    }

    const contextValue: AppContextType = {
        contextData,
        setData,
        qsyButtonId,
        setLastQsyBtnId
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    )
};

export const useAppContext = () => {
    const context = React.useContext(AppContext);

    if (!context) {
        throw new Error("useAppContext must be used inside the AppContextProvider");
    }

    return context;
};


export function createEqualityFilter(field: string, value: string) {
    return {
        field: field,
        operator: 'equals',
        value: value
    }
};