import logging
import socket

log = logging.getLogger(__name__)


def send_tcp_msg(msg: str, host: str, port: int):
    """
    Send a adif message to a remote TCP endpoint
    """
    log.debug(f"sending to {host}:{port} with data {msg}")

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect((host, port))
            sock.send(msg.encode())
    except Exception as err:
        log.error("_send_msg exception:", err)


def send_udp_msg(msg: str, host: str, port: int):
    """
    Send a adif message to a remote UDP endpoint
    """
    log.debug(f"sending to {host}:{port} with data {msg}")

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect((host, port))
            sock.send(msg.encode())
    except Exception as err:
        log.error("_send_msg exception:", err)
