
import './CondxArea.scss'

import React, { SyntheticEvent, useEffect, useState } from "react";

import { useAppContext } from '../../AppContext';
import { Box, Popover, Tooltip, Typography } from '@mui/material';
import { showErrorToast } from '../../Utilities/util';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import { useMessageQueue } from '../../MessageContext';

// import { Button, IconButton, MobileStepper } from '@mui/material';
// import { checkApiResponse2 } from '../Utilities/util';

export default function CondxArea() {

    const DEFAULT_URL = 'https://www.hamqsl.com/solar101pic.php';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contextData, setData } = useAppContext();

    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const [srcImg, setSrcImg] = React.useState(DEFAULT_URL);
    const { addMessage } = useMessageQueue();

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    let open = Boolean(anchorEl);

    useEffect(() => {
        const val = window.localStorage.getItem('BAND_CONDX_HAMQSL_URL') || '';
        // console.log('CondxArea', val);

        if (val) {
            if (isValidUrl(val)) {
                setSrcImg(val);
            } else {
                showErrorToast("Invalid hamqsl.com URL", addMessage);
                setSrcImg(DEFAULT_URL);
            }
        } else {
            setSrcImg(DEFAULT_URL);
        }
    }, []);

    function isValidUrl(val: string) {
        let url: URL;

        try {
            url = new URL(val);
        } catch (_) {
            return false;
        }

        console.log('url', url);

        if (url.host !== 'www.hamqsl.com')
            return false;

        return url.protocol === "http:" || url.protocol === "https:";
    }

    return (
        <div className="condx-area"
            onMouseEnter={handlePopoverOpen}
            onMouseLeave={handlePopoverClose}>
            <Tooltip title="Band Condx">
                <PodcastsIcon color={'primary'} />
            </Tooltip>
            <Popover
                id="condx-mouse-over-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <div>
                    <a href="https://www.hamqsl.com/solar.html" title="Click to add Solar-Terrestrial Data to your website!">
                        <img
                            src={srcImg}
                            alt='hamqsl propagation data' />
                    </a>
                </div>
            </Popover>
        </div>
    );
}