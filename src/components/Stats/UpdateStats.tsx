import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';

export const UpdateStats = () => {
    const [isWorking, setIsWorking] = React.useState(false);

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            setIsWorking(true);
            let x = window.pywebview.api.update_park_hunts_from_csv();
            x.then((r: string) => {
                if (r === null)
                    return;
                let x = JSON.parse(r);
                if (x.success) {
                    setIsWorking(false);
                    console.log(x.message);
                }
            });
        }
    };

    return (
        <>
            <Tooltip title="Update park hunt stats from hunter_parks.csv">
                <Button onClick={handleClick}>
                    Update Stats <br/>
                    {isWorking && (
                        <div style={{'width':'50%'}}>
                            <LinearProgress />
                        </div>
                    )}
                </Button>
            </Tooltip>
        </>
    );
};
