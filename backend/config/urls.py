from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        "message": "RideCompare API",
        "endpoints": [
            "/api/auth/",
            "/api/rides/",
            "/api/favourites/"
        ]
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", api_root),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/rides/', include('apps.rides.urls')),
    path('api/favourites/', include('apps.favourites.urls')),
]