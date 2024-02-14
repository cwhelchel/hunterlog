import * as React from 'react';
import { Qso } from '../types/QsoTypes';

interface ContextData {
    id: number;
    text: string;
    qso: Qso | null;
};

interface AppContextType {
    contextData: ContextData;
    setData: (d: ContextData) => void;
}

const defData: ContextData = {id: 0, text:"", qso:null };

export const AppContext = React.createContext<AppContextType | null>(null);

export const AppContextProvider = ({ children }) => {
    const [contextData, setContextData] = React.useState<ContextData>(defData);

    const setData = (ctx: ContextData) => {
        const newContext: ContextData = {
            id: ctx.id,
            text: ctx.text,
            qso: ctx.qso
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