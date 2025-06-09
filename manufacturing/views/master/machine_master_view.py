from django.views.generic import TemplateView
from manufacturing.models import Machine, Line
from django.shortcuts import render
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.core.paginator import Paginator


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