from daihatsu.log import resource_logger, error_logger

def resource_check():
    """リソースチェック"""
    from daihatsu.models import Resource
    import psutil
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        Resource.objects.create(cpu=cpu_percent, memory=memory.percent, disk=disk.percent)
        
        # アラート条件
        if cpu_percent > 90 or memory.percent > 90 or disk.percent > 90:
            resource_logger.warning(f"リソースチェック - CPU: {cpu_percent}%, メモリ: {memory.percent}%, ディスク: {disk.percent}%")
            
    except Exception as e:
        error_logger.error(f"リソースチェックエラー: {e}")