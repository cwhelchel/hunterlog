import * as React from 'react';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { DataGrid, GridColDef, GridValueGetterParams, GridValueFormatterParams, GridSortModel, GridFilterModel } from '@mui/x-data-grid';

import './FilterBar.scss'


// https://mui.com/material-ui/react-table/

interface IFilterBarPros {
    onModeChange: (mode: string) => void;
    onFilterClear: () => void;
}

export const FilterBar = (props: IFilterBarPros) => {
    const [mode, setMode] = React.useState('');

    const { onModeChange, onFilterClear } = props;

    const handleChange = (event: SelectChangeEvent) => {
        let m = event.target.value as string
        console.log(`from filterbar ${m}`);
        setMode(m);
        onModeChange(m);
    };

    const handleClear = () => {
        console.log("from filterbar");
        setMode("");
        onFilterClear();
    };

    return (
        <div className='spots-bar'>
            <FormControl size='small' >
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
            <Button onClick={handleClear} variant="outlined">
                Clear Filters
            </Button>
        </div>

    );
}
