from django.db import models

class Resource(models.Model):
    id = models.AutoField('ID', primary_key=True)
    created_at = models.DateTimeField('日時', auto_now_add=True)
    cpu = models.FloatField('CPU使用率', default=0)
    memory = models.FloatField('メモリ使用率', default=0)
    disk = models.FloatField('ディスク使用率', default=0)

    class Meta:
        verbose_name = 'リソース'
        verbose_name_plural = 'リソース'
        ordering = ['-created_at']

    def __str__(self):
        return str(self.created_at)