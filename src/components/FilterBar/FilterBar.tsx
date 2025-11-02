import * as React from 'react';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Box, Stack, Typography, createStyles, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { createEqualityFilter, useAppContext } from '../AppContext';

import './FilterBar.scss'

// https://mui.com/material-ui/react-table/

interface IFilterBarPros {
}


export const FilterBar = (props: IFilterBarPros) => {
    const [mode, setMode] = React.useState('');
    const [band, setBand] = React.useState('');
    const [region, setRegion] = React.useState<string[]>([]);
    const [continent, setContinent] = React.useState<string[]>([]);
    const [loc, setLocation] = React.useState('');
    const [sig, setSig] = React.useState('');
    const [qrt, setQrt] = React.useState(true);
    const [hunted, setHunted] = React.useState(false);
    const [onlyNew, setOnlyNew] = React.useState(false);

    const { contextData, setData } = useAppContext();

    // load up all the data stored in localStorage and use them... after the 
    // API is ready
    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            initFilters();
        else
            window.addEventListener('pywebviewready', initFilters);

        function initFilters() {
            let bf = window.localStorage.getItem("BAND_FILTER") || '0';
            setBandFilter(bf);
            let rf = window.localStorage.getItem("REGION_FILTER") || '';
            setRegionFilter(rf.split(","));
            let mf = window.localStorage.getItem("MODE_FILTER") || '';
            setModeFilter(mf);
            let lf = window.localStorage.getItem("LOCATION_FILTER") || '';
            setLocationFilter(lf);
            let cf = window.localStorage.getItem("CONTINENT_FILTER") || '';
            setContinentFilter(cf.split(","));

            let qrtF = window.localStorage.getItem("QRT_FILTER");
            setQrtFilter((qrtF === "true"));
            let hf = window.localStorage.getItem("HUNTED_FILTER");
            setHuntedFilter((hf === "true"));
            let on = window.localStorage.getItem("ATNO_FILTER");
            setOnlyNewFilter((on === "true"));

            let sf = window.localStorage.getItem("SIG_FILTER") || '';
            setSigFilter(sf);
        };
    }, []);

    const handleChange = (event: SelectChangeEvent) => {
        let m = event.target.value as string
        setModeFilter(m);
        window.localStorage.setItem("MODE_FILTER", m);
    };

    const handleBandChange = (event: SelectChangeEvent) => {
        let m = event.target.value as string;
        setBandFilter(m);
        window.localStorage.setItem("BAND_FILTER", m);
    }

    const handleContinentChange = (event: SelectChangeEvent) => {
        let c = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

        console.log(c);
        if (c.includes("NONE")) {
            c = [];
        }
        setContinentFilter(c);
        window.localStorage.setItem("CONTINENT_FILTER", c.join(","));
    };

    const handleRegionChange = (event: SelectChangeEvent) => {
        let r = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

        // the compiler complains that shiftKey isn't there. but it is.
        // if no regions are selected and the user holds shift while clicking
        // their selection, we invert the selection. helpful for those who dont
        // want to see US spots.
        if (event.shiftKey) {
            let curr = { ...contextData };
            let current = curr.regions;
            let filterBy = "";
            if (r.length > 1 && r[0] === "") {
                // the very first time it's clicked there's an empty string in
                // index 0
                filterBy = r[1];
            } else {
                filterBy = r[0];
            }
            let inv = current.filter((x) => x != filterBy);
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
        let l = event.target.value as string;
        setLocationFilter(l);
        window.localStorage.setItem("LOCATION_FILTER", l);
    }

    const handleSigChange = (event: SelectChangeEvent) => {
        let sig = event.target.value as string;
        setSigFilter(sig);
        window.localStorage.setItem("SIG_FILTER", sig);
    }

    const handleClear = () => {
        setMode("");
        setBand("0");
        contextData.filter.items = [];
        contextData.filter.items.push(
            createEqualityFilter('mode', '')
        );
        window.pywebview.api.set_band_filter(0);
        window.pywebview.api.set_region_filter([]);
        window.pywebview.api.set_continent_filter([]);
        window.pywebview.api.set_qrt_filter(true);
        window.pywebview.api.set_hunted_filter(false);
        window.pywebview.api.set_only_new_filter(false);
        window.pywebview.api.set_sig_filter("");
        setRegion([]);
        setContinent([]);
        setLocation("");
        setQrt(true);
        setHunted(false);
        setOnlyNew(false);
        setSig("");

        window.localStorage.setItem("BAND_FILTER", '0');
        window.localStorage.setItem("REGION_FILTER", '');
        window.localStorage.setItem("CONTINENT_FILTER", '');
        window.localStorage.setItem("MODE_FILTER", '');
        window.localStorage.setItem("LOCATION_FILTER", '');
        window.localStorage.setItem("QRT_FILTER", 'true');
        window.localStorage.setItem("HUNTED_FILTER", 'false');
        window.localStorage.setItem("ATNO_FILTER", 'false');
        window.localStorage.setItem("SIG_FILTER", '');

        const next = {
            ...contextData,
            bandFilter: 0,
            regionFilter: "",
            locationFilter: "",
            qrtFilter: true,
            huntedFilter: false,
            onlyNew: false,
            sigFilter: ''
        };
        setData(next);

        location.reload();
    };

    function handleQrtSwitch(event: any, checked: boolean): void {
        setQrtFilter(checked);
        window.localStorage.setItem("QRT_FILTER", checked.toString());
    }

    function handleHuntedSwitch(event: any, checked: boolean): void {
        setHuntedFilter(checked);
        window.localStorage.setItem("HUNTED_FILTER", checked.toString());
    }

    function handleOnlyNewSwitch(event: any, checked: boolean): void {
        setOnlyNewFilter(checked);
        window.localStorage.setItem("ATNO_FILTER", checked.toString());
    }

    function setQrtFilter(checked: boolean) {
        console.log("changing qrt filter to: " + checked);
        window.pywebview.api.set_qrt_filter(checked);

        let next = { ...contextData, qrtFilter: checked };
        setData(next);
        setQrt(checked);
    }

    function setHuntedFilter(checked: boolean) {
        console.log("changing hunted filter to: " + checked);
        window.pywebview.api.set_hunted_filter(checked);

        let next = { ...contextData, huntedFilter: checked };
        setData(next);
        setHunted(checked);
    }

    function setOnlyNewFilter(checked: boolean) {
        console.log("changing onlynew filter to: " + checked);
        window.pywebview.api.set_only_new_filter(checked);

        let next = { ...contextData, onlyNewFilter: checked };
        setData(next);
        setOnlyNew(checked);
    }

    function setModeFilter(m: string) {
        setMode(m); // it doesn't work without this?????

        contextData.filter.items = [];
        contextData.filter.items.push(
            createEqualityFilter('mode', m)
        );

        setData(contextData);
    }

    function setBandFilter(m: string) {
        let x = parseInt(m);
        console.log("changing band to: " + m);
        window.pywebview.api.set_band_filter(x);

        let next = { ...contextData, bandFilter: x };
        setData(next);
        setBand(m);
    }

    function setRegionFilter(r: string[]) {
        console.log("changing region to: " + r);
        window.pywebview.api.set_region_filter(r);

        let next = { ...contextData, regionFilter: r.join(",") };
        setData(next);
        setRegion(r);
    }

    function setContinentFilter(r: string[]) {
        window.pywebview.api.set_continent_filter(r);
        let next = { ...contextData, continentFilter: r.join(",") };
        setData(next);
        setContinent(r);
    }

    function setLocationFilter(l: string) {
        console.log("changing location to: " + l);
        window.pywebview.api.set_location_filter(l);

        let next = { ...contextData, locationFilter: l };
        setData(next);
        setLocation(l);
    }

    function setSigFilter(sig: string) {
        console.log("changing sig filt to: " + sig);
        window.pywebview.api.set_sig_filter(sig);

        let next = { ...contextData, locationFilter: sig };
        setData(next);
        setSig(sig);
    }


    const StyledTypoGraphy = styled(Typography)(({ theme }) =>
        theme.unstable_sx({
            fontSize: {
                lg: 16,
                md: 16,
                sm: 12,
                xs: 10
            }
        }),
    );

    const StyledInputLabel = styled(InputLabel)(({ theme }) =>
        theme.unstable_sx({
            fontSize: {
                lg: 16,
                md: 16,
                sm: 12,
                xs: 10
            }
        }),
    );

    return (
        <Box className='filter-bar' sx={{ borderTop: 1, borderColor: 'grey.800', paddingTop: 2, paddingBottom: 1 }}>
            <Stack
                direction='row'
                spacing={{ md: 1, sm: 0, lg: 1.25 }}
            >
                <FormControlLabel
                    control={<Switch onChange={handleQrtSwitch} checked={qrt} />}
                    label={<StyledTypoGraphy>Hide QRT</StyledTypoGraphy>} />
                <FormControlLabel
                    control={<Switch onChange={handleHuntedSwitch} checked={hunted} />}
                    label={<StyledTypoGraphy>Hide Hunted</StyledTypoGraphy>} />
                <FormControlLabel
                    control={<Switch onChange={handleOnlyNewSwitch} checked={onlyNew} />}
                    label={<StyledTypoGraphy>Only New</StyledTypoGraphy>} />
                <FormControl size='small'>
                    <StyledInputLabel id="band-label">Band</StyledInputLabel>
                    <Select
                        labelId="band-label"
                        id="band"
                        value={band}
                        variant='standard'
                        onChange={handleBandChange}
                    >
                        {/* use style={{ display: "none" }} to hide these later */}
                        <MenuItem value="0"><em>None</em></MenuItem>
                        <MenuItem value="1">160</MenuItem>
                        <MenuItem value="2">80</MenuItem>
                        <MenuItem value="3">60</MenuItem>
                        <MenuItem value="4">40</MenuItem>
                        <MenuItem value="5">30</MenuItem>
                        <MenuItem value="6">20</MenuItem>
                        <MenuItem value="7">17</MenuItem>
                        <MenuItem value="8">15</MenuItem>
                        <MenuItem value="9">12</MenuItem>
                        <MenuItem value="10">10</MenuItem>
                        <MenuItem value="11">6</MenuItem>
                        <MenuItem value="12">2</MenuItem>
                        <MenuItem value="14">70cm</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <StyledInputLabel id="demo-simple-select-label">Mode</StyledInputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={mode}
                        variant='standard'
                        sx={{ minWidth: 75 }}
                        onChange={handleChange}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value='CW'>CW</MenuItem>
                        <MenuItem value='SSB'>SSB</MenuItem>
                        <MenuItem value='AM'>AM</MenuItem>
                        <MenuItem value='FM'>FM</MenuItem>
                        <MenuItem value='FT8'>FT8</MenuItem>
                        <MenuItem value='FT4'>FT4</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <StyledInputLabel id="demo-simple-select-label">Continent</StyledInputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={continent}
                        multiple
                        variant='standard'
                        sx={{ minWidth: 75 }}
                        onChange={handleContinentChange}
                    >
                        <MenuItem value="NONE"><em>None</em></MenuItem>
                        <MenuItem value='AF'>Africa</MenuItem>
                        <MenuItem value='AN'>Antarctica</MenuItem>
                        <MenuItem value='AS'>Asia</MenuItem>
                        <MenuItem value='EU'>Europe</MenuItem>
                        <MenuItem value='NA'>North America</MenuItem>
                        <MenuItem value='OC'>Oceania</MenuItem>
                        <MenuItem value='SA'>South America</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <StyledInputLabel id="region-lbl">Region (m)</StyledInputLabel>
                    <Select
                        labelId="region-lbl"
                        id="region"
                        multiple
                        value={region}
                        variant='standard'
                        sx={{ minWidth: 100 }}
                        onChange={handleRegionChange}
                    >
                        <MenuItem value="NONE"><em>None</em></MenuItem>
                        {contextData.regions.map((region) => (
                            <MenuItem key={region} value={region}>
                                {region}
                            </MenuItem>
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
                        sx={{ minWidth: 100 }}
                        onChange={handleLocationChange}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {contextData.locations.map((loc) => (
                            <MenuItem key={loc} value={loc}>
                                {loc}
                            </MenuItem>
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
                        sx={{ minWidth: 100 }}
                        onChange={handleSigChange}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value='POTA'>POTA</MenuItem>
                        <MenuItem value='SOTA'>SOTA</MenuItem>
                        <MenuItem value='WWFF'>WWFF</MenuItem>
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


