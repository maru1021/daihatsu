import logging
import os
from datetime import datetime

# ログディレクトリの作成
log_dir = 'log'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# ロガーの設定
def setup_logger(name, log_file, level=logging.ERROR):
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # ファイルハンドラの設定
    file_handler = logging.FileHandler(
        os.path.join(log_dir, log_file),
        encoding='utf-8'
    )
    file_handler.setLevel(level)

    # フォーマッタの設定（CSV形式）
    formatter = logging.Formatter(
        '%(asctime)s,%(name)s,%(levelname)s,%(message)s'
    )
    file_handler.setFormatter(formatter)

    # ハンドラの追加
    logger.addHandler(file_handler)

    return logger

# エラーロガーの作成
error_logger = setup_logger('error_logger', 'error.log')

# アクセスロガーの作成
access_logger = setup_logger('access_logger', 'access.log', level=logging.INFO)

# SQLロガーの作成
sql_logger = setup_logger('sql_logger', 'sql.log', level=logging.DEBUG)

# ジョブロガーの作成
job_logger = setup_logger('job_logger', 'job.log', level=logging.INFO)

#  資源管理ロガーの作成
resource_logger = setup_logger('resource_logger', 'resource.log', level=logging.INFO)

# セキュリティロガーの作成（認証、認可、CSRF等）
security_logger = setup_logger('security_logger', 'security.log', level=logging.INFO)
# セキュリティログ用のフォーマッタを設定
security_formatter = logging.Formatter(
    '%(asctime)s,%(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
security_logger.handlers[0].setFormatter(security_formatter)

# パフォーマンスロガーの作成（API応答時間、ビュー処理時間等）
performance_logger = setup_logger('performance_logger', 'performance.log', level=logging.INFO)
# パフォーマンスログ用のフォーマッタを設定
performance_formatter = logging.Formatter(
    '%(asctime)s,%(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
performance_logger.handlers[0].setFormatter(performance_formatter)

# Djangoのデータベースロガーを設定
django_db_logger = logging.getLogger('django.db.backends')
django_db_logger.setLevel(logging.DEBUG)

# SQLログ用のハンドラを作成
sql_file_handler = logging.FileHandler(
    os.path.join(log_dir, 'sql.log'),
    encoding='utf-8'
)
sql_file_handler.setLevel(logging.DEBUG)

# SQLログ用のフォーマッタを設定
sql_formatter = logging.Formatter(
    '%(asctime)s,%(name)s,%(levelname)s,%(message)s'
)
sql_file_handler.setFormatter(sql_formatter)

# SQLログ用のフィルタを追加
class SQLFilter(logging.Filter):
    def filter(self, record):
        message = record.getMessage().upper()
        
        # SELECT文を除外
        if 'SELECT' in message:
            return False
        
        # 認証関連の除外
        auth_excludes = [
            'UPDATE "AUTH_USER" SET "LAST_LOGIN"',  # ログイン時間の更新
            'UPDATE "DJANGO_SESSION"',              # セッション関連
            'INSERT INTO "DJANGO_SESSION"',         # セッション作成
            'DELETE FROM "DJANGO_SESSION"'          # セッション削除
        ]
        
        # 認証関連の除外チェック
        if any(exclude in message for exclude in auth_excludes):
            return False
            
        # 記録するクエリのみを厳密に指定
        return any([
            'INSERT INTO' in message,
            'UPDATE' in message and 'WHERE' in message,
            'DELETE FROM' in message
        ])

sql_file_handler.addFilter(SQLFilter())
django_db_logger.addHandler(sql_file_handler)
