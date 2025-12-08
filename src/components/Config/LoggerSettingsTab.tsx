import * as React from 'react';
import { MenuItem, Select, Stack, TextField } from "@mui/material";
import { useConfigContext } from './ConfigContextProvider';

export default function LoggerSettingsTab() {
    const { config, setConfig } = useConfigContext();
    
    return (
        <div style={{ 'display': 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
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
                    const x = e.target.value.toString();
                    const y = parseInt(x);
                    setConfig({ ...config, logger_type: y });
                }}>
                <MenuItem value={0}>TCP (Logger32)</MenuItem>
                <MenuItem value={1}>UDP (Log4om)</MenuItem>
                <MenuItem value={2}>AcLog</MenuItem>
                <MenuItem value={3}>Log4om</MenuItem>
                <MenuItem value={4}>Wsjt-X UDP</MenuItem>
            </Select>

            <p className="modal-config-text">
                The chosen logger will has a Internet Protocol (IP) address
                and port number. If the application is on the same computer as
                Hunterlog, then the IP is 127.0.0.1, otherwise you need to get the
                IP address of the computer. The port can usually be found by looking
                at the application&apos;s documents, but here are some common defaults:
                <div>
                    <ul className="modal-ul-horiz">
                        <li>log4om: 2234</li>
                        <li>aclog: 1100</li>
                        <li>wsjt-x: 2237</li>
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