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
      
      # デバッグ情報
      print(f"=== LineMasterView Debug ===")
      print(f"is_htmx: {is_htmx}")
      print(f"has_search_param: {has_search_param}")
      print(f"has_page: {has_page}")
      print(f"has_pk: {has_pk}")
      print(f"request.GET: {request.GET}")
      print(f"request.headers HX-Request: {request.headers.get('HX-Request')}")
      print(f"request.path: {request.path}")
      print(f"kwargs: {kwargs}")
      
      if has_pk:
          # 編集モーダルの内容を返す
          print("=> Returning edit modal")
          line = get_object_or_404(Line, pk=kwargs['pk'])
          from django.urls import reverse
          edit_url = reverse('manufacturing:line_edit', kwargs={'pk': kwargs['pk']})
          context = {'line': line, 'edit_url': edit_url}
          return render(request, 'master/line_master/line_edit_modal.html', context)
      elif is_htmx and (has_search_param or has_page):
          # 検索やページネーション：テーブル+ページネーションのみを返す
          print("=> Returning table only (pagination/search)")
          context = self.get_context_data(**kwargs)
          return render(request, 'master/line_master/line_table_with_pagination.html', context)
      elif is_htmx:
          # その他のHTMXリクエスト：コンテンツ部分のみ
          print("=> Returning content only (other HTMX)")
          context = self.get_context_data(**kwargs)
          return render(request, 'master/line_master/line_master_content.html', context)
      
      # 直接アクセス：完全なページを返す
      print("=> Returning full page (direct access)")
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
        
        print(f"=== get_preserved_context ===")
        print(f"POST data: {dict(request.POST)}")
        print(f"GET data: {dict(request.GET)}")
        print(f"受信したページ情報 - page: {current_page}, search: {search_query}")
        
        lines = Line.objects.all().order_by('id')
        
        # 検索処理
        if search_query:
            lines = lines.filter(name__icontains=search_query)
            print(f"検索結果: {lines.count()}件")
        
        paginator = Paginator(lines, 10)
        print(f"総ページ数: {paginator.num_pages}, 1ページあたり10件")
        
        # ページ番号を整数に変換し、範囲をチェック
        try:
            page_number = int(current_page)
            print(f"リクエストされたページ番号: {page_number}")
            
            if page_number > paginator.num_pages:
                page_number = paginator.num_pages
                print(f"ページ番号を最大値に調整: {current_page} -> {page_number}")
            elif page_number < 1:
                page_number = 1
                print(f"ページ番号を最小値に調整: {current_page} -> {page_number}")
            else:
                print(f"ページ番号は有効範囲内: {page_number}")
        except (ValueError, TypeError):
            page_number = 1
            print(f"無効なページ番号、1に設定: {current_page} -> {page_number}")
        
        page_obj = paginator.get_page(page_number)
        print(f"返すページ番号: {page_obj.number}")
        print(f"このページのアイテム数: {len(page_obj.object_list)}")
        print(f"総アイテム数: {paginator.count}")
        
        from django.urls import reverse
        
        return {
            'lines': page_obj,
            'form': LineForm(),
            'search_query': search_query,
            'form_action_url': reverse('manufacturing:line_master'),
        }

    def post(self, request, *args, **kwargs):
        print(f"=== POST Request Debug ===")
        print(f"POST data: {dict(request.POST)}")
        print(f"kwargs: {kwargs}")
        
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
                
                print("編集処理完了")

                # 現在のページ情報を保持してコンテキストを生成
                context = self.get_preserved_context(request)
                html = render_to_string('master/line_master/line_table_with_pagination.html', context, request=request)
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'ラインが正常に更新されました。',
                    'html': html
                })
            except Exception as e:
                print(f"編集処理エラー: {e}")
                return JsonResponse({
                    'status': 'error',
                    'message': f'エラーが発生しました: {str(e)}'
                }, status=400)
        else:
            # 新規登録処理
            form = LineForm(request.POST)
            if form.is_valid():
                form.save()
                print("新規登録処理完了")
                
                # 現在のページ情報を保持してコンテキストを生成
                context = self.get_preserved_context(request)
                html = render_to_string('master/line_master/line_table_with_pagination.html', context, request=request)
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'ラインが正常に登録されました。',
                    'html': html
                })
            else:
                print(f"フォームバリデーションエラー: {form.errors}")
                return JsonResponse({
                    'status': 'error',
                    'message': '入力内容に誤りがあります。',
                    'errors': form.errors
                }, status=400)

    def delete(self, request, *args, **kwargs):
        try:
            print(f"=== DELETE Request Debug ===")
            print(f"Request URL: {request.get_full_path()}")
            print(f"GET params: {dict(request.GET)}")
            print(f"POST data: {dict(request.POST)}")
            print(f"Request method: {request.method}")
            
            line = get_object_or_404(Line, pk=kwargs['pk'])
            line.delete()
            
            # URLパラメータから現在のページ情報を取得
            current_page = request.GET.get('current_page')
            search_query = request.GET.get('search_query')
            
            print(f"GETパラメータ取得結果 - page: {current_page}, search: {search_query}")
            
            # GETパラメータがない場合は、通常のGETパラメータをチェック
            if not current_page:
                current_page = request.GET.get('page', '1')
                print(f"通常のpageパラメータから取得: {current_page}")
            
            if search_query is None:
                search_query = request.GET.get('search', '')
                print(f"通常のsearchパラメータから取得: {search_query}")
            
            # デフォルト値の設定
            if not current_page:
                current_page = '1'
            if search_query is None:
                search_query = ''
            
            print(f"最終的なページ情報 - page: {current_page}, search: {search_query}")
            
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
            print(f"削除処理エラー: {e}")
            import traceback
            traceback.print_exc()
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