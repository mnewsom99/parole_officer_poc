
// Global Error Reporting Utility

const initErrorReporting = () => {
    // 1. Capture Unhandled Exceptions (Synchronous)
    window.onerror = (message, source, lineno, colno, error) => {
        console.group('%c🚨 Uncaught Exception', 'color: red; font-weight: bold; font-size: 14px;');
        console.error(`Message: ${message}`);
        console.error(`Source: ${source}:${lineno}:${colno}`);
        if (error && error.stack) {
            console.error('Stack Trace:', error.stack);
        }
        console.groupEnd();

        // In a real app, you would send this to Sentry/LogRocket here
        // sendToErrorService({ message, source, lineno, colno, stack: error?.stack });

        return false; // Let the default handler run (log to console)
    };

    // 2. Capture Unhandled Promise Rejections (Async)
    window.onunhandledrejection = (event) => {
        console.group('%c⚠️ Unhandled Promise Rejection', 'color: orange; font-weight: bold; font-size: 14px;');
        console.error('Reason:', event.reason);
        console.groupEnd();
    };

    console.log('%c🛡️ Client-Side Error Reporting Active', 'color: green; font-weight: bold;');
};

export default initErrorReporting;
