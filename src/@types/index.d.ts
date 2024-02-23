export { };

// done here so TypeScript stops yelling about pywebview not being available.
declare global {
    interface Window {
        pywebview: any;
    }
}