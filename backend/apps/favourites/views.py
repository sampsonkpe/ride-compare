from rest_framework import status, generics, permissions
from rest_framework.response import Response
from .models import Favourite
from .serializers import FavouriteSerializer, FavouriteCreateSerializer


class FavouriteListCreateView(generics.ListCreateAPIView):
    """API endpoint to list and create favourites"""
    
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FavouriteCreateSerializer
        return FavouriteSerializer
    
    def get_queryset(self):
        # Return only current user's favourites
        return Favourite.objects.filter(user=self.request.user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        favourite = serializer.save()
        
        return Response(
            FavouriteSerializer(favourite).data,
            status=status.HTTP_201_CREATED
        )


class FavouriteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API endpoint to get, update, or delete a specific favourite"""
    
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = FavouriteSerializer
    
    def get_queryset(self):
        # Users can only access their own favourites
        return Favourite.objects.filter(user=self.request.user)