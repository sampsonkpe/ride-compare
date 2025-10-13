from django.urls import path
from .views import RideOptionsView, RideBookView

urlpatterns = [
    path('options/', RideOptionsView.as_view(), name='ride-options'),
    path('book/', RideBookView.as_view(), name='ride-book'),
]