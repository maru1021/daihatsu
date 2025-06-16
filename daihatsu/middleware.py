import time
import psutil
from django.conf import settings
from .log import performance_logger

class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # リクエスト開始時の時間とメモリ使用量を記録
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # レスポンスを取得
        response = self.get_response(request)

        # 処理時間とメモリ使用量を計算
        process_time = time.time() - start_time
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        memory_used = end_memory - start_memory

        performance_logger.info(
            f"{process_time:.3f}秒, {memory_used:.2f}MB, {request.path}"
        )

        return response 