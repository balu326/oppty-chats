import os
import mimetypes
from pathlib import Path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.sessions import SessionMiddlewareStack
from django.core.asgi import get_asgi_application
from django.conf import settings

django_asgi_app = get_asgi_application()

from chatapp.routing import websocket_urlpatterns


class MediaFileMiddleware:
    """Serve MEDIA_ROOT files under MEDIA_URL for local dev."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            media_url = settings.MEDIA_URL  # e.g. "/media/"
            if path.startswith(media_url):
                rel = path[len(media_url):]
                file_path = Path(settings.MEDIA_ROOT) / rel
                if file_path.is_file():
                    content = file_path.read_bytes()
                    mime, _ = mimetypes.guess_type(str(file_path))
                    mime = mime or "application/octet-stream"
                    await send({"type": "http.response.start", "status": 200,
                                "headers": [[b"content-type", mime.encode()],
                                            [b"content-length", str(len(content)).encode()],
                                            [b"cache-control", b"no-cache"]]})
                    await send({"type": "http.response.body", "body": content})
                    return
        await self.app(scope, receive, send)


http_app = MediaFileMiddleware(django_asgi_app)

application = ProtocolTypeRouter(
    {
        "http": http_app,
        "websocket": SessionMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
