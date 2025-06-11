from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from django.views.generic import TemplateView
from django.core.paginator import Paginator
from manufacturing.models import Line
from django.shortcuts import render
from django.urls import reverse


class LineMasterView(TemplateView):
    template_name = 'master/line_master/line_master.html'

    def get(self, request, *args, **kwargs):
      is_htmx = request.headers.get('HX-Request')
      has_search_param = 'search' in request.GET
      has_page = request.GET.get('page') is not None
      has_pk = 'pk' in kwargs
      
      # 編集時の初期値
      if has_pk:
          line = get_object_or_404(Line, pk=kwargs['pk'])
          
          response_data = {
              'status': 'success',
              'data': {
                  'id': line.id,
                  'name': line.name,
                  'x_position': line.x_position,
                  'y_position': line.y_position,
                  'width': line.width,
                  'height': line.height,
                  'active': line.active
              },
              'edit_url': reverse('manufacturing:line_edit', kwargs={'pk': kwargs['pk']}),
              'has_page': has_page
          }
          
          return JsonResponse(response_data)
      
      # 検索やページネーション時
      elif is_htmx and (has_search_param or has_page):
          context = self.get_context_data(**kwargs)
          return render(request, 'master/line_master/line_table_with_pagination.html', context)
      
      # 通常アクセス時
      elif is_htmx:
          context = self.get_context_data(**kwargs)
          return render(request, 'master/line_master/line_master_content.html', context)
      
      # リロード時など
      self.template_name = 'master/line_master/line_master.html'
      return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['headers'] = ['ライン名', 'X座標', 'Y座標', '幅', '高さ', 'ステータス', '操作']
        data = Line.objects.all()
        
        # 検索処理
        search_query = self.request.GET.get('search', '')
        if search_query:
            data = data.filter(name__icontains=search_query)
        
        paginator = Paginator(data, 10)
        page_number = self.request.GET.get('page', 1)
        page_obj = paginator.get_page(page_number)
        # データが10件以上ならページネーションを表示
        display_pagination = True if data.count() > 10 else False
        
        formatted_data = []
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
                'edit_url': reverse('manufacturing:line_edit', kwargs={'pk': row.id}),
                'delete_url': reverse('manufacturing:line_delete', kwargs={'pk': row.id}),
                'name': row.name,
            })
        
        context.update({
            'data': formatted_data,
            'page_obj': page_obj,
            'search_query': search_query,
            'form_action_url': reverse('manufacturing:line_master'),
            'display_pagination': display_pagination
        })
        
        return context

    # 登録、編集、削除などの時に、現在のページと検索条件、データを保持するのに使用
    def get_preserved_context(self, request):
        current_page = request.POST.get('current_page') or request.GET.get('page', '1')
        search_query = request.POST.get('search_query') or request.GET.get('search', '')
        
        data = Line.objects.all()
        display_pagination = True if data.count() > 10 else False
        
        # 検索処理
        if search_query:
            data = data.filter(name__icontains=search_query)
        
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
        formatted_data = []
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
                'edit_url': reverse('manufacturing:line_edit', kwargs={'pk': row.id}),
                'delete_url': reverse('manufacturing:line_delete', kwargs={'pk': row.id}),
                'name': row.name
            })
        return {
            'data': formatted_data,
            'page_obj': page_obj,
            'search_query': search_query,
            'form_action_url': reverse('manufacturing:line_master'),
            'headers': ['ライン名', 'X座標', 'Y座標', '幅', '高さ', 'ステータス', '操作'],
            'display_pagination': display_pagination
        }

    def post(self, request, *args, **kwargs):
        if 'pk' in kwargs:
            # 編集処理
            try:
                line = get_object_or_404(Line, pk=kwargs['pk'])
                name = request.POST.get('name', '').strip()
                active = request.POST.get('active') == 'on'
                
                # バリデーション
                errors = {}
                if not name:
                    errors['name'] = 'ライン名は必須です。'
                elif active:
                    # アクティブなラインの中で名前の重複をチェック（自分以外）
                    existing_line = Line.objects.filter(name=name, active=True).exclude(id=kwargs['pk']).first()
                    if existing_line:
                        errors['name'] = 'このライン名は既に使用されています。'
                
                if errors:
                    return JsonResponse({
                        'status': 'error',
                        'message': '入力内容に誤りがあります。',
                        'errors': errors
                    }, status=400)
                
                line.name = name
                line.x_position = int(request.POST.get('x_position', 0))
                line.y_position = int(request.POST.get('y_position', 0))
                line.width = int(request.POST.get('width', 0))
                line.height = int(request.POST.get('height', 0))
                line.active = active
                line.save()
                
                # 現在のページ情報を保持してコンテキストを生成
                context = self.get_preserved_context(request)
                html = render_to_string('master/line_master/line_table_with_pagination.html', context, request=request)
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'ラインが正常に更新されました。',
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
                name = request.POST.get('name', '').strip()
                active = request.POST.get('active') == 'on'
                
                # バリデーション
                errors = {}
                if not name:
                    errors['name'] = 'ライン名は必須です。'
                elif active:
                    # アクティブなラインの中で名前の重複をチェック
                    existing_line = Line.objects.filter(name=name, active=True).first()
                    if existing_line:
                        errors['name'] = 'このライン名は既に使用されています。'
                
                if errors:
                    return JsonResponse({
                        'status': 'error',
                        'message': '入力内容に誤りがあります。',
                        'errors': errors
                    }, status=400)
                
                line = Line.objects.create(
                    name=name,
                    x_position=int(request.POST.get('x_position', 0)),
                    y_position=int(request.POST.get('y_position', 0)),
                    width=int(request.POST.get('width', 0)),
                    height=int(request.POST.get('height', 0)),
                    active=active
                )
                
                # 現在のページ情報を保持してコンテキストを生成
                context = self.get_preserved_context(request)
                html = render_to_string('master/line_master/line_table_with_pagination.html', context, request=request)
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'ラインが正常に登録されました。',
                    'html': html
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'error',
                    'message': f'エラーが発生しました: {str(e)}'
                }, status=400)

    def delete(self, request, *args, **kwargs):
        try:
            line = get_object_or_404(Line, pk=kwargs['pk'])
            line.delete()
            
            # URLパラメータから現在のページ情報を取得
            current_page = request.GET.get('current_page')
            search_query = request.GET.get('search_query')
            
            # GETパラメータがない場合は、通常のGETパラメータをチェック
            if not current_page:
                current_page = request.GET.get('page', '1')
            
            if search_query is None:
                search_query = request.GET.get('search', '')
            
            # デフォルト値の設定
            if not current_page:
                current_page = '1'
            if search_query is None:
                search_query = ''
            
            from django.http import QueryDict
            request.POST = QueryDict(mutable=True)
            request.POST['current_page'] = current_page
            request.POST['search_query'] = search_query
            
            # 現在のページ情報を保持してコンテキストを生成(ここを消すと削除時にリロードしないとデータが更新されなくなる)
            context = self.get_preserved_context(request)
            html = render_to_string('master/line_master/line_table_with_pagination.html', context, request=request)
            
            return JsonResponse({
                'status': 'success',
                'message': 'ラインが正常に削除されました。',
                'html': html
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'エラーが発生しました: {str(e)}'
            }, status=400)
