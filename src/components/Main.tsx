import * as React from 'react';
import { Theme, ThemeProvider, createTheme } from '@mui/material/styles'
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

// Augment the palette to include an alert color
declare module '@mui/material/styles' {
    interface Palette {
        alert: Palette['primary'];
    }

    interface PaletteOptions {
        alert?: PaletteOptions['primary'];
    }
}

function buildTheme(isDark: boolean): Theme {
    return createTheme({
        palette: {
            mode: isDark ? 'dark' : 'light',
            primary: {
                main: isDark ? '#008C2C' : '#305c3e'
            },
            secondary: {
                main: isDark ? '#7e0e5b' : '#650b49' //og purp 8c0060 
            },
            alert: {
                main: '#E3D026',
                light: '#E9DB5D',
                dark: '#A29415',
                contrastText: '#242105',
            }
        }
    });
}

export default function Main() {
    const { contextData, setData } = useAppContext();
    const potaTheme = buildTheme(true);
    const [theme, setTheme] = React.useState(potaTheme);

    React.useEffect(() => {
        const isDark = contextData.themeMode == 'dark';
        const temp = buildTheme(isDark);
        setTheme(temp);
    }, [contextData.themeMode]);

    React.useEffect(() => {
        if (window.pywebview !== undefined && window.pywebview.api !== null)
            initTheme();
        else
            window.addEventListener('pywebviewready', initTheme);

        function initTheme() {
            let darkMode = window.localStorage.getItem("USE_DARK_MODE") || '1';
            let darkModeInt = parseInt(darkMode);

            const isDark = darkModeInt == 1;
            const temp = buildTheme(isDark);
            setTheme(temp);

            const newCtx = { ...contextData };
            if (isDark)
                newCtx.themeMode = 'dark';

            else
                newCtx.themeMode = 'light';
            setData(newCtx);
        };
    }, []);


    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Stack direction="column"
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
                    height="28%"
                >
                    <Grid item xs={12} >
                        <AppMenu />
                    </Grid>
                    <Grid item xs={7}>
                        <QsoEntry />
                    </Grid>
                    <Grid item xs={5} >
                        <BasicTabs />
                    </Grid>
                    <Grid item xs={12}>
                        <FilterBar />
                    </Grid>
                </Grid>
                <SpotViewer />
                <Footer />
            </Stack>
        </ThemeProvider>
    )
}