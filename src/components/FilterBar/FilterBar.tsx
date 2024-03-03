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


// https://mui.com/material-ui/react-table/

interface IFilterBarPros {
}


export const FilterBar = (props: IFilterBarPros) => {
    const [mode, setMode] = React.useState('');
    const [band, setBand] = React.useState('');
    const [region, setRegion] = React.useState('');
    const [qrt, setQrt] = React.useState(true);

    const { contextData, setData } = useAppContext();

    const handleChange = (event: SelectChangeEvent) => {
        let m = event.target.value as string

        setMode(m); // it doesn't work without this?????

        contextData.filter.items = [];
        contextData.filter.items.push(
            createEqualityFilter('mode', m)
        );

        setData(contextData);
    };

    const handleBandChange = (event: SelectChangeEvent) => {
        let m = event.target.value as string;
        let x = parseInt(m);
        console.log("changing band to: " + m);
        window.pywebview.api.set_band_filter(x);

        let next = { ...contextData, bandFilter: x };
        setData(next);
        setBand(m);
    }

    const handleRegionChange = (event: SelectChangeEvent) => {
        let r = event.target.value as string;
        console.log("changing region to: " + r);
        window.pywebview.api.set_region_filter(r);

        let next = { ...contextData, regionFilter: r };
        setData(next);
        setRegion(r);
    }

    const handleClear = () => {
        setMode("");
        setBand("0");
        contextData.filter.items = [];
        contextData.filter.items.push(
            createEqualityFilter('mode', '')
        );
        window.pywebview.api.set_band_filter(0);
        let next = { ...contextData, bandFilter: 0 };
        setData(next);
    };

    function handleQrtSwitch(event: any, checked: boolean): void {
        console.log("changing qrt filter to: " + checked);
        window.pywebview.api.set_qrt_filter(checked);

        let next = { ...contextData, qrtFilter: checked};
        setData(next);
        setQrt(checked);
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
                <Button onClick={handleClear} variant="outlined">
                    Clear Filters
                </Button>
            </Box>
        </div>

    );
}
