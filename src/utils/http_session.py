from requests_cache import CachedSession

from version import __version__


http = CachedSession(
    backend="memory",
    expire_after=0,  # Default to no caching, but overridden by cache_control headers
    cache_control=True,
)
http.headers.update({
    "User-Agent": f"hunterlog/{__version__}",
})
