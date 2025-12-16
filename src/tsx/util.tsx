import { ContextData } from "../@types/ContextTypes";

/*
Check the JSON response from the backend endpoints found in api.py

@param x: string json response from api methods
@param contextData: the context data object
@param setData: the useContext's
@returns parsed response JSON or null if no response
*/
export function checkApiResponse(x: string, contextData: ContextData, setData: (d: ContextData) => void) {
    if (x === null)
        return null;

    const j = JSON.parse(x);

    if (!("success" in j)) {
        // normal success values is missing. this is some other object just return it
        return j;
    }

    if (j['success']) {
        // extended flag from API. persist means show this as alert (not toast)
        if (j['persist']) {
            setInfoMsg(j['message'], contextData, setData);
            return j;
        }

        // if a success response's message is empty string, dont toast
        if (j['message'] !== "")
            setToastMsg(j['message'], contextData, setData);

    } else {
        // unsuccessful returns
        if (j['transient']) {
            // message is a toast. failure is not critical
            setToastMsg(j['message'], contextData, setData);
        } else {
            // user needs to see this and clear it
            setErrorMsg(j['message'], contextData, setData);
        }
    }

    return j;
}

export function setToastMsg(msg: string, contextData: ContextData, setData: (d: ContextData) => void) {
    const newCtxData = { ...contextData };
    newCtxData.errorMsg = msg;
    newCtxData.errorSeverity = 'success';
    setData(newCtxData);
}

export function setErrorMsg(msg: string, contextData: ContextData, setData: (d: ContextData) => void) {
    const newCtxData = { ...contextData };
    newCtxData.errorMsg = msg;
    newCtxData.errorSeverity = 'error';
    setData(newCtxData);
}


export function setInfoMsg(msg: string, contextData: ContextData, setData: (d: ContextData) => void) {
    const newCtxData = { ...contextData };
    newCtxData.errorMsg = msg;
    newCtxData.errorSeverity = 'info';
    setData(newCtxData);
}