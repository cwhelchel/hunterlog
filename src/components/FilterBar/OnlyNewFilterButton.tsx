import * as React from 'react';
import { AutoAwesome } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useAppContext } from '../AppContext';

export default function OnlyNewFilterButton() {
    const [selected, setSelected] = React.useState(false);
    const { contextData, setData } = useAppContext();

    function setBackendAndContext(checked: boolean) {
        console.log("changing onlynew filter to: " + checked);
        window.pywebview.api.set_only_new_filter(checked);

        const next = { ...contextData, onlyNewFilter: checked };
        setData(next);
        setSelected(checked);
    }

    function handleButtonClick(checked: boolean): void {
        setBackendAndContext(checked);
        window.localStorage.setItem("ATNO_FILTER", checked.toString());
    }

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            init();
        else
            window.addEventListener('pywebviewready', init);

        function init() {
            const hidden = window.localStorage.getItem("ATNO_FILTER");
            const bHidden = (hidden === "true")
            setBackendAndContext(bHidden);
        }
    }, []);

    return (
        <Button
            color='primary'
            title='Show Only New Refs'
            size='small'
            onClick={() => handleButtonClick(!selected)}
        >
            {selected &&
                <AutoAwesome color="primary" />
            }
            {!selected &&
                <AutoAwesome color="disabled" />
            }
        </Button>
    );
}
