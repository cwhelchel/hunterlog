import React from "react";
import LandscapeIcon from '@mui/icons-material/Landscape';
import ParkIcon from '@mui/icons-material/Park';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import WwbotaIcon from "./WwbotaIcon";

export interface ProgramIconProps {
    sig: string;
}

export default function ProgramIcon(props: ProgramIconProps) {
    return (
        <>
            {props.sig == 'SOTA' && (
                <LandscapeIcon color='secondary' />
            )}
            {props.sig == 'POTA' && (
                <ParkIcon color='primary' />
            )}
            {props.sig == 'WWFF' && (
                <LocalFloristIcon color='success' />
            )}
            {props.sig == 'WWBOTA' && (
                <WwbotaIcon />
            )}
        </>
    )
}