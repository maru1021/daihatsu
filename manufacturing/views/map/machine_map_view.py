from django.views.generic import TemplateView
from manufacturing.models import Line, Machine
from django.db.models import Max

class MachineMapView(TemplateView):
    template_name = 'factorymap/machine_map/machine_map.html'
    
    def get_template_names(self):
        """HTMXリクエストの場合は部分テンプレートを返す"""
        if self.request.headers.get('HX-Request'):
            return ['factorymap/machine_map/machine_list_partial.html']
        return [self.template_name]
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # アクティブなラインを取得
        machines = Machine.objects.filter(active=True, line_id=self.kwargs['pk'])
        
        context.update({
            'machines': machines,
            'pk': self.kwargs['pk'],  # テンプレートでpkを使用するため追加
        })
        
        return context