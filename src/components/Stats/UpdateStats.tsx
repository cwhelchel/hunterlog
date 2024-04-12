import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { checkApiResponse } from '../../util';
import { useAppContext } from '../AppContext';

declare interface IUpdateStatProps {
    setIsWorking: (val: boolean) => void,
}


export const UpdateStats = (props: IUpdateStatProps) => {
    const [isWorking, _] = React.useState(false);
    const {contextData, setData} = useAppContext();

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            props.setIsWorking(true);
            let x = window.pywebview.api.update_park_hunts_from_csv();
            x.then((r: string) => {
                let x = checkApiResponse(r, contextData, setData);
                if (x.success) {
                    props.setIsWorking(false);
                    console.log(x.message);
                }
            });
        }
    };

    return (
        <>
            <Tooltip title="Update park hunt stats from hunter_parks.csv">
                <Button onClick={handleClick}>
                    Park Stats
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
