import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { checkApiResponse } from '../../tsx/util';
import { useAppContext } from '../AppContext';

declare interface ILocationStatsButtonProps {
    setIsWorking: (val: boolean) => void,
}


export const LocationStatsButton = (props: ILocationStatsButtonProps) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isWorking, _] = React.useState(false);
    const {contextData, setData} = useAppContext();

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            props.setIsWorking(true);
            const x = window.pywebview.api.imports.load_location_data();
            x.then((r: string) => {
                props.setIsWorking(false);

                const x = checkApiResponse(r, contextData, setData);
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
