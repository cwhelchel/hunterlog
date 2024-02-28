import * as React from 'react';
import { Button, FormControlLabel, Modal, Switch } from '@mui/material';
import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import { styled, css } from '@mui/system';
import { SpotComments } from '../../@types/SpotComments';

interface ISpotCommentsProps {
    spotId: number,
    spotter: string,
    comments: string
};

export default function HuntedCheckbox(props: ISpotCommentsProps) {
    const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
    const [comments, setComments] = React.useState<null | SpotComments[]>(null);
    const [useRbn, setUseRbn] = React.useState<boolean>(false);

    function getSpotComments(spotId: number) {
        let id = spotId;
        console.log(`getting comments for ${id}`);
        let p = window.pywebview.api.get_spot_comments(id);
    
        p.then((x: string) => {
            console.log('comments json:');
            let t = JSON.parse(x) as SpotComments[];
            setComments(t);
        });
    }

    
    function onClick(e: React.MouseEvent<HTMLElement>) {
        getSpotComments(props.spotId);
        setAnchor(anchor ? null : e.currentTarget);
    };

    function handleClickAway(_: any) {
        setAnchor(null);
    }

    const open = Boolean(anchor);
    const cellVal = `${props.spotter}: ${props.comments}`;

    function handleChange(event: any, checked: boolean): void {
        console.log(checked);

        if (comments == null)
            return;

        if (checked) {
            let newComments = comments?.filter(c => {
                const source = c.source
                return !source.includes('RBN');
            });

            setComments(newComments);
        } else {
            getSpotComments(props.spotId);
        }
    }

    return (

        <div>
            <Button variant='text' onClick={onClick}>
                {cellVal}
            </Button>
            <StyledModal open={open}>
                <ClickAwayListener onClickAway={handleClickAway}>
                    <ModalContent>
                        <FormControlLabel control={<Switch onChange={handleChange} />} label="Hide RBN" />

                        {comments?.map(c => {
                            return <span>{c.spotter}: {c.comments}<br /></span>;
                        })
                        }
                    </ModalContent>
                </ClickAwayListener>
            </StyledModal>
        </div >

    );
}

// stolen from MUI base-ui docs: 

const grey = {
    50: '#F3F6F9',
    100: '#E5EAF2',
    200: '#DAE2ED',
    300: '#C7D0DD',
    400: '#B0B8C4',
    500: '#9DA8B7',
    600: '#6B7A90',
    700: '#434D5B',
    800: '#303740',
    900: '#1C2025',
};

const StyledModal = styled(Modal)`
  position: fixed;
  z-index: 1300;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled('div')(
    ({ theme }) => css`
    font-family: Lucida Console, courier, monospace;
    font-size: 0.75em;
    text-align: start;
    position: relative;
    display: flex;
    flex-direction: column;
    height:500px;
    gap: 8px;
    overflow: scroll;
    background-color: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
    border-radius: 8px;
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    box-shadow: 0 4px 12px
      ${theme.palette.mode === 'dark' ? 'rgb(0 0 0 / 0.5)' : 'rgb(0 0 0 / 0.2)'};
    padding: 12px;
    color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};

    & .modal-title {
      margin: 0;
      line-height: 1.5rem;
      margin-bottom: 8px;
    }

    & .modal-description {
      margin: 0;
      line-height: 1.5rem;
      font-weight: 400;
      color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
      margin-bottom: 4px;
    }
  `,
);
