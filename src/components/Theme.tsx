// src/theme/theme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { DefaultTheme } from './Themes/DefaultTheme';
import { DefaultLightTheme } from './Themes/DefaultLightTheme';
import { BlueyTheme } from './Themes/BlueyTheme';
import { BlueyLightTheme } from './Themes/BlueyLightTheme';
import { AmberTerminalTheme, ClassicLightTheme, GraphiteTheme, MidnightBlueTheme, SandLightTheme, SkyLightTheme } from './Themes/AdditionalThemes';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const themes: Record<string, any> = {
//     "def-dark": {
//         primary: { main: '#008C2C' },
//         secondary: { main: '#7e0e5b' },
//         background: { default: '#000000', paper: '#121212' },
//         //text: { primary: '#0f172a', secondary: '#475569' },
//         alert: {
//             main: '#E3D026',
//             light: '#E9DB5D',
//             dark: '#A29415',
//             contrastText: '#242105',
//         }
//     },
//     "def-light": {
//         primary: { main: '#305c3e', },
//         secondary: { main: '#650b49' },
//         // background: { default: '#000000', paper: '#121212' },
//         //text: { primary: '#f8fafc', secondary: '#94a3b8' },
//         alert: {
//             main: '#E3D026',
//             light: '#E9DB5D',
//             dark: '#A29415',
//             contrastText: '#242105',
//         }
//     },
//     "bluey-dark": {
//         primary: { main: '#90caf9', light: '#e3f2fd', dark: '#42a5f5' },
//         secondary: { main: '#ce93d8' },
//         background: { default: '#0f172a', paper: '#1e293b' },
//         text: { primary: '#f8fafc', secondary: '#94a3b8' },
//         alert: {
//             main: '#E3D026',
//             light: '#E9DB5D',
//             dark: '#A29415',
//             contrastText: '#242105',
//         }
//     },
//     "bluey-light": {
//         primary: { main: '#40a6fa', light: '#93d2ff', dark: '#2676b8' },
//         secondary: { main: '#91479e' },
//         background: { default: '#e6e6e6', paper: '#919eb4' },
//         //text: { primary: '#f8fafc', secondary: '#93abce' },
//         alert: {
//             main: '#E3D026',
//             light: '#E9DB5D',
//             dark: '#A29415',
//             contrastText: '#242105',
//         }
//     }
// }

// function getColors(mode: string, theme: string) {

//     console.log('getting theme for', theme, mode)
//     const my_theme = themes[theme];
//     console.log('got', my_theme)

//     return my_theme;
// }

function getTheme(theme: string): ThemeOptions {
    switch (theme) {
        case "def-dark":
            return DefaultTheme();
        case "def-light":
            return DefaultLightTheme();
        case "bluey-dark":
            return BlueyTheme();
        case "bluey-light":
            return BlueyLightTheme();
        case "midnight-blue":
            return MidnightBlueTheme();
        case "terminal":
            return AmberTerminalTheme();
        case "graphite":
            return GraphiteTheme();
        case "classic-light":
            return ClassicLightTheme();
        case "skylight":
            return SkyLightTheme();
        case "sandlight":
            return SandLightTheme();
        default:
            return DefaultTheme();
    }
}

export const getDesignTokens = (theme: string): ThemeOptions => ({
    ...
    getTheme(theme)
});

export const createAppTheme = (mode: 'light' | 'dark', theme: string) =>
    createTheme(getDesignTokens(theme));
