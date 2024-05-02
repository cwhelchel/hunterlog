import * as React from 'react';
import Button from '@mui/material/Button';
import { Badge, styled } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams, GridValueFormatterParams, GridFilterModel, GridSortModel, GridSortDirection, GridCellParams, GridRowClassNameParams, GridToolbar, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarColumnsButton, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { GridEventListener } from '@mui/x-data-grid';

import { useAppContext } from '../AppContext';

import { Qso } from '../../@types/QsoTypes';
import CallToolTip from './CallTooltip';
import { SpotRow } from '../../@types/Spots';

import './SpotViewer.scss'
import HuntedCheckbox from './HuntedCheckbox';
import FreqButton from './FreqButton';
import SpotComments from './SpotComments';
import { Park } from '../../@types/Parks';
import SpotTimeCell from './SpotTime';

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
        renderCell: (x) => {
            return (
                <SpotTimeCell dateTimeObj={x.row.spotTime} />
            );
        }
    },
    {
        field: 'frequency', headerName: 'Freq', width: 100, type: 'number',
        renderCell: (x) => {
            return (
                <FreqButton frequency={x.row.frequency} mode={x.row.mode} />
            );
        }
    },
    { field: 'mode', headerName: 'Mode', width: 100 },
    {
        field: 'locationDesc', headerName: 'Loc', width: 150,
        renderCell: (x) => {
            function getContent() {
                return (
                    <>{x.row.loc_hunts} / {x.row.loc_total} </>
                )
            };
            return (
                <>
                    {x.row.loc_hunts > 0 && (
                        <Badge
                            badgeContent={getContent()}
                            color="secondary"
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}>
                            <span id="locationDesc">{x.row.locationDesc}</span>
                        </Badge>
                    )}
                    {x.row.loc_hunts == 0 && (
                        <span id="locationDesc">{x.row.locationDesc}</span>
                    )}
                </>
            )
        }
    },
    {
        field: 'reference', headerName: 'Park', width: 400,
        renderCell: (x) => {
            return (
                <Badge
                    badgeContent={x.row.park_hunts}
                    color="secondary"
                    max={999}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}>
                    <span id="parkName">{x.row.reference} - {x.row.name}</span>
                </Badge>
            )
        }
    },
    {
        field: 'spotOrig', headerName: 'Spot', width: 400,
        // valueGetter: (params: GridValueGetterParams) => {
        //     return `${params.row.spotter || ''}: ${params.row.comments || ''}`;
        // },
        // do this to have a popup for all spots comments
        renderCell: (x) => {
            return (
                <SpotComments spotId={x.row.spotId} spotter={x.row.spotter} comments={x.row.comments} />
            )
        }
    },
    {
        field: 'hunted', headerName: 'Hunted', width: 100,
        renderCell: (x) => {
            return (
                <HuntedCheckbox hunted={x.row.hunted} hunted_bands={x.row.hunted_bands} />
            )
        }
    }
];


const rows: SpotRow[] = [];


var currentSortFilter = { field: 'spotTime', sort: 'desc' as GridSortDirection };


export default function SpotViewer() {
    const [spots, setSpots] = React.useState(rows)
    const [sortModel, setSortModel] = React.useState<GridSortModel>([currentSortFilter]);
    const { contextData, setData } = useAppContext();

    function getSpots() {
        // get the spots from the db
        // NOTE: this gets called from the python backend on a timer and when
        // a qso is logged
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
        if (contextData.locationFilter === "")
            contextData.locations = [];

        spots.map((spot) => {
            let region = spot.locationDesc.substring(0, 2);
            if (!contextData.regions.includes(region))
                contextData.regions.push(region);

            let location = spot.locationDesc.substring(0, 5);
            if (!contextData.locations.includes(location))
                contextData.locations.push(location);
        });

        contextData.locations.sort();
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
            window.pywebview.api.get_park(x.sig_info)
                .then((r: string) => {
                    let p = JSON.parse(r) as Park;
                    const newCtxData = { ...contextData };
                    newCtxData.spotId = id;
                    newCtxData.qso = x;
                    newCtxData.park = p;
                    setData(newCtxData);
                });
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

        try {
            let j = window.localStorage.getItem("SORT_MODEL") || '';
            let sm = JSON.parse(j) as GridSortModel;
            setSortModel(sm);
        } catch {
            console.log("ignored error loading sortmodel. using default");
        }
    }, []);

    React.useEffect(() => {
        // get the spots from the db
        if (window.pywebview !== undefined) {
            getSpots();
        }
    }, [contextData.bandFilter, contextData.regionFilter,
    contextData.qrtFilter, contextData.locationFilter,
    contextData.huntedFilter, contextData.onlyNewFilter]
    );

    // return the correct PK id for our rows
    function getRowId(row: { spotId: any; }) {
        return row.spotId;
    }

    const handleRowClick: GridEventListener<'rowClick'> = (
        params,  // GridRowParams
        event,   // MuiEvent<React.MouseEvent<HTMLElement>>
        details, // GridCallbackDetails
    ) => {
        // load the spot's comments into the db
        let x = window.pywebview.api.insert_spot_comments(params.row.spotId);

        x.then(() => {
            // wait to get the rest of the data until after the spot comments 
            // are inserted
            getQsoData(params.row.spotId);
        });
    };

    function setFilterModel(e: GridFilterModel) {
        contextData.filter = e;
        setData(contextData);
    };

    function setSortModelAndSave(newModel: GridSortModel) {
        setSortModel(newModel);
        window.localStorage.setItem("SORT_MODEL", JSON.stringify(newModel));
    }

    function getClassName(params: GridRowClassNameParams<SpotRow>) {
        if (params.row.is_qrt)
            return 'spotviewer-row-qrt';
        else
            return 'spotviewer-row';
    };

    function CustomToolbar() {
        return (
            <GridToolbarContainer>
                <GridToolbarColumnsButton />
                <GridToolbarDensitySelector />
                <GridToolbarQuickFilter />
            </GridToolbarContainer>
        );
    }

    return (
        <div className='spots-container'>
            <DataGrid
                rows={spots}
                slots={{ toolbar: CustomToolbar }}
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
                onSortModelChange={(e) => setSortModelAndSave(e)}
                getRowClassName={getClassName}
            />
        </div>
    );
}
