from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

from chatapp.views import HealthView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", HealthView.as_view()),
    path("api/", include("chatapp.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
