import * as React from 'react';
import { Checkbox, Divider, FormControlLabel, Stack } from '@mui/material';
import { useConfigContext } from './ConfigContextProvider';
import { MuiColorInput } from 'mui-color-input';

export default function WsjtxSettingsTab() {
    const { config, setConfig } = useConfigContext();

    return (
        <Stack direction={'column'} spacing={1}>
            <FormControlLabel label="Enable advanced WSJT-X Integrations"
                style={{ width: "100%" }}
                control={
                    <Checkbox checked={config.enable_wsjtx_int}
                        inputProps={{ 'aria-label': 'controlled' }}
                        onChange={(e) => {
                            const val = Boolean(e.target.checked);
                            setConfig({ ...config, enable_wsjtx_int: val });
                        }} />
                } />
            <p className="modal-config-text">
                If enabled, Hunterlog will monitor WSJT-X UDP packets and log QSOs that it sees. If they are spots from
                a program Hunterlog knows, it will park the spot as hunted. If this is false all WSJT-X integrations are disabled.
            </p>

            <Divider aria-hidden="true" />

            <FormControlLabel label="Enable Highlighting of seen callsigns in WSJT-X"
                style={{ width: "100%" }}
                control={
                    <Checkbox checked={config.wsjtx_highlight_calls}
                        inputProps={{ 'aria-label': 'controlled' }}
                        onChange={(e) => {
                            const val = Boolean(e.target.checked);
                            setConfig({ ...config, wsjtx_highlight_calls: val });
                        }} />
                } />

            <Stack direction={'row'} gap={1}>
                <FormControlLabel label="Hunted Background"
                    labelPlacement='start'
                    style={{ width: "100%", marginLeft: '10px' }}
                    control={
                        <MuiColorInput isAlphaHidden={false} format='hex8' value={config.wsjtx_hunted_bg} onChange={(e) => {
                            const val = (e);
                            setConfig({ ...config, wsjtx_hunted_bg: val });
                        }}></MuiColorInput>
                    } />
                <FormControlLabel label="Hunted Foreground (text)"
                    labelPlacement='start'
                    style={{ width: "100%", marginLeft: '10px' }}
                    control={
                        <MuiColorInput isAlphaHidden={false} format='hex8' value={config.wsjtx_hunted_fg} onChange={(e) => {
                            const val = (e);
                            setConfig({ ...config, wsjtx_hunted_fg: val });
                        }}></MuiColorInput>
                    } />
            </Stack>

            <Stack direction={'row'} gap={1}>
                <FormControlLabel label="Spotted Background"
                    labelPlacement='start'
                    style={{ width: "100%", marginLeft: '10px' }}
                    control={
                        <MuiColorInput isAlphaHidden={false} format='hex8' value={config.wsjtx_spot_bg} onChange={(e) => {
                            const val = (e);
                            setConfig({ ...config, wsjtx_spot_bg: val });
                        }}></MuiColorInput>
                    } />
                <FormControlLabel label="Spotted Foreground (text)"
                    labelPlacement='start'
                    style={{ width: "100%", marginLeft: '10px' }}
                    control={
                        <MuiColorInput isAlphaHidden={false} format='hex8' value={config.wsjtx_spot_fg} onChange={(e) => {
                            const val = (e);
                            setConfig({ ...config, wsjtx_spot_fg: val });
                        }}></MuiColorInput>
                    } />
            </Stack>

            <Stack direction={'row'} gap={1}>
                <FormControlLabel
                    label="New Reference Background"
                    labelPlacement='start'
                    style={{ width: "100%", marginLeft: '10px' }}
                    control={
                        <MuiColorInput isAlphaHidden={false} format='hex8' value={config.wsjtx_new_ref_bg} onChange={(e) => {
                            const val = (e);
                            setConfig({ ...config, wsjtx_new_ref_bg: val });
                        }}></MuiColorInput>
                    } />
                <FormControlLabel
                    label="New Reference Foreground (text)"
                    labelPlacement='start'
                    style={{ width: "100%", marginLeft: '10px' }}
                    control={
                        <MuiColorInput isAlphaHidden={false} format='hex8' value={config.wsjtx_new_ref_fg} onChange={(e) => {
                            const val = (e);
                            setConfig({ ...config, wsjtx_new_ref_fg: val });
                        }}></MuiColorInput>
                    } />
            </Stack>
        </Stack>
    );
}
