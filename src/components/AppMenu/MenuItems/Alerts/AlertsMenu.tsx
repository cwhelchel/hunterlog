import * as React from 'react';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Stack from '@mui/material/Stack';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowId } from '@mui/x-data-grid';

import './AlertsMenu.scss';
import { AlertRow } from '../../../../@types/AlertTypes';
import { checkApiResponse } from '../../../../tsx/util';
import { useAppContext } from '../../../AppContext';
import HlModal2 from '../../../Common/HlModal';

const rows: AlertRow[] = [];

export default function AlertsMenu() {
    const [open, setOpen] = React.useState(false);
    const [alerts, setAlerts] = React.useState(rows);
    const [toDelete, setToDelete] = React.useState<number[]>([]);
    const [statusOptions, setStatusOptions] = React.useState([]);
    const { contextData, setData } = useAppContext();

    const columns: GridColDef<(typeof rows)[number]>[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'enabled',
            headerName: 'Enabled',
            headerClassName: 'hl-alert-col-hdr',
            type: 'boolean',
            width: 100,
            editable: true,
        },
        {
            field: 'new_only',
            headerName: 'New Only?',
            headerClassName: 'hl-alert-col-hdr',
            type: 'boolean',
            width: 100,
            editable: true,
        },
        {
            field: 'name',
            headerName: 'Alert Name',
            headerClassName: 'hl-alert-col-hdr',
            type: 'string',
            width: 150,
            editable: true,
        },
        {
            field: 'loc_search',
            headerName: 'Location',
            headerClassName: 'hl-alert-col-hdr',
            type: 'string',
            width: 110,
            editable: true,
        },
        {
            field: 'call_search',
            headerName: 'Calsign',
            headerClassName: 'hl-alert-col-hdr',
            type: 'string',
            width: 110,
            editable: true,
        },
        {
            field: 'exclude_modes',
            headerName: 'Excluded Modes (comma separated)',
            headerClassName: 'hl-alert-col-hdr',
            type: 'string',
            width: 225,
            editable: true,
        },
        {
            field: 'excl_band_above',
            headerName: 'Exclude Bands Above',
            headerClassName: 'hl-alert-col-hdr',
            type: 'singleSelect',
            width: 160,
            editable: true,
            valueOptions: statusOptions
        },
        {
            field: 'excl_band_below',
            headerName: 'Exclude Bands Below',
            headerClassName: 'hl-alert-col-hdr',
            type: 'singleSelect',
            width: 160,
            editable: true,
            valueOptions: statusOptions
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Delete',
            headerClassName: 'hl-alert-col-hdr',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id }) => [
                <GridActionsCellItem
                    key="delete-action"
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={handleDeleteClick(id)}
                    color="inherit" />,
            ],
        }
    ];


    const getBands = () => {
        const y = window.pywebview.api.get_band_names();

        y.then((json: string) => {
            console.log(json);
            const obj = checkApiResponse(json, contextData, setData);
            if (!obj.success)
                return;
            console.log(obj);
            const x = obj.band_names;
            console.log('bandnames type: ' + typeof x);
            console.log('bandnames: ' + x);
            // const wtf = JSON.parse(x);
            setStatusOptions(x);
            //columns.filter(column => column.field === "excl_band_above").valueOptions = x;
        });
    };

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null) {
            getBands();
        }
        else {
            window.addEventListener('pywebviewready', getBands);
        }
    }, []);



    const handleOpen = () => {
        setOpen(true);
        getAlerts();
    }
    const handleClose = () => setOpen(false);

    function getAlerts() {
        const p = window.pywebview.api.get_alerts()
        p.then((r: string) => {
            const x = JSON.parse(r);
            setAlerts(x);
        });
    }

    const handleSave = () => {
        if (window.pywebview !== undefined) {
            const deletes = [...toDelete];

            deletes.forEach(d => {
                console.log(`deleting alert id: ${d}`);
                window.pywebview.api.delete_alert(d);
            });

            const x = [...alerts];
            window.pywebview.api.set_alerts(JSON.stringify(x));
            handleClose();
        }
    };

    function handleAdd(): void {
        const x = [...alerts];
        let max_id = -1;
        if (x.length > 0) {
            const a = x.map(y => y.id);
            max_id = Math.max.apply(null, a);
        }
        x.push({
            id: max_id + 1,
            enabled: true, new_only: true,
            name: '', loc_search: '', exclude_modes: '',
            last_triggered: null,
            dismissed_until: null,
            dismissed_callsigns: '',
            call_search: null,
            excl_band_above: null,
            excl_band_below: null
        });

        setAlerts(x);
    }


    function handleShowTest(): void {

        const example = {
            'location': '',
            'activator': 'Close alert with X',
            'reference': 'K-TEST',
            'freq': '14000',
            'mode': 'CW',
            'spotId': 0
        }
        const example2 = {
            'location': '',
            'activator': 'Close all with Shift+Click X',
            'reference': 'K-TEST',
            'freq': '14000',
            'mode': 'CW',
            'spotId': 0
        }
        const example3 = {
            'location': '',
            'activator': 'Snooze button = 10 mute',
            'reference': 'K-TEST',
            'freq': '14000',
            'mode': 'CW',
            'spotId': 0
        }
        const example4 = {
            'location': 'US-FL',
            'activator': 'W1AW',
            'reference': 'US-6293',
            'freq': '14284',
            'mode': 'SSB',
            'spotId': 0
        }
        const json = {
            'TestAlert+-1': [example, example2, example3],
            'AnotherAlert+-1': [example4]
        }
        window.pywebview.state.showSpotAlert(JSON.stringify(json));
    }

    const handleDeleteClick = (id: GridRowId) => () => {
        function getValue(value: string | number): string {
            if (typeof value === "string") {
                return value; // value is treated as string here
            } else {
                return value.toString(); // value is treated as number here
            }
        }

        const x = [...toDelete];
        const num = parseInt(getValue(id));
        x.push(num);
        setToDelete(x);
        setAlerts(alerts.filter((row) => row.id !== id));
    };

    const processRowUpdate = (newRow: AlertRow) => {
        const updatedRow = { ...newRow };
        setAlerts(alerts.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    return (
        <>
            <Button onClick={handleOpen} >
                Alerts
            </Button>
            <HlModal2
                isOpen={open}
                onClose={handleClose}
                title='Alert Configuration'
                id='alerts'
                contentStyle={{ width: '80%' }}>

                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div style={{ margin: '2px', maxWidth: '75%', fontSize: '0.8rem' }}>
                        <ul style={{ paddingInlineStart: '20px' }}>
                            <li>The <b>Name</b> specified is used only when displaying the alert.</li>
                            <li>The <b>Location</b> field is a string like &apos;US-TX&apos;, it will match the beginning of a spots location (&apos;US-&apos;&apos; would match all locations in the US).</li>
                            <li>If <b>New Only</b> is checked, only ATNO are alerted for a given location.</li>
                            <li>Callsign should be the base callsign without modifiers like VE3/ or /P.</li>
                        </ul>
                    </div>
                    <div style={{ margin: '2px', maxWidth: '75%', fontSize: '0.8rem' }}>
                        The &apos;Exclude Band&apos; filters work like this:
                        <ul style={{ paddingInlineStart: '20px' }}>
                            <li>Exclude Bands Above will exclude spots where <code>freq &gt;= band lower limit</code></li>
                            <li>Exclude Bands Below will exclude spots where <code>freq &lt;= band upper limit</code></li>
                            <li>If you enter <i>20m</i> for &apos;Exclude Bands Above&apos;, any alerts on 20m <em>AND</em> above will not be shown for that filter.</li>
                        </ul>
                    </div>
                </div>
                <Stack direction={'row'} spacing={1}>
                    <Button sx={{ maxWidth: '15%' }} onClick={handleAdd}>Add Alert Filter</Button>
                    <Button sx={{ maxWidth: '15%' }} onClick={handleShowTest}>Show Test Alert</Button>
                </Stack>
                <DataGrid
                    rows={alerts}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 5,
                            },
                        },
                    }}
                    pageSizeOptions={[5]}
                    disableRowSelectionOnClick
                    processRowUpdate={processRowUpdate}
                />

                <Stack direction={'row'} spacing={1} sx={{ 'align-items': 'stretch', 'justify-content': 'space-evenly' }} useFlexGap>
                    <Button fullWidth variant='contained' onClick={handleSave}>Save</Button>
                    <Button fullWidth variant='contained' onClick={handleClose}>Cancel</Button>
                </Stack>
            </HlModal2>
        </>
    );
}
