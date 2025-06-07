from django import forms
from .models import Line

class LineForm(forms.ModelForm):
    class Meta:
        model = Line
        fields = ['name', 'x_position', 'y_position', 'width', 'height', 'active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'x_position': forms.NumberInput(attrs={'class': 'form-control'}),
            'y_position': forms.NumberInput(attrs={'class': 'form-control'}),
            'width': forms.NumberInput(attrs={'class': 'form-control'}),
            'height': forms.NumberInput(attrs={'class': 'form-control'}),
            'active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        } 