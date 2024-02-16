import * as React from 'react';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { DataGrid, GridColDef, GridValueGetterParams, GridValueFormatterParams, GridFilterModel } from '@mui/x-data-grid';
import {GridEventListener} from '@mui/x-data-grid';

import { FilterBar } from '../FilterBar/FilterBar'
import { useAppContext } from '../AppContext';

import './SpotViewer.scss'
import { Qso } from '../../types/QsoTypes';


// https://mui.com/material-ui/react-table/


const columns: GridColDef[] = [
    { field: 'spotId', headerName: 'ID', width: 70 },
    { field: 'activator', headerName: 'Activator', width: 130 },
    {
        field: 'spotTime',
        headerName: 'Time',
        width: 100,
        type: 'dateTime',
        valueGetter: (params: GridValueGetterParams) => {
            return new Date(params.row.spotTime);
        },
        valueFormatter: (params: GridValueFormatterParams<Date>) => {
            if (params.value === undefined) return '';
            const hh = params.value.getHours().toString().padStart(2, '0');
            const mm = params.value.getMinutes().toString().padStart(2, '0');
            return `${hh}:${mm}`;
        }

    },
    { field: 'frequency', headerName: 'Freq', width: 100, type: 'number' },
    { field: 'mode', headerName: 'Mode', width: 100 },
    { field: 'reference', headerName: 'Reference', width: 150 },
    { field: 'name', headerName: 'Park Name', width: 500 },
];

// example spots 
const rows = [
    {
        "spotId": 24575447,
        "activator": "KC4MIT",
        "frequency": "14244",
        "mode": "SSB",
        "reference": "K-0050",
        "parkName": null,
        "spotTime": "2024-02-12T19:10:03",
        "spotter": "KC4MIT",
        "comments": "QRT",
        "source": "Web",
        "invalid": null,
        "name": "Mammoth Cave National Park",
        "locationDesc": "US-KY",
        "grid4": "EM67",
        "grid6": "EM67we",
        "latitude": 37.1877,
        "longitude": -86.1012,
        "count": 52,
        "expire": 18
    }
]

var currentFilters = {
    items: [{
        field: 'mode',
        operator: 'equals',
        value: 'CW'
    }]
};

function createEqualityFilter(field: string, value: string) {
    return {
        field: field,
        operator: 'equals',
        value: value
    }
}


export default function SpotViewer() {
    const [mode, setMode] = React.useState("")
    const [time, setTime] = React.useState(30)
    const [spots, setSpots] = React.useState(rows)
    const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
        items: []
    });

    const { contextData, setData } = useAppContext();

    function getSpots() {
        // get the spots from the db
        const spots = window.pywebview.api.get_spots()
        spots.then((r) => {
            var x = JSON.parse(r);
            setSpots(x);
        });
    }

    function getQsoData(id) {
        // use the spot to generate qso data (unsaved)
        const q = window.pywebview.api.qso_data(id);
        console.log(q);
        q.then((r) => {
            var x = JSON.parse(r) as Qso;
            console.log(x);
            const newCtxData = {...contextData};
            newCtxData.qso = x;
            setData(newCtxData);
        });
    }

    React.useEffect(() => {
        window.addEventListener('pywebviewready', function () {
            if (!window.pywebview.state) {
                window.pywebview.state = {}
            }

            // get the spots from the db
            getSpots();
        })
    }, []);

    // setup a timer
    React.useEffect( () => {
        const interval: any = setInterval(() => {
            const x = time - 1;
            if (x < 0) {
                console.log('getting spots...');
                getSpots();
                return setTime(30);
            }
            // return x < 0
            //   ? clearInterval(interval)
            //   : setTime(time - 1);
              return setTime(time - 1);
          }, 1000);
          return () => clearInterval(interval);
    });


    // return the correct PK id for our rows
    function getRowId(row) {
        return row.spotId;
    }

    const handleOnModeChange = (newMode: string) => {
        setMode(newMode); // it doesn't work without this?????
        filterModel.items = [];
        filterModel.items.push(
            createEqualityFilter('mode', newMode)
        );
        console.log(filterModel);
        setFilterModel(filterModel);
    };

    const handleOnFilterCleared = () => {
        currentFilters.items = [];
        setFilterModel(currentFilters);
    }

    const handleRowClick: GridEventListener<'rowClick'> = (
        params,  // GridRowParams
        event,   // MuiEvent<React.MouseEvent<HTMLElement>>
        details, // GridCallbackDetails
      ) => {
        console.log('row click');
        getQsoData(params.row.spotId)
      };

    return (
        <div className='spots-container'>
            <FilterBar
                onModeChange={handleOnModeChange}
                onFilterClear={handleOnFilterCleared} />
            <DataGrid
                rows={spots}
                columns={columns}
                getRowId={getRowId}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 25 },
                    },
                }}
                pageSizeOptions={[5, 10, 25]}
                filterModel={filterModel}
                onFilterModelChange={(newFilterModel) => setFilterModel(newFilterModel)}
                onRowClick={handleRowClick}
            />
        </div >
    );
}
