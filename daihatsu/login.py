from django.contrib.auth.views import LoginView, LogoutView
from django.shortcuts import redirect
from django.urls import reverse_lazy
from daihatsu.log import access_logger

class CustomLoginView(LoginView):
    template_name = 'auth/login.html'
    
    def form_valid(self, form):
        response = super().form_valid(form)
        user = form.get_user()
        access_logger.info(f'ログイン成功, {user.username}, {self.request.META.get("REMOTE_ADDR")}')
        return response
    
    def form_invalid(self, form):
        username = form.data.get('username', '')
        access_logger.warning(f'ログイン失敗, {username}, {self.request.META.get("REMOTE_ADDR")}')
        return super().form_invalid(form)

class CustomLogoutView(LogoutView):
    next_page = reverse_lazy('login')
    
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            access_logger.info(f'ログアウト, {request.user.username}, {request.META.get("REMOTE_ADDR")}')
        return super().dispatch(request, *args, **kwargs) 