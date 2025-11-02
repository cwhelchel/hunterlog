import * as React from 'react';
import { Button, Tooltip } from '@mui/material';
import { checkApiResponse } from '../../util';
import { useAppContext } from '../AppContext';

// Update the Button's color options to include an alert option
declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        alert: true;
    }
}


type ButtonVariants = "text" | "outlined" | "contained"
type ButtonSize = "small" | "medium" | "large"
type ColorVariants = 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'alert'

interface IFreqButtonProps {
    activator: string,
    frequency: string,
    mode: string,
    buttonVariant?: ButtonVariants,
    buttonSize?: ButtonSize,
    displayText?: string,
    widthSx?: string,
    color?: ColorVariants
};


export default function FreqButton(props: IFreqButtonProps) {
    const { contextData, setData, qsyButtonId, setLastQsyBtnId } = useAppContext();
    const [buttonColor, setButtonColor] = React.useState<ColorVariants | undefined>(undefined);

    const actId = [props.activator, props.frequency, props.mode].join("|");
    const id = actId + '==' + React.useId();

    function onClick(e: string, m: string, id: string) {
        console.log("js qsy to...");
        console.log(`param ${e} ${m}`);
        let p = window.pywebview.api.qsy_to(e, m);
        p.then((resp: string) => {
            checkApiResponse(resp, contextData, setData);
            setLastQsyBtnId(id);
            //console.log(`freqbtn qsy resp. spotId: ${id}`);
        });
    };

    function checkQsyId(btnId: string) : boolean {
        const x = btnId.split('==');
        const actId = x[0];
        const y = actId.split('|');

        return (
            y[0] === props.activator && 
            y[1] === props.frequency && 
            y[2] === props.mode
        );
    }

    React.useEffect(() => {
        if (checkQsyId(qsyButtonId)) {
            setButtonColor('alert');
        } else {
            setButtonColor('primary');
        }
    }, [qsyButtonId]);

    React.useEffect(() => {
        if (checkQsyId(qsyButtonId)) {
            setButtonColor('alert');
        } else {
            setButtonColor(props.color ?? 'primary');
        }
    }, []);

    return (
        <Button
            id={id}
            sx={{ width: props.widthSx ?? '100px', height: 'fit-content' }}
            variant={props.buttonVariant ?? 'contained'}
            size={props.buttonSize ?? 'medium'}
            color={buttonColor}
            onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                // console.log(event.currentTarget.id);
                // bevent.stopPropagation();
                let x = event.currentTarget.id;
                // console.log(event.currentTarget.className);
                onClick(props.frequency, props.mode, x);
            }
            }>
            {props.displayText === undefined ? props.frequency : props.displayText}
        </Button>
    );
}