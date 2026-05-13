
// meow

import './CatArea.scss';

import React from "react";

import { useAppContext } from '../../AppContext';
import CwControl from './CwControl';

// import { Button, IconButton, MobileStepper } from '@mui/material';
// import { checkApiResponse2 } from '../Utilities/util';

export default function CatArea() {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contextData, setData } = useAppContext();

    return (<>
        <span>Cat Area</span>
        <CwControl/>
    </>
    );
}