import * as React from 'react';

import { Button, Divider, Menu, MenuItem } from '@mui/material';
import AlertsMenu from './SettingsMenu/Alerts/AlertsMenu';
import CallNotesMenu from './SettingsMenu/CallNotesMenu';
import { ConfigContextProvider } from './SettingsMenu/Config/ConfigContextProvider';
import ConfigModal from './SettingsMenu/Config/ConfigModal';

export default function ConfigDropdownMenu() {

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // when modals popup from the menuitems, the open menu tries to handle the
    // any key presses where the key pressed is the first letter of the menu item.
    // so A for alerts or C for configuration / callsign notes. In order to type
    // those letters in the popup modals we have to stop the event from propagating
    const avoidBubblingUp = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    return (
        <div>
            <Button
                id="config-menu-button"
                aria-controls={openMenu ? 'config-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openMenu ? 'true' : undefined}
                onClick={handleClick}
                style={{
                    color: "#bdbdbd"
                }}
            >
                Settings
            </Button>
            <Menu
                id="config-menu"
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onKeyDown={avoidBubblingUp} >
                    <ConfigContextProvider>
                        <ConfigModal />
                    </ConfigContextProvider>
                </MenuItem>
                <Divider />
                <MenuItem onKeyDown={avoidBubblingUp} >
                    <AlertsMenu />
                </MenuItem>
                <MenuItem onKeyDown={avoidBubblingUp} >
                    <CallNotesMenu />
                </MenuItem>
            </Menu>
        </div>
    );
}