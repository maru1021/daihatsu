from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('auth/login', auth_views.LoginView.as_view(template_name='auth/login.html'), name='login'),
    path('auth/logout', auth_views.LogoutView.as_view(), name='logout'),
    path('admin/', admin.site.urls),
    path('manufacturing/', include('manufacturing.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)