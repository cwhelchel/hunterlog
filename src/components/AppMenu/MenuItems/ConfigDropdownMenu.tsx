import * as React from 'react';

import { Button, Divider, Menu, MenuItem } from '@mui/material';
import AlertsMenu from './Alerts/AlertsMenu';
import CallNotesMenu from './CallNotesMenu';
import { ConfigContextProvider } from '../../Config/ConfigContextProvider';
import ConfigModal from '../../Config/ConfigModal';

export default function ConfigDropdownMenu() {

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
                Settings
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
                    <ConfigContextProvider>
                        <ConfigModal />
                    </ConfigContextProvider>
                </MenuItem>
                <Divider />
                <MenuItem >
                    <AlertsMenu />
                </MenuItem>
                <MenuItem >
                    <CallNotesMenu />
                </MenuItem>
            </Menu>
        </div>
    );
}