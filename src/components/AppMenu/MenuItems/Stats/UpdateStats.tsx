import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import ParkStatsModal from './ParkStatsModal';

declare interface IUpdateStatProps {
    setIsWorking: (val: boolean) => void,
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const UpdateStats = (props: IUpdateStatProps) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <Tooltip title="Update reference hunt numbers from a program's exported data">
                <Button onClick={handleClick}>
                    Hunt Stats
                </Button>
            </Tooltip>
            <ParkStatsModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false) }} >
            </ParkStatsModal>
        </>
    );
};
