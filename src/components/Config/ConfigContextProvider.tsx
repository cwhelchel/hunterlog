import * as React from 'react';
import { UserConfig } from '../../@types/Config';

const defData: UserConfig = {
    my_call: '',
    my_grid6: '',
    default_pwr: 0,
    flr_host: '',
    flr_port: 0,
    adif_host: '',
    adif_port: 0,
    logger_type: 0,
    size_x: 0,
    size_y: 0,
    is_max: false,
    cw_mode: '',
    ftx_mode: '',
    qth_string: '',
    rig_if_type: '',
    include_rst: false,
    enabled_progs: ''
};

export interface ConfigContextType {
    config: UserConfig;
    setConfig: (newCfg: UserConfig) => void;
}

export const ConfigContext = React.createContext<ConfigContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ConfigContextProvider = ( {children}: any ) => {
    const [configData, setConfigData] = React.useState<UserConfig>(defData);

    const x = (ctx: UserConfig) => {
        const newContext: UserConfig = {
            ...ctx
        };
        setConfigData(newContext);
    };

    const initialValue: ConfigContextType = {
        config: configData,
        setConfig: x
    }

    return (
        <ConfigContext.Provider value={initialValue}>
            {children}
        </ConfigContext.Provider>
    )
}


export const useConfigContext = () => {
    const context = React.useContext(ConfigContext);

    if (!context) {
        throw new Error("useConfigContext must be used inside the AppContextProvider");
    }

    return context;
};
