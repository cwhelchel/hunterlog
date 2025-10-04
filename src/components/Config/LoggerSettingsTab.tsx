import * as React from 'react';
import { Checkbox, FormControlLabel, Grid, MenuItem, Radio, RadioGroup, Select, Stack, Switch, TextField, Tooltip } from "@mui/material";
import { useConfigContext } from './ConfigContextProvider';
import { useAppContext } from '../AppContext';
import { UserConfig } from '../../@types/Config';

export default function LoggerSettingsTab() {
    const { config, setConfig } = useConfigContext();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let x = (event.target as HTMLInputElement).value;
        let y = parseInt(x);

        let newCfg: UserConfig = { ...config, logger_type: y };
        setConfig(newCfg);
    };
    
    return (
        <div style={{ 'display': 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {/* <RadioGroup
                defaultValue="0"
                row
                name="radio-buttons-group"
                value={config?.logger_type}
                onChange={handleChange}
            >
                <FormControlLabel value="0" control={<Radio />} label="TCP (Logger32)" />
                <FormControlLabel value="1" control={<Radio />} label="UDP (Log4om)" />
                <FormControlLabel value="2" control={<Radio />} label="AcLog" />
                <FormControlLabel value="3" control={<Radio />} label="Log4om" />
            </RadioGroup> */}

            <p className="modal-config-text">
                Hunterlog will send ADIF formed QSO data to a separate logger 
                application (like Logger32 or Log4OM). If UDP or TCP is selected then
                Hunterlog will send raw ADIF data to that endpoint. If another logger is selected,
                the same ADIF data is sent but with other special commands to interact with the
                selected logger.
            </p>
            <Select
                value={config?.logger_type}
                label="Logger Type"
                onChange={(e) => {
                    let x = e.target.value.toString();
                    let y = parseInt(x);
                    setConfig({ ...config, logger_type: y });
                }}>
                <MenuItem value={0}>TCP (Logger32)</MenuItem>
                <MenuItem value={1}>UDP (Log4om)</MenuItem>
                <MenuItem value={2}>AcLog</MenuItem>
                <MenuItem value={3}>Log4om</MenuItem>
            </Select>

            <p className="modal-config-text">
                The chosen logger will has a Internet Protocol (IP) address
                and port number. If the application is on the same computer as
                Hunterlog, then the IP is 127.0.0.1, otherwise you need to get the
                IP address of the computer. The port can usually be found by looking
                at the application's documents, but here are some common defaults:
                <div>
                    <ul className="modal-ul-horiz">
                        <li>log4om: 2234</li>
                        <li>aclog: 1100</li>
                    </ul>
                </div>
            </p>
            <Stack direction={'row'} spacing={1}>
                <TextField id="adif_host" label="Remote ADIF Host (IPv4 string)"
                    value={config?.adif_host}
                    fullWidth
                    onChange={(e) => {
                        setConfig({ ...config, adif_host: e.target.value });
                    }} />
                <TextField id="adif_port" label="Remote ADIF Port (number)"
                    value={config?.adif_port}
                    fullWidth
                    onChange={(e) => {
                        setConfig({ ...config, adif_port: Number.parseInt(e.target.value) });
                    }} />
            </Stack>
        </div>
    )

}