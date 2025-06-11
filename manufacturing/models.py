from django.db import models
from django.core.validators import MinValueValidator

class Line(models.Model):
    id = models.AutoField('ID', primary_key=True)
    name = models.CharField('ライン名', max_length=100)
    x_position = models.IntegerField('X座標', default=0, validators=[MinValueValidator(0)])
    y_position = models.IntegerField('Y座標', default=0, validators=[MinValueValidator(0)])
    width = models.IntegerField('横幅', default=100, validators=[MinValueValidator(1)])
    height = models.IntegerField('縦幅', default=100, validators=[MinValueValidator(1)])
    active = models.BooleanField('アクティブ', default=True)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)

    class Meta:
        verbose_name = 'ライン'
        verbose_name_plural = 'ライン'
        ordering = ['-active', 'name']

    def __str__(self):
        return self.name

class Machine(models.Model):
    STATUS_CHOICES = [
        ('active', '稼働中'),
        ('maintenance', 'メンテナンス中'),
        ('stopped', '停止中'),
    ]

    id = models.AutoField('ID', primary_key=True)
    name = models.CharField('設備名', max_length=100)
    status = models.CharField('稼働状態', max_length=20, choices=STATUS_CHOICES, default='stopped')
    x_position = models.IntegerField('X座標', default=0, validators=[MinValueValidator(0)])
    y_position = models.IntegerField('Y座標', default=0, validators=[MinValueValidator(0)])
    width = models.IntegerField('横幅', default=50, validators=[MinValueValidator(0)])
    height = models.IntegerField('縦幅', default=50, validators=[MinValueValidator(0)])
    line = models.ForeignKey(Line, on_delete=models.CASCADE, null=True, blank=True, verbose_name='ライン')
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    active = models.BooleanField('アクティブ', default=True)
    alarm_message = models.CharField('アラームメッセージ', max_length=200, blank=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)

    class Meta:
        verbose_name = '加工機'
        verbose_name_plural = '加工機'
        ordering = ['-active', 'line__name', 'name']

    def __str__(self):
        return f"{self.line.name} - {self.name}"
