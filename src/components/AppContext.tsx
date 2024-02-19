import * as React from 'react';
import { AppContextType, ContextData } from '../@types/ContextTypes';

const defData: ContextData = {
    qso: null,
    filter: {
        items: [{
            field: 'mode',
            operator: 'equals',
            value: ''
        }]
    },
    bandFilter: 0
};

export const AppContext = React.createContext<AppContextType | null>(null);

export const AppContextProvider = ({ children }) => {
    const [contextData, setContextData] = React.useState<ContextData>(defData);

    const setData = (ctx: ContextData) => {
        const newContext: ContextData = {
            qso: ctx.qso,
            filter: ctx.filter,
            bandFilter: ctx.bandFilter,
        }
        setContextData(newContext);
    };

    const contextValue: AppContextType = {
        contextData,
        setData
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