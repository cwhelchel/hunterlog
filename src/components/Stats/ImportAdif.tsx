import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

declare interface IImportAdifProps {
    setIsWorking: (val: boolean) => void,
}


export const ImportAdif = (props: IImportAdifProps) => {
    const [isWorking, _] = React.useState(false);

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            props.setIsWorking(true);
            window.pywebview.api.import_adif().then((r: string) => {
                let x = JSON.parse(r);
                if (x.success) {
                    props.setIsWorking(false);
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
            <Tooltip title="Import ADIF log of QSOs to track Operator hunts. SIG, SIG_INFO, POTAPLUS comments should be present.">
                <Button onClick={handleClick}>
                    OP Stats
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
