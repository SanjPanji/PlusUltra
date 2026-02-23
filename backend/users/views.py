"""
Authentication views for PlusUltra.

Endpoints
---------
POST /auth/login        — obtain JWT access + refresh tokens
POST /auth/logout       — blacklist refresh token
POST /auth/refresh      — obtain new access token from refresh
GET  /auth/me           — current user profile
GET  /auth/users/       — list all users (admin only)
POST /auth/users/       — create user (admin only)
"""
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .permissions import IsAdminRole
from .serializers import LoginSerializer, UserSerializer, UserCreateSerializer


class LoginView(APIView):
    """
    POST /auth/login

    Request body:
        { "email": "...", "password": "..." }

    Response:
        { "access": "...", "refresh": "...", "user": { ... } }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /auth/logout

    Request body:
        { "refresh": "<refresh_token>" }

    Blacklists the refresh token to invalidate the session.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)


class CurrentUserView(APIView):
    """GET /auth/me — returns the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /auth/users/ — list all users (admin only)
    POST /auth/users/ — create a new user (admin only)
    """

    queryset = User.objects.all().order_by("-created_at")
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer
class RegisterView(generics.CreateAPIView):
    """
    POST /auth/register/

    Allows public user registration.
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]
