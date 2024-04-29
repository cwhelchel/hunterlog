import * as React from 'react';

import { useAppContext } from '../AppContext';
import { UpdateStats } from '../Stats/UpdateStats';
import { ImportAdif } from '../Stats/ImportAdif';
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import { LocationStatsButton } from '../Stats/LocationStats';

export default function StatusMenu() {

    const [isWorking, setIsWorking] = React.useState(false);
    const { contextData, setData } = useAppContext();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };


    return (
        <div>
            <Button
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                style={{
                    color: "#bdbdbd"
                }}
            >
                Stats
                {isWorking && (
                    <div style={{ 'display': 'flex' }}>
                        <CircularProgress />
                    </div>
                )}
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem >
                    <UpdateStats setIsWorking={setIsWorking} />
                </MenuItem>
                <MenuItem >
                    <ImportAdif setIsWorking={setIsWorking} />
                </MenuItem>
                <MenuItem >
                    <LocationStatsButton setIsWorking={setIsWorking} />
                </MenuItem>
            </Menu>
        </div>
    );
}