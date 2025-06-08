/**
 * ライン管理ページのJavaScript - 修正版
 */

// グローバル変数
let lineMasterInitialized = false;

// ページ初期化関数（HTMXナビゲーション後の再初期化用）
function initializeLineMasterPage() {
    console.log('ライン管理ページ初期化開始');
    
    // 残ったモーダルオーバーレイをクリーンアップ
    const existingBackdrops = document.querySelectorAll('.modal-backdrop');
    existingBackdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // 既存のイベントリスナーを削除（重複防止）
    const existingForm = document.getElementById('lineForm');
    if (existingForm && existingForm._formInitialized) {
        return;
    }

    // 新規追加フォームの送信処理
    const lineForm = document.getElementById('lineForm');
    if (lineForm && !lineForm._formInitialized) {
        lineForm._formInitialized = true;
        lineForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(lineForm);
            
            // URLを動的に取得
            const createUrl = lineForm.getAttribute('data-create-url') || '/manufacturing/line-master/';
            
            fetch(createUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const modalElement = document.getElementById('lineFormModal');
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                    
                    setTimeout(() => {
                        const backdrops = document.querySelectorAll('.modal-backdrop');
                        backdrops.forEach(backdrop => backdrop.remove());
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.body.style.paddingRight = '';
                    }, 300);
                    
                    resetLineForm(lineForm);
                    showToast('success', data.message);
                    
                    if (data.html) {
                        document.getElementById('lineTableContainer').innerHTML = data.html;
                        // 再初期化
                        setTimeout(() => {
                            initializePaginationEvents();
                            initializeTableEvents();
                        }, 100);
                    }
                } else {
                    showToast('error', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('error', 'エラーが発生しました。');
            });
        });
    }

    // ページネーションのイベント初期化
    initializePaginationEvents();

    // 検索フォームの処理
    initializeSearchForm();

    // 編集・削除ボタンのクリックイベント
    initializeTableEvents();

    console.log('ライン管理ページ初期化完了');
}

// フォームリセット関数
function resetLineForm(form) {
    form.reset();
    const xPosInput = document.getElementById('id_x_position');
    const yPosInput = document.getElementById('id_y_position');
    const widthInput = document.getElementById('id_width');
    const heightInput = document.getElementById('id_height');
    const activeInput = document.getElementById('id_active');
    
    if (xPosInput) xPosInput.value = '1';
    if (yPosInput) yPosInput.value = '1';
    if (widthInput) widthInput.value = '1';
    if (heightInput) heightInput.value = '1';
    if (activeInput) activeInput.checked = true;
}

// ページネーションのイベント初期化
function initializePaginationEvents() {
    // 既存のページネーションイベントを削除
    document.querySelectorAll('.pagination a').forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    // 新しいページネーションイベントを追加
    document.querySelectorAll('.pagination a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.href;
            
            console.log('ページネーションクリック:', url);
            
            fetch(url, {
                headers: { 'HX-Request': 'true' }
            })
            .then(response => response.text())
            .then(html => {
                document.getElementById('lineTableContainer').innerHTML = html;
                // 再初期化
                setTimeout(() => {
                    initializePaginationEvents();
                    initializeTableEvents();
                }, 100);
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('error', 'ページの読み込みに失敗しました。');
            });
        });
    });
}

// 検索フォームの処理
function initializeSearchForm() {
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput && !searchInput._searchInitialized) {
        searchInput._searchInitialized = true;
        let searchTimeout;
        
        // URLを動的に取得
        const searchUrl = searchInput.getAttribute('data-search-url') || '/manufacturing/line-master/';
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchQuery = this.value;
                const url = new URL(searchUrl, window.location.origin);
                url.searchParams.set('search', searchQuery);
                
                fetch(url, {
                    headers: { 'HX-Request': 'true' }
                })
                .then(response => response.text())
                .then(html => {
                    document.getElementById('lineTableContainer').innerHTML = html;
                    // 再初期化
                    setTimeout(() => {
                        initializePaginationEvents();
                        initializeTableEvents();
                    }, 100);
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('error', '検索に失敗しました。');
                });
            }, 500);
        });
    }
}

// テーブルイベント（編集・削除）の初期化
function initializeTableEvents() {
    console.log('テーブルイベント初期化');
    
    // 既存の編集ボタンイベントを削除して新しく追加
    document.querySelectorAll('.edit-line').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function(e) {
            handleEditLine(e, this);
        });
    });
    
    // 既存の削除ボタンイベントを削除して新しく追加
    document.querySelectorAll('.delete-line').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function(e) {
            handleDeleteLine(e, this);
        });
    });
}

