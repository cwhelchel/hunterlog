import * as React from 'react';
import { Divider, Grid } from "@mui/material";
import { useAppContext } from '../../../../AppContext';
import ToggleSwitch from './ToggleSwitch';
import StoredTextInput from './StoredTextInput';

export default function DisplaySettingsTab() {

    const { contextData, setData } = useAppContext();

    // most of the display settings are only on the frontend side and therefore
    // stored in localStorage
    // const { config, setConfig } = useConfigContext();

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
                    <ToggleSwitch storageKey={'USE_DARK_MODE'} initialState={true} label='Dark Mode' onChange={toggleDarkTheme} />
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