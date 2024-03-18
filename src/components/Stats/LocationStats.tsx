import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

declare interface ILocationStatsButtonProps {
    setIsWorking: (val: boolean) => void,
}


export const LocationStatsButton = (props: ILocationStatsButtonProps) => {
    const [isWorking, _] = React.useState(false);

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            props.setIsWorking(true);
            let x = window.pywebview.api.load_location_data();
            x.then((r: string) => {
                if (r === null)
                    return;
                let x = JSON.parse(r);
                if (x.success) {
                    props.setIsWorking(false);
                    console.log(x.message);
                }
            });
        }
    };

    return (
        <>
            <Tooltip title="Download POTA location data for stats">
                <Button onClick={handleClick}>
                    Loc Stats
                </Button>
            </Tooltip>
            {isWorking && (
                <div style={{ 'display': 'flex' }}>
                    <CircularProgress />
                </div>
            )}
        </>
    );
};
