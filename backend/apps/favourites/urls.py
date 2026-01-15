from django.urls import path
from .views import FavouriteListCreateView, FavouriteDetailView

urlpatterns = [
    path('', FavouriteListCreateView.as_view(), name='favourite-list-create'),
    path('<uuid:pk>/', FavouriteDetailView.as_view(), name='favourite-detail'),
]