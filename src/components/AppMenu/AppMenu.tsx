import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

import { useAppContext } from '../AppContext';
import ConfigModal from '../Config/ConfigModal';
import { UpdateStats } from '../Stats/UpdateStats';
import { ImportAdif } from '../Stats/ImportAdif';
import { UserConfig } from '../../@types/Config';
import { ActivatorData } from '../../@types/ActivatorTypes';
import { Avatar } from '@mui/material';

export default function AppMenu() {

    const { contextData, setData } = useAppContext();
    const [callsign, setCallsign] = React.useState('')
    const [gravatar, setGravatar] = React.useState('')

    React.useEffect(() => {
        window.addEventListener('pywebviewready', function () {
            // pywebview is ready so api can be called here:
            let x = window.pywebview.api.get_user_config();
            x.then((cfgStr: string) => {
                let obj: UserConfig = JSON.parse(cfgStr) as UserConfig;
                setCallsign(obj.my_call);
                let y = window.pywebview.api.get_activator_stats(obj.my_call);
                y.then((actStr: string) => {
                    let actObj: ActivatorData = JSON.parse(actStr) as ActivatorData;
                    let url = getGravatarUrl(actObj.gravatar);
                    setGravatar(url);
                });
            })
        })
    }, []);

    function getGravatarUrl(md5: string) {
        //console.log(md5);
        return `https://gravatar.com/avatar/${md5}?d=identicon`;
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Avatar src={gravatar} >
                    </Avatar>
                    <Typography variant="h6" color="inherit"
                        component="div" ml={1} mr={1}>
                        {callsign}
                    </Typography>
                    <ConfigModal />
                    <UpdateStats />
                    <ImportAdif />
                </Toolbar>
            </AppBar>
        </Box>
    );
}