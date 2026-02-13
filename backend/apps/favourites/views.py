from rest_framework import status, generics, permissions
from rest_framework.response import Response

from .models import Favourite
from .serializers import FavouriteSerializer, FavouriteCreateSerializer


class FavouriteListCreateView(generics.ListCreateAPIView):
    """API endpoint to list and create saved places"""

    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FavouriteCreateSerializer
        return FavouriteSerializer

    def get_queryset(self):
        return Favourite.objects.filter(user=self.request.user).order_by("-created_at")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx.update({"request": self.request})
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        favourite = serializer.save()

        return Response(FavouriteSerializer(favourite).data, status=status.HTTP_201_CREATED)


class FavouriteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API endpoint to get, update, or delete a specific saved place"""

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = FavouriteSerializer

    def get_queryset(self):
        return Favourite.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx.update({"request": self.request})
        return ctx