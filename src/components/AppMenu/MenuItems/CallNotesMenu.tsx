import * as React from 'react';
import { Button, Stack } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowId } from '@mui/x-data-grid';
import { CallsignNoteRow } from '../../../@types/CallsignNoteTypes';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { checkApiResponse } from '../../Utilities/util';
import { useAppContext } from '../../AppContext';
import HlModal2 from '../../Common/HlModal';


const rows: CallsignNoteRow[] = [];

export default function CallNotesMenu() {
    const { contextData, setData } = useAppContext()
    const [open, setOpen] = React.useState(false);
    const [callNotes, setCallNotes] = React.useState(rows);
    const [toDelete, setToDelete] = React.useState<number[]>([]);

    const handleOpen = () => {
        setOpen(true);
        getCallsignNotes();
    }

    const handleClose = () => setOpen(false);

    function getCallsignNotes() {
        const p = window.pywebview.api.callsign_notes.get_all();
        p.then((r: string) => {
            console.log(r);
            const result = checkApiResponse(r, contextData, setData);

            if (result.success) {
                const x = JSON.parse(result.call_notes);
                setCallNotes(x);
            }
        });
    }

    const columns: GridColDef<(typeof rows)[number]>[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'enabled',
            headerName: 'Enabled',
            headerClassName: 'hl-cnotes-col-hdr',
            type: 'boolean',
            width: 100,
            editable: true,
        },
        {
            field: 'name',
            headerName: 'Name',
            headerClassName: 'hl-cnotes-col-hdr',
            type: 'string',
            width: 100,
            editable: true,
        },
        {
            field: 'path',
            headerName: 'Path',
            headerClassName: 'hl-cnotes-col-hdr',
            type: 'string',
            width: 400,
            editable: true,
        },
        {
            field: 'last_download',
            headerName: 'Last Update',
            headerClassName: 'hl-cnotes-col-hdr',
            type: 'string',
            width: 200,
            editable: false,
            valueFormatter: (params) => {
                // Ensure the value is a valid Date object before formatting
                if (!params.value) {
                    return '';
                }
                const date = new Date(params.value);
                return date.toLocaleString();
            },
        },
        {
            field: 'sort',
            headerName: 'sort',
            headerClassName: 'hl-cnotes-col-hdr',
            type: 'number',
            width: 50,
            editable: false,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: '',
            headerClassName: 'hl-cnotes-col-hdr',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id }) => [
                <GridActionsCellItem
                    key="up-action"
                    icon={<ArrowUpwardIcon />}
                    label="Up"
                    onClick={() => handleMoveRow(id, 'up')}
                    color="inherit" />,
                <GridActionsCellItem
                    key="delete-action"
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={handleDeleteClick(id)}
                    color="inherit" />,
                <GridActionsCellItem
                    key="down-action"
                    icon={<ArrowDownwardIcon />}
                    label="Down"
                    onClick={() => handleMoveRow(id, 'down')}
                    color="inherit" />,
            ],
        }
    ];

    function getId(value: string | number): string {
        if (typeof value === "string") {
            return value; // value is treated as string here
        } else {
            return value.toString(); // value is treated as number here
        }
    }



    const handleMoveRow = (gridId: GridRowId, direction: string) => {
        const id = parseInt(getId(gridId));
        const index = callNotes.findIndex((row) => row.id === id);
        console.log(direction, id, index);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= callNotes.length)
            return;

        console.log('old order', callNotes);

        const newRows = [...callNotes];
        const [removed] = newRows.splice(index, 1);
        newRows.splice(newIndex, 0, removed);

        console.log('new order', newRows);

        // fix the order to what's on screen so it gets saved.
        for (let i = 0; i < newRows.length; i++) {
            newRows[i].order = i;
        }

        // The DataGrid will re-render with the new order
        setCallNotes(newRows);
    };

    const handleDeleteClick = (id: GridRowId) => () => {
        const x = [...toDelete];
        const num = parseInt(getId(id));
        x.push(num);
        setToDelete(x);
        setCallNotes(callNotes.filter((row) => row.id !== id));
    };

    const processRowUpdate = (newRow: CallsignNoteRow) => {
        const updatedRow = { ...newRow };
        setCallNotes(callNotes.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    function handleAdd(): void {
        const x = [...callNotes];

        let max_id = -1;
        if (x.length > 0) {
            const a = x.map(y => y.id);
            max_id = Math.max.apply(null, a);
        }

        x.push({
            id: max_id + 1,
            enabled: true,
            name: '',
            path: '',
            last_download: null,
            order: x.length + 1
        });

        setCallNotes(x);
    }

    const handleSave = async () => {
        if (window.pywebview !== undefined) {
            const deletes = [...toDelete];

            deletes.forEach(async d => {
                console.log(`deleting alert id: ${d}`);
                await window.pywebview.api.callsign_notes.delete_note(d);
            });

            const x = [...callNotes];
            const res = await window.pywebview.api.callsign_notes.set_notes(JSON.stringify(x));

            const result = checkApiResponse(res, contextData, setData);
            if (result.success)
                handleClose();
        }
    };


    return (
        <>
            <Button onClick={handleOpen} >
                Callsign Notes
            </Button>
            <HlModal2
                id='callnotes'
                title='Callsign Notes'
                isOpen={open}
                onClose={handleClose}
                contentStyle={{ width: '60%' }}
            >
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div style={{ margin: '2px', width: '100%', fontSize: '0.8rem' }}>
                        <p>
                            Here you can add callsign notes to show extra information about a given
                            callsign that you input. It appears near the Activator Info panel by POTA avatar image.
                            <ul>
                                <li><code style={{ color: 'green' }}>Name</code> must be unique or downloaded files will be overwritten</li>
                                <li><code style={{ color: 'green' }}>Path</code> can be a filename <em>myclub.txt</em> or a web URL to a txt file <em>https://krinkl3.net/myclub.txt</em>. Files on web are downloaded every 5 days</li>
                                <li>The order the rows appear is the order they will be shown in the Activator Info panel. Use up and down arrows to adjust.</li>
                            </ul>
                        </p>
                        <p>
                            You can create your own text files using the <a href="https://polo.ham2k.com/docs/polo-features/callsign-notes/" target="_blank" rel="noreferrer">PoLo format</a> with a stripped-down Markdown syntax. Place
                            them in <code>\data\notes\</code> directory in the Hunterlog folder.
                        </p>
                    </div>
                </div>
                <DataGrid
                    rows={callNotes}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 10,
                            },
                        },
                        sorting: {
                            sortModel: [{ field: 'sort', sort: 'asc' }],
                        },
                        columns: {
                            columnVisibilityModel: {
                                // Hide columns
                                id: false,
                                sort: false,
                            },
                        }
                    }}
                    pageSizeOptions={[10]}
                    disableRowSelectionOnClick
                    processRowUpdate={processRowUpdate}
                />

                <Stack direction={'row'} spacing={1} sx={{ 'align-items': 'stretch', 'justify-content': 'space-evenly' }} useFlexGap>
                    <Button fullWidth variant='contained' onClick={handleAdd}>Add New</Button>
                    <Button fullWidth variant='contained' onClick={handleSave}>Save</Button>
                    <Button fullWidth variant='contained' onClick={handleClose}>Cancel</Button>
                </Stack>
            </HlModal2>
        </>
    );
}
