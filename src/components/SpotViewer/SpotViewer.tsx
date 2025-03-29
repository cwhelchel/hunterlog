import * as React from 'react';
import Button from '@mui/material/Button';
import { Backdrop, Badge, CircularProgress, styled } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams, GridValueFormatterParams, GridFilterModel, GridSortModel, GridSortDirection, GridCellParams, GridRowClassNameParams, GridToolbar, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarColumnsButton, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { GridEventListener } from '@mui/x-data-grid';
import LandscapeIcon from '@mui/icons-material/Landscape';
import ParkIcon from '@mui/icons-material/Park';

import { useAppContext } from '../AppContext';

import { Qso } from '../../@types/QsoTypes';
import CallToolTip from './CallTooltip';
import { SpotRow } from '../../@types/Spots';

import './SpotViewer.scss'
import HuntedCheckbox from './HuntedCheckbox';
import FreqButton from './FreqButton';
import SpotCommentsButton from './SpotComments';
import { Park } from '../../@types/Parks';
import SpotTimeCell from './SpotTime';
import { SpotComments } from '../../@types/SpotComments';
import { getSummitInfo } from '../../pota';
import { Summit } from '../../@types/Summit';
import { checkApiResponse } from '../../util';

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
                    <LandscapeIcon color='secondary'/>
                )}
                {x.row.spot_source == 'POTA' && (
                    <ParkIcon color='primary' />
                )}
                <span id="sig">{x.row.spot_source}</span>
            </>
        }
    }
];


const rows: SpotRow[] = [];


var currentSortFilter = { field: 'spotTime', sort: 'desc' as GridSortDirection };


export default function SpotViewer() {
    const [spots, setSpots] = React.useState(rows)
    const [sortModel, setSortModel] = React.useState<GridSortModel>([currentSortFilter]);
    const [backdropOpen, setBackdropOpen] = React.useState(false);
    const { contextData, setData } = useAppContext();

    function getSpots() {
        // get the spots from the db
        // NOTE: this gets called from the python backend on a timer and when
        // a qso is logged
        setBackdropOpen(true);
        const spots = window.pywebview.api.get_spots()
        spots.then((r: string) => {
            var x = JSON.parse(r);
            setSpots(x);
            setBackdropOpen(false);
        });
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
            let json = checkApiResponse(x, contextData, setData);
            if (json.success) {
                contextData.regions = json.seen_regions;
                setData(contextData);
            }
        });

        spots.map((spot) => {
            if (spot.spot_source == 'POTA') {
                let location = spot.locationDesc.substring(0, 5);
                if (!contextData.locations.includes(location))
                    contextData.locations.push(location);
            }
        });
        contextData.locations.sort();
    }, [spots]);

    async function getOtherOps(spotId: number): Promise<string> {
        const r = await window.pywebview.api.get_spot_comments(spotId);

        let t = JSON.parse(r) as SpotComments[];
        let filtered = t.filter(function (el) {
            return el.comments.includes('{With:');
        });

        if (filtered.length > 0) {
            const str = filtered[0].comments;
            const re = new RegExp("{With:([^}]*)}");
            const m = str.match(re);

            if (m) {
                return m[1];
            }
        } else {
            return '';
        }

        return '';

    }

    function getQsoData(id: number) {
        // use the spot to generate qso data (unsaved)
        const q = window.pywebview.api.get_qso_from_spot(id);

        q.then((r: any) => {
            if (r['success'] == false)
                return;
            var x = JSON.parse(r) as Qso;
            //console.log("got qso:" + r);

            if (x.sig == 'POTA') {
                window.pywebview.api.get_park(x.sig_info)
                    .then((r: string) => {
                        let p = JSON.parse(r) as Park;
                        const newCtxData = { ...contextData };
                        newCtxData.spotId = id;
                        newCtxData.qso = x;
                        newCtxData.park = p;
                        newCtxData.summit = null;
                        getOtherOps(id).then((oo) => {
                            newCtxData.otherOperators = oo;
                            setData(newCtxData);
                        });
                    });
            } else if (x.sig == 'SOTA') {

                window.pywebview.api.get_summit(x.sig_info)
                    .then((r: string) => {
                        let summit = JSON.parse(r) as Park;
                        const newCtxData = { ...contextData };
                        newCtxData.spotId = id;
                        newCtxData.qso = x;
                        //newCtxData.summit = summit;
                        newCtxData.park = summit;
                        setData(newCtxData);
                    });

                // getSummitInfo(x.sig_info).then((summit: Summit) => {
                //     console.log("got summit: " + summit.summitCode);
                //     const newCtxData = { ...contextData };
                //     newCtxData.spotId = id;
                //     newCtxData.qso = x;
                //     newCtxData.summit = summit;
                //     newCtxData.park = null;
                //     setData(newCtxData);
                // });
            } else if (x.sig == 'WWFF') {
                window.pywebview.api.get_wwff_info(x.sig_info)
                    .then((r: string) => {
                        let summit = JSON.parse(r) as Park;
                        const newCtxData = { ...contextData };
                        newCtxData.spotId = id;
                        newCtxData.qso = x;
                        //newCtxData.summit = summit;
                        newCtxData.park = summit;
                        setData(newCtxData);
                    });

                // getSummitInfo(x.sig_info).then((summit: Summit) => {
                //     console.log("got summit: " + summit.summitCode);
                //     const newCtxData = { ...contextData };
                //     newCtxData.spotId = id;
                //     newCtxData.qso = x;
                //     newCtxData.summit = summit;
                //     newCtxData.park = null;
                //     setData(newCtxData);
                // });
            }

        });
    }

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
        }

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
        let highlightNewStr = window.localStorage.getItem("HIGHLIGHT_NEW_REF") || '1';
        let highlightNew = parseInt(highlightNewStr);

        if (params.row.is_qrt)
            return 'spotviewer-row-qrt';
        else if (params.row.park_hunts === 0 && highlightNew)
            return 'spotviewer-row-new';
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
                    }
                }}
                slots={{ toolbar: CustomToolbar }}
                columns={columns}
                getRowId={getRowId}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 25 },
                    },
                }}
                pageSizeOptions={[5, 10, 25, 100]}
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
