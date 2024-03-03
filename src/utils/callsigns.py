
def get_basecall(callsign: str) -> str:
    '''
    Get the base component of a given callsign (ie. the callsign without '/P'
    suffixes or country prefixes ie 'W4/').
    '''
    if callsign is None:
        return ""

    if "/" in callsign:
        basecall = max(
            callsign.split("/")[0],
            callsign.split("/")[1],
            key=len)
    else:
        basecall = callsign
    return basecall
