from django.views.generic import TemplateView
from manufacturing.models import Line, Machine


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