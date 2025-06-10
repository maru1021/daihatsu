// static/js/toast.js
// Bootstrap Toastを使用した通知システム

// トースト表示関数
function showToast(type, message, title = null, duration = 3000) {
    const toastElement = document.getElementById(type === 'success' ? 'successToast' : 'errorToast');
    if (!toastElement) return;

    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: duration
    });

    const messageElement = document.getElementById(type === 'success' ? 'toastMessage' : 'errorMessage');
    if (messageElement) {
        messageElement.textContent = message;
    }

    // アニメーション用のクラスを追加
    toastElement.classList.add('toast-slide-in');
    
    toast.show();

    // トーストが非表示になった後の処理
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.classList.remove('toast-slide-in');
    });
}

// 簡易関数
function showSuccessToast(message, title = null) {
    return showToast('success', message, title);
}

function showErrorToast(message, title = null) {
    return showToast('error', message, title);
}

// クリックでトーストを閉じる
document.addEventListener('click', function(event) {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
        if (!toast.contains(event.target)) {
            const bsToast = bootstrap.Toast.getInstance(toast);
            if (bsToast) {
                bsToast.hide();
            }
        }
    });
});

// グローバルに公開
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;