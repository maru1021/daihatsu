from django.shortcuts import render, get_object_or_404
from django.views.generic import TemplateView
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string
from .models import Line, Machine
from .forms import LineForm

class LineMapView(TemplateView):
    template_name = 'factorymap/line_map.html'

    def get(self, request, *args, **kwargs):
        if request.headers.get('HX-Request'):
            self.template_name = 'factorymap/line_map_content.html'
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['lines'] = Line.objects.filter(active=True)
        context['machines'] = Machine.objects.filter(active=True)
        return context

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
              'line': {
                  'id': line.id,
                  'name': line.name,
                  'x_position': line.x_position,
                  'y_position': line.y_position,
                  'width': line.width,
                  'height': line.height,
                  'active': line.active
              },
              'edit_url': edit_url
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
          'lines': page_obj,
          'form': LineForm(),
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
            'lines': page_obj,
            'form': LineForm(),
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
            form = LineForm(request.POST)
            if form.is_valid():
                form.save()
                
                # 現在のページ情報を保持してコンテキストを生成
                context = self.get_preserved_context(request)
                html = render_to_string('master/line_master/line_table_with_pagination.html', context, request=request)
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'ラインが正常に登録されました。',
                    'html': html
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': '入力内容に誤りがあります。',
                    'errors': form.errors
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

class LineDeleteModalView(TemplateView):
    template_name = 'master/line_master/line_delete_modal.html'

    def get(self, request, *args, **kwargs):
        line = get_object_or_404(Line, pk=kwargs['pk'])
        
        if request.headers.get('HX-Request'):
            # HTMXリクエストの場合、モーダルの内容だけを返す
            context = {'line': line}
            return render(request, self.template_name, context)
        else:
            # 直接アクセスの場合は適切にハンドリング
            return HttpResponse("Direct access not allowed", status=403)

class MachineMasterView(TemplateView):
    template_name = 'master/machine_master/machine_master.html'

    def get(self, request, *args, **kwargs):
        # 同じSPAロジックを適用
        is_htmx = request.headers.get('HX-Request')
        has_search_param = 'search' in request.GET
        has_page = request.GET.get('page') is not None
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        is_browser_nav = 'mozilla' in user_agent or 'chrome' in user_agent or 'safari' in user_agent
        
        if is_htmx and (has_search_param or has_page):
            # 検索やページネーション用
            self.template_name = 'master/machine_master/machine_master_content.html'
        elif is_htmx and is_browser_nav:
            # サイドバーナビゲーション用
            self.template_name = 'master/machine_master/machine_master_content.html'
        
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        machine_list = Machine.objects.all().order_by('id')
        paginator = Paginator(machine_list, 10)
        page_number = self.request.GET.get('page', 1)
        try:
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_number = 1
        context['machines'] = paginator.get_page(page_number)
        context['lines'] = Line.objects.all().order_by('id')
        return context

    def post(self, request, *args, **kwargs):
        try:
            line_id = request.POST.get('line')
            line = Line.objects.get(id=line_id) if line_id else None

            machine = Machine.objects.create(
                name=request.POST.get('name'),
                status=request.POST.get('status'),
                x_position=request.POST.get('x_position'),
                y_position=request.POST.get('y_position'),
                width=request.POST.get('width'),
                height=request.POST.get('height'),
                line=line,
                active=True
            )

            context = self.get_context_data()
            html = render_to_string('master/machine_master/machine_master_content.html', context)
            return JsonResponse({
                'status': 'success',
                'message': 'マシンを登録しました',
                'html': html
            })

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'エラーが発生しました: {str(e)}'
            }, status=400)