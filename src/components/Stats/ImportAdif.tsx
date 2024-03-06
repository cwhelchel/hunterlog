import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

export const ImportAdif = () => {
    const [isWorking, setIsWorking] = React.useState(false);

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            setIsWorking(true);
            window.pywebview.api.import_adif().then((r: string) => {
                let x = JSON.parse(r);
                if (x.success) {
                    setIsWorking(false);
                    console.log(x.message);
                }
                else
                    alert(x.message);
            },
                () => {
                    //alert("hi");
                });
        }
    };

    return (
        <>
            <Tooltip title="Load in old QSOs to track Operator hunts">
                <Button onClick={handleClick}>
                    Import ADIF
                </Button>
            </Tooltip>
            {isWorking && (
                <div style={{'display':'flex'}}>
                    <CircularProgress />
                </div>
            )}
        </>
    );
};
