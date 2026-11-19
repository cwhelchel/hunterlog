import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';

import { useAppContext } from './AppContext'
import SpotViewer from './SpotViewer/SpotViewer'
import QsoEntry from './QsoEntry/QsoEntry'
import { FilterBar } from './FilterBar/FilterBar'
import AppMenu from './AppMenu/AppMenu'
import Footer from './Footer/Footer'
import BasicTabs from './Tabs';
import { Backdrop, CircularProgress } from '@mui/material';
import { checkApiResponse2 } from './Utilities/util';
import { useMessageQueue } from './MessageContext';
import MigrateModal from './AppMenu/MenuItems/Extras/MigrateModal';
import { createAppTheme } from './Theme';

// Augment the palette to include an alert color
declare module '@mui/material/styles' {
    interface Palette {
        alert: Palette['primary'];
        timeOld: Palette['primary'];
        timeAging: Palette['primary'];
        timeNew: Palette['primary'];
        timeBrandNew: Palette['primary'];
    }

    interface PaletteOptions {
        alert?: PaletteOptions['primary'];
        timeOld?: PaletteOptions['primary'];
        timeAging?: PaletteOptions['primary'];
        timeNew?: PaletteOptions['primary'];
        timeBrandNew?: PaletteOptions['primary'];
    }
}

// function buildTheme(isDark: boolean): Theme {
//     return createTheme({
//         palette: {
//             mode: isDark ? 'dark' : 'light',
//             primary: {
//                 main: isDark ? '#008C2C' : '#305c3e'
//             },
//             secondary: {
//                 main: isDark ? '#7e0e5b' : '#650b49' //og purp 8c0060 
//             },
//             alert: {
//                 main: '#E3D026',
//                 light: '#E9DB5D',
//                 dark: '#A29415',
//                 contrastText: '#242105',
//             }
//         }
//     });
// }

export default function Main() {
    const savedTheme = window.localStorage.getItem('THEME_NAME') || 'def-dark';
    
    const { contextData, setData } = useAppContext();
    const [spinnerOpen, setSpinnerOpen] = React.useState(false);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [themeName, setThemeName] = React.useState(savedTheme);
    const { addMessage } = useMessageQueue();

    const theme = React.useMemo(() => {
        function getThemeMode(themeName: string) {
            switch (themeName) {
                case 'def-dark': return 'dark';
                case 'def-light': return 'light';
                case 'bluey-dark': return 'dark';
                case 'bluey-light': return 'light';
                default: return 'dark';
            }
        }
        const theMode = getThemeMode(themeName);
        console.log('themem', theMode, themeName);
        return createAppTheme(theMode, themeName)
    }, [themeName]);

    React.useEffect(() => {
        setThemeName(contextData.themeName);
    }, [contextData.themeName]);

    React.useEffect(() => {
        if (contextData.loadingQsoData)
            setSpinnerOpen(true);
        else
            setSpinnerOpen(false);
    }, [contextData.loadingQsoData]);

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            initTheme();
        else
            window.addEventListener('pywebviewready', initTheme);

        function initTheme() {
            const themeName = window.localStorage.getItem("THEME_NAME") || 'def-dark';
            const newCtx = { ...contextData };
            newCtx.themeName = themeName;
            setData(newCtx);
            setThemeName(themeName);
            checkMigration();
        };
    }, []);

    function checkMigration() {
        if (window.pywebview) {
            window.pywebview.api.extras.check_migration_flag()
                .then((x: string) => {
                    const j = checkApiResponse2(x, addMessage)
                    console.log('checking migration flag', j);
                    if (j.success) {
                        const do_migrate = j.migrate_flag;
                        if (do_migrate) {
                            console.log('gotta migrate');
                            setModalOpen(true);
                        }
                    }
                });
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <Stack direction="column"
                height={'100vh'}
                ml="1.5rem"
                mr="1.5rem">
                <Grid
                    container
                    sx={{
                        "&.MuiGrid-root": { backgroundColor: (theme) => theme.palette.background.default }
                    }}
                    overflow='hidden'
                    className='sticky'
                    direction="row"
                    justifyContent="space-evenly"
                    spacing={{ xs: 1, md: 1 }}
                >
                    <Grid item xs={12} >
                        <AppMenu />
                    </Grid>
                    <Grid container item xs={12} sx={{ position: 'relative' }}>
                        <Backdrop
                            sx={{ position: 'absolute', color: '#ff00aa', zIndex: 1500 }}
                            open={spinnerOpen}
                        >
                            <CircularProgress color="inherit" />
                        </Backdrop>
                        <Grid item xs={7} sx={{ minHeight: 200 }}>
                            <QsoEntry />
                        </Grid>
                        <Grid item xs={5} >
                            <BasicTabs />
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <FilterBar />
                    </Grid>
                </Grid>
                <SpotViewer />
                <Footer />
            </Stack>
            <MigrateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} migrateFromInstall={true} />
        </ThemeProvider>
    )
}