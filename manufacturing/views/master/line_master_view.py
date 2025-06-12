from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from django.views.generic import TemplateView
from django.core.paginator import Paginator
from manufacturing.models import Line
from django.shortcuts import render
from django.urls import reverse
from manufacturing.mixin import ManufacturingPermissionMixin
from daihatsu.views.basic_table_view import BasicTableView
from django.db.models import Q

class LineMasterView(ManufacturingPermissionMixin, BasicTableView):
    crud_model = Line
    table_model = Line
    template_name = 'master/line_master/line_master.html'
    table_template = 'master/line_master/line_table_with_pagination.html'
    content_template = 'master/line_master/line_master_content.html'
    form_action_url = 'manufacturing:line_master'
    edit_url = 'manufacturing:line_edit'
    delete_url = 'manufacturing:line_delete'
    noti_text = 'ライン'
    
    admin_table_header = ['ライン名', 'X座標', 'Y座標', '幅', '高さ', 'ステータス', '操作']
    user_table_header = ['ライン名', 'ステータス']
    search_fields = ['name']
    
    def get_edit_data(self, data):
        response_data = {
              'status': 'success',
              'data': {
                  'id': data.id,
                  'name': data.name,
                  'x_position': data.x_position,
                  'y_position': data.y_position,
                  'width': data.width,
                  'height': data.height,
                  'active': data.active
              },
              'edit_url': reverse(self.edit_url, kwargs={'pk': data.id}),
          }
        return response_data

    def validate_data(self, data, pk=None):
        errors = {}
        name = data.get('name', '').strip()
        active = data.get('active') == 'on'

        if not name:
            errors['name'] = 'ライン名は必須です。'
        elif active:
            query = self.crud_model.objects.filter(name=name, active=True)
            if pk:
                query = query.exclude(id=pk)
            if query.exists():
                errors['name'] = 'このライン名は既に使用されています。'
        
        return errors

    def create_model(self, data):
       return self.crud_model.objects.create(
            name=data.get('name', '').strip(),
            x_position=int(data.get('x_position', 0)),
            y_position=int(data.get('y_position', 0)),
            width=int(data.get('width', 0)),
            height=int(data.get('height', 0)),
            active=data.get('active') == 'on'
        )

    def update_model(self, model, data):
        model.name = data.get('name').strip()
        model.x_position = int(data.get('x_position', 0))
        model.y_position = int(data.get('y_position', 0))
        model.width = int(data.get('width', 0))
        model.height = int(data.get('height', 0))
        model.active = data.get('active') == 'on'
        model.save()

    # テーブルに返すデータの整形
    def format_data(self, page_obj, is_admin=True):
        formatted_data = []
        if is_admin:
            for row in page_obj:
                formatted_data.append({
                    'id': row.id,
                    'fields': [
                        row.name,
                        row.x_position,
                        row.y_position,
                        row.width,
                        row.height,
                        '有効' if row.active else '無効'
                    ],
                    'edit_url': reverse(self.edit_url, kwargs={'pk': row.id}),
                    'delete_url': reverse(self.delete_url, kwargs={'pk': row.id}),
                    'name': row.name,
                })
        else:
            for row in page_obj:
                formatted_data.append({
                    'fields': [
                        row.name,
                        '有効' if row.active else '無効'
                    ],
                })
        return formatted_data
