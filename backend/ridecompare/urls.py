from django.contrib import admin
from django.urls import path, include
from .views import home

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/rides/', include('rides.urls')),
]