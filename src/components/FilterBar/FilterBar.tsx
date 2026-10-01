/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Box, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAppContext } from '../AppContext';

import './FilterBar.scss'
import HiddenFilterButton from './HiddenFilterButton';
import OnlyNewFilterButton from './OnlyNewFilterButton';
import HuntedFilterButton from './HuntedFilterButton';
import QrtFilterButton from './QrtFilterButton';
import { checkApiResponse2 } from '../Utilities/util';
import { useMessageQueue } from '../MessageContext';

// https://mui.com/material-ui/react-table/

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IFilterBarPros {
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const FilterBar = (props: IFilterBarPros) => {
    const [mode, setMode] = React.useState<string[]>([]);
    const [band, setBand] = React.useState<string[]>([]);
    const [region, setRegion] = React.useState<string[]>([]);
    const [continent, setContinent] = React.useState<string[]>([]);
    const [loc, setLocation] = React.useState('');
    const [sig, setSig] = React.useState('');
    const [enabledPrograms, setEnabledPrograms] = React.useState<string[]>([]);
    const { addMessage } = useMessageQueue();

    const { contextData, setData } = useAppContext();

    // load up all the data stored in localStorage and use them... after the 
    // API is ready
    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            init();
        else
            window.addEventListener('pywebviewready', init);

        function init() {
            const bf = window.localStorage.getItem("BAND_FILTER") || '0';
            const bf_a = bf.split(',');
            if (bf_a.length == 1 && bf_a[0] == '')
                setBandFilter([]);
            else
                setBandFilter(bf_a);

            const rf = window.localStorage.getItem("REGION_FILTER") || '';
            setRegionFilter(rf.split(","));
            const mf = window.localStorage.getItem("MODE_FILTER") || '';
            const mf_a = mf.split(",");
            if (mf_a.length == 1 && mf_a[0] == '')
                setModeFilter([]);
            else
                setModeFilter(mf_a);
            const lf = window.localStorage.getItem("LOCATION_FILTER") || '';
            setLocationFilter(lf);
            const cf = window.localStorage.getItem("CONTINENT_FILTER") || '';
            setContinentFilter(cf.split(","));

            // NOTE: there's an issue with these on first load and refresh 
            // where the first two prints will be true (if show hidden is on)
            // but the stuff in the state and context will be false. and when
            // the switch is toggled it doesn't register a change until toggled
            // several times
            // This issue affects the other filters too
            // console.log(hidden);
            // console.log(bHidden);
            // console.log(showHidden);
            // console.log(contextData.showHiddenFilter);

            const sf = window.localStorage.getItem("SIG_FILTER") || '';
            setSigFilter(sf);

            // get enabled programs
            const res = window.pywebview.api.get_enabled_programs();

            res.then((cfgStr: string) => {
                const obj = checkApiResponse2(cfgStr, addMessage);

                console.log(obj);
                if (!obj.success)
                    return;

                const progs: string[] = [];
                const temp = obj.enabled_progs;
                const keys = Object.keys(temp);
                keys.forEach((k)=> {
                     const enabled = temp[k];

                     if (enabled)
                        progs.push(k);
                });

                setEnabledPrograms(progs);
            });
        };
    }, []);

    const handleModeChange = (event: SelectChangeEvent<string[]>) => {
        let m = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

        if (m.includes("")) {
            m = [];
        }
        setModeFilter(m);
        window.localStorage.setItem("MODE_FILTER", m.join(","));
    };

    const handleBandChange = (event: SelectChangeEvent<string[]>) => {
        let m = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
        if (m.includes("0")) {
            m = [];
        }
        setBandFilter(m);
        window.localStorage.setItem("BAND_FILTER", m.join(","));
    }

    const handleContinentChange = (event: SelectChangeEvent<string[]>) => {
        let c = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

        console.log(c);
        if (c.includes("NONE")) {
            c = [];
        }
        setContinentFilter(c);
        window.localStorage.setItem("CONTINENT_FILTER", c.join(","));
    };

    const handleRegionChange = (event: SelectChangeEvent<string[]>) => {
        let r = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

        // the compiler complains that shiftKey isn't there. but it is.
        // if no regions are selected and the user holds shift while clicking
        // their selection, we invert the selection. helpful for those who dont
        // want to see US spots.
        // TODO: continents replaces the need for this. need to remove.
        if ((event as any).shiftKey) {
            const curr = { ...contextData };
            const current = curr.regions;
            let filterBy = "";
            if (r.length > 1 && r[0] === "") {
                // the very first time it's clicked there's an empty string in
                // index 0
                filterBy = r[1];
            } else {
                filterBy = r[0];
            }
            const inv = current.filter((x) => x != filterBy);
            setRegionFilter(inv);
            window.localStorage.setItem("REGION_FILTER", inv.join(","));
            return;
        }

        if (r.includes("NONE")) {
            r = [];
        }
        setRegionFilter(r);
        window.localStorage.setItem("REGION_FILTER", r.join(","));
    }

    const handleLocationChange = (event: SelectChangeEvent) => {
        const l = event.target.value as string;
        setLocationFilter(l);
        window.localStorage.setItem("LOCATION_FILTER", l);
    }

    const handleSigChange = (event: SelectChangeEvent) => {
        const sig = event.target.value as string;
        setSigFilter(sig);
        window.localStorage.setItem("SIG_FILTER", sig);
    }

    const handleClear = () => {
        setMode([]);
        setBand([]);
        contextData.filter.items = [];
        // contextData.filter.items.push(
        //     createEqualityFilter('mode', '')
        // );
        window.pywebview.api.set_band_filter([]);
        window.pywebview.api.set_region_filter([]);
        window.pywebview.api.set_continent_filter([]);
        window.pywebview.api.set_qrt_filter(true);
        window.pywebview.api.set_hidden_filter(false);
        window.pywebview.api.set_hunted_filter(false);
        window.pywebview.api.set_only_new_filter(false);
        window.pywebview.api.set_sig_filter("");
        setRegion([]);
        setContinent([]);
        setLocation("");
        setSig("");

        window.localStorage.setItem("BAND_FILTER", '0');
        window.localStorage.setItem("REGION_FILTER", '');
        window.localStorage.setItem("CONTINENT_FILTER", '');
        window.localStorage.setItem("MODE_FILTER", '');
        window.localStorage.setItem("LOCATION_FILTER", '');
        window.localStorage.setItem("QRT_FILTER", 'true');
        window.localStorage.setItem("HUNTED_FILTER", 'false');
        window.localStorage.setItem("ATNO_FILTER", 'false');
        window.localStorage.setItem("SHOW_HIDDEN_FLT", 'false');
        window.localStorage.setItem("SIG_FILTER", '');

        const next = {
            ...contextData,
            bandFilter: [],
            regionFilter: "",
            locationFilter: "",
            qrtFilter: true,
            huntedFilter: false,
            onlyNew: false,
            sigFilter: '',
            showHiddenFilter: false
        };
        setData(next);

        location.reload();
    };

    function setModeFilter(m: string[]) {
        window.pywebview.api.set_mode_filter(m);
        setMode(m);
        const next = { ...contextData, modeFilter: m };
        setData(next);
    }

    function setBandFilter(m: string[]) {
        const x = m.map((x) => parseInt(x));
        console.log("changing band to: " + x);
        window.pywebview.api.set_band_filter(x);

        const next = { ...contextData, bandFilter: x };
        setData(next);
        setBand(m);
    }

    function setRegionFilter(r: string[]) {
        console.log("changing region to: " + r);
        window.pywebview.api.set_region_filter(r);

        const next = { ...contextData, regionFilter: r.join(",") };
        setData(next);
        setRegion(r);
    }

    function setContinentFilter(r: string[]) {
        window.pywebview.api.set_continent_filter(r);
        const next = { ...contextData, continentFilter: r.join(",") };
        setData(next);
        setContinent(r);
    }

    function setLocationFilter(l: string) {
        console.log("changing location to: " + l);
        window.pywebview.api.set_location_filter(l);

        const next = { ...contextData, locationFilter: l };
        setData(next);
        setLocation(l);
    }

    function setSigFilter(sig: string) {
        console.log("changing sig filt to: " + sig);
        window.pywebview.api.set_sig_filter(sig);

        const next = { ...contextData, locationFilter: sig };
        setData(next);
        setSig(sig);
    }

    const StyledInputLabel = styled(InputLabel)(({ theme }) =>
        theme.unstable_sx({
            fontSize: {
                lg: 14,
                md: 14,
                sm: 12,
                xs: 10
            }
        }),
    );

    const StyledMenuItem = styled(MenuItem)(({ theme }) =>
        theme.unstable_sx({
            fontSize: {
                lg: 14,
                md: 14,
                sm: 12,
                xs: 10
            }
        }),
    );

    return (
        <Box className='filter-bar' sx={{ borderTop: 1, borderColor: 'grey.800', paddingTop: 2, paddingBottom: 1 }}>
            <Stack
                direction='row'
                spacing={{ sm: 0, md: 0.75, lg: 1 }}
            >
                <QrtFilterButton />
                <HuntedFilterButton />
                <OnlyNewFilterButton />
                <HiddenFilterButton />
                <FormControl size='small'>
                    <StyledInputLabel id="band-label">Band</StyledInputLabel>
                    <Select
                        labelId="band-label"
                        id="band-select"
                        value={band}
                        variant='standard'
                        onChange={handleBandChange}
                        multiple
                        sx={{ minWidth: 75, maxWidth: 110, textOverflow: 'ellipsis', fontSize: '14px' }}
                    >
                        {/* use style={{ display: "none" }} to hide these later */}
                        <StyledMenuItem value="0"><em>None</em></StyledMenuItem>
                        <StyledMenuItem value="1">160</StyledMenuItem>
                        <StyledMenuItem value="2">80</StyledMenuItem>
                        <StyledMenuItem value="3">60</StyledMenuItem>
                        <StyledMenuItem value="4">40</StyledMenuItem>
                        <StyledMenuItem value="5">30</StyledMenuItem>
                        <StyledMenuItem value="6">20</StyledMenuItem>
                        <StyledMenuItem value="7">17</StyledMenuItem>
                        <StyledMenuItem value="8">15</StyledMenuItem>
                        <StyledMenuItem value="9">12</StyledMenuItem>
                        <StyledMenuItem value="10">10</StyledMenuItem>
                        <StyledMenuItem value="11">6</StyledMenuItem>
                        <StyledMenuItem value="12">2</StyledMenuItem>
                        <StyledMenuItem value="14">70cm</StyledMenuItem>
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <StyledInputLabel id="mode-label">Mode</StyledInputLabel>
                    <Select
                        labelId="mode-label"
                        id="mode-select"
                        value={mode}
                        variant='standard'
                        sx={{ minWidth: 75, maxWidth: 110, textOverflow: 'ellipsis', fontSize: '14px' }}
                        onChange={handleModeChange}
                        multiple
                    >
                        <StyledMenuItem value=""><em>None</em></StyledMenuItem>
                        <StyledMenuItem value='CW'>CW</StyledMenuItem>
                        <StyledMenuItem value='SSB'>SSB</StyledMenuItem>
                        <StyledMenuItem value='AM'>AM</StyledMenuItem>
                        <StyledMenuItem value='FM'>FM</StyledMenuItem>
                        <StyledMenuItem value='FT8'>FT8</StyledMenuItem>
                        <StyledMenuItem value='FT4'>FT4</StyledMenuItem>
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <StyledInputLabel id="continent-label">Continent</StyledInputLabel>
                    <Select
                        labelId="continent-label"
                        id="continent-select"
                        value={continent}
                        multiple
                        variant='standard'
                        sx={{ minWidth: 120, maxWidth: 120, textOverflow: 'ellipsis', fontSize: '14px' }}
                        onChange={handleContinentChange}
                    >
                        <StyledMenuItem value="NONE"><em>None</em></StyledMenuItem>
                        <StyledMenuItem value='AF'>Africa</StyledMenuItem>
                        <StyledMenuItem value='AN'>Antarctica</StyledMenuItem>
                        <StyledMenuItem value='AS'>Asia</StyledMenuItem>
                        <StyledMenuItem value='EU'>Europe</StyledMenuItem>
                        <StyledMenuItem value='NA'>North America</StyledMenuItem>
                        <StyledMenuItem value='OC'>Oceania</StyledMenuItem>
                        <StyledMenuItem value='SA'>South America</StyledMenuItem>
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <StyledInputLabel id="region-lbl">Region</StyledInputLabel>
                    <Select
                        labelId="region-lbl"
                        id="region-select"
                        multiple
                        value={region}
                        variant='standard'
                        sx={{ minWidth: 100, maxWidth: 120, textOverflow: 'ellipsis', fontSize: '14px' }}
                        onChange={handleRegionChange}
                    >
                        <StyledMenuItem value="NONE"><em>None</em></StyledMenuItem>
                        {contextData.regions.map((region) => (
                            <StyledMenuItem key={region} value={region}>
                                {region}
                            </StyledMenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <StyledInputLabel id="location-lbl">Location</StyledInputLabel>
                    <Select
                        labelId="location-lbl"
                        id="location"
                        value={loc}
                        variant='standard'
                        sx={{ minWidth: 100, maxWidth: 120, textOverflow: 'ellipsis', fontSize: '14px' }}
                        onChange={handleLocationChange}
                    >
                        <StyledMenuItem value=""><em>None</em></StyledMenuItem>
                        {contextData.locations.map((loc) => (
                            <StyledMenuItem key={loc} value={loc}>
                                {loc}
                            </StyledMenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <StyledInputLabel id="sig-lbl">SIG</StyledInputLabel>
                    <Select
                        labelId="sig-lbl"
                        id="sig"
                        value={sig}
                        variant='standard'
                        sx={{ minWidth: 100, maxWidth: 120, textOverflow: 'ellipsis', fontSize: '14px' }}
                        onChange={handleSigChange}
                    >
                        <StyledMenuItem value=""><em>None</em></StyledMenuItem>
                        {enabledPrograms.map((loc) => (
                            <StyledMenuItem key={loc} value={loc}>
                                {loc}
                            </StyledMenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button onClick={handleClear} variant="outlined"
                    sx={{ maxWidth: 100 }}>
                    Clear
                </Button>
            </Stack>
        </Box>

    );
}
