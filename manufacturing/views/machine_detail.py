from django.views.generic import DetailView
from django.conf import settings
from manufacturing.models import Machine, AlarmHistory
import re
from mongoengine import connect, disconnect, get_connection
from datetime import datetime, time

class MachineDetailView(DetailView):
    model = Machine
    template_name = 'machine_detail/machine_detail.html'
    context_object_name = 'machine'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        pk = self.kwargs.get('pk')

        machine_model = Machine.objects.values('line__name', 'name').get(pk=pk, active=True)
        line_name = machine_model['line__name']
        machine_name = machine_model['name']

        # line_dict = {
        #     "1ヘッド": "L1MH"
        # }

        # L1Name = f"{line_dict[line_name]}-{machine_name}"

        # machine_server = {
        #     "10.69.200.6": ["L1MH-OP10A", "L1MH-OP10B", "L1MH-OP10C", "L1MH-OP20"],
        #     "10.69.200.7": ["L1MH-OP30"],
        #     "10.69.200.8": ["L1MH-OP100A"]
        # }

        # # 対象サーバーを特定
        # target_server = None
        # target_db_name = None
        
        # for server_ip, machines in machine_server.items():
        #     if L1Name in machines:
        #         target_server = server_ip
        #         # settings.MONGODB_CONFIGSから対応するDB名を取得
        #         for db_name, host_ip in settings.MONGODB_CONFIGS:
        #             if host_ip == server_ip:
        #                 target_db_name = db_name
        #                 break
        #         break

        # all_data = []

        # # 対象サーバーが見つかった場合のみデータを取得
        # if target_server and target_db_name:
        #     try:
        #         # 既存の接続をチェック
        #         try:
        #             connection = get_connection(alias=target_db_name)
        #         except:
        #             # 接続が存在しない場合は新規作成
        #             connect(
        #                 db=target_db_name,
        #                 host=f'mongodb://{target_server}:27017/{target_db_name}',
        #                 alias=target_db_name
        #             )

        #         # 動的にモデルを作成（対象サーバー用）
        #         class ServerAlarmHistory(AlarmHistory):
        #             meta = {
        #                 'collection': 'Alarm_History',
        #                 'db_alias': target_db_name,
        #                 'strict': False
        #             }

        #         today = datetime.now().date()
        #         start_time = datetime.combine(today, time(0, 0))

        #         server_data = ServerAlarmHistory.objects.filter(
        #             L1Name=L1Name, 
        #             updatedate__gte=start_time
        #         ).order_by('-updatedate')

        #         # 各レコードにサーバー情報を追加
        #         for item in server_data:
        #             combined_item = {
        #                 'updatedate': item.updatedate,
        #                 'timespan': item.timespan,
        #                 'message': item.message,
        #                 'L1Name': item.L1Name,
        #             }
        #             all_data.append(combined_item)
                
        #     except Exception as e:
        #         print(f"{target_db_name}({target_server})接続エラー: {e}")
        # else:
        #     print(f"L1Name: {L1Name} に対応するサーバーが見つかりません")

        # # 全データを時間順でソート（最新が上）
        # all_data.sort(key=lambda x: x['updatedate'], reverse=True)

        # context['alarms'] = all_data
        # context['alarm_count'] = len(all_data)

        # now = datetime.now()
        # elapsed_seconds = int((now - start_time).total_seconds())

        # stop_time = sum(item.timespan for item in server_data if item.timespan)
        # operating_rate = round(((elapsed_seconds-stop_time)/elapsed_seconds) * 100, 2)

        # context['operating_rate'] = operating_rate

        return context
