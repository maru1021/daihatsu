from django.views.generic import DetailView
from manufacturing.models import Machine


class MachineDetailView(DetailView):
    model = Machine
    template_name = 'machine_detail/machine_detail.html'
    context_object_name = 'machine'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context