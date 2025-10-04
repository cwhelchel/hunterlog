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
    rig_if_type: ''
};

export interface ConfigContextType {
    config: UserConfig;
    setConfig: (newCfg: UserConfig) => void;
}

export const ConfigContext = React.createContext<ConfigContextType | null>(null);

export const ConfigContextProvider = ( {children}: any ) => {
    const [configData, setConfigData] = React.useState<UserConfig>(defData);

    const x = (ctx: UserConfig) => {
        const newContext: UserConfig = {
            my_call: ctx.my_call,
            my_grid6: ctx.my_grid6,
            default_pwr: ctx.default_pwr,
            flr_host: ctx.flr_host,
            flr_port: ctx.flr_port,
            adif_host: ctx.adif_host,
            adif_port: ctx.adif_port,
            logger_type: ctx.logger_type,
            size_x: ctx.size_x,
            size_y: ctx.size_y,
            is_max: ctx.is_max,
            cw_mode: ctx.cw_mode,
            ftx_mode: ctx.ftx_mode,
            qth_string: ctx.qth_string,
            rig_if_type: ctx.rig_if_type
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
