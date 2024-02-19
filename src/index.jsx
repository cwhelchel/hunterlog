import React from 'react'
import ReactDOM from 'react-dom'
import { AppContextProvider } from './components/AppContext'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers'
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';

import SpotViewer from './components/SpotViewer/SpotViewer'
import QsoEntry from './components/QsoEntry/QsoEntry'
import LeafMap from './components/Map/Map'
import { ActivatorInfo } from './components/ActivatorInfo/ActivatorInfo'

import './index.scss'
import { FilterBar } from './components/FilterBar/FilterBar'


const darkTheme = createTheme({
    palette: {
        mode: 'dark'
    }
});


const App = function () {
    return (
        <>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <AppContextProvider>
                    <ThemeProvider theme={darkTheme}>
                        <CssBaseline />
                        <Stack direction="column">
                            <Grid
                                container
                                sx={{
                                    "&.MuiGrid-root": { backgroundColor: (theme) => theme.palette.background.default }
                                }}
                                className='sticky'
                                direction="row"
                                justifyContent="space-evenly"
                                divider={<Divider orientation="vertical" flexItem />}
                                spacing={{ xs: 2, md: 4 }}
                                m={3}
                                height="50%">
                                <Grid item xs={4}>
                                    <QsoEntry />
                                </Grid>
                                <Grid item xs={4}>
                                    <ActivatorInfo />
                                </Grid>
                                <Grid item xs={4}>
                                    <LeafMap />
                                </Grid>
                                <Grid item xs={12}>
                                    <FilterBar />
                                </Grid>
                            </Grid>
                            <SpotViewer />
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