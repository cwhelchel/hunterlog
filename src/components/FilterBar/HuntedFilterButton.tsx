import * as React from 'react';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Button } from '@mui/material';
import { useAppContext } from '../AppContext';

export default function HuntedFilterButton() {
    const [selected, setSelected] = React.useState(false);
    const { contextData, setData } = useAppContext();

    function setBackendAndContext(checked: boolean) {
        console.log("changing hunted filter to: " + checked);
        window.pywebview.api.set_hunted_filter(checked);

        const next = { ...contextData, huntedFilter: checked };
        setData(next);
        setSelected(checked);
    }

    function handleButtonClick(checked: boolean): void {
        setBackendAndContext(checked);
        window.localStorage.setItem("HUNTED_FILTER", checked.toString());
    }

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            init();
        else
            window.addEventListener('pywebviewready', init);

        function init() {
            const valStr = window.localStorage.getItem("HUNTED_FILTER");
            const bFilter = (valStr === "true")
            setBackendAndContext(bFilter);
        }
    }, []);

    return (
        <Button
            color='primary'
            title='Hide Hunted spots'
            size='small'
            onClick={() => handleButtonClick(!selected)}
        >
            {selected &&
                <CheckBoxIcon color="primary" />
            }
            {!selected &&
                <CheckBoxOutlineBlankIcon color='disabled' />
            }
        </Button>
    );
}
