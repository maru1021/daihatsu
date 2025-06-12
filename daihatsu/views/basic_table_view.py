from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from django.views.generic import TemplateView
from django.core.paginator import Paginator
from django.shortcuts import render
from django.urls import reverse
from django.db.models import Q


class BasicTableView(TemplateView):
    crud_model = None
    table_model = None
    template_name = None
    table_template = None
    content_template = None
    form_action_url = None
    edit_url = None
    delete_url = None
    noti_text = None
    
    admin_table_header = []
    user_table_header = []
    search_fields = []
    
    def get_edit_data(self, data):
        """編集時のデータを取得する"""
        pass

    def validate_data(self, data, pk=None):
        """データのバリデーションを行う"""
        return {}

    def create_model(self, data):
        """モデルを作成する"""
        pass

    def update_model(self, model, data):
        """モデルを更新する"""
        pass

    def get(self, request, *args, **kwargs):
      is_htmx = request.headers.get('HX-Request')
      has_search_param = 'search' in request.GET
      has_page = request.GET.get('page') is not None
      pk = kwargs.get('pk')
      
      # 編集時の初期値
      if pk:
          data = get_object_or_404(self.crud_model, pk=pk)
          response_data = self.get_edit_data(data)
          return JsonResponse(response_data)
      
      # 検索やページネーション時
      elif is_htmx and (has_search_param or has_page):
          context = self.get_context_data(**kwargs)
          return render(request, self.table_template, context)
      
      # 通常アクセス時
      elif is_htmx:
          context = self.get_context_data(**kwargs)
          return render(request, self.content_template, context)
      
      # リロード時など
      self.template_name = self.template_name
      return super().get(request, *args, **kwargs)
  
    # テーブルに返すデータの整形
    def format_data(self, page_obj, is_admin=True):
        pass

    def get_search_query(self, search_query):
        """検索クエリを生成する"""
        query = Q()
        for field in self.search_fields:
            query |= Q(**{f"{field}__icontains": search_query})
        return query

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        is_admin = self.has_admin_permission(self.request.user)
        context['headers'] = self.admin_table_header if is_admin else self.user_table_header
        data = self.table_model.objects.all()
        
        # 検索処理
        search_query = self.request.GET.get('search', '')
        if search_query:
            data = data.filter(self.get_search_query(search_query))
        
        paginator = Paginator(data, 10)
        page_number = self.request.GET.get('page', 1)
        # 1ページに表示するデータ
        page_obj = paginator.get_page(page_number)
        # データが10件以上ならページネーションを表示
        display_pagination = True if data.count() > 10 else False
        
        formatted_data = self.format_data(page_obj, is_admin)
        
        context.update({
            'data': formatted_data,
            'page_obj': page_obj,
            'search_query': search_query,
            'form_action_url': reverse(self.form_action_url),
            'display_pagination': display_pagination,
            'is_admin': is_admin
        })
        
        return context

    # 登録、編集、削除などの時に、現在のページと検索条件、データを保持するのに使用
    def get_preserved_context(self, request):
        current_page = request.POST.get('current_page') or request.GET.get('page', '1')
        search_query = request.POST.get('search_query') or request.GET.get('search', '')
        
        data = self.table_model.objects.all()
        display_pagination = True if data.count() > 10 else False
        
        # 検索処理
        if search_query:
            data = data.filter(self.get_search_query(search_query))
        
        paginator = Paginator(data, 10)
        
        # ページ番号を整数に変換し、範囲をチェック
        try:
            page_number = int(current_page)
            
            if page_number > paginator.num_pages:
                page_number = paginator.num_pages
            elif page_number < 1:
                page_number = 1
        except (ValueError, TypeError):
            page_number = 1
        
        page_obj = paginator.get_page(page_number)
        
        # データの整形
        formatted_data = self.format_data(page_obj)

        return {
            'data': formatted_data,
            'page_obj': page_obj,
            'search_query': search_query,
            'form_action_url': reverse(self.form_action_url),
            'headers': self.admin_table_header,
            'display_pagination': display_pagination
        }

    def post(self, request, *args, **kwargs):
        if 'pk' in kwargs:
            # 編集処理
            try:
                model = get_object_or_404(self.crud_model, pk=kwargs['pk'])
                data = request.POST.dict()
                
                # バリデーション
                errors = self.validate_data(data, pk=kwargs['pk'])
                if errors:
                    return JsonResponse({
                        'status': 'error',
                        'message': '入力内容に誤りがあります。',
                        'errors': errors
                    }, status=400)
                
                # モデルの更新
                self.update_model(model, data)
                
                # 現在のページ情報を保持してコンテキストを生成
                context = self.get_preserved_context(request)
                html = render_to_string(self.table_template, context, request=request)
                
                return JsonResponse({
                    'status': 'success',
                    'message': f'{self.noti_text}が正常に更新されました。',
                    'html': html
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'error',
                    'message': f'エラーが発生しました: {str(e)}'
                }, status=400)
        else:
            # 新規登録処理
            try:
                data = request.POST.dict()
                
                # バリデーション
                errors = self.validate_data(data)
                if errors:
                    return JsonResponse({
                        'status': 'error',
                        'message': '入力内容に誤りがあります。',
                        'errors': errors
                    }, status=400)
                
                # モデルの作成
                self.create_model(data)
                
                # 現在のページ情報を保持してコンテキストを生成
                context = self.get_preserved_context(request)
                html = render_to_string(self.table_template, context, request=request)
                
                return JsonResponse({
                    'status': 'success',
                    'message': f'{self.noti_text}が正常に登録されました。',
                    'html': html
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'error',
                    'message': f'エラーが発生しました: {str(e)}'
                }, status=400)

    def delete(self, request, *args, **kwargs):
        try:
            model = get_object_or_404(self.crud_model, pk=kwargs['pk'])
            model.delete()

            # 現在のページ情報を保持してコンテキストを生成
            context = self.get_preserved_context(request)
            html = render_to_string(self.table_template, context, request=request)
            
            return JsonResponse({
                'status': 'success',
                'message': f'{self.noti_text}が正常に削除されました。',
                'html': html
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'エラーが発生しました: {str(e)}'
            }, status=400)
