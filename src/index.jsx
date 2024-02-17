import React from 'react'
import ReactDOM from 'react-dom'
import { AppContextProvider } from './components/AppContext'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers'
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';

import SpotViewer from './components/SpotViewer/SpotViewer'
import QsoEntry from './components/QsoEntry/QsoEntry'
import LeafMap from './components/Map/Map'
import { ActivatorInfo } from './components/ActivatorInfo/ActivatorInfo'

import './index.scss'


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
                            <Stack
                                direction="row"
                                justifyContent="space-evenly"
                                margin="3rem"
                                height="40%">
                                <QsoEntry />
                                <ActivatorInfo />
                                <LeafMap />
                            </Stack>
                            <SpotViewer />
                        </Stack>
                    </ThemeProvider>
                </AppContextProvider>
            </LocalizationProvider>
        </>
    )
}

const view = App('pywebview')

const element = document.getElementById('app')
ReactDOM.render(view, element)