from django.urls import path
from . import views

app_name = 'manufacturing'

urlpatterns = [
    path('line-map/', views.LineMapView.as_view(), name='line_map'),
    path('line-master/', views.LineMasterView.as_view(), name='line_master'),
    path('line-master/edit/<int:pk>/', views.LineMasterView.as_view(), name='line_edit'),
    path('line-master/delete/<int:pk>/', views.LineMasterView.as_view(), name='line_delete'),
    path('machine-master/', views.MachineMasterView.as_view(), name='machine_master'),
    path('machine-master/edit/<int:pk>/', views.MachineEditView.as_view(), name='machine_edit'),
    path('machine-master/delete/<int:pk>/', views.MachineDeleteView.as_view(), name='machine_delete'),
]