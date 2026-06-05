import * as React from 'react';
import { Checkbox, Divider, FormControlLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
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
                <MenuItem value={"flex"}>Flex SmartSDR</MenuItem>
            </Select>

            <p className="modal-config-text">
                The chosen application usually has a Internet Protocol (IP) address
                and port number. If the CAT application is on the same computer as
                Hunterlog, then the IP is 127.0.0.1, otherwise you need to get the
                IP address of the computer. The port can usually be found by looking
                at the CAT application&apos;s documents, but here are some common defaults:
                <div>
                    <ul className="modal-ul-horiz">
                        <li>flrig: 12345</li>
                        <li>rigctld: 4532</li>
                        <li>aclog: 1100</li>
                        <li>dxlabs: 52002</li>
                    </ul>
                </div>
            </p>

            {config.rig_if_type == "flex" && (
                <p className="modal-config-text">
                    For Flex CAT, setup a TCP CAT port in SmartSDR CAT program
                    and use the port here with the 127.0.0.1 as the IP host. 
                    SmartSDR should be running on the same computer.
                </p>
            )}
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

            <Divider aria-hidden="true" />
            
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
            <Stack direction={'row'} spacing={1}>
                <FormControlLabel label="Enable CW RIT"
                    style={{ width: "50%", marginLeft: 10 }}
                    control={
                        <Checkbox checked={config.use_cw_offset}
                            inputProps={{ 'aria-label': 'controlled' }}
                            onChange={(e) => {
                                const val = Boolean(e.target.checked);
                                setConfig({ ...config, use_cw_offset: val });
                            }} />
                    } />
                <p className="modal-config-text">
                    Add random offset when QSY-ing CW spots. Set min and max to same number to remove randomness.
                </p>
                <TextField id="cw_offset_min" label="CW RIT Min (HZ)"
                    value={config?.cw_offset_min}
                    fullWidth
                    onChange={(e) => {
                        setConfig({ ...config, cw_offset_min: Number(e.target.value) });
                    }} />
                <TextField id="cw_offset_max" label="CW RIT Max (HZ)"
                    value={config?.cw_offset_max}
                    fullWidth
                    onChange={(e) => {
                        setConfig({ ...config, cw_offset_max: Number(e.target.value) });
                    }} />
            </Stack>
        </div>
    )

}