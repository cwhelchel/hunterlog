/*
Check the JSON response from the backend endpoints found in api.py

@param x: string json response from api methods
@param addMessage: addMessage from useMessageQueue
@returns parsed response JSON or null if no response
*/
export function checkApiResponse2(x: string, addMessage: (msg: MessageType) => void) {
    if (x === null)
        return null;

    const j = JSON.parse(x);
    // console.log('checkApiResponse2', j);


    if (!("success" in j)) {
        // normal success values is missing. this is some other object just return it
        return j;
    }

    const msg = j['message'];

    if (j['success']) {
        if (j['persist']) {
            // extended flag from API. persist means show this as alert (not toast)
            showInfoAlert(msg, addMessage);
            return j;
        }

        // if a success response's message is empty string, dont toast
        if (j['message'] !== "")
            showSuccessToast(msg, addMessage);
    } else {
        // unsuccessful returns
        if (j['transient']) {
            // message is a toast. failure is not critical
            showErrorToast(msg, addMessage);
        } else {
            // user needs to see this and clear it
            showErrorAlert(msg, addMessage);
        }
    }

    return j;
}

/* TOAST helper functions. React MUI SnackBar == Toast */

export function showSuccessToast(msg: string, addMessage: (msg: MessageType) => void) {
    addMessage({
        id: 0,
        message: msg,
        type: 1,
        color: "success"
    });
}

export function showInfoToast(msg: string, addMessage: (msg: MessageType) => void) {
    addMessage({
        id: 0,
        message: msg,
        type: 1,
        color: "info"
    });
}

export function showWarningToast(msg: string, addMessage: (msg: MessageType) => void) {
    addMessage({
        id: 0,
        message: msg,
        type: 1,
        color: "warning"
    });
}

export function showErrorToast(msg: string, addMessage: (msg: MessageType) => void) {
    addMessage({
        id: 0,
        message: msg,
        type: 1,
        color: "error"
    });
}

/* Alerts helper functions - persists until closed. See AppMenu.tsx */

export function showSuccessAlert(msg: string, addMessage: (msg: MessageType) => void) {
    addMessage({
        id: 0,
        message: msg,
        type: 0,
        color: "success"
    });
}

export function showInfoAlert(msg: string, addMessage: (msg: MessageType) => void) {
    addMessage({
        id: 0,
        message: msg,
        type: 0,
        color: "info"
    });
}

export function showWarningAlert(msg: string, addMessage: (msg: MessageType) => void) {
    addMessage({
        id: 0,
        message: msg,
        type: 0,
        color: "warning"
    });
}

export function showErrorAlert(msg: string, addMessage: (msg: MessageType) => void) {
    addMessage({
        id: 0,
        message: msg,
        type: 0,
        color: "error"
    });
}