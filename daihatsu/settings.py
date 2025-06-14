from pathlib import Path
import ipaddress
import time

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-4qw4=0)pmkh28=+9qy!p1d#bzp@tizj&a^8$vl)gmyz9b^6nih'

# デバッグ時にはキャッシュ無効
DEBUG = True

# キャッシュバスター関数
def get_cache_buster():
    if DEBUG:
        return int(time.time())
    else:
        return '1.0.0'

# キャッシュバスター用のコンテキストプロセッサ
def cache_buster_context_processor(request):
    return {'CACHE_BUSTER': get_cache_buster()}

# 403エラーの対策
def generate_trusted_origins(prefix=''):
    origins = []
    
    # フォーム入力を行うIPのサブネットを指定
    network_ranges = [
        '127.0.0.1/32',
        '10.69.0.0/16',
        '192.168.0.0/16',
    ]
    
    for network_str in network_ranges:
        network = ipaddress.IPv4Network(network_str, strict=False)
        # 最初の50個のIPのみ（パフォーマンス対策）
        for i, ip in enumerate(network.hosts()):
            if i >= 50:
                break
            if prefix:
                origins.append(f'{prefix}{ip}')
            else:
                origins.append(str(ip))
    return origins

CSRF_TRUSTED_ORIGINS = generate_trusted_origins('https://')
ALLOWED_HOSTS = generate_trusted_origins()

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'daihatsu',
    'manufacturing.apps.ManufacturingConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'daihatsu.middleware.PerformanceMiddleware',  # パフォーマンス監視ミドルウェアを追加
]

ROOT_URLCONF = 'daihatsu.urls'

# 修正されたTEMPLATES設定
if DEBUG:
    # 開発環境：キャッシュ無効化（loadersを使用する場合はAPP_DIRSをFalseに）
    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [
                BASE_DIR / 'daihatsu' / 'templates',
                BASE_DIR / 'manufacturing' / 'templates',
            ],
            'APP_DIRS': False,  # loadersを使うためFalse
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                    'daihatsu.settings.cache_buster_context_processor',
                ],
                'loaders': [
                    'django.template.loaders.filesystem.Loader',
                    'django.template.loaders.app_directories.Loader',
                ],
            },
        },
    ]
    
    # キャッシュ完全無効化
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }
else:
    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [
                BASE_DIR / 'daihatsu' / 'templates',
                BASE_DIR / 'manufacturing' / 'templates',
            ],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                    'daihatsu.settings.cache_buster_context_processor',
                ],
            },
        },
    ]
    
    # 本番環境：キャッシュ有効
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': 'redis://127.0.0.1:6379/1',
        }
    }

WSGI_APPLICATION = 'daihatsu.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'ja'
TIME_ZONE = 'Asia/Tokyo'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# 開発環境と本番環境でSTATIC_ROOT設定を分ける
if DEBUG:
    pass
else:
    # 本番環境：STATIC_ROOT設定
    STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 静的ファイルファインダーを明示的に設定
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# 開発環境用の設定（テンプレートキャッシュ無効化）
if DEBUG:
    # 静的ファイルのキャッシュも無効化
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'


# ログイン関連の設定
LOGIN_URL = '/auth/login'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/auth/login'

# ログ設定
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'sql': {
            'format': '%(asctime)s - %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'sql_file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'log/sql.log',
            'formatter': 'sql',
            'encoding': 'utf-8',
        },
    },
    'filters': {
        'sql_filter': {
            '()': 'daihatsu.log.SQLFilter',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['sql_file'],
            'level': 'DEBUG',
            'propagate': False,
            'filters': ['sql_filter'],
        },
    },
}

# 開発環境でのSQLログ出力設定
if DEBUG:
    LOGGING['loggers']['django.db.backends']['level'] = 'DEBUG'
else:
    LOGGING['loggers']['django.db.backends']['level'] = 'INFO'