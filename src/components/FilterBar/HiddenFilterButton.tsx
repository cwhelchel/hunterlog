import * as React from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useAppContext } from '../AppContext';

export default function HiddenFilterButton() {
    const [selected, setSelected] = React.useState(false);
    const { contextData, setData } = useAppContext();

    function setDbShowHiddenFilter(checked: boolean) {
        console.log("changing showhidden filter to: " + checked);

        window.pywebview.api.set_hidden_filter(checked);

        setSelected(checked);

        const next = { ...contextData, showHiddenFilter: checked };
        // console.log(next);
        setData(next);
    }

    function handleButtonClick(checked: boolean): void {
        setDbShowHiddenFilter(checked);
        window.localStorage.setItem("SHOW_HIDDEN_FLT", checked.toString());
    }

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            init();
        else
            window.addEventListener('pywebviewready', init);

        function init() {
            const hidden = window.localStorage.getItem("SHOW_HIDDEN_FLT");
            const bHidden = (hidden === "true")
            setDbShowHiddenFilter(bHidden);
        }
    }, []);

    return (
        <Button
            color='primary'
            title='Show User-hidden Rows'
            size='small'
            onClick={() => handleButtonClick(!selected)}
        >
            {selected &&
                <Visibility color="primary" />
            }
            {!selected &&
                <VisibilityOff color="disabled" />
            }
        </Button>
    );
}
