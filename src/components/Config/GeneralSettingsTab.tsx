import * as React from 'react';
import { Checkbox, FormControlLabel, Grid, Stack, Switch, TextField, Tooltip } from "@mui/material";
import { useConfigContext } from './ConfigContextProvider';
import { useAppContext } from '../AppContext';

export default function GeneralSettingsTab() {

    const { contextData, setData } = useAppContext();
    const { config, setConfig } = useConfigContext();

    const [imperialChecked, setImperialChecked] = React.useState(true);
    const [useDarkMode, setUseDarkMode] = React.useState(true);
    const [showSpotAge, setShowSpotAge] = React.useState(true);
    const [highlightNewRef, setHighlightNewRef] = React.useState(true);

    // function to toggle the dark mode as true or false
    const toggleDarkTheme = () => {
        const newMode = !useDarkMode;
        setUseDarkMode(newMode);

        const newCtx = { ...contextData };
        if (newMode)
            newCtx.themeMode = 'dark';
        else
            newCtx.themeMode = 'light';

        setData(newCtx);
        window.localStorage.setItem("USE_DARK_MODE", newMode ? '1' : '0');
    };

    const toggleShowSpotAge = () => {
        const newMode = !showSpotAge;
        setShowSpotAge(newMode);
        window.localStorage.setItem("SHOW_SPOT_AGE", newMode ? '1' : '0');
    };

    const toggleHighlightNewRef = () => {
        const newMode = !highlightNewRef;
        setHighlightNewRef(newMode);
        window.localStorage.setItem("HIGHLIGHT_NEW_REF", newMode ? '1' : '0');
    };

    const handleCheckedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImperialChecked(event.target.checked);
        let x = event.target.checked ? '1' : '0';
        // this is a display only config so we don't put this in the db
        // we put this into localstorage
        window.localStorage.setItem("USE_FREEDOM_UNITS", x);
    };

    React.useEffect(() => {
        let units = window.localStorage.getItem("USE_FREEDOM_UNITS") || '1';
        let use_imperial = parseInt(units);
        setImperialChecked(use_imperial != 0 ? true : false);

        let darkMode = window.localStorage.getItem("USE_DARK_MODE") || '1';
        let darkModeInt = parseInt(darkMode);
        setUseDarkMode(darkModeInt == 1 ? true : false);

        let spotAgeStr = window.localStorage.getItem("SHOW_SPOT_AGE") || '1';
        let showSage = parseInt(spotAgeStr);
        setShowSpotAge(showSage == 1 ? true : false);

        let highlightNewStr = window.localStorage.getItem("HIGHLIGHT_NEW_REF") || '1';
        let highlightNew = parseInt(highlightNewStr);
        setHighlightNewRef(highlightNew == 1 ? true : false);
    }, []);


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
            <Stack direction={'row'} spacing={1}>
                <FormControlLabel control={<Checkbox defaultChecked checked={imperialChecked}
                    onChange={handleCheckedChange} />} label="Display Imperial Units" />

                <FormControlLabel control={<Switch checked={useDarkMode}
                    onChange={toggleDarkTheme} />} label="Dark Mode" />

                <Tooltip title="Show spot time as age: '5 min' vs 'hh:mm'">
                    <FormControlLabel control={<Switch checked={showSpotAge}
                        onChange={toggleShowSpotAge} />} label="Show Spot Age" />
                </Tooltip>

                <Tooltip title="Add extra highlighting to new park rows">
                    <FormControlLabel control={<Switch checked={highlightNewRef}
                        onChange={toggleHighlightNewRef} />} label="Highlight New" />
                </Tooltip>
            </Stack>
            <Stack spacing={2} marginTop={3}>
                <p className="modal-config-text">
                    QTH string is inserted when posting spots to POTA.app ex: 'mid GA'
                    is inserted into comment like '[599 mid GA] thx fb qso'
                </p>
                <TextField id="qth_string" label="QTH String"
                    value={config?.qth_string}
                    fullWidth
                    onChange={(e) => {
                        setConfig({ ...config, qth_string: e.target.value });
                    }} />
            </Stack>
        </>
    )

}