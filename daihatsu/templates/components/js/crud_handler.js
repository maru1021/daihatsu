/**
 * 汎用CRUD操作ハンドラー
 * 使用方法: CrudHandler.init(config) でページを初期化
 */
class CrudHandler {
    constructor(config) {
        this.config = {
            tableContainerId: 'tableContainer',
            formModalId: 'crudFormModal',
            editModalId: 'crudEditModal',
            entityName: '項目',
            ...config
        };
        this.isInitialized = false;
    }

    static init(config) {
        const handler = new CrudHandler(config);
        handler.initialize();
        return handler;
    }

    initialize() {
        if (this.isInitialized) return;
        
        // モーダルオーバーレイクリーンアップ
        this.cleanupModals();
        
        // フォーム初期化
        this.initializeCreateForm();
        
        // イベントリスナー初期化
        this.initializeEventListeners();
        
        // ページネーション初期化
        this.initializePagination();
        
        // 検索機能初期化
        this.initializeSearch();
        
        this.isInitialized = true;
    }

    cleanupModals() {
        const existingBackdrops = document.querySelectorAll('.modal-backdrop');
        existingBackdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    initializeCreateForm() {
        const form = document.getElementById('crudForm');
        if (form && !form._formInitialized) {
            form._formInitialized = true;
            form.addEventListener('submit', (e) => this.handleFormSubmit(e, 'create'));
        }
    }

    initializeEventListeners() {
        if (document.body._crudEventsInitialized) return;
        document.body._crudEventsInitialized = true;
        
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
    }

    handleDocumentClick(e) {
        // 編集ボタンの処理
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.handleEdit(editBtn.getAttribute('data-item-id'));
            return;
        }
        
        // 削除ボタンの処理
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.handleDelete(
                deleteBtn.getAttribute('data-item-id'),
                deleteBtn.getAttribute('data-item-name')
            );
        }
    }

    async handleEdit(itemId) {
        try {
            const url = this.config.editUrl.replace('0', itemId);
            const response = await fetch(url, {
                headers: { 'HX-Request': 'true' }
            });
            
            if (!response.ok) throw new Error('編集データの取得に失敗しました');
            
            const html = await response.text();
            this.showEditModal(html, itemId);
        } catch (error) {
            console.error('Edit error:', error);
            this.showToast('error', '編集画面の読み込みに失敗しました。');
        }
    }

    showEditModal(html, itemId) {
        const modal = document.getElementById(this.config.editModalId);
        
        // 既存のモーダルインスタンスをクリーンアップ
        const existingModal = bootstrap.Modal.getInstance(modal);
        if (existingModal) {
            existingModal.dispose();
        }
        
        // オーバーレイを強制削除
        const existingBackdrops = document.querySelectorAll('.modal-backdrop');
        existingBackdrops.forEach(backdrop => backdrop.remove());
        
        // モーダルコンテンツを更新
        modal.querySelector('.modal-content').innerHTML = html;
        
        // 新しいモーダルインスタンスを作成
        const bsModal = new bootstrap.Modal(modal);
        
        // モーダル非表示時のクリーンアップイベントを追加
        modal.addEventListener('hidden.bs.modal', () => {
            this.cleanupModals();
        }, { once: true });
        
        bsModal.show();
        
        // 編集フォームの送信処理
        const editForm = modal.querySelector('form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleFormSubmit(e, 'edit', bsModal));
        }
    }

    handleDelete(itemId, itemName) {
        const modalHtml = `
            <div class="modal fade" id="deleteModal${itemId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${this.config.entityName}削除の確認</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>本当に「${itemName}」を削除してもよろしいですか？</p>
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
        const existingDeleteModals = document.querySelectorAll(`[id^="deleteModal"]`);
        existingDeleteModals.forEach(modal => modal.remove());
        
        // モーダルを追加
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        const newModalElement = tempDiv.firstElementChild;
        document.body.appendChild(newModalElement);
        
        // モーダルを表示
        const bsModal = new bootstrap.Modal(newModalElement);
        bsModal.show();
        
        // クリーンアップ処理
        newModalElement.addEventListener('hidden.bs.modal', () => {
            newModalElement.remove();
            this.cleanupModals();
        }, { once: true });
        
        // 削除確認ボタンのイベント処理
        const deleteConfirmBtn = newModalElement.querySelector('#confirmDeleteBtn');
        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener('click', () => {
                this.performDelete(itemId, bsModal);
            });
        }
    }

    async performDelete(itemId, modal) {
        try {
            const url = this.config.deleteUrl.replace('0', itemId);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.config.csrfToken
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                modal.hide();
                this.showToast('success', data.message);
                this.updateTable(data.html);
            } else {
                this.showToast('error', data.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('error', '削除に失敗しました。');
        }
    }

    async handleFormSubmit(e, type, modal = null) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        try {
            const response = await fetch(form.action || this.config.createUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.config.csrfToken
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                if (modal) {
                    modal.hide();
                } else {
                    const modalElement = document.getElementById(this.config.formModalId);
                    const bsModal = bootstrap.Modal.getInstance(modalElement);
                    if (bsModal) bsModal.hide();
                }
                
                if (type === 'create') {
                    this.resetForm(form);
                }
                
                this.showToast('success', data.message);
                this.updateTable(data.html);
            } else {
                this.showToast('error', data.message);
            }
        } catch (error) {
            console.error('Form submit error:', error);
            this.showToast('error', 'エラーが発生しました。');
        }
    }

    resetForm(form) {
        form.reset();
        // カスタムリセット処理があれば実行
        if (this.config.onFormReset) {
            this.config.onFormReset(form);
        }
    }

    updateTable(html) {
        if (html) {
            document.getElementById(this.config.tableContainerId).innerHTML = html;
            this.initializePagination();
        }
    }

    initializePagination() {
        document.querySelectorAll('.pagination a').forEach(link => {
            if (!link._paginationInitialized) {
                link._paginationInitialized = true;
                link.addEventListener('click', (e) => this.handlePaginationClick(e));
            }
        });
    }

    async handlePaginationClick(e) {
        e.preventDefault();
        
        try {
            const response = await fetch(e.target.href, {
                headers: { 'HX-Request': 'true' }
            });
            
            const html = await response.text();
            this.updateTable(html);
        } catch (error) {
            console.error('Pagination error:', error);
            this.showToast('error', 'ページの読み込みに失敗しました。');
        }
    }

    initializeSearch() {
        const searchInput = document.querySelector('input[name="search"]');
        if (searchInput && !searchInput._searchInitialized) {
            searchInput._searchInitialized = true;
            let searchTimeout;
            
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(searchInput.value);
                }, 500);
            });
        }
    }

    async handleSearch(searchQuery) {
        try {
            const url = new URL(this.config.searchUrl, window.location.origin);
            url.searchParams.set('search', searchQuery);
            
            const response = await fetch(url, {
                headers: { 'HX-Request': 'true' }
            });
            
            const html = await response.text();
            this.updateTable(html);
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('error', '検索に失敗しました。');
        }
    }

    showToast(type, message) {
        if (typeof showToast === 'function') {
            showToast(type, message);
        }
    }
}

// グローバルに公開
window.CrudHandler = CrudHandler;