from django.urls import path
from manufacturing.views.master.line_master_view import LineMasterView
from manufacturing.views.master.machine_master_view import MachineMasterView
from manufacturing.views.map.line_map_view import LineMapView

app_name = 'manufacturing'

urlpatterns = [
    path('line-map/', LineMapView.as_view(), name='line_map'),
    path('line-master/', LineMasterView.as_view(), name='line_master'),
    path('line-master/<int:pk>/', LineMasterView.as_view(), name='line_master_pk'),
    path('line-master/edit/<int:pk>/', LineMasterView.as_view(), name='line_edit'),
    path('line-master/delete/<int:pk>/', LineMasterView.as_view(), name='line_delete'),
    path('machine-master/', MachineMasterView.as_view(), name='machine_master'),
    path('machine-master/<int:pk>/', MachineMasterView.as_view(), name='machine_master_pk'),
    path('machine-master/edit/<int:pk>/', MachineMasterView.as_view(), name='machine_edit'),
    path('machine-master/delete/<int:pk>/', MachineMasterView.as_view(), name='machine_delete'),
]