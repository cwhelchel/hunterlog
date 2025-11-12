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
        setErrorMsg(j['message'], contextData, setData);
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

export function checkReferenceForSota(ref: string) {
    // eslint-disable-next-line no-useless-escape
    const regex = new RegExp('[a-zA-Z0-9]{2,3}\/[a-zA-Z0-9]{2}-[0-9]{3}');
    return regex.test(ref);
}

export function checkReferenceForWwff(ref: string) {
    const regex = new RegExp('[a-zA-Z0-9]{1,2}FF-[0-9]{4}');
    return regex.test(ref);
}

export function checkReferenceForPota(ref: string) {
    const regex = new RegExp('[A-Z0-9]+-[0-9]*');
    return regex.test(ref);
}

export function checkReferenceForWwbota(ref: string) {
    // eslint-disable-next-line no-useless-escape
    const regex = new RegExp('B\/[A-Z0-9]+-[0-9]*');
    return regex.test(ref);
}