import { ThemeOptions } from "@mui/material"

/* ------------------------------ DARK THEMES ------------------------------ */

// Navy/slate with a light blue accent and purple highlights (matches the screenshot)
// Softer, rounder look with sentence-case buttons
export const MidnightBlueTheme = (): ThemeOptions => ({
    palette: {
        mode: 'dark',
        primary: { main: '#293fbb' },
        secondary: { main: '#9640cc' },
        background: { default: '#0b1220', paper: '#111a2e' },
        text: { primary: '#e8eefc', secondary: '#9fb0d0' },
        success: { main: '#2e9e5b', contrastText: '#cccccc' }, //2e9e5b
        alert: {
            main: '#F2C94C',
            light: '#F5D77A',
            dark: '#B8942F',
            contrastText: '#2a2105',
        },
        timeNew: { main: '#2e9e5b' },
        timeOld: { main: '#e5534b' },
        timeAging: { main: '#e0a526' },
        timeBrandNew: { main: '#5cf28a' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h2: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em' },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    padding: '8px 20px',
                    borderRadius: 2, // pill buttons
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' }, // removes MUI's dark-mode elevation tint
            },
        },
        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                }),
            },
        },
        MuiAlert: {
            styleOverrides: {
                filledSuccess: ({ theme }) => ({
                    // force the filled alerts to honor contrastText color
                    color: theme.palette.success.contrastText,
                }),
            },
        },
    },
});

// Amber on black, old-school radio shack
// Monospace, square corners, wide-tracked buttons
export const AmberTerminalTheme = (): ThemeOptions => ({
    palette: {
        mode: 'dark',
        primary: { main: '#FFB000' },
        secondary: { main: '#ff6a3d' },
        background: { default: '#0a0700', paper: '#14100a' },
        text: { primary: '#ffe8b8', secondary: '#c2a370' },
        alert: {
            main: '#ff7043',
            light: '#ff9a76',
            dark: '#c63f17',
            contrastText: '#2b0d03',
        },
        timeNew: { main: '#6fae3a' },
        timeOld: { main: '#c0392b' },
        timeAging: { main: '#e6a817' },
        timeBrandNew: { main: '#b6f23c' },
    },
    typography: {
        fontFamily: '"JetBrains Mono", "Roboto Mono", "Consolas", "Courier New", monospace',
        fontSize: 13,
        h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
        button: { textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' },
    },
    shape: {
        borderRadius: 0,
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    padding: '6px 16px',
                    border: '1px solid currentColor',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => ({
                    border: `1px solid ${theme.palette.primary.dark}`,
                    boxShadow: 'none',
                }),
            },
        },
    },
});

// Neutral graphite grey with a teal accent
// Compact and dense, tight corners
export const GraphiteTheme = (): ThemeOptions => ({
    palette: {
        mode: 'dark',
        primary: { main: '#26a69a' },
        secondary: { main: '#ec6aa0' },
        background: { default: '#121212', paper: '#1e1e1e' },
        text: { primary: '#eeeeee', secondary: '#aaaaaa' },
        alert: {
            main: '#FFCA28',
            light: '#FFD95A',
            dark: '#C79A00',
            contrastText: '#262000',
        },
        timeNew: { main: '#2e7d32' },
        timeOld: { main: '#d32f2f' },
        timeAging: { main: '#f9a825' },
        timeBrandNew: { main: '#76ff03' },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 13,
        h2: { fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.01em' },
        button: { textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.06em', fontSize: '0.75rem' },
    },
    shape: {
        borderRadius: 2,
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
                size: 'small',
            },
            styleOverrides: {
                root: {
                    padding: '4px 12px',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                }),
            },
        },
    },
});

/* ------------------------------ LIGHT THEMES ----------------------------- */

// Clean white with the same green as the default dark theme
// Closest to the default layout, with a light shadow on cards
export const ClassicLightTheme = (): ThemeOptions => ({
    palette: {
        mode: 'light',
        primary: { main: '#007A27' },
        secondary: { main: '#7e0e5b' },
        background: { default: '#f4f6f4', paper: '#ffffff' },
        text: { primary: '#1a1f1a', secondary: '#555c55' },
        alert: {
            main: '#E3D026',
            light: '#E9DB5D',
            dark: '#A29415',
            contrastText: '#242105',
        },
        timeNew: { main: '#2e7d32' },
        timeOld: { main: '#b22222' },
        timeAging: { main: '#b8860b' },
        timeBrandNew: { main: '#4caf00' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h2: { fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.02em' },
        button: { textTransform: 'uppercase', fontWeight: 600 },
    },
    shape: {
        borderRadius: 4,
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
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
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                }),
            },
        },
    },
});

// Cool blue light theme
// Large radii, pill buttons, soft shadows, sentence-case text
export const SkyLightTheme = (): ThemeOptions => ({
    palette: {
        mode: 'light',
        primary: { main: '#1565c0' },
        secondary: { main: '#8e24aa' },
        background: { default: '#eef3fa', paper: '#ffffff' },
        text: { primary: '#14213d', secondary: '#4d5b78' },
        alert: {
            main: '#F9A825',
            light: '#FBC14F',
            dark: '#B77800',
            contrastText: '#2a1b00',
        },
        timeNew: { main: '#2e7d32' },
        timeOld: { main: '#c62828' },
        timeAging: { main: '#b7791f' },
        timeBrandNew: { main: '#3fae00' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h2: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.025em' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    padding: '8px 22px',
                    borderRadius: 999,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(21, 101, 192, 0.12)',
                },
            },
        },
    },
});

// Warm paper / sand tones, easy on the eyes
// Serif headings, slightly rounded, understated buttons
export const SandLightTheme = (): ThemeOptions => ({
    palette: {
        mode: 'light',
        primary: { main: '#a0522d' },
        secondary: { main: '#3f6b5a' },
        background: { default: '#f5efe3', paper: '#fffaf0' },
        text: { primary: '#2b2118', secondary: '#6b5d4d' },
        alert: {
            main: '#d98e04',
            light: '#e8ab3a',
            dark: '#9a6400',
            contrastText: '#241600',
        },
        timeNew: { main: '#3d7a3d' },
        timeOld: { main: '#a63232' },
        timeAging: { main: '#b8860b' },
        timeBrandNew: { main: '#5a9e1a' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h2: { fontFamily: '"Georgia", "Times New Roman", serif', fontSize: '1.9rem', fontWeight: 600, letterSpacing: '-0.01em' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 6,
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
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
                    boxShadow: 'none',
                    backgroundColor: theme.palette.background.paper,
                }),
            },
        },
    },
});
