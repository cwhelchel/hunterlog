import { ThemeOptions } from "@mui/material"

export const DefaultTheme = (): ThemeOptions => ({
    palette: {
        mode: 'dark',
        primary: { main: '#008C2C' },
        secondary: { main: '#7e0e5b' },
        background: { default: '#000000', paper: '#0f120f' },
        text: { primary: '#f0f0f0', secondary: '#b9b9b9' },
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
        // h2 is used as header for the modal dialogs. there are no h1's
        h2: { fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.02em' },
        button: { textTransform: 'uppercase', fontWeight: 600 },
    },
    shape: {
        borderRadius: 4, // the default radius is 4 on classic HL
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