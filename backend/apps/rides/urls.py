from django.urls import path
from .views import (
    RideCompareView,
    SearchHistoryListView,
    SearchHistoryDeleteView,
    SearchHistoryClearView
)

urlpatterns = [
    path('compare/', RideCompareView.as_view(), name='ride-compare'),
    path('history/', SearchHistoryListView.as_view(), name='search-history-list'),
    path('history/<uuid:pk>/', SearchHistoryDeleteView.as_view(), name='search-history-delete'),
    path('history/clear/', SearchHistoryClearView.as_view(), name='search-history-clear'),
]