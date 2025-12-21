import * as React from 'react';
import { MenuItem, Select, Stack, TextField } from "@mui/material";
import { useConfigContext } from './ConfigContextProvider';

export default function RadioSettingsTab() {
    const { config, setConfig } = useConfigContext();

    return (
        <div style={{ 'display': 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <p className="modal-config-text">
                Computer Aided Transceiver (CAT) interface setting. Choose from the drop down
                the application you wish to use to control your rig.
            </p>
            <Select
                value={config.rig_if_type}
                label="CAT interface"
                onChange={(e) => {
                    setConfig({ ...config, rig_if_type: e.target.value });
                }}>
                <MenuItem value={"flrig"}>FLRIG</MenuItem>
                <MenuItem value={"rigctld"}>RIGCTLD</MenuItem>
                <MenuItem value={"aclog"}>ACLOG</MenuItem>
                <MenuItem value={"dxlabs"}>DXLABS</MenuItem>
                <MenuItem value={"wsjtx"}>WSJT-X (MacLoggerDX)</MenuItem>
            </Select>

            <p className="modal-config-text">
                The chosen application usually has a Internet Protocol (IP) address
                and port number. If the CAT application is on the same computer as
                Hunterlog, then the IP is 127.0.0.1, otherwise you need to get the
                IP address of the computer. The port can usually be found by looking
                at the CAT application's documents, but here are some common defaults:
                <div>
                    <ul className="modal-ul-horiz">
                        <li>flrig: 12345</li>
                        <li>rigctld: 4532</li>
                        <li>aclog: 1100</li>
                        <li>dxlabs: 52002</li>
                    </ul>
                </div>
            </p>
            <Stack direction={'row'} spacing={1}>
                <TextField id="flr_host" label="Host (IPv4 string)"
                    fullWidth
                    value={config?.flr_host}
                    onChange={(e) => {
                        setConfig({ ...config, flr_host: e.target.value });
                    }} />
                <TextField id="flr_port" label="Port (number)"
                    fullWidth
                    value={config?.flr_port}
                    onChange={(e) => {
                        setConfig({ ...config, flr_port: Number.parseInt(e.target.value) });
                    }} />
            </Stack>
            <p className="modal-config-text">
                Mode strings used to specify a custom mode for RIG control
                (CW may need to be CW-R or CW-L if that is what your rig expects)
            </p>
            <Stack direction={'row'} spacing={1}>
                <TextField id="cw_mode" label="CW Mode"
                    value={config?.cw_mode}
                    fullWidth
                    onChange={(e) => {
                        setConfig({ ...config, cw_mode: e.target.value });
                    }} />
                <TextField id="ftx_mode" label="FT-x modes"
                    value={config?.ftx_mode}
                    fullWidth
                    onChange={(e) => {
                        setConfig({ ...config, ftx_mode: e.target.value });
                    }} />
            </Stack>
        </div>
    )

}