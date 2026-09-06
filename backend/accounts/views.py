from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    Public customer registration endpoint.

    Anyone can create a customer account without
    being authenticated first.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint for Customer, Agent and Admin users.
    """

    serializer_class = CustomTokenObtainPairSerializer