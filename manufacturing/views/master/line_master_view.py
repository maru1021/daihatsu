from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from django.views.generic import TemplateView
from django.core.paginator import Paginator
from manufacturing.models import Line
from django.shortcuts import render


class LineMasterView(TemplateView):
    template_name = 'master/line_master/line_master.html'

    def get(self, request, *args, **kwargs):
      is_htmx = request.headers.get('HX-Request')
      has_search_param = 'search' in request.GET
      has_page = request.GET.get('page') is not None
      has_pk = 'pk' in kwargs
      
      if has_pk:
          line = get_object_or_404(Line, pk=kwargs['pk'])
          
          from django.urls import reverse
          edit_url = reverse('manufacturing:line_edit', kwargs={'pk': kwargs['pk']})
          
          # ラインの情報をJSONで返す
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
              'edit_url': edit_url,
              'register_url': reverse('manufacturing:line_master'),
          }
          
          return JsonResponse(response_data)
      elif is_htmx and (has_search_param or has_page):
          # 検索やページネーション：テーブル+ページネーションのみを返す
          context = self.get_context_data(**kwargs)
          return render(request, 'master/line_master/line_table_with_pagination.html', context)
      elif is_htmx:
          # その他のHTMXリクエスト：コンテンツ部分のみ
          context = self.get_context_data(**kwargs)
          return render(request, 'master/line_master/line_master_content.html', context)
      
      # 直接アクセス：完全なページを返す
      self.template_name = 'master/line_master/line_master.html'
      return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
      context = super().get_context_data(**kwargs)
      lines = Line.objects.all().order_by('id')
      
      # 検索処理
      search_query = self.request.GET.get('search', '')
      if search_query:
          lines = lines.filter(name__icontains=search_query)
      
      paginator = Paginator(lines, 10)
      page_number = self.request.GET.get('page', 1)
      page_obj = paginator.get_page(page_number)
      
      # Django reverse URLを使用してアクションURLを動的生成
      from django.urls import reverse
      
      context = {
          'data': page_obj,
          'search_query': search_query,
          'form_action_url': reverse('manufacturing:line_master'),
      }
      
      # 編集モーダル用に個別のedit_urlを追加
      if 'pk' in kwargs:
          context['edit_url'] = reverse('manufacturing:line_edit', kwargs={'pk': kwargs['pk']})
      
      return context

    def get_preserved_context(self, request):
        """現在のページと検索条件を保持したコンテキストを取得"""
        # POSTリクエストから現在のページ情報を取得
        current_page = request.POST.get('current_page') or request.GET.get('page', '1')
        search_query = request.POST.get('search_query') or request.GET.get('search', '')
        
        lines = Line.objects.all().order_by('id')
        
        # 検索処理
        if search_query:
            lines = lines.filter(name__icontains=search_query)
        
        paginator = Paginator(lines, 10)
        
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
        
        from django.urls import reverse
        
        return {
            'data': page_obj,
            'search_query': search_query,
            'form_action_url': reverse('manufacturing:line_master'),
        }

    def post(self, request, *args, **kwargs):
        if 'pk' in kwargs:
            # 編集処理
            try:
                line = get_object_or_404(Line, pk=kwargs['pk'])
                line.name = request.POST.get('name')
                line.x_position = int(request.POST.get('x_position', 0))
                line.y_position = int(request.POST.get('y_position', 0))
                line.width = int(request.POST.get('width', 100))
                line.height = int(request.POST.get('height', 100))
                line.active = request.POST.get('active') == 'on'
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
              context = self.get_preserved_context(request)
              html = render_to_string('master/line_master/line_table_with_pagination.html', context, request=request)
              
              return JsonResponse({
                  'status': 'success',
                  'message': 'ラインが正常に登録されました。',
                  'html': html
              })

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
            
            # 一時的にPOSTデータとして設定（get_preserved_contextで使用）
            from django.http import QueryDict
            request.POST = QueryDict(mutable=True)
            request.POST['current_page'] = current_page
            request.POST['search_query'] = search_query
            
            # 現在のページ情報を保持してコンテキストを生成
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
