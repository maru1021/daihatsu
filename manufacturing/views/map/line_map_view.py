from django.views.generic import TemplateView
from manufacturing.models import Line, Machine
from django.db.models import Max
from django.http import HttpResponse


class LineMapView(TemplateView):
    template_name = 'factorymap/line_map/line_map.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # アクティブなラインを取得
        lines = Line.objects.filter(active=True)
        
        context.update({
            'lines': lines,
        })
        
        return context

    def get(self, request, *args, **kwargs):
        # HTMXリクエストの場合
        if request.headers.get('HX-Request'):
            self.template_name = 'factorymap/line_map/line_map_partial.html'
            return self.render_to_response(self.get_context_data())
        
        # 通常のリクエストの場合
        self.template_name = 'factorymap/line_map/line_map.html'
        return super().get(request, *args, **kwargs)

    def get_machines(self):
        # マシンの取得ロジック
        return Machine.objects.filter(active=True)