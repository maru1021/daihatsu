/**
 * モーダルを表示する
 * @param {string} modalId - モーダルのID
 * @returns {bootstrap.Modal} - Bootstrapモーダルインスタンス
 */
export function showModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.error(`モーダルが見つかりません: ${modalId}`);
        return null;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    return modal;
}

/**
 * モーダルを非表示にする
 * @param {string} modalId - モーダルのID
 */
export function hideModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.error(`モーダルが見つかりません: ${modalId}`);
        return;
    }
    
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
}

/**
 * モーダルのクリーンアップを行う
 */
export function cleanupModals() {
    // 残ったモーダルオーバーレイをクリーンアップ
    const existingBackdrops = document.querySelectorAll('.modal-backdrop');
    existingBackdrops.forEach(backdrop => backdrop.remove());
    
    // bodyのスタイルをリセット
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

/**
 * モーダルのメッセージを更新する
 * @param {string} modalId - モーダルのID
 * @param {string} message - 表示するメッセージ
 */
export function updateModalMessage(modalId, message) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.error(`モーダルが見つかりません: ${modalId}`);
        return;
    }
    
    const messageElement = modalElement.querySelector('.modal-body p');
    if (messageElement) {
        messageElement.textContent = message;
    }
} 