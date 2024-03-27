import * as React from 'react';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import './FilterBar.scss'
import { createEqualityFilter, useAppContext } from '../AppContext';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { ContextData } from '../../@types/ContextTypes';


// https://mui.com/material-ui/react-table/

interface IFilterBarPros {
}


export const FilterBar = (props: IFilterBarPros) => {
    const [mode, setMode] = React.useState('');
    const [band, setBand] = React.useState('');
    const [region, setRegion] = React.useState('');
    const [location, setLocation] = React.useState('');
    const [qrt, setQrt] = React.useState(true);
    const [hunted, setHunted] = React.useState(false);

    const { contextData, setData } = useAppContext();

    // load up all the data stored in localStorage and use them... after the 
    // API is ready
    React.useEffect(() => {
        window.addEventListener('pywebviewready', function () {
            let bf = window.localStorage.getItem("BAND_FILTER") || '';
            setBandFilter(bf);
            let rf = window.localStorage.getItem("REGION_FILTER") || '';
            setRegionFilter(rf);
            let mf = window.localStorage.getItem("MODE_FILTER") || '';
            setModeFilter(mf);
            let lf = window.localStorage.getItem("LOCATION_FILTER") || '';
            setLocationFilter(lf);

            let qrtF = window.localStorage.getItem("QRT_FILTER");
            setQrtFilter((qrtF === "true"));
            let hf = window.localStorage.getItem("HUNTED_FILTER");
            setHuntedFilter((hf === "true"));
        });
    },[]);

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

    const handleRegionChange = (event: SelectChangeEvent) => {
        let r = event.target.value as string;
        setRegionFilter(r);

        window.localStorage.setItem("REGION_FILTER", r);
    }

    const handleLocationChange = (event: SelectChangeEvent) => {
        let l = event.target.value as string;
        setLocationFilter(l);
        window.localStorage.setItem("LOCATION_FILTER", l);
    }

    const handleClear = () => {
        setMode("");
        setBand("0");
        contextData.filter.items = [];
        contextData.filter.items.push(
            createEqualityFilter('mode', '')
        );
        window.pywebview.api.set_band_filter(0);
        window.pywebview.api.set_region_filter("");
        window.pywebview.api.set_qrt_filter(true);
        window.pywebview.api.set_hunted_filter(false);

        let next = { ...contextData, 
            bandFilter: 0, 
            regionFilter: "", 
            locationFilter: "", 
            qrtFilter: true, 
            huntedFilter: false};
        setData(next);
        setRegion("");
        setLocation("");
        setQrt(true);
        setHunted(false);

        window.localStorage.setItem("BAND_FILTER", '0');
        window.localStorage.setItem("REGION_FILTER",'');
        window.localStorage.setItem("MODE_FILTER", '');
        window.localStorage.setItem("LOCATION_FILTER", '');
        window.localStorage.setItem("QRT_FILTER", 'true');
        window.localStorage.setItem("HUNTED_FILTER", 'false');

    };

    function handleQrtSwitch(event: any, checked: boolean): void {
        setQrtFilter(checked);
        window.localStorage.setItem("QRT_FILTER", checked.toString());
    }

    function handleHuntedSwitch(event: any, checked: boolean): void {
        setHuntedFilter(checked);
        window.localStorage.setItem("HUNTED_FILTER", checked.toString());
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
    
    function setRegionFilter(r: string) {
        console.log("changing region to: " + r);
        window.pywebview.api.set_region_filter(r);

        let next = { ...contextData, regionFilter: r };
        setData(next);
        setRegion(r);
    }

    function setLocationFilter(l: string) {
        console.log("changing location to: " + l);
        window.pywebview.api.set_location_filter(l);

        let next = { ...contextData, locationFilter: l };
        setData(next);
        setLocation(l);
    }

    return (
        <div className='filter-bar'>
            <Box
                component="form"
                sx={{
                    '& > :not(style)': { m: 1 },
                }}
                noValidate
                autoComplete="off"
            >
                <FormControlLabel control={<Switch onChange={handleQrtSwitch} checked={qrt} />} label="Hide QRT" />
                <FormControlLabel control={<Switch onChange={handleHuntedSwitch} checked={hunted} />} label="Hide Hunted" />
                <FormControl size='small'>
                    <InputLabel id="band-label">Band</InputLabel>
                    <Select
                        labelId="band-label"
                        id="band"
                        value={band}
                        label="Band"
                        variant='standard'
                        sx={{ minWidth: 75 }}
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
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <InputLabel id="demo-simple-select-label">Mode</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={mode}
                        label="Mode"
                        variant='standard'
                        sx={{ minWidth: 75 }}
                        onChange={handleChange}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value='CW'>CW</MenuItem>
                        <MenuItem value='SSB'>SSB</MenuItem>
                        <MenuItem value='FT8'>FT8</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <InputLabel id="region-lbl">Region</InputLabel>
                    <Select
                        labelId="region-lbl"
                        id="region"
                        value={region}
                        label="Region"
                        variant='standard'
                        sx={{ minWidth: 100 }}
                        onChange={handleRegionChange}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {contextData.regions.map((region) => (
                            <MenuItem key={region} value={region}>
                                {region}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl size='small'>
                    <InputLabel id="location-lbl">Location</InputLabel>
                    <Select
                        labelId="location-lbl"
                        id="location"
                        value={location}
                        label="Location"
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
                <Button onClick={handleClear} variant="outlined">
                    Clear Filters
                </Button>
            </Box>
        </div>

    );
}


