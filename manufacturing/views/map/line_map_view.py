from django.views.generic import TemplateView
from manufacturing.models import Line, Machine
from django.db.models import Max


class LineMapView(TemplateView):
    template_name = 'factorymap/line_map.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # アクティブなラインを取得
        lines = Line.objects.filter(active=True)
        
        context.update({
            'lines': lines,
        })
        print(context['lines'][1].x_position)
        
        return context