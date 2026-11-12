import json
import logging as L

import webview

log = L.getLogger(__name__)


def call_js(method: str):
    '''
    Executes the JS method on the pywebview state object.

    Method must take no parameters and the return is ignored.
    '''
    def get_js(m: str):
        return """
            if (window.pywebview.state !== undefined &&
                window.pywebview.state.{m} !== undefined) {{
                window.pywebview.state.{m}();
            }}
            """.format(m=method)

    if len(webview.windows) > 0:
        js = get_js(method)
        log.debug(f'calling {method} in frontend')
        try:
            webview.windows[0].evaluate_js(js)
        except Exception as ex:
            log.error(f'error executing JS {js}', exc_info=ex)


def call_js_param(method: str, param):
    '''
    Executes the JS method on the pywebview state object.

    Target js method must take 1 parameter. Passed in param Will be
    json.dumps'd
    '''
    def get_js(m: str):
        return """
            if (window.pywebview.state !== undefined &&
                window.pywebview.state.{m} !== undefined) {{
                window.pywebview.state.{m}({p});
            }}
            """.format(m=method, p=json.dumps(param))

    if len(webview.windows) > 0:
        js = get_js(method)
        log.debug(f'calling {method} in frontend')
        try:
            webview.windows[0].evaluate_js(js)
        except Exception as ex:
            log.error(f'error executing JS {js}', exc_info=ex)
