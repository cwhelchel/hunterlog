import React from "react";
import ReactDOM from 'react-dom'
import { createRoot } from "react-dom/client";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AppContextProvider } from './components/AppContext'
import Main from './components/Main'

import './index.scss'

export default function App() {
      return (
        <>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <AppContextProvider>
                   <Main/>
                </AppContextProvider>
            </LocalizationProvider >
        </>
    )
}

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App/>);