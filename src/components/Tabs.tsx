import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { ActivatorInfo } from './ActivatorInfo/ActivatorInfo';
import ParkInfo from './Map/ParkInfo';
import Stack from '@mui/material/Stack';
import ParkIcon from '@mui/icons-material/Park';
import PersonIcon from '@mui/icons-material/Person';
import { useAppContext } from './AppContext';
import { checkApiResponse } from '../tsx/util';
import Badge from '@mui/material/Badge';
import { Tooltip } from '@mui/material';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// https://muhimasri.com/blogs/mui-vertical-tabs/

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            style={{ width: '100%' }}
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function BasicTabs() {
    const { contextData, setData } = useAppContext();
    const [value, setValue] = React.useState(0);
    const [hunts, setHunts] = React.useState(0);
    const [newBand, setNewBand] = React.useState(false);
    const [invisible, setInvisible] = React.useState(true);

    const handleBadgeVisibility = () => {
        setInvisible(!invisible);
    };

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    function onParkChange() {
        let park = contextData?.park?.reference || '';
        if (park === null || park === '') {
            setInvisible(true);
            return;
        }

        window.pywebview.api.get_park_hunts(park).then((j: string) => {
            let o = checkApiResponse(j, contextData, setData);
            let hunts = parseInt(o.count);
            setHunts(hunts);
            if (hunts > 0) {
                setInvisible(true);
            } else {
                setInvisible(false);
            }
        });

        let freq = contextData?.qso?.freq;
        if (freq !== null || freq !== '') {
            window.pywebview.api.get_park_hunted_bands(freq, park).then((j: string) => {
                let o = checkApiResponse(j, contextData, setData);
                let nb = o.new_band;
                setNewBand(nb);
                if (nb) {
                    setInvisible(false);
                } else {
                    setInvisible(true);
                }
            });
        }
    }

    React.useEffect(() => {
        onParkChange();
    }, [contextData.park]);

    function getColor(): string {
        if (hunts == 0)
            return '#d9534f';

        if (newBand)
            return '#bf821f'

        return '#FFFFFF';
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Stack direction='row' gap={2} sx={{ justifyContent: 'flex-end' }} >
                <CustomTabPanel value={value} index={0}>
                    <ActivatorInfo />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    <ParkInfo />
                </CustomTabPanel>
                <Tabs value={value}
                    onChange={handleChange}
                    aria-label="info tabs"
                    orientation='vertical'
                    sx={{ marginLeft: 'auto' }}
                >
                    <Tab label={
                        <Tooltip title="Activator Info" >
                            <PersonIcon />
                        </Tooltip>
                    } {...a11yProps(0)} />
                    <Tab label={
                        <Badge
                            sx={{
                                "& .MuiBadge-badge": {
                                    backgroundColor: getColor()
                                }
                            }}
                            invisible={invisible}
                            variant='dot'
                        >
                            <Tooltip title="Reference Info" >
                                <ParkIcon />
                            </Tooltip>
                        </Badge>

                    } {...a11yProps(1)} />
                </Tabs>
            </Stack>
        </Box>
    );
}