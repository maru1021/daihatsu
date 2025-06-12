from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import redirect
from daihatsu.mixin import Mixin

class ManufacturingPermissionMixin(Mixin):
    """製造部門の権限制御"""
    user_groups = ['manufacturing_user']
    admin_groups = ['manufacturing_admin']
