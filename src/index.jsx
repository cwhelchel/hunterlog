import React from 'react'
import ReactDOM from 'react-dom'
import { AppContextProvider } from './components/AppContext'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers'
import CssBaseline from '@mui/material/CssBaseline';

import Header from './components/Header/Header'
import Editor from './components/Editor/Editor'
import Ticker from './components/Ticker/Ticker'
import SpotViewer from './components/SpotViewer/SpotViewer'
import QsoEntry from './components/QsoEntry/QsoEntry'
import LeafMap from './components/Map/Map'

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
                        <Header />
                        <Ticker />
                        <LeafMap />
                        <QsoEntry />
                        <SpotViewer />
                        <Editor />
                    </ThemeProvider>
                </AppContextProvider>
            </LocalizationProvider>
        </>
    )
}

const view = App('pywebview')

const element = document.getElementById('app')
ReactDOM.render(view, element)