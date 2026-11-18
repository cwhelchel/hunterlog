import * as React from 'react';
import { Divider, IconButton, Menu, MenuItem } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MigrateMenuItem from './MigrateMenuItem';
import OpenUserDirectoryMenuItem from './OpenUserDirectoryMenuItem';
import OpenLogFileMenuItem from './OpenLogFileMenuItem';
import DebugToolsMenuItem from './DebugToolsMenuItem';


export default function ExtrasDropdownMenu() {
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
        <>
            <IconButton
                id="extras-menu-button"
                aria-controls={openMenu ? 'config-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openMenu ? 'true' : undefined}
                onClick={handleClick}
                style={{
                    color: "#bdbdbd"
                }}
            >
                <KeyboardArrowRightIcon
                    sx={{
                        transform: openMenu ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease-in-out',
                    }}
                />
            </IconButton>
            <Menu
                id="config-menu"
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleClose}
            >
                <MenuItem onKeyDown={avoidBubblingUp} >
                    <MigrateMenuItem />
                </MenuItem>
                <Divider />
                <MenuItem onKeyDown={avoidBubblingUp} >
                    <OpenUserDirectoryMenuItem />
                </MenuItem>
                <MenuItem onKeyDown={avoidBubblingUp} >
                    <OpenLogFileMenuItem />
                </MenuItem>
                <Divider />
                <MenuItem onKeyDown={avoidBubblingUp}>
                    <DebugToolsMenuItem />
                </MenuItem>
            </Menu>
        </>
    );
}
