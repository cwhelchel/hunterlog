import * as React from 'react';
import { Button, Typography } from '@mui/material';
import { useAppContext } from '../AppContext';

export default function QrtFilterButton() {
    const [selected, setSelected] = React.useState(false);
    const { contextData, setData } = useAppContext();

    function setBackendAndContext(checked: boolean) {
        console.log("changing qrt filter to: " + checked);
        window.pywebview.api.set_qrt_filter(checked);

        const next = { ...contextData, qrtFilter: checked };
        setData(next);
        setSelected(checked);
    }

    function handleButtonClick(checked: boolean): void {
        setBackendAndContext(checked);
        window.localStorage.setItem("QRT_FILTER", checked.toString());
    }

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            init();
        else
            window.addEventListener('pywebviewready', init);

        function init() {
            const valStr = window.localStorage.getItem("QRT_FILTER");
            const bFilter = (valStr === "true")
            setBackendAndContext(bFilter);
        }
    }, []);

    return (
        <Button
            title='Hide QRT'
            size='small'
            onClick={() => handleButtonClick(!selected)}
        >
            {selected &&
                <Typography color="primary">QRT</Typography>
            }
            {!selected &&
                <Typography color="text.disabled">QRT</Typography>
            }
        </Button>
    );
}
