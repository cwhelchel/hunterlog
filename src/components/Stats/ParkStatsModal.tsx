import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Step from '@mui/material/Step';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import { HlModal, HlModalContent, HlStyledBackdrop } from './Modals';
import { checkApiResponse } from '../../tsx/util';
import { useAppContext } from '../AppContext';
import pota_step1 from '../../assets/import_pota_1.png';
import pota_step2 from '../../assets/import_pota_2.png';
import wwff_step1 from '../../assets/import_wwff_1.png';
import wwff_step2 from '../../assets/import_wwff_2.png';
import wwff_step3 from '../../assets/import_wwff_3.png';
import wwff_step4 from '../../assets/import_wwff_4.png';
import sota_step1 from '../../assets/import_sota_1.png';
import sota_step2 from '../../assets/import_sota_2.png';
import sota_step3 from '../../assets/import_sota_3.png';
import './ParkStatsModal.scss';
import LinearProgress from '@mui/material/LinearProgress';
import { Divider, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const PROGS = ["POTA", "WWFF", "SOTA"];

export interface IParkStatsModalProps {
    isOpen: boolean,
    onClose: () => void,
}

export default function ParkStatsModal(props: IParkStatsModalProps) {
    const [importType, setImportType] = React.useState(0);
    const { contextData, setData } = useAppContext();
    const [files, setFiles] = React.useState<File[]>([]);
    const [activeStep, setActiveStep] = React.useState(0);
    const [steps, setSteps] = React.useState(potaSteps);
    const [progress, setProgress] = React.useState(0);
    const [isComplete, setIsComplete] = React.useState(false);

    const handleImport = () => {
        if (window.pywebview === undefined) {
            return;
        }

        if (importType == 0) {
            const reader = new FileReader();
            reader.onload = function (event) {
                if (event) {
                    const fileContents = event?.target?.result;
                    // this is POTA specific api call
                    const x = window.pywebview.api.update_park_hunts_from_csv(fileContents);
                    x.then((r: string) => {
                        const x = checkApiResponse(r, contextData, setData);
                        if (x.success) {
                            setIsComplete(true);
                            console.log(x.message);
                        }
                    });
                }
            };
            reader.readAsText(files[0]);
        } else {
            const reader = new FileReader();
            reader.onload = function (event) {
                if (event) {
                    const fileContents = event?.target?.result;
                    const prog = PROGS[importType];

                    const y = window.pywebview.api.update_park_hunts_from_csv_qsos(prog, fileContents);
                    y.then((r: string) => {
                        const x = checkApiResponse(r, contextData, setData);
                        if (x.success) {
                            setIsComplete(true);
                            console.log(x.message);
                        }
                    });
                }
            };
            reader.readAsText(files[0]);
        }
    };

    const handleClose = () => {
        setIsComplete(false);
        props.onClose();
    }

    const handleDragStart = (ev: React.DragEvent<HTMLDivElement>): void => {
        const id = (ev.target as HTMLDivElement).id;
        ev.dataTransfer.setData("text/plain", id);
        //console.log(id);

    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Allow dropping
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsComplete(false);
        setProgress(0.0);

        // console.log(e);
        // console.log(e.target);
        // console.log(e.dataTransfer.files);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            const newFiles = Array.from(droppedFiles);
            setFiles([...newFiles]);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function handleClearFiles(el: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
        setFiles([]);
    }

    const handleNext = () => {
        if (activeStep === steps.length - 1)
            return;
        const newActiveStep = activeStep + 1;
        setActiveStep(newActiveStep);
    };

    const handleBack = () => {
        if (activeStep == 0)
            return;
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    // this is called from python back end
    function updateImportProgress(percentage: number) {
        setProgress(percentage);
    }

    React.useEffect(() => {
        if (files.length <= 0)
            return;

        const fn = files[0].name;
        if (fn.startsWith('hunter_parks'))
            setImportType(0);
        else if (fn.startsWith('logsearch'))
            setImportType(1);
        else if (fn.includes('_chaser_'))
            setImportType(2);
    }, [files]);

    React.useEffect(() => {
        const s = availSteps[importType];
        setSteps(s);
    }, [importType]);

    React.useEffect(() => {
        if (!window.pywebview.state) {
            window.pywebview.state = {}
        }

        window.pywebview.state.updateImportProgress = updateImportProgress;

        setIsComplete(false);
        setProgress(0.0);
    }, []);

    return (
        <HlModal
            aria-labelledby="unstyled-modal-title"
            aria-describedby="unstyled-modal-description"
            open={props.isOpen}
            onClose={props.onClose}
            slots={{ backdrop: HlStyledBackdrop }}
        >
            <HlModalContent sx={{ width: '60%' }}>
                <h2 id="unstyled-modal-title" className="modal-title" style={{ display: 'flex' }}>
                    Import Park / Reference hunts
                    {/* <div style={{ marginLeft: 'auto', paddingTop: '5px' }}>
                        <Select
                            value={importType}
                            label="Import Type"
                            onChange={(e) => {
                                const x = e.target.value.toString();
                                const y = parseInt(x);
                                setImportType(y);
                            }}>
                            <MenuItem value={0}>POTA</MenuItem>
                            <MenuItem value={1}>WWFF</MenuItem>
                            <MenuItem value={2}>SOTA</MenuItem>
                        </Select>
                    </div> */}
                </h2>
                <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle1">
                        On this screen, you can import the hunt counts for various programs.
                        This will only effect the overall hunt counts for a given program&apos;s reference.
                        This is the number that is shown next to the reference column in the main spot grid.
                    </Typography>
                    <Divider />
                </Box>
                <Box sx={{ width: '100%' }} >
                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '5px' }}>
                        <Typography variant="body2">
                            Select a SIG program in the dropdown to the right to get step-by-step instructions for downloading
                            and importing reference hunt counts. If you have the right file name from
                            the program website, the SIG should be auto-detected.

                            Then click the Import button. Drag and Drop a new file to start over.
                        </Typography>
                        <div style={{ marginLeft: 'auto', paddingTop: '5px' }}>
                            <Select
                                value={importType}
                                label="Import Type"
                                onChange={(e) => {
                                    const x = e.target.value.toString();
                                    const y = parseInt(x);
                                    setImportType(y);
                                }}>
                                <MenuItem value={0}>POTA</MenuItem>
                                <MenuItem value={1}>WWFF</MenuItem>
                                <MenuItem value={2}>SOTA</MenuItem>
                            </Select>
                        </div>
                    </Box>
                    <Box sx={{padding: '4em', border: '1px dashed grey'}}>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((label, index) => (
                                <Step
                                    key={label[0]}
                                    completed={activeStep > index}>
                                    <StepLabel>{label[0]}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                        <React.Fragment>
                            <div className='step-info'>
                                <p dangerouslySetInnerHTML={{ __html: steps[activeStep][1] }} />
                                <img className='step-img' src={steps[activeStep][2]} />
                            </div>
                            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                                <Button
                                    color="inherit"
                                    disabled={activeStep === 0}
                                    onClick={handleBack}
                                    sx={{ mr: 1 }}
                                >
                                    Back
                                </Button>
                                <Box sx={{ flex: '1 1 auto' }} />
                                <Button onClick={handleNext} sx={{ mr: 1 }}>
                                    Next
                                </Button>
                            </Box>
                        </React.Fragment>
                    </Box>
                </Box>

                {files.length == 0 && (
                    <div id="drop-zone"
                        draggable={true}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e)}>
                        Drag data files here
                    </div>
                )}

                {files.length > 0 && (
                    <div className="file-list">
                        <div className="file-list__container">
                            {files.map((file, index) => (
                                <div className="file-item" key={index}>
                                    <div className="file-info">
                                        {file.name}
                                    </div>
                                    <div className="file-actions">
                                        <Button onClick={handleClearFiles}>
                                            <DeleteForeverIcon />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <Stack direction={'row'} spacing={1} sx={{ 'align-items': 'stretch', 'justify-content': 'space-evenly' }} useFlexGap>
                    <Button fullWidth variant='contained' disabled={isComplete} onClick={handleImport}>Import</Button>
                    <Button fullWidth variant='contained' onClick={handleClose}>Close</Button>
                </Stack>
                <Box sx={{ width: '100%' }}>
                    <LinearProgress variant="determinate" value={progress} />
                    {isComplete && (
                        <Typography variant='h6'>
                            <CheckIcon />
                            Import Successful
                        </Typography>
                    )}
                </Box>
            </HlModalContent>
        </HlModal>
    );
}

const potaSteps = [
    ['Go to Stats on POTA website', 'Point your browser to <a href="https://pota.app" target="_blank">pota.app</a>, log into your user account, and click your user account in the top right corner. In the drop down menu click the My Stats menu item.', pota_step1],
    ['Download hunter_parks.csv', 'Click Export CSV button on your Hunter stats list. This will download the hunter_parks.csv file to your computer.', pota_step2],
    ['Drag & Drop', 'Drag and drop hunter_parks.csv file below and click the Import button', ''],
];

const wwffSteps = [
    ['Go to wwff website', 'Point your browser to <a href="https://wwff.co/" target="_blank">wwff.co</a>, log into your user account, and click LOGSEARCH in nav menu on top of screen.', wwff_step1],
    ['Enter logsearch parameters', 'In Logsearch Callsign, make sure your calls are correct and Hunter is selected and that All-Time is selected. Then click Search.', wwff_step2],
    ['Go to your QSOs', 'In Search Results, click QSOs button.', wwff_step3],
    ['Download logsearch.csv', 'Click large green Download button. This should download the logsearch.csv file to your computer. <i>You can see all your hunter WWFF qsos in the list below</i>', wwff_step4],
    ['Drag & Drop', 'Drag and drop logsearch.csv file below and click the Import button', ''],
];

const sotaSteps = [
    ['Go to SOTA website', 'Point your browser to <a href="https://sotadata.org.uk/" target="_blank">sotadata.co.uk</a>, log into your user account, and click Logs in nav menu on top of screen.', sota_step1],
    ['Go to your SOTA Logs', 'On this the next screen, click the blue Chaser button near the top.', sota_step2],
    ['Download logs', 'In Chaser Log screen, click blue Download complete log button.', sota_step3],
    ['Drag & Drop', 'Drag and drop downloaded csv file below and click the Import button', ''],
];

const availSteps = [potaSteps, wwffSteps, sotaSteps];