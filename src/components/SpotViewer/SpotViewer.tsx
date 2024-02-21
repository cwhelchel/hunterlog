import * as React from 'react';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { DataGrid, GridColDef, GridValueGetterParams, GridValueFormatterParams, GridFilterModel, GridSortModel, GridSortDirection, GridCellParams } from '@mui/x-data-grid';
import { GridEventListener } from '@mui/x-data-grid';

import { FilterBar } from '../FilterBar/FilterBar'
import { useAppContext } from '../AppContext';

import './SpotViewer.scss'
import { Qso } from '../../@types/QsoTypes';
import Tooltip from '@mui/material/Tooltip';
import CallToolTip from './CallTooltip';


// https://mui.com/material-ui/react-table/


const columns: GridColDef[] = [
    // { field: 'spotId', headerName: 'ID', width: 70 },
    {
        field: 'activator', headerName: 'Activator', width: 130,
        renderCell: (params: GridCellParams) => (
            <CallToolTip callsign={params.row.activator} />
        ),
    },
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
    {
        field: 'frequency', headerName: 'Freq', width: 100, type: 'number',
        renderCell: (x) => {
            function onClick(e, m) {
                console.log("js qsy to...");
                console.log(`param ${e} ${m}`);
                window.pywebview.api.qsy_to(e, m);
            };

            return (
                <Button sx={{width:'100px'}} variant='contained' onClick={() => { onClick(x.row.frequency, x.row.mode) }}>{x.row.frequency}</Button>
            )
        }
    },
    { field: 'mode', headerName: 'Mode', width: 100 },
    { field: 'locationDesc', headerName: 'Loc', width: 100 },
    {
        field: 'reference', headerName: 'Park', width: 400,
        valueGetter: (params: GridValueGetterParams) => {
            return `${params.row.reference || ''} - ${params.row.name || ''}`;
        },
    },
    {
        field: 'spotOrig', headerName: 'Spot', width: 400,
        valueGetter: (params: GridValueGetterParams) => {
            return `${params.row.spotter || ''}: ${params.row.comments || ''}`;
        },
    }
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
        "expire": 18,
    }
]

var currentFilters = {
    items: [{
        field: 'mode',
        operator: 'equals',
        value: 'CW'
    }]
};

var currentSortFilter = { field: 'spotTime', sort: 'desc' as GridSortDirection };


export default function SpotViewer() {
    const [mode, setMode] = React.useState("")
    const [time, setTime] = React.useState(30)
    const [spots, setSpots] = React.useState(rows)
    const [sortModel, setSortModel] = React.useState<GridSortModel>([currentSortFilter]);
    const { contextData, setData } = useAppContext();

    function getSpots() {
        // get the spots from the db
        const spots = window.pywebview.api.get_spots()
        spots.then((r) => {
            var x = JSON.parse(r);
            setSpots(x);
        });
    }

    // when [spots] are set, update regions
    React.useEffect(() => {
        // parse the current spots and pull out the region specifier from each
        // location
        spots.map((spot) => {
            let loc = spot.locationDesc.substring(0, 2);
            if (!contextData.regions.includes(loc))
                contextData.regions.push(loc);
        });

        setData(contextData);
    }, [spots]);

    function getQsoData(id) {
        // use the spot to generate qso data (unsaved)
        const q = window.pywebview.api.qso_data(id);
        //console.log(q);
        q.then((r) => {
            if (r['success'] == false)
                return;
            var x = JSON.parse(r) as Qso;
            //console.log(x);
            const newCtxData = { ...contextData };
            newCtxData.qso = x;
            setData(newCtxData);
        });
    }

    React.useEffect(() => {
        window.addEventListener('pywebviewready', function () {
            if (!window.pywebview.state) {
                window.pywebview.state = {}
            }

            // first run thru do this:
            getSpots();
        })
    }, []);

    React.useEffect(() => {
        // get the spots from the db
        if (window.pywebview !== undefined)
            getSpots();
    }, [contextData.bandFilter, contextData.regionFilter]);

    // setup a timer
    React.useEffect(() => {
        const interval: any = setInterval(() => {
            const x = time - 1;
            if (x < 0) {
                console.log('getting spots...');
                getSpots();
                return setTime(30);
            }
            return setTime(time - 1);
        }, 1000);
        return () => clearInterval(interval);
    });


    // return the correct PK id for our rows
    function getRowId(row) {
        return row.spotId;
    }

    const handleRowClick: GridEventListener<'rowClick'> = (
        params,  // GridRowParams
        event,   // MuiEvent<React.MouseEvent<HTMLElement>>
        details, // GridCallbackDetails
    ) => {
        console.log('row click');
        getQsoData(params.row.spotId)
    };

    function setFilterModel(e: GridFilterModel) {
        contextData.filter = e;
        setData(contextData);
    };

    return (
        <div className='spots-container'>
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
                filterModel={contextData.filter}
                onFilterModelChange={(v) => setFilterModel(v)}
                onRowClick={handleRowClick}
                sortModel={sortModel}
                onSortModelChange={(e) => setSortModel(e)}
            />
        </div >
    );
}
