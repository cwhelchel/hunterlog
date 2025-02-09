import * as React from 'react';
import clsx from 'clsx';
import { styled, css, maxWidth } from '@mui/system';
import { Modal as BaseModal } from '@mui/base/Modal';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Stack from '@mui/material/Stack';

import { useAppContext } from '../AppContext';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowId } from '@mui/x-data-grid';
import { AlertRow } from '../../@types/AlertTypes';

const rows: AlertRow[] = [];

export default function AlertsMenu() {
    const [open, setOpen] = React.useState(false);
    const [alerts, setAlerts] = React.useState(rows);
    const [toDelete, setToDelete] = React.useState<number[]>([]);
    const { contextData, setData } = useAppContext();

    const columns: GridColDef<(typeof rows)[number]>[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'enabled',
            headerName: 'Enabled',
            type: 'boolean',
            width: 100,
            editable: true,
        },
        {
            field: 'new_only',
            headerName: 'New Only?',
            type: 'boolean',
            width: 100,
            editable: true,
        },
        {
            field: 'name',
            headerName: 'Alert Name',
            type: 'string',
            width: 150,
            editable: true,
        },
        {
            field: 'loc_search',
            headerName: 'Location',
            type: 'string',
            width: 110,
            editable: true,
        },
        {
            field: 'exclude_modes',
            headerName: 'Excluded Modes (comma separated)',
            type: 'string',
            width: 225,
            editable: true,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Delete',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id }) => [
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={handleDeleteClick(id)}
                    color="inherit" />,
            ],
        }
    ];

    const handleOpen = () => {
        setOpen(true);
        getAlerts();
    }
    const handleClose = () => setOpen(false);

    function getAlerts() {
        const p = window.pywebview.api.get_alerts()
        p.then((r: string) => {
            var x = JSON.parse(r);
            setAlerts(x);
        });
    }

    const handleSave = () => {
        if (window.pywebview !== undefined) {
            let deletes = [...toDelete];

            deletes.forEach(d => {
                console.log(`deleting alert id: ${d}`);
                window.pywebview.api.delete_alert(d);
            });

            let x = [...alerts];
            window.pywebview.api.set_alerts(JSON.stringify(x));
            handleClose();
        }
    };

    function handleAdd(): void {
        let x = [...alerts];
        let max_id = -1;
        if (x.length > 0) {
            const a = x.map(y => y.id);
            max_id = Math.max.apply(null, a);
        }
        x.push({
            id: max_id + 1,
            enabled: true, new_only: true,
            name: '', loc_search: '', exclude_modes: '',
            last_triggered: null, dismissed_until: null, dismissed_callsigns: ''
        });

        setAlerts(x);
    }


    function handleShowTest(): void {
        const json = {
            'TestAlert+-1': ['📢 Close alert with X. 🔸 Close all with Shift+Click', '📢 Snooze button disables whole filter for a little while.'],
            'AnotherAlert+-1': ['📢 New one in US-FL: N7AWX at  US-6293 🔸 SSB on 14284', '📢 New one in US-FL: KA4PJZ at  US-3622 🔸 SSB on 14265']
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

        let x = [...toDelete];
        let num = parseInt(getValue(id));
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
            <Button onClick={handleOpen} style={{
                color: "#bdbdbd",
                marginRight: '15px'
            }}>
                Alerts
            </Button>
            <Modal
                aria-labelledby="unstyled-modal-title"
                aria-describedby="unstyled-modal-description"
                open={open}
                onClose={handleClose}
                slots={{ backdrop: StyledBackdrop }}
            >
                <ModalContent sx={{ width: '70%' }}>
                    <h2 id="unstyled-modal-title" className="modal-title">
                        Alert Configuration
                    </h2>
                    <div style={{ maxWidth: '75%', fontSize: '0.8rem' }}>
                        <ul style={{ margin: '1px', paddingInlineStart: '20px' }}>
                            <li>The <b>Name</b> specified is used only when displaying the alert.</li>
                            <li>The <b>Location</b> field is a string like 'US-TX', it will match the beginning of a spots location ('US-'' would match all locations in the US).</li>
                            <li>If <b>New Only</b> is checked, only ATNO are alerted for a given location.</li>
                        </ul>
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
                </ModalContent>
            </Modal>
        </>
    );
}

const Backdrop = React.forwardRef<
    HTMLDivElement,
    { open?: boolean; className: string }
>((props, ref) => {
    const { open, className, ...other } = props;
    return (
        <div
            className={clsx({ 'base-Backdrop-open': open }, className)}
            ref={ref}
            {...other}
        />
    );
});

const blue = {
    200: '#99CCFF',
    300: '#66B2FF',
    400: '#3399FF',
    500: '#007FFF',
    600: '#0072E5',
    700: '#0066CC',
};

const grey = {
    50: '#F3F6F9',
    100: '#E5EAF2',
    200: '#DAE2ED',
    300: '#C7D0DD',
    400: '#B0B8C4',
    500: '#9DA8B7',
    600: '#6B7A90',
    700: '#434D5B',
    800: '#303740',
    900: '#1C2025',
};

const Modal = styled(BaseModal)`
  position: fixed;
  z-index: 1300;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledBackdrop = styled(Backdrop)`
  z-index: -1;
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 0.5);
  -webkit-tap-highlight-color: transparent;
`;

const ModalContent = styled('div')(
    ({ theme }) => css`
    /*font-family: 'IBM Plex Sans', sans-serif;*/
    font-weight: 500;
    text-align: start;
    align-items: stretch;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
    background-color: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border-radius: 8px;
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    box-shadow: 0 4px 12px
      ${theme.palette.mode === 'dark' ? 'rgb(0 0 0 / 0.5)' : 'rgb(0 0 0 / 0.2)'};
    padding: 24px;
    color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};

    & .modal-title {
      margin: 0;
      line-height: 1.5rem;
      margin-bottom: 8px;
    }

    & .modal-description {
      margin: 0;
      line-height: 1.5rem;
      font-weight: 400;
      color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
      margin-bottom: 4px;
    }

    & .modal-config-text {
        margin: 0;
        line-height: 1.1rem;
        font-weight: 300;
        font-size: smaller;
        color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
        margin-bottom: 2px;
      }
  `,
);

const TriggerButton = styled('button')(
    ({ theme }) => css`
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.5;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 150ms ease;
    cursor: pointer;
    background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

    &:hover {
      background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
      border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
    }

    &:active {
      background: ${theme.palette.mode === 'dark' ? grey[700] : grey[100]};
    }

    &:focus-visible {
      box-shadow: 0 0 0 4px ${theme.palette.mode === 'dark' ? blue[300] : blue[200]};
      outline: none;
    }
  `,
);
