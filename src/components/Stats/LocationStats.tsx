import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { checkApiResponse } from '../../util';
import { useAppContext } from '../AppContext';

declare interface ILocationStatsButtonProps {
    setIsWorking: (val: boolean) => void,
}


export const LocationStatsButton = (props: ILocationStatsButtonProps) => {
    const [isWorking, _] = React.useState(false);
    const {contextData, setData} = useAppContext();

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            props.setIsWorking(true);
            let x = window.pywebview.api.load_location_data();
            x.then((r: string) => {
                props.setIsWorking(false);

                let x = checkApiResponse(r, contextData, setData);
                if (x.success) {
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
