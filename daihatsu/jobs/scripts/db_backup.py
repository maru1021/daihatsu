import os
import shutil
from datetime import datetime
from django.conf import settings
from daihatsu.log import job_logger

def db_backup():
    try:
        # バックアップディレクトリの作成
        backup_dir = os.path.join(settings.BASE_DIR, 'daihatsu', 'backup')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)

        # バックアップファイル名の生成（日時を含む）
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'backup_{timestamp}.db')

        # データベースファイルのパスを取得
        db_path = settings.DATABASES['default']['NAME']

        # データベースファイルをコピー
        shutil.copy2(db_path, backup_file)
        job_logger.info(f"データベースバックアップを作成しました: {backup_file}")

    except Exception as e:
        job_logger.error(f"バックアップ作成中にエラーが発生しました: {str(e)}")
        raise 