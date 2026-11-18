import { ThemeOptions } from "@mui/material"

export const BlueyTheme = (): ThemeOptions => ({
    palette: {
        mode: 'dark',
        primary: { main: '#90caf9', light: '#e3f2fd', dark: '#42a5f5' },
        secondary: { main: '#ce93d8' },
        background: { default: '#0f172a', paper: '#1e293b' },
        text: { primary: '#f8fafc', secondary: '#94a3b8' },
        alert: {
            main: '#E3D026',
            light: '#E9DB5D',
            dark: '#A29415',
            contrastText: '#242105',
        },
        timeNew: { main: '#008000' },
        timeOld: { main: '#b22222' },
        timeAging: { main: '#daa520' },
        timeBrandNew: { main: '#7fff00' }
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