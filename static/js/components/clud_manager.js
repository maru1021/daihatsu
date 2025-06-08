/**
 * 汎用CRUD管理システム
 * 複数のCRUD画面で再利用可能
 */

class CrudManager {
  constructor(config) {
      this.config = {
          entityName: '項目',
          tableContainerId: 'tableContainer',
          formModalId: 'formModal',
          editModalId: 'editModal',
          formId: 'crudForm',
          createUrl: '',
          editUrl: '',
          deleteUrl: '',
          searchUrl: '',
          ...config
      };
      this.isInitialized = false;
  }

  /**
   * 初期化
   */
  initialize() {
      if (this.isInitialized) return;
      
      this.cleanupModals();
      this.initializeCreateForm();
      this.initializePagination();
      this.initializeSearch();
      this.initializeTableEvents();
      
      this.isInitialized = true;
  }

  /**
   * モーダルクリーンアップ
   */
  cleanupModals() {
      const existingBackdrops = document.querySelectorAll('.modal-backdrop');
      existingBackdrops.forEach(backdrop => backdrop.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
  }

  /**
   * 新規作成フォーム初期化
   */
  initializeCreateForm() {
      const form = document.getElementById(this.config.formId);
      if (form && !form._crudInitialized) {
          form._crudInitialized = true;
          form.addEventListener('submit', (e) => this.handleCreateSubmit(e));
      }
  }

  /**
   * 新規作成フォーム送信処理
   */
  async handleCreateSubmit(e) {
      e.preventDefault();
      
      const form = e.target;
      const formData = new FormData(form);
      
      try {
          const response = await fetch(this.config.createUrl, {
              method: 'POST',
              body: formData,
              headers: {
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRFToken': this.getCsrfToken()
              }
          });
          
          const data = await response.json();
          
          if (data.status === 'success') {
              this.hideModal(this.config.formModalId);
              this.resetForm(form);
              this.showToast('success', data.message);
              this.updateTable(data.html);
          } else {
              this.showToast('error', data.message);
          }
      } catch (error) {
          console.error('Create error:', error);
          this.showToast('error', 'エラーが発生しました。');
      }
  }

  /**
   * ページネーション初期化
   */
  initializePagination() {
      document.querySelectorAll('.pagination a').forEach(link => {
          if (!link._crudPaginationInitialized) {
              link._crudPaginationInitialized = true;
              link.addEventListener('click', (e) => this.handlePaginationClick(e));
          }
      });
  }

  /**
   * ページネーションクリック処理
   */
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

  /**
   * 検索機能初期化
   */
  initializeSearch() {
      const searchInput = document.querySelector('input[name="search"]');
      if (searchInput && !searchInput._crudSearchInitialized) {
          searchInput._crudSearchInitialized = true;
          let searchTimeout;
          
          searchInput.addEventListener('input', () => {
              clearTimeout(searchTimeout);
              searchTimeout = setTimeout(() => {
                  this.handleSearch(searchInput.value);
              }, 500);
          });
      }
  }

  /**
   * 検索処理
   */
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

  /**
   * テーブルイベント初期化
   */
  initializeTableEvents() {
      if (document.body._crudTableEventsInitialized) return;
      document.body._crudTableEventsInitialized = true;
      
      document.addEventListener('click', (e) => {
          // 編集ボタン
          const editBtn = e.target.closest('.edit-btn, .edit-line');
          if (editBtn) {
              this.handleEdit(e, editBtn);
              return;
          }
          
          // 削除ボタン
          const deleteBtn = e.target.closest('.delete-btn, .delete-line');
          if (deleteBtn) {
              this.handleDelete(e, deleteBtn);
          }
      });
  }

  /**
   * 編集処理
   */
  async handleEdit(e, editBtn) {
      e.preventDefault();
      e.stopPropagation();
      
      const itemId = editBtn.getAttribute('data-item-id') || editBtn.getAttribute('data-line-id');
      const editUrl = this.config.editUrl.replace('0', itemId);
      
      try {
          const response = await fetch(editUrl, {
              headers: { 'HX-Request': 'true' }
          });
          
          const html = await response.text();
          this.showEditModal(html, itemId);
      } catch (error) {
          console.error('Edit error:', error);
          this.showToast('error', '編集画面の読み込みに失敗しました。');
      }
  }

  /**
   * 編集モーダル表示
   */
  showEditModal(html, itemId) {
      const modal = document.getElementById(this.config.editModalId);
      
      // 既存のモーダルクリーンアップ
      const existingModal = bootstrap.Modal.getInstance(modal);
      if (existingModal) existingModal.dispose();
      
      this.cleanupModals();
      
      // モーダルコンテンツ更新
      modal.querySelector('.modal-content').innerHTML = html;
      
      // 新しいモーダルインスタンス作成
      const bsModal = new bootstrap.Modal(modal);
      
      // クリーンアップイベント
      modal.addEventListener('hidden.bs.modal', () => {
          this.cleanupModals();
      }, { once: true });
      
      bsModal.show();
      
      // 編集フォーム送信処理
      const editForm = modal.querySelector('form');
      if (editForm) {
          editForm.addEventListener('submit', (e) => this.handleEditSubmit(e, bsModal));
      }
  }

  /**
   * 編集フォーム送信処理
   */
  async handleEditSubmit(e, bsModal) {
      e.preventDefault();
      
      const form = e.target;
      const formData = new FormData(form);
      
      try {
          const response = await fetch(form.action, {
              method: 'POST',
              body: formData,
              headers: {
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRFToken': this.getCsrfToken()
              }
          });
          
          const data = await response.json();
          
          if (data.status === 'success') {
              bsModal.hide();
              this.showToast('success', data.message);
              this.updateTable(data.html);
          } else {
              this.showToast('error', data.message);
          }
      } catch (error) {
          console.error('Edit submit error:', error);
          this.showToast('error', 'エラーが発生しました。');
      }
  }

  /**
   * 削除処理
   */
  handleDelete(e, deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      
      const itemId = deleteBtn.getAttribute('data-item-id') || deleteBtn.getAttribute('data-line-id');
      const itemName = deleteBtn.getAttribute('data-item-name') || deleteBtn.getAttribute('data-line-name');
      
      this.showDeleteConfirmation(itemId, itemName);
  }

  /**
   * 削除確認モーダル表示
   */
  showDeleteConfirmation(itemId, itemName) {
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
      
      // 既存削除モーダルクリーンアップ
      document.querySelectorAll(`[id^="deleteModal"]`).forEach(modal => modal.remove());
      
      // 新しいモーダル追加
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = modalHtml;
      const newModalElement = tempDiv.firstElementChild;
      document.body.appendChild(newModalElement);
      
      const bsModal = new bootstrap.Modal(newModalElement);
      bsModal.show();
      
      // クリーンアップイベント
      newModalElement.addEventListener('hidden.bs.modal', () => {
          newModalElement.remove();
          this.cleanupModals();
      }, { once: true });
      
      // 削除確認ボタン処理
      const confirmBtn = newModalElement.querySelector('#confirmDeleteBtn');
      if (confirmBtn) {
          confirmBtn.addEventListener('click', () => {
              this.performDelete(itemId, bsModal);
          });
      }
  }

  /**
   * 削除実行
   */
  async performDelete(itemId, modal) {
      try {
          const deleteUrl = this.config.deleteUrl.replace('0', itemId);
          
          const response = await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                  'X-Requested-With': 'XMLHttpRequest',
                  'X-CSRFToken': this.getCsrfToken()
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

  /**
   * ユーティリティメソッド
   */
  getCsrfToken() {
      const token = document.querySelector('[name=csrfmiddlewaretoken]');
      return token ? token.value : '';
  }

  hideModal(modalId) {
      const modalElement = document.getElementById(modalId);
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
      
      setTimeout(() => this.cleanupModals(), 300);
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

  showToast(type, message) {
      if (typeof showToast === 'function') {
          showToast(type, message);
      }
  }
}

// グローバルに公開
window.CrudManager = CrudManager;