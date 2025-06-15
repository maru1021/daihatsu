Djangoの設定など--------------------------------------------------------------------------------------
# 以下の操作はmanage.pyと同じディレクトリで行う

# ネットワークに接続されていない環境でのパッケージのインストール

# ネットワークに接続されているPCで
pip download -r requirements.txt -d offline_packages/
# を実行する(対象のパッケージに必要なパッケージのwhlファイルも含めてoffline_packages/にダウンロードされる)

# その後ネットワークから遮断されているPCのmanage.pyと同じディレクトリに
# offline_packages/をコピーし、以下を実行する
pip install --no-index --find-links offline_packages/ -r requirements.txt

# パッケージを追加時は、requirements.txtに追記し、offline_packagesフォルダにwhlファイルを追加する
# その後上のコマンドを再度実行

# 初回動作時
# データベースの作成
python manage.py makemigrations
python manage.py migrate

# サーバーの起動
python manage.py runserver

# テーブル新規追加、変更など
# 対象のmodels.pyにて追加、変更などを行う
python manage.py makemigrations
python manage.p migrate
# を実行する

# 管理者ユーザーの作成
python manage.py createsuperuser

# 管理者ページに表示するテーブルの設定
# 表示したいテーブルのモデルがあるappのadmin.pyに
admin.site.register(管理者ページに追加したいテーブルのモデル)
# の形式で記入する


# 以下インフラ-----------------------------------------------------------------------------------
# 証明書の検証ができずセキュリティ保護なしになる
# https通信にする--------------------------------------------------------------------------------
# Win64OpenSSL_Light-3_5_0.exeをインストールする

# コマンドプロンプトで以下を実行
# コマンドプロンプト用のコマンド
mkdir C:\nginx-1.28.0\ssl
cd C:\nginx-1.28.0\ssl

"C:\Program Files\OpenSSL-Win64\bin\openssl.exe" genrsa -out server.key 2048

"C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -new -x509 -key server.key -out server.crt -days 365 -subj "/C=JP/ST=Oita/L=Nakatsu/O=Daihatsu/CN=localhost"

--------------------------------------------------------------------------------------------------
# nginxの設定
# これでhttp://ipのみでアクセス可能になる
# Cドライブ直下にnginx-1.28.0フォルダをコピーする

cd C:\nginx-1.28.0
C:\nginx-1.28.0\conf\nginx.confを編集する
nginx.exe
# を実行する
# PCシャットダウン後再度実行して起動させる必要あり

# nginxが正しく動作するかの確認
nginx.exe -t

# nginxのリロード時のコマンド
nginx.exe -s reload
----------------------------------------------------------------------------------------------------
# waitressの起動(runserver不要)
waitress-serve --host=127.0.0.1 --port=8000 --threads=8 daihatsu.wsgi:application

---------------------------------------------------------------------------------------------------
# データベース
# 初期ユーザー名 postgres
# PowerShellを管理者で起動する必要あり
# 起動
Start-Service postgresql-x64-16

# 終了
Stop-Service postgresql-x64-16

# 確認
Get-Service *postgresql*
---------------------------------------------------------------------------------------------------
