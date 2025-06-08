/**
 * ライン管理ページのJavaScript - ページ保持対応版
 */

// グローバル変数
let lineMasterInitialized = false;

// 現在のページ情報を取得する関数
function getCurrentPageInfo() {
    let currentPage = '1';
    let currentSearch = '';
    
    // URLパラメータから取得
    const urlParams = new URLSearchParams(window.location.search);
    const urlPage = urlParams.get('page');
    const urlSearch = urlParams.get('search');
    
    if (urlPage) {
        currentPage = urlPage;
    }
    
    if (urlSearch !== null) {
        currentSearch = urlSearch;
    }
    
    // アクティブなページネーション要素から取得（URLが無い場合）
    if (!urlPage) {
        const activePageElement = document.querySelector('.pagination .page-item.active .page-link');
        if (activePageElement) {
            const pageFromDOM = activePageElement.textContent.trim();
            if (pageFromDOM && !isNaN(pageFromDOM)) {
                currentPage = pageFromDOM;
            }
        }
    }
    
    // 検索入力フィールドから取得
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput && urlSearch === null) {
        currentSearch = searchInput.value || '';
    }
    return {
        page: currentPage,
        search: currentSearch
    };
}

// ページ初期化関数（HTMXナビゲーション後の再初期化用）
function initializeLineMasterPage() {
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
            
            const pageInfo = getCurrentPageInfo();
            const formData = new FormData(lineForm);
            formData.append('current_page', pageInfo.page);
            formData.append('search_query', pageInfo.search);
            
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
                        initializePaginationEvents();
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
    document.querySelectorAll('.pagination a').forEach(link => {
        if (!link._paginationInitialized) {
            link._paginationInitialized = true;
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const url = this.href;
                
                // URLを更新してからHTMXリクエストを送信
                window.history.pushState({}, '', url);
                
                fetch(url, {
                    headers: { 'HX-Request': 'true' }
                })
                .then(response => response.text())
                .then(html => {
                    document.getElementById('lineTableContainer').innerHTML = html;
                    initializePaginationEvents();
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('error', 'ページの読み込みに失敗しました。');
                });
            });
        }
    });
}

// 検索フォームの処理
function initializeSearchForm() {
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput && !searchInput._searchInitialized) {
        searchInput._searchInitialized = true;
        
        // URLを動的に取得
        const searchUrl = searchInput.getAttribute('data-search-url') || '/manufacturing/line-master/';
        
        searchInput.addEventListener('input', function() {
            const searchQuery = this.value;
            const url = new URL(searchUrl, window.location.origin);
            url.searchParams.set('search', searchQuery);
            url.searchParams.set('page', '1'); // 検索時は1ページ目
            
            // URLを更新してからHTMXリクエストを送信
            window.history.pushState({}, '', url.pathname + url.search);
            
            fetch(url, {
                headers: { 'HX-Request': 'true' }
            })
            .then(response => response.text())
            .then(html => {
                document.getElementById('lineTableContainer').innerHTML = html;
                initializePaginationEvents();
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('error', '検索に失敗しました。');
            });
        });
    }
}

// テーブルイベント（編集・削除）の初期化
function initializeTableEvents() {
    if (document.body._lineEventsInitialized) return;
    document.body._lineEventsInitialized = true;
    
    document.addEventListener('click', function(e) {
        // 編集ボタンの処理
        const editBtn = e.target.closest('.edit-line');
        if (editBtn) {
            handleEditLine(e, editBtn);
            return;
        }
        
        // 削除ボタンの処理
        const deleteBtn = e.target.closest('.delete-line');
        if (deleteBtn) {
            handleDeleteLine(e, deleteBtn);
        }
    });
}

// 編集処理
function handleEditLine(e, editBtn) {
    e.preventDefault();
    e.stopPropagation();
    
    const lineId = editBtn.getAttribute('data-line-id');
    const editUrl = editBtn.getAttribute('data-edit-url') || `/manufacturing/line-master/edit/${lineId}/`;
    
    // サーバーからラインの情報を取得
    fetch(editUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // 編集モーダルを表示
                const editModal = document.getElementById('lineEditModal');
                if (editModal) {
                    const modal = new bootstrap.Modal(editModal);
                    
                    // フォームのaction属性を設定
                    const form = editModal.querySelector('form');
                    if (form) {
                        form.action = editUrl;
                        
                        // フォームの各フィールドに値を設定
                        const nameField = form.querySelector('[name="name"]');
                        const xPosField = form.querySelector('[name="x_position"]');
                        const yPosField = form.querySelector('[name="y_position"]');
                        const widthField = form.querySelector('[name="width"]');
                        const heightField = form.querySelector('[name="height"]');
                        const activeField = form.querySelector('[name="active"]');
                        
                        nameField.value = data.line.name;
                        xPosField.value = data.line.x_position;
                        yPosField.value = data.line.y_position;
                        widthField.value = data.line.width;
                        heightField.value = data.line.height;
                        activeField.checked = data.line.active;
                    }
                    
                    modal.show();
                    
                    // 編集フォームの送信処理
                    if (form) {
                        form.addEventListener('submit', function(e) {
                            handleEditFormSubmit(e, form, modal);
                        });
                    }
                }
            } else {
                showToast('エラー', 'ラインの情報を取得できませんでした。', 'error');
            }
        })
        .catch(error => {
            showToast('エラー', 'ラインの情報を取得できませんでした。', 'error');
        });
}

// 編集フォーム送信処理
function handleEditFormSubmit(e, editForm, bsModal) {
    e.preventDefault();
    
    const pageInfo = getCurrentPageInfo();
    const formData = new FormData(editForm);
    formData.append('current_page', pageInfo.page);
    formData.append('search_query', pageInfo.search);
    
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
                initializePaginationEvents();
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
    
    const lineId = deleteBtn.getAttribute('data-line-id');
    const lineName = deleteBtn.getAttribute('data-line-name');
    const deleteUrl = deleteBtn.getAttribute('data-delete-url') || `/manufacturing/line-master/delete/${lineId}/`;
    
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
            // 現在のページ情報を取得
            const pageInfo = getCurrentPageInfo();
            
            // URLパラメータとして送信
            const deleteUrlObj = new URL(deleteUrl, window.location.origin);
            deleteUrlObj.searchParams.set('current_page', pageInfo.page);
            deleteUrlObj.searchParams.set('search_query', pageInfo.search);
            
            performDelete(lineId, deleteUrlObj.toString(), bsModal);
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
                initializePaginationEvents();
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
        initializeLineMasterPage();
        lineMasterInitialized = true;
    }
});

// HTMXナビゲーション後の初期化（スロットリング追加）
let htmxInitTimeout = null;
document.addEventListener('htmx:afterSwap', function(evt) {
    if (evt.detail.target.classList.contains('main-content')) {
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
    if (!lineMasterInitialized) {
        initializeLineMasterPage();
        lineMasterInitialized = true;
    }
};

// ページがすでに読み込まれている場合の即座初期化
if (document.readyState === 'loading') {
    // DOMContentLoadedイベントで処理
} else {
    if (!lineMasterInitialized) {
        initializeLineMasterPage();
        lineMasterInitialized = true;
    }
}