from django.views.generic import TemplateView
from daihatsu.models import Resource
from daihatsu.views.basic_chart_view import BasicChartView


class ResourceView(TemplateView):
    template_name = 'resource/resource.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # 最新のリソース情報のみを取得（カード表示用）
        latest_resource = Resource.objects.order_by('-created_at').first()
        
        # グラフ設定のみをcontextに渡す（データはAjaxで取得）
        context.update({
            'latest_resource': latest_resource,
            'chart_id': 'resourceChart',
        })
        return context


class ResourceDataView(BasicChartView):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        latest_resources = Resource.objects.order_by('-created_at')[:100]
        self.model = list(reversed(latest_resources))

        self.horizontal_labels = [r.created_at.strftime('%H:%M') for r in self.model]
        self.vertical_labels = ["CPU使用率(%)", "メモリ使用率(%)", "ディスク使用率(%)"]

        self.cpu_data = [r.cpu for r in self.model]
        self.memory_data = [r.memory for r in self.model]
        self.disk_data = [r.disk for r in self.model]
        self.data_list = [self.cpu_data, self.memory_data, self.disk_data]