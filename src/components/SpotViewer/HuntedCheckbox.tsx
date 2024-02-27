import * as React from 'react';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Tooltip } from '@mui/material';

interface IHuntedCheckboxProps {
    hunted: boolean,
    hunted_bands: string
};

export default function HuntedCheckbox(props: IHuntedCheckboxProps) {
    return (
        <>
            {props.hunted && (
                <div>
                    <Tooltip title={<React.Fragment>
                        {'hunted on:'}<br />
                        {props.hunted_bands}
                    </React.Fragment>}>
                        <CheckBoxIcon color='primary' />
                    </Tooltip>
                </div>
            )}
            {!props.hunted && props.hunted_bands.length > 0 && (
                <Tooltip title={<React.Fragment>
                    {'hunted on:'}<br />
                    {props.hunted_bands}
                </React.Fragment>}>
                    <CheckBoxOutlineBlankIcon color='primary' />
                </Tooltip>
            )}
            {!props.hunted && props.hunted_bands.length === 0 && (
                <CheckBoxOutlineBlankIcon />
            )}
        </>
    );
}
