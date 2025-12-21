import * as React from 'react';
import { Checkbox, FormControlLabel, Grid, Stack, TextField, Tooltip } from "@mui/material";
import { useConfigContext } from './ConfigContextProvider';
import { useAppContext } from '../AppContext';
import ToggleSwitch from './ToggleSwitch';

export default function GeneralSettingsTab() {

    const { contextData, setData } = useAppContext();
    const { config, setConfig } = useConfigContext();

    // function to toggle the dark mode as true or false
    const toggleDarkTheme = (newVal: boolean) => {
        const newMode = newVal;

        const newCtx = { ...contextData };
        if (newMode)
            newCtx.themeMode = 'dark';
        else
            newCtx.themeMode = 'light';

        setData(newCtx);
    };

    const toggleSwapRst = (newVal: boolean) => {
        const newCtx = { ...contextData };
        newCtx.swapRstOrder = newVal;
        setData(newCtx);
    };

    return (
        <>
            <Grid container direction={'row'} spacing={1} alignItems="stretch">
                <Grid item xs={4}>
                    <TextField id="my_call" label="My Callsign"
                        value={config?.my_call}
                        onChange={(e) => {
                            setConfig({ ...config, my_call: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4}>
                    <TextField id="my_grid6" label="My Gridsquare (6 digit)"
                        value={config?.my_grid6}
                        onChange={(e) => {
                            setConfig({ ...config, my_grid6: e.target.value });
                        }} />
                </Grid>
                <Grid item xs={4}>
                    <Tooltip title="The number is used only in logging">
                        <TextField id="default_pwr" label="Default TX Power"
                            value={config?.default_pwr}
                            onChange={(e) => {
                                setConfig({ ...config, default_pwr: Number.parseInt(e.target.value) });
                            }} />
                    </Tooltip>
                </Grid>
            </Grid>
            <Stack direction={'row'} spacing={1} marginTop={3} sx={{ flexWrap: 'wrap' }}>
                <ToggleSwitch storageKey={'USE_DARK_MODE'} initialState={true} label='Dark Mode' onChange={toggleDarkTheme} />
                <ToggleSwitch storageKey={'USE_FREEDOM_UNITS'} initialState={true} label='Display Imperial Units' longTrueText='Display distance in miles' longFalseText='Display distance in kilometers' />
                <ToggleSwitch storageKey={'SHOW_SPOT_AGE'} initialState={true} label='Show Spot Age' longTrueText='Shows spot age as minutes past' longFalseText='Shows spot timestamps' />
            </Stack>
            <Stack direction={'row'} spacing={1} marginTop={3} sx={{ flexWrap: 'wrap' }}>
                <ToggleSwitch storageKey={'HIGHLIGHT_NEW_REF'} initialState={true} label='Highlight New' longTrueText='Highlight new references' longFalseText='No highlighting' />
                <ToggleSwitch storageKey={'SWAP_RST_ORDER'} initialState={false} label='Swap RST Order' longTrueText='Recv RST first' longFalseText='Sent RST first' onChange={toggleSwapRst} />
            </Stack>
            <Stack spacing={2} marginTop={3}>
                <p className="modal-config-text">
                    QTH string is inserted when posting spots to POTA.app ex: &apos;mid GA&apos;
                    is inserted into comment like &apos;[599 mid GA] thx fb qso&apos;
                </p>
                <Stack direction={'row'}>
                    <TextField id="qth_string" label="QTH String"
                        value={config?.qth_string}
                        fullWidth
                        onChange={(e) => {
                            setConfig({ ...config, qth_string: e.target.value });
                        }} />
                    <FormControlLabel label="Include RST in Spot"
                        style={{ width: "50%", marginLeft: 20 }}
                        control={
                            <Checkbox checked={config.include_rst}
                                inputProps={{ 'aria-label': 'controlled' }}
                                onChange={(e) => {
                                    const val = Boolean(e.target.checked);
                                    setConfig({ ...config, include_rst: val });
                                }} />
                        } />
                </Stack>
            </Stack>
        </>
    )

}