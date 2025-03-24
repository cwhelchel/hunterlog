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
    frequency: string,
    mode: string,
    buttonVariant?: ButtonVariants,
    buttonSize?: ButtonSize,
    displayText?: string,
    widthSx?: string,
    color?: ColorVariants
};


export default function FreqButton(props: IFreqButtonProps) {
    const { contextData, setData } = useAppContext();

    function onClick(e: string, m: string) {
        console.log("js qsy to...");
        console.log(`param ${e} ${m}`);
        let p = window.pywebview.api.qsy_to(e, m);
        p.then((resp: string) => {
            checkApiResponse(resp, contextData, setData);
        });
    };

    return (
        <Button 
            sx={{ width: props.widthSx ?? '100px', height: 'fit-content' }}
            variant={props.buttonVariant ?? 'contained'}
            size={props.buttonSize ?? 'medium'}
            color={props.color ?? 'primary'}
            onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                onClick(props.frequency, props.mode);
            }
            }>
            {props.displayText === undefined ? props.frequency : props.displayText}
        </Button>
    );
}