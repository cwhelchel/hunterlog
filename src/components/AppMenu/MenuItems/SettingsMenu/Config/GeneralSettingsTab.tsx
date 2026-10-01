import * as React from 'react';
import { Checkbox, Divider, FormControlLabel, Grid, Stack, TextField, Tooltip } from "@mui/material";
import { useConfigContext } from './ConfigContextProvider';

export default function GeneralSettingsTab() {

    const { config, setConfig } = useConfigContext();

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
                <Grid item xs={4}>
                    <Tooltip title="Maximum spot age in minutes. Spots older than this are removed.">
                        <TextField id="max_spot_age" label="Max spot age"
                            value={config?.max_spot_age}
                            onChange={(e) => {
                                setConfig({ ...config, max_spot_age: Number.parseInt(e.target.value) });
                            }} />
                    </Tooltip>
                </Grid>
            </Grid>

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
                <Divider />
                <Stack direction={'row'} marginTop={3} spacing={2}>
                    <FormControlLabel label="Match hunted on base callsign"
                        control={
                            <Checkbox checked={config.hunted_use_basecall}
                                inputProps={{ 'aria-label': 'controlled' }}
                                onChange={(e) => {
                                    const val = Boolean(e.target.checked);
                                    setConfig({ ...config, hunted_use_basecall: val });
                                }} />
                        } />

                    <p className="modal-config-text"
                        style={{ width: '60%', marginLeft: 10 }}>
                        When matching hunted spots, ignore portable suffixes and
                        country prefixes, so SM6KZW and SM6KZW/P count as the same
                        station, as do SM6KZW and LA/SM6KZW.
                    </p>
                </Stack>
            </Stack>
        </>
    )

}