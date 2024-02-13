import React from 'react'
import ReactDOM from 'react-dom'

import Header from './components/Header/Header'
import Editor from './components/Editor/Editor'
import Ticker from './components/Ticker/Ticker'
import SpotViewer from './components/SpotViewer/SpotViewer'
import { AppContextProvider } from './components/AppContext'

import './index.scss'

const App = function () {
    return (
        <>
            <AppContextProvider>
                <Header />
                <Ticker />
                <SpotViewer />
                <Editor />
            </AppContextProvider>
        </>
    )
}

const view = App('pywebview')

const element = document.getElementById('app')
ReactDOM.render(view, element)