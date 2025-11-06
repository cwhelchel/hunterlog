/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import { Backdrop, Badge, CircularProgress } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams, GridFilterModel, GridSortModel, GridSortDirection, GridCellParams, GridRowClassNameParams, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarColumnsButton, GridToolbarQuickFilter, GridPaginationModel } from '@mui/x-data-grid';
import { GridEventListener } from '@mui/x-data-grid';
import LandscapeIcon from '@mui/icons-material/Landscape';
import ParkIcon from '@mui/icons-material/Park';
import Brightness3Icon from '@mui/icons-material/Brightness3';

import { useAppContext } from '../AppContext';

import CallToolTip from './CallTooltip';
import { SpotRow } from '../../@types/Spots';

import './SpotViewer.scss'
import HuntedCheckbox from './HuntedCheckbox';
import FreqButton from './FreqButton';
import SpotCommentsButton from './SpotComments';
import SpotTimeCell from './SpotTime';
import { checkApiResponse } from '../../util';
import HandleSpotRowClick from './HandleSpotRowClick';

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
                <FreqButton activator={x.row.activator} frequency={x.row.frequency} mode={x.row.mode} />
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
        field: 'reference', headerName: 'Reference', width: 400,
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
                <SpotCommentsButton spotId={x.row.spotId} spotter={x.row.spotter} comments={x.row.comments} />
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
    },
    {
        field: 'sig', headerName: 'SIG', width: 100,
        renderCell: (x) => {
            return <>
                {x.row.spot_source == 'SOTA' && (
                    <LandscapeIcon color='secondary' />
                )}
                {x.row.spot_source == 'POTA' && (
                    <ParkIcon color='primary' />
                )}
                {x.row.spot_source == 'WWFF' && (
                    <Brightness3Icon color='success' />
                )}

                <span id="sig">{x.row.spot_source}</span>
            </>
        }
    }
];


const rows: SpotRow[] = [];


const currentSortFilter = { field: 'spotTime', sort: 'desc' as GridSortDirection };
const currentPageFilter = { pageSize: 25, page: 0, };

