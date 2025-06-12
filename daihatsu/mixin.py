from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import redirect

class Mixin(LoginRequiredMixin):
    """認可管理の親クラス"""
    
    user_groups = []
    admin_groups = []
    
    # アクセス時に最初に実行されるメソッド
    def dispatch(self, request, *args, **kwargs):
        # ログインチェック（親クラスで実行）
        if not request.user.is_authenticated:
            return self.handle_no_permission()

        # ユーザー権限チェック
        if not self.has_permission(request.user):
            if request.headers.get('HX-Request'):
                return JsonResponse({
                    'status': 'error',
                    'message': 'このページにアクセスする権限がありません。',
                    'redirect': '/auth/login'
                }, status=403)
            else:
                return redirect('/auth/login')
        
        return super().dispatch(request, *args, **kwargs)
    
    def has_permission(self, user):
        """基本権限チェック"""
        if not user.is_authenticated:
            return False
        # user_groupsとadmin_groupsを結合して使用
        groups = list(set(self.user_groups + self.admin_groups))
        return user.groups.filter(name__in=groups).exists()
    
    def has_admin_permission(self, user):
        """管理者権限チェック"""
        return user.groups.filter(name__in=self.admin_groups).exists()
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_admin'] = self.has_admin_permission(self.request.user)
        return context