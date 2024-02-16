import * as React from 'react';
import { AppContextType, ContextData } from '../@types/ContextTypes';

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