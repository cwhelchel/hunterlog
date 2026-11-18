import { ThemeOptions } from "@mui/material"

export const BlueyLightTheme = (): ThemeOptions => ({
    palette: {
        mode: 'light',
        primary: { main: '#40a6fa', light: '#93d2ff', dark: '#2676b8' },
        secondary: { main: '#91479e' },
        background: { default: '#e6e6e6', paper: '#d0e1ff' },
        text: { primary: '#000000', secondary: '#bdbdbd' },
        alert: {
            main: '#E3D026',
            light: '#E9DB5D',
            dark: '#A29415',
            contrastText: '#242105',
        },
        timeNew: { main: '#008000' },
        timeOld: { main: '#b22222' },
        timeAging: { main: '#daa520' },
        timeBrandNew: { main: '#0a910a' }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h2: { fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.02em' },
        button: { textTransform: 'capitalize', fontWeight: 600 }, // Disables default ALL CAPS
    },
    shape: {
        borderRadius: 10, // Modern rounded corners across buttons, cards, and inputs
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true, // Removes heavy default Material shadows
            },
            styleOverrides: {
                root: {
                    padding: '8px 18px',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none', // Clean, flat SaaS aesthetic
                }),
            },
        },
    },
});