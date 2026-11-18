import * as React from 'react';
import { Button } from '@mui/material';
import DebugToolsModal from './DebugToolsModal';


export default function DebugToolsMenuItem() {
    const [modalOpen, setModalOpen] = React.useState(false);

    return (
        <>
            <Button onClick={() => { setModalOpen(true); }}>
                Debug Tools
            </Button>
            <DebugToolsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    )
}
