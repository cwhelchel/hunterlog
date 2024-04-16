import * as React from 'react'
import { Tooltip, Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { checkApiResponse } from '../../util';
import { useAppContext } from '../AppContext';

declare interface IImportAdifProps {
    setIsWorking: (val: boolean) => void,
}


export const ImportAdif = (props: IImportAdifProps) => {
    const [isWorking, _] = React.useState(false);
    const { contextData, setData } = useAppContext();

    const handleClick = () => {
        if (window.pywebview !== undefined) {
            props.setIsWorking(true);
            window.pywebview.api.import_adif().then((r: string) => {
                props.setIsWorking(false);
                checkApiResponse(r, contextData, setData);
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
                <div style={{ 'display': 'flex' }}>
                    <CircularProgress />
                </div>
            )}
        </>
    );
};