export default function SpotViewer() {
    const [spots, setSpots] = React.useState(rows)
    const [sortModel, setSortModel] = React.useState<GridSortModel>([currentSortFilter]);
    const [pageModel, setPaginationModel] = React.useState<GridPaginationModel>(currentPageFilter);
    const [backdropOpen, setBackdropOpen] = React.useState(false);
    const { contextData, setData } = useAppContext();

    function getSpots() {
        // get the spots from the db
        // NOTE: this gets called from the python backend on a timer and when
        // a qso is logged
        setBackdropOpen(true);
        const spots = window.pywebview.api.get_spots()
        spots.then((r: string) => {
            const x = JSON.parse(r);
            setSpots(x);
            setBackdropOpen(false);
        });
    }


    function setWorking() {
        // get the spots from the python backend
        // show the spinner to keep user from interacting with spots that wont
        // update.
        setBackdropOpen(true);
    }

    // when [spots] are set, update regions
    React.useEffect(() => {
        // the backend will parse out the regions for pota and sota (US, CA, W7)
        // and we will just set the available regions directly in the context.
        // however, we still parse the current spots and pull out the
        // location specifier (US-GA, CA-ON) for POTA spots only

        if (contextData.locationFilter === "")
            contextData.locations = [];

        if (window.pywebview === undefined) {
            return;
        }

        const p = window.pywebview.api.get_seen_regions();
        p.then((x: string) => {
            const json = checkApiResponse(x, contextData, setData);
            if (json.success) {
                contextData.regions = json.seen_regions;
                setData(contextData);
            }
        });

        // console.log(spots);
        spots.map((spot) => {
            // random white screen. one time there was a null dereference here
            // turning the hunterlog screen white
            if (spot === null)
                return;
            if (spot.spot_source == 'POTA') {
                const location = spot.locationDesc.substring(0, 5);
                if (!contextData.locations.includes(location))
                    contextData.locations.push(location);
            }
        });
        contextData.locations.sort();
    }, [spots]);

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            initSpots();
        else
            window.addEventListener('pywebviewready', initSpots);

        function initSpots() {
            if (!window.pywebview.state) {
                window.pywebview.state = {}
            }

            // first run thru do this:
            getSpots();

            window.pywebview.state.getSpots = getSpots;
            window.pywebview.state.setWorking = setWorking;
        }

        try {
            const j = window.localStorage.getItem("SORT_MODEL") || '';
            const sm = JSON.parse(j) as GridSortModel;
            setSortModel(sm);
        } catch {
            console.log("ignored error loading sortmodel. using default");
        }

        try {
            const j = window.localStorage.getItem("PAGE_MODEL") || '';
            const pm = JSON.parse(j) as GridPaginationModel;
            console.log(`pagemodel ${j} ${pm}`)
            setPaginationModel(pm);
        } catch {
            console.log("ignored error loading pagination model. using default");
        }
    }, []);

    React.useEffect(() => {
        // get the spots from the db
        if (window.pywebview !== undefined) {
            getSpots();
        }
    },
        [contextData.bandFilter, contextData.regionFilter,
        contextData.qrtFilter, contextData.locationFilter,
        contextData.huntedFilter, contextData.onlyNewFilter,
        contextData.continentFilter]
    );

    // return the correct PK id for our rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getRowId(row: { spotId: any; }) {
        return row.spotId;
    }

    const handleRowClick: GridEventListener<'rowClick'> = (
        params,  // GridRowParams
        event,   // MuiEvent<React.MouseEvent<HTMLElement>>
        details, // GridCallbackDetails
    ) => {
        // setting spotId in ctx is connected to HandleSpotRowClick
        const newCtxData = { ...contextData };
        // console.log('setting spot to ' + params.row.spotId);
        newCtxData.spotId = params.row.spotId;
        setData(newCtxData);
    };

    function setFilterModel(e: GridFilterModel) {
        contextData.filter = e;
        setData(contextData);
    };

    function setSortModelAndSave(newModel: GridSortModel) {
        setSortModel(newModel);
        window.localStorage.setItem("SORT_MODEL", JSON.stringify(newModel));
    }

    function setPaginationModelAndSave(newModel: GridPaginationModel) {
        setPaginationModel(newModel);
        window.localStorage.setItem("PAGE_MODEL", JSON.stringify(newModel));
    }

    function getClassName(params: GridRowClassNameParams<SpotRow>) {
        const highlightNewStr = window.localStorage.getItem("HIGHLIGHT_NEW_REF") || '1';
        const highlightNew = parseInt(highlightNewStr);

        if (params.row.is_qrt)
            return 'spotviewer-row-qrt';
        else if (params.row.park_hunts === 0 && highlightNew)
            return 'spotviewer-row-new';
        else
            return 'spotviewer-row';
    };

    // memoize this so it doesn't re-render on all the key presses
    const CustomToolbar = React.useCallback(() => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarDensitySelector />
            <GridToolbarQuickFilter />
        </GridToolbarContainer>
    ), []);

    return (
        <div className='spots-container'>
            <Backdrop
                sx={{ color: '#fff', zIndex: 1500 }}
                open={backdropOpen}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            <DataGrid
                rows={spots}
                sx={{
                    "& .Mui-selected.spotviewer-row-new": {
                        backgroundColor: "rgba(75, 30, 110, 0.75) !important"
                    },
                    '& .Mui-selected': {
                        color: 'alert.main',
                    },
                }}
                slots={{ toolbar: CustomToolbar }}
                columns={columns}
                getRowId={getRowId}
                initialState={{
                    pagination: {
                        paginationModel: pageModel,
                    },
                }}
                pageSizeOptions={[5, 10, 25, 100]}
                filterModel={contextData.filter}
                onFilterModelChange={(v) => setFilterModel(v)}
                onRowClick={handleRowClick}
                sortModel={sortModel}
                paginationModel={pageModel}
                onSortModelChange={(e) => setSortModelAndSave(e)}
                onPaginationModelChange={(e) => setPaginationModelAndSave(e)}
                getRowClassName={getClassName}
            />
            <HandleSpotRowClick />
        </div>
    );
}
