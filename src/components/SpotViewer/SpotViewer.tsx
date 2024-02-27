import * as React from 'react';
import Button from '@mui/material/Button';
import { Badge, Tooltip } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { DataGrid, GridColDef, GridValueGetterParams, GridValueFormatterParams, GridFilterModel, GridSortModel, GridSortDirection, GridCellParams } from '@mui/x-data-grid';
import { GridEventListener } from '@mui/x-data-grid';

import { useAppContext } from '../AppContext';

import { Qso } from '../../@types/QsoTypes';
import CallToolTip from './CallTooltip';
import { SpotRow } from '../../@types/Spots';

import './SpotViewer.scss'

// https://mui.com/material-ui/react-table/


const columns: GridColDef[] = [
    // { field: 'spotId', headerName: 'ID', width: 70 },
    {
        field: 'activator', headerName: 'Activator', width: 130,
        renderCell: (params: GridCellParams) => (
            <CallToolTip callsign={params.row.activator} op_hunts={params.row.op_hunts} />
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
            function onClick(e: string, m: string) {
                console.log("js qsy to...");
                console.log(`param ${e} ${m}`);
                window.pywebview.api.qsy_to(e, m);
            };

            return (
                <Button sx={{ width: '100px' }} variant='contained' onClick={() => { onClick(x.row.frequency, x.row.mode) }}>{x.row.frequency}</Button>
            )
        }
    },
    { field: 'mode', headerName: 'Mode', width: 100 },
    { field: 'locationDesc', headerName: 'Loc', width: 100 },
    {
        field: 'reference', headerName: 'Park', width: 400,
        // valueGetter: (params: GridValueGetterParams) => {
        //     return `${params.row.reference || ''} - ${params.row.name || ''}`;
        // },
        renderCell: (x) => {
            return (
                <Badge
                    badgeContent={x.row.park_hunts}
                    color="secondary"
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}>
                    {x.row.reference} - {x.row.name}
                </Badge>
            )
        }
    },
    {
        field: 'spotOrig', headerName: 'Spot', width: 400,
        valueGetter: (params: GridValueGetterParams) => {
            return `${params.row.spotter || ''}: ${params.row.comments || ''}`;
        },
    },
    {
        field: 'hunted', headerName: 'Hunted', width: 100,
        renderCell: (x) => {
            return (
                <>
                    {x.row.hunted && (
                        <div>
                            <Tooltip title={
                                <React.Fragment>
                                    {'hunted on:'}<br />
                                    {x.row.hunted_bands}
                                </React.Fragment>
                            }>
                                <CheckBoxIcon color='primary' />
                            </Tooltip>
                        </div>
                    )}
                    {!x.row.hunted && (<CheckBoxOutlineBlankIcon />)}
                </>
            )
        }
    }
];


const rows: SpotRow[] = [];


var currentSortFilter = { field: 'spotTime', sort: 'desc' as GridSortDirection };


export default function SpotViewer() {
    const [time, setTime] = React.useState(30)
    const [spots, setSpots] = React.useState(rows)
    const [sortModel, setSortModel] = React.useState<GridSortModel>([currentSortFilter]);
    const { contextData, setData } = useAppContext();

    function getSpots() {
        // get the spots from the db
        const spots = window.pywebview.api.get_spots()
        spots.then((r: string) => {
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

    function getQsoData(id: number) {
        // use the spot to generate qso data (unsaved)
        const q = window.pywebview.api.get_qso_from_spot(id);
        //console.log(q);
        q.then((r: any) => {
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

            window.pywebview.state.getSpots = getSpots;
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
    function getRowId(row: { spotId: any; }) {
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
