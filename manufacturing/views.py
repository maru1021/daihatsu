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
        # HTMXリクエストの詳細判定
        is_htmx = request.headers.get('HX-Request')
        has_search_param = 'search' in request.GET  # 検索パラメータの存在（値が空でも）
        has_page = request.GET.get('page') is not None
        has_pk = 'pk' in kwargs
        
        # **重要**: User-AgentでJavaScriptからのリクエストかどうかを判定
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        is_browser_nav = 'mozilla' in user_agent or 'chrome' in user_agent or 'safari' in user_agent
        
        if is_htmx and has_pk:
            # 編集モーダルの内容を返す
            line = get_object_or_404(Line, pk=kwargs['pk'])
            context = {'line': line}
            return render(request, 'master/line_master/line_edit_modal.html', context)
        elif is_htmx and (has_search_param or has_page):
            # **修正**: 検索（値が空でも）やページネーション：テーブル+ページネーションのみ
            context = self.get_context_data(**kwargs)
            return render(request, 'master/line_master/line_table_with_pagination.html', context)
        elif is_htmx and is_browser_nav:
            # **HTMXサイドバーナビゲーション**: コンテンツ部分のみ（真のSPA）
            context = self.get_context_data(**kwargs)
            return render(request, 'master/line_master/line_master_content.html', context)
        
        # 直接アクセス、リロード、ブックマーク：完全なページを返す
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
        
        context = {
            'lines': page_obj,
            'form': LineForm(),
            'search_query': search_query,
        }
        
        return context

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

                # 更新後のテーブル+ページネーションを返す
                context = self.get_context_data()
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
                
                # 登録後のテーブル+ページネーションを返す
                context = self.get_context_data()
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
            
            # 削除後のテーブル+ページネーションを返す
            context = self.get_context_data()
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

class MachineCreateView(TemplateView):
    def post(self, request, *args, **kwargs):
        try:
            line_id = request.POST.get('line')
            line = Line.objects.get(id=line_id) if line_id else None
            
            machine = Machine.objects.create(
                id=request.POST.get('machine_id'),
                name=request.POST.get('name'),
                line=line,
                x_position=request.POST.get('x_position'),
                y_position=request.POST.get('y_position'),
                width=request.POST.get('width'),
                height=request.POST.get('height'),
                status=request.POST.get('status')
            )
            html = render_to_string('master/machine_master/machine_row.html', {'machine': machine})
            return HttpResponse(html)
        except Exception as e:
            return HttpResponse(f'エラーが発生しました: {str(e)}', status=400)

class MachineEditView(TemplateView):
    template_name = 'master/machine_master/machine_edit_modal.html'

    def get(self, request, *args, **kwargs):
        machine = get_object_or_404(Machine, pk=kwargs['pk'])
        context = {'machine': machine, 'lines': Line.objects.all().order_by('id')}
        html = render_to_string(self.template_name, context)
        return HttpResponse(html)

    def post(self, request, *args, **kwargs):
        try:
            machine = get_object_or_404(Machine, pk=kwargs['pk'])
            line_id = request.POST.get('line')
            line = Line.objects.get(id=line_id) if line_id else None

            machine.name = request.POST.get('name')
            machine.status = request.POST.get('status')
            machine.x_position = request.POST.get('x_position')
            machine.y_position = request.POST.get('y_position')
            machine.width = request.POST.get('width')
            machine.height = request.POST.get('height')
            machine.line = line
            machine.active = request.POST.get('active') == 'on'
            machine.save()

            context = self.get_context_data()
            context['machines'] = Machine.objects.all().order_by('id')
            context['lines'] = Line.objects.all().order_by('id')
            html = render_to_string('master/machine_master/machine_master_content.html', context)
            return JsonResponse({
                'status': 'success',
                'message': 'マシンを更新しました',
                'html': html
            })

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'エラーが発生しました: {str(e)}'
            }, status=400)

class MachineDeleteView(TemplateView):
    def delete(self, request, *args, **kwargs):
        try:
            machine = get_object_or_404(Machine, pk=kwargs['pk'])
            machine.delete()

            context = self.get_context_data()
            context['machines'] = Machine.objects.all().order_by('id')
            context['lines'] = Line.objects.all().order_by('id')
            html = render_to_string('master/machine_master/machine_master_content.html', context)
            return JsonResponse({
                'status': 'success',
                'message': 'マシンを削除しました',
                'html': html
            })

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'エラーが発生しました: {str(e)}'
            }, status=400)