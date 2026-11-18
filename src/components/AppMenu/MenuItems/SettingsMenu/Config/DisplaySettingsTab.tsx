import * as React from 'react';
import { Divider, FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material";
import { useAppContext } from '../../../../AppContext';
import ToggleSwitch from './ToggleSwitch';
import StoredTextInput from './StoredTextInput';

export default function DisplaySettingsTab() {

    const { contextData, setData } = useAppContext();

    // most of the display settings are only on the frontend side and therefore
    // stored in localStorage
    // const { config, setConfig } = useConfigContext();

    const setThemeName = (newVal: string) => {
        const newCtx = { ...contextData };
        newCtx.themeName = newVal;
        setData(newCtx);
        window.localStorage.setItem("THEME_NAME", newVal);
    };

    const toggleSwapRst = (newVal: boolean) => {
        const newCtx = { ...contextData };
        newCtx.swapRstOrder = newVal;
        setData(newCtx);
    };

    const toggleShowBandCondx = (newVal: boolean) => {
        const newCtx = { ...contextData };
        newCtx.showBandCondx = newVal;
        setData(newCtx);
    };

    return (
        <>
            <p className="modal-config-text" style={{ margin: '10px' }}>
                The settings here are persisted but not stored in the local database. So you can refresh with the refresh button and see changes right away.
            </p>
            <Divider />
            <Grid container direction={'row'} spacing={2} alignItems="stretch" marginTop={1} marginBottom={2}>
                <Grid item xs={4}>
                    {/* <ToggleSwitch storageKey={'USE_DARK_MODE'} initialState={true} label='Dark Mode' onChange={toggleDarkTheme} /> */}
                    <FormControl fullWidth>
                        <InputLabel id="theme-select-label">Theme</InputLabel>
                        <Select
                            labelId='theme-select-label'
                            id="theme-select"
                            label="Theme"
                            value={contextData?.themeName}
                            onChange={(e) => {
                                const x = e.target.value.toString();
                                setThemeName(x);
                            }}>
                            <MenuItem value={'def-dark'}>dark</MenuItem>
                            <MenuItem value={'def-light'}>light</MenuItem>
                            <MenuItem value={'bluey-dark'}>bluey</MenuItem>
                            <MenuItem value={'bluey-light'}>bluey (light)</MenuItem>
                            <MenuItem value={'midnight-blue'}>midnight blue</MenuItem>
                            <MenuItem value={'terminal'}>terminal</MenuItem>
                            <MenuItem value={'graphite'}>graphite</MenuItem>
                            <MenuItem value={'classic-light'}>classic light</MenuItem>
                            <MenuItem value={'skylight'}>skylight</MenuItem>
                            <MenuItem value={'sandlight'}>sandlight</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={4}>
                    <ToggleSwitch storageKey={'SHOW_SPOT_AGE'} initialState={true} label='Show Spot Age' longTrueText='Shows spot age as minutes past' longFalseText='Shows spot timestamps' />
                </Grid>
                <Grid item xs={4}>
                    <ToggleSwitch storageKey={'HIGHLIGHT_NEW_REF'} initialState={true} label='Highlight New' longTrueText='Highlight new references' longFalseText='No highlighting' />
                </Grid>

                <Grid item xs={4}>
                    <ToggleSwitch storageKey={'SWAP_RST_ORDER'} initialState={false} label='Swap RST Order' longTrueText='Recv RST first' longFalseText='Sent RST first' onChange={toggleSwapRst} />
                </Grid>
                <Grid item xs={4}>
                    <ToggleSwitch storageKey={'USE_FREEDOM_UNITS'} initialState={true} label='Display Imperial Units' longTrueText='Display distance in miles' longFalseText='Display distance in kilometers' />
                </Grid>
                <Grid item xs={4}></Grid>
                <Grid item xs={4}>
                    <ToggleSwitch storageKey={'SHOW_BAND_CONDX'} initialState={true} label='Band CONDX' longTrueText='Show Band Condx Area' longFalseText='Hide Band Condx Area' onChange={toggleShowBandCondx} />
                </Grid>
                <Grid item xs={8}><StoredTextInput sx={{ flexGrow: 1 }} storageKey={'BAND_CONDX_HAMQSL_URL'} initialVal={'https://www.hamqsl.com/solar101pic.php'} label='HamQSL URL' extraDescription='Full URL to <a target="_blank" rel="noopener noreferrer" href="https://www.hamqsl.com/">hamqsl.com</a> embedded condx images' /></Grid>
            </Grid>
        </>
    )

}