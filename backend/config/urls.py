from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/rides/', include('apps.rides.urls')),
    path('api/favourites/', include('apps.favourites.urls')),
]