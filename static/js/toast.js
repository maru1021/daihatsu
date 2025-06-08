// static/js/toast.js
// Bootstrap Toastを使用した通知システム

// トーストコンテナを作成（まだ存在しない場合）
function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '1200';
      document.body.appendChild(container);
  }
  return container;
}

// トースト表示関数
function showToast(type, message, title = null, duration = 5000) {
  const container = ensureToastContainer();
  
  // トーストのID
  const toastId = 'toast-' + Date.now();
  
  // アイコンとカラーの設定
  const config = {
      success: {
          icon: 'fas fa-check-circle',
          bgClass: 'bg-success',
          textClass: 'text-white'
      },
      error: {
          icon: 'fas fa-exclamation-circle',
          bgClass: 'bg-danger',
          textClass: 'text-white'
      },
      warning: {
          icon: 'fas fa-exclamation-triangle',
          bgClass: 'bg-warning',
          textClass: 'text-dark'
      },
      info: {
          icon: 'fas fa-info-circle',
          bgClass: 'bg-info',
          textClass: 'text-white'
      }
  };
  
  const typeConfig = config[type] || config.info;
  const toastTitle = title || {
      success: '成功',
      error: 'エラー',
      warning: '警告',
      info: '情報'
  }[type] || '通知';
  
  // トーストHTML
  const toastHtml = `
      <div id="${toastId}" class="toast ${typeConfig.bgClass} ${typeConfig.textClass}" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${duration}">
          <div class="toast-header ${typeConfig.bgClass} ${typeConfig.textClass} border-0">
              <i class="${typeConfig.icon} me-2"></i>
              <strong class="me-auto">${toastTitle}</strong>
              <button type="button" class="btn-close btn-close${typeConfig.textClass.includes('white') ? '-white' : ''}" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">
              ${message}
          </div>
      </div>
  `;
  
  // トーストを挿入
  container.insertAdjacentHTML('beforeend', toastHtml);
  
  // Bootstrap Toastを初期化して表示
  const toastElement = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastElement);
  
  // 自動削除の設定
  toastElement.addEventListener('hidden.bs.toast', function() {
      toastElement.remove();
  });
  
  bsToast.show();
  
  return toastElement;
}

// 簡易関数
function showSuccessToast(message, title = null) {
  return showToast('success', message, title);
}

function showErrorToast(message, title = null) {
  return showToast('error', message, title);
}

function showWarningToast(message, title = null) {
  return showToast('warning', message, title);
}

function showInfoToast(message, title = null) {
  return showToast('info', message, title);
}

// グローバルに公開
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;