import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider, ThemeOptions, createTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers'
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { Link } from '@mui/material'

import { AppContextProvider } from './components/AppContext'
import SpotViewer from './components/SpotViewer/SpotViewer'
import QsoEntry from './components/QsoEntry/QsoEntry'
import LeafMap from './components/Map/Map'
import ParkInfo from './components/Map/ParkInfo'
import ConfigModal from './components/Config/ConfigModal'
import { ActivatorInfo } from './components/ActivatorInfo/ActivatorInfo'
import { FilterBar } from './components/FilterBar/FilterBar'
import { UpdateStats } from './components/Stats/UpdateStats'
import AppMenu from './components/AppMenu/AppMenu'
import Footer from './components/Footer/Footer'


import './index.scss'

const darkTheme = createTheme({
    palette: {
        mode: 'dark'
    }
});

export const potaTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#008C2C' },
        secondary: { main: '#8c0060' }
    }
});


const App = function () {
    return (
        <>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <AppContextProvider>
                    <ThemeProvider theme={potaTheme}>
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
                                // divider={<Divider orientation="vertical" flexItem />}
                                spacing={{ xs: 1, md: 2 }}
                                height="50%">
                                <Grid item xs={12} >
                                    <AppMenu />
                                </Grid>
                                <Grid item xs={4}>
                                    <QsoEntry />
                                </Grid>
                                <Grid item xs={4}>
                                    <ActivatorInfo />
                                </Grid>
                                <Grid item xs={4}>
                                    {/* <LeafMap /> */}
                                    <ParkInfo/>
                                </Grid>
                                <Grid item xs={12}>
                                    <FilterBar />
                                </Grid>
                            </Grid>
                            <SpotViewer />
                            <Footer />
                        </Stack>
                    </ThemeProvider>
                </AppContextProvider>
            </LocalizationProvider >
        </>
    )
}

const view = App('pywebview')

const element = document.getElementById('app')
ReactDOM.render(view, element)