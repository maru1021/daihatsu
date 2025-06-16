from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from daihatsu.jobs.scripts.resource_check import resource_check
from daihatsu.jobs.scripts.db_backup import db_backup
from daihatsu.log import job_logger

def job_register():
    scheduler = BackgroundScheduler()
    
    # リソースチェックジョブ
    scheduler.add_job(
        resource_check,
        trigger=IntervalTrigger(minutes=1),
        id='resource_check',
        replace_existing=True
    )
    
    # データベースバックアップジョブ（毎週月曜日0時）
    scheduler.add_job(
        db_backup,
        trigger=CronTrigger(
            day_of_week='mon',
            hour=0,
            minute=0
        ),
        id='db_backup',
        replace_existing=True
    )
    
    # スケジューラーを開始
    scheduler.start()
    job_logger.info(f"ジョブスケジューラーが開始されました。{scheduler.get_jobs()}")