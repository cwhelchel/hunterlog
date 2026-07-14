
// meow

import './RightArea.scss';

import React from "react";

import { useAppContext } from '../AppContext';
import { Box } from '@mui/material';
import CondxArea from './CondxArea/CondxArea';
import WsjtxArea from './WsjtxArea/WsjtxArea';
import CatArea from './CatArea/CatArea';

// import { Button, IconButton, MobileStepper } from '@mui/material';
// import { checkApiResponse2 } from '../Utilities/util';

export default function RightArea() {
    const currentVal = window.localStorage.getItem('SHOW_BAND_CONDX') || '1';


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contextData, setData } = useAppContext();

    const [showBandCondx, setShowBandCondx] = React.useState(parseInt(currentVal) == 1 ? true : false);

    React.useEffect(() => {
        if (contextData.showBandCondx)
            setShowBandCondx(true);
        else
            setShowBandCondx(false);
    }, [contextData.showBandCondx]);


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


    return (<Box className="right-area">

        {showBandCondx &&
            <CondxArea />
        }
        <WsjtxArea />
        <CatArea />

    </Box>
    );
}