// 編集処理
function handleEditLine(e, editBtn) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('編集ボタンクリック');
    
    const lineId = editBtn.getAttribute('data-line-id');
    const editUrl = editBtn.getAttribute('data-edit-url') || `/manufacturing/line-master/${lineId}/`;
    
    console.log('編集URL:', editUrl);
    
    fetch(editUrl, {
        headers: { 'HX-Request': 'true' }
    })
    .then(response => response.text())
    .then(html => {
        const modal = document.getElementById('lineEditModal');
        
        // 既存のモーダルインスタンスを削除
        const existingModal = bootstrap.Modal.getInstance(modal);
        if (existingModal) existingModal.dispose();
        
        // 既存のバックドロップを削除
        const existingBackdrops = document.querySelectorAll('.modal-backdrop');
        existingBackdrops.forEach(backdrop => backdrop.remove());
        
        // モーダルコンテンツを更新
        modal.querySelector('.modal-content').innerHTML = html;
        
        // 新しいモーダルインスタンスを作成
        const bsModal = new bootstrap.Modal(modal);
        
        // モーダル非表示時のクリーンアップ
        modal.addEventListener('hidden.bs.modal', function() {
            cleanupModals();
        }, { once: true });
        
        // モーダルを表示
        bsModal.show();
        
        // 編集フォームの送信処理
        const editForm = modal.querySelector('form');
        if (editForm) {
            editForm.addEventListener('submit', function(e) {
                handleEditFormSubmit(e, editForm, bsModal);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', '編集画面の読み込みに失敗しました。');
    });
}

// 編集フォーム送信処理
function handleEditFormSubmit(e, editForm, bsModal) {
    e.preventDefault();
    
    const formData = new FormData(editForm);
    
    fetch(editForm.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            bsModal.hide();
            showToast('success', data.message);
            
            if (data.html) {
                document.getElementById('lineTableContainer').innerHTML = data.html;
                // 再初期化
                setTimeout(() => {
                    initializePaginationEvents();
                    initializeTableEvents();
                }, 100);
            }
        } else {
            showToast('error', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'エラーが発生しました。');
    });
}

// 削除処理
function handleDeleteLine(e, deleteBtn) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('削除ボタンクリック');
    
    const lineId = deleteBtn.getAttribute('data-line-id');
    const lineName = deleteBtn.getAttribute('data-line-name');
    const deleteUrl = deleteBtn.getAttribute('data-delete-url') || `/manufacturing/line-master/delete/${lineId}/`;
    
    console.log('削除URL:', deleteUrl);
    
    const modalHtml = `
        <div class="modal fade" id="deleteLineModal${lineId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">ライン削除の確認</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>本当に「${lineName}」を削除してもよろしいですか？</p>
                        <p class="text-danger">この操作は取り消せません。</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">削除</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 既存の削除モーダルを削除
    const existingDeleteModals = document.querySelectorAll(`[id^="deleteLineModal"]`);
    existingDeleteModals.forEach(modal => modal.remove());
    
    // 新しいモーダルを追加
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHtml;
    const newModalElement = tempDiv.firstElementChild;
    document.body.appendChild(newModalElement);
    
    const bsModal = new bootstrap.Modal(newModalElement);
    bsModal.show();
    
    // クリーンアップ処理
    newModalElement.addEventListener('hidden.bs.modal', function() {
        newModalElement.remove();
        cleanupModals();
    }, { once: true });
    
    // 削除確認ボタンの処理
    const deleteConfirmBtn = newModalElement.querySelector('#confirmDeleteBtn');
    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', function() {
            performDelete(lineId, deleteUrl, bsModal);
        });
    }
}

// 実際の削除実行
function performDelete(lineId, deleteUrl, bsModal) {
    fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            bsModal.hide();
            showToast('success', data.message);
            
            if (data.html) {
                document.getElementById('lineTableContainer').innerHTML = data.html;
                // 再初期化
                setTimeout(() => {
                    initializePaginationEvents();
                    initializeTableEvents();
                }, 100);
            }
        } else {
            showToast('error', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', '削除に失敗しました。');
    });
}

// モーダルクリーンアップ
function cleanupModals() {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
    if (!lineMasterInitialized) {
        console.log('DOMContentLoaded: ライン管理ページを初期化');
        initializeLineMasterPage();
        lineMasterInitialized = true;
    }
});

// HTMXナビゲーション後の初期化（スロットリング追加）
let htmxInitTimeout = null;
document.addEventListener('htmx:afterSwap', function(evt) {
    if (evt.detail.target.classList.contains('main-content')) {
        console.log('HTMX afterSwap: ライン管理ページを再初期化');
        
        // 前のタイマーをクリア
        if (htmxInitTimeout) {
            clearTimeout(htmxInitTimeout);
        }
        
        // 少し遅延して実行（重複を防ぐため）
        htmxInitTimeout = setTimeout(() => {
            lineMasterInitialized = false; // リセット
            initializeLineMasterPage();
            lineMasterInitialized = true;
        }, 200);
    }
});

// 手動初期化用（line_master_content.htmlから呼び出される）
window.initializeLineMasterPageManual = function() {
    console.log('手動初期化: ライン管理ページ');
    lineMasterInitialized = false; // 強制リセット
    initializeLineMasterPage();
    lineMasterInitialized = true;
};

// ページがすでに読み込まれている場合の即座初期化
if (document.readyState === 'loading') {
    // DOMContentLoadedイベントで処理
} else {
    if (!lineMasterInitialized) {
        console.log('即座初期化（complete）: ライン管理ページ');
        initializeLineMasterPage();
        lineMasterInitialized = true;
    }
}