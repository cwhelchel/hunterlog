
// meow

import './RightArea.scss';

import React from "react";

import { useAppContext } from '../AppContext';
import { Box } from '@mui/material';
import CondxArea from './CondxArea/CondxArea';
import WsjtxArea from './WsjtxArea/WsjtxArea';
import CatArea from './CatArea/CatArea';
import { checkApiResponse2 } from '../Utilities/util';

const LIGHT_COLOR = '#53BD75';
const DARK_COLOR = '#0b262e';

export default function RightArea() {
    const currentVal = window.localStorage.getItem('SHOW_BAND_CONDX') || '1';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contextData, setData } = useAppContext();
    const [showBandCondx, setShowBandCondx] = React.useState(parseInt(currentVal) == 1 ? true : false);
    const [backgroundColor, setBackgroundColor] = React.useState(DARK_COLOR);

    const [showWsjtx, setShowWsjtx] = React.useState(true);

    React.useEffect(() => {
        if (contextData.themeMode == 'dark')
            setBackgroundColor(DARK_COLOR)
        else if (contextData.themeMode == 'light')
            setBackgroundColor(LIGHT_COLOR)
    }, [contextData.themeMode]);

    React.useEffect(() => {
        if (contextData.showBandCondx)
            setShowBandCondx(true);
        else
            setShowBandCondx(false);
    }, [contextData.showBandCondx]);

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            init();
        else
            window.addEventListener('pywebviewready', init);

        function init() {
            const y = window.pywebview.api.get_user_config_val('enable_wsjtx_int');
            y.then(async (r: string) => {
                const x = checkApiResponse2(r, addMessage);
                if (x.success) {
                    const enabled: boolean = x.val;
                    setShowWsjtx(enabled);
                }
            });
        };
    }, []);


    function initState() {
        if (!window.pywebview.state) {
            window.pywebview.state = {};
        }

        const val = window.localStorage.getItem('SHOW_BAND_CONDX') || '1';
        setShowBandCondx(parseInt(val) == 1 ? true : false);
    }

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null) {
            initState();
        }
        else {
            window.addEventListener('pywebviewready', initState);
        }
    }, []);


    return (
        <Box
            className="right-area"
            sx={{ backgroundColor: backgroundColor }}>

            {showBandCondx &&
                <CondxArea />
            }
            {showWsjtx &&
                <WsjtxArea />
            }
            <CatArea />

        </Box>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addMessage(msg: MessageType): void {
    throw new Error('Function not implemented.');
}
