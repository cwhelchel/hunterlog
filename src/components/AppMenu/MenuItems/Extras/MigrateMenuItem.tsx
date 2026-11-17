import * as React from 'react';
import { Button, Tooltip } from '@mui/material';
import MigrateModal from './MigrateModal';


export default function MigrateMenuItem() {
    const [modalOpen, setModalOpen] = React.useState(false);

    return (
        <>
            <Tooltip title="Peform migration from old Hunterlog data.">
                <Button onClick={() => { setModalOpen(true); }}>
                    Migrate
                </Button>
            </Tooltip>
            <MigrateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    )
}

