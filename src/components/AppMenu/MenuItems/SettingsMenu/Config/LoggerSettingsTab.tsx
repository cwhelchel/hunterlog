import * as React from 'react';
import { Checkbox, CircularProgress, Divider, FormControl, FormControlLabel, FormHelperText, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { useConfigContext } from './ConfigContextProvider';

interface WavelogStation {
    station_id: string,
    station_profile_name: string,
    station_callsign: string,
    station_active: string | null,
}

export default function LoggerSettingsTab() {
    const { config, setConfig } = useConfigContext();

    const [stations, setStations] = React.useState<WavelogStation[]>([]);
    const [loadingStations, setLoadingStations] = React.useState(false);
    const [stationError, setStationError] = React.useState('');

    const getStations = React.useCallback(async () => {
        if (window.pywebview === undefined) return;

        setLoadingStations(true);
        setStationError('');

        try {
            const r = await window.pywebview.api.get_wavelog_stations(
                config?.wavelog_url, config?.wavelog_api_key);
            const result = JSON.parse(r);

            if (result.error) {
                setStations([]);
                setStationError(result.error);
                return;
            }

            const list = result.stations as WavelogStation[];
            setStations(list);

        } catch (e) {
            setStations([]);
            setStationError(`Could not read stations from Wavelog: ${e}`);
        } finally {
            setLoadingStations(false);
        }
    }, [config, setConfig]);

    // fetch the station list when Wavelog becomes the selected logger and we
    // already have something to authenticate with. deliberately not keyed on
    // the url or key fields, or we would hit the API on every keystroke.
    React.useEffect(() => {
        if (config?.logger_type != 5) return;
        if (!config?.wavelog_url || !config?.wavelog_api_key) return;

        getStations();
    }, [config?.logger_type]);

    // keep a saved profile id selectable even before the list has loaded, so
    // opening the config dialog offline does not silently blank the setting.
    const savedId = config?.wavelog_station_id ?? '';
    const isSavedIdKnown = stations.some(s => s.station_id === savedId);

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
                <MenuItem value={5}>Wavelog</MenuItem>
                <MenuItem value={6}>QRZ.com</MenuItem>
            </Select>

            <Stack direction={'row'} spacing={1} marginBottom={'10px'}>
                <FormControlLabel label="Use QSO staging"
                    style={{ width: "50%", marginLeft: 10 }}
                    control={
                        <Checkbox checked={config.stage_qsos}
                            inputProps={{ 'aria-label': 'controlled' }}
                            onChange={(e) => {
                                const val = Boolean(e.target.checked);
                                setConfig({ ...config, stage_qsos: val });
                            }} />
                    } />
                <p className="modal-config-text">
                    Some loggers support staging of QSOs to provide extra functionality. You can
                    disable this with the checkbox.
                </p>
            </Stack>

            <Divider aria-hidden="true" />

            <p className="modal-config-text" hidden={config?.logger_type == 5 || config?.logger_type == 6}>
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

            <div hidden={config?.logger_type != 5} className="modal-config-text">
                <p>
                    Wavelog uses a different communications style for logging QSOs.
                    The Wavelog URL should be a web address like this <code>http://mywavelog.example.com/</code> or <code>http://192.168.1.30:8086</code>
                </p>
                <p>
                    The API key is generated by by the user (you) to allow applications
                    to send data to the Wavelog instance. You can find this
                    in the Wavelog menus named &apos;API Keys&apos;
                </p>
                <p>
                    Wavelog requires QSOs to name the station profile they belong to.
                    Fill in the URL and API key, then press the refresh button to read
                    your station profiles from Wavelog and pick the one you are
                    operating from.
                </p>
            </div>

            <div hidden={config?.logger_type != 6} className="modal-config-text">
                <p>
                    <em>QRZ.COM subscription required for this feature.</em>
                </p>
                <p>
                    Enter your QRZ.com logbook API key and qsos will be sent to your
                    online logbook.
                </p>
            </div>

            {config?.logger_type == 6 &&
                <Stack direction={'row'} spacing={1}>
                    <TextField id="wl_url" label="QRZ API Key"
                        value={config?.qrz_api_key}
                        fullWidth
                        onChange={(e) => {
                            setConfig({ ...config, qrz_api_key: e.target.value });
                        }} />
                </Stack>
            }

            {config?.logger_type == 5 &&
                <Stack direction={'column'} spacing={2}>
                    <Stack direction={'row'} spacing={1}>
                        <TextField id="wl_url" label="Wavelog instance URL"
                            value={config?.wavelog_url}
                            fullWidth
                            onChange={(e) => {
                                setConfig({ ...config, wavelog_url: e.target.value });
                            }} />
                        <TextField id="wl_api_key" label="Wavelog API key"
                            value={config?.wavelog_api_key}
                            fullWidth
                            onChange={(e) => {
                                setConfig({ ...config, wavelog_api_key: e.target.value });
                            }} />
                    </Stack>

                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <FormControl fullWidth error={stationError != ''}>
                            <InputLabel id="wl-station-label">Wavelog station profile</InputLabel>
                            <Select
                                labelId="wl-station-label"
                                id="wl_station_id"
                                label="Wavelog station profile"
                                value={savedId}
                                onChange={(e) => {
                                    setConfig({ ...config, wavelog_station_id: e.target.value.toString() });
                                }}>
                                {savedId != '' && !isSavedIdKnown &&
                                    <MenuItem value={savedId}>
                                        {`Profile ${savedId}`}
                                    </MenuItem>
                                }
                                {stations.map((s) => (
                                    <MenuItem key={s.station_id} value={s.station_id}>
                                        {`${s.station_id}: ${s.station_profile_name} (${s.station_callsign})`}
                                        {s.station_active === '1' ? ' - active in Wavelog' : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>
                                {stationError != ''
                                    ? stationError
                                    : 'QSOs are logged against this station profile.'}
                            </FormHelperText>
                        </FormControl>

                        {loadingStations
                            ? <CircularProgress size={24} />
                            : <Tooltip title="Read station profiles from Wavelog">
                                <span>
                                    <IconButton
                                        aria-label="refresh wavelog stations"
                                        disabled={!config?.wavelog_url || !config?.wavelog_api_key}
                                        onClick={getStations}>
                                        <RefreshIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        }
                    </Stack>
                </Stack>
            }

            {config?.logger_type < 5 &&
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
            }
        </div>
    )

}