import * as React from 'react';

export interface IAppContext {
    id: number;
    text: string;
};

const defData = { id: 0, text:"" };

//export const AppContext = React.createContext<{ data: IAppContext } | null>(null);
export const AppContext = React.createContext<{
    data: IAppContext;
} | null>(null);

export const AppContextProvider = ({ children }) => {
    const [contextData] = React.useState<IAppContext>();

    return (
        <AppContext.Provider value={{ data: defData }}>
            {children}
        </AppContext.Provider>
    )
};

export const useAppContext = () => {
    const context = React.useContext(AppContext);

    if (!context) {
        throw new Error("useAppContext must be used inside the ThemeProvider");
    }

    return context;
};

// export const setData = (ctx: IAppContext) => {
//     //console.log("in context setData");
//     const newContext: IAppContext = {
//         id: Math.random(), 
//         text: ctx.text
//     }
// };