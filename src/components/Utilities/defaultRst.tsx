export function getModeDefaultRst(mode: string) : string {
    // default rst for modes is 59 (covers most voice modes i can think off)
    let rst = '59';
    mode = mode.toUpperCase();
    switch (mode) {
        case "CW":
            rst = '599'
            break;
        case "FT8":
            rst = '+00';
            break;
        case "FT4":
            rst = '+00';
            break;
    }
    return rst;
}