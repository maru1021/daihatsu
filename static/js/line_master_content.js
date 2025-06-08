/**
 * ライン管理ページ - コンテンツ専用JavaScript
 * ファイル: static/js/line_master_content.js
 */

(function() {
  'use strict';

  // デバッグ: JavaScriptが正しく読み込まれているかを確認
  window.lineMasterDebug = function() {
      const pageInfo = getCurrentPageInfo();
      return pageInfo;
  };
  
  // グローバル変数
  let lineMasterContentInitialized = false;
  
  // 現在のページ情報を取得する関数（デバッグ強化版）
  function getCurrentPageInfo() {
      let currentPage = '1';
      let currentSearch = '';

      // 1. URLパラメータから取得（最優先）
      const urlParams = new URLSearchParams(window.location.search);
      const urlPage = urlParams.get('page');
      const urlSearch = urlParams.get('search');
      
      if (urlPage) {
          currentPage = urlPage;
      }
      
      if (urlSearch !== null) {
          currentSearch = urlSearch;
      }
      
      // 2. アクティブなページネーション要素から取得（URLが無い場合）
      if (!urlPage) {
          const activePageElement = document.querySelector('.pagination .page-item.active .page-link');
          if (activePageElement) {
              const pageFromDOM = activePageElement.textContent.trim();
              if (pageFromDOM && !isNaN(pageFromDOM)) {
                  currentPage = pageFromDOM;
              }
          }
      }
      
      // 3. 検索入力フィールドから取得
      const searchInput = document.querySelector('input[name="search"]');
      if (searchInput && urlSearch === null) {
          currentSearch = searchInput.value || '';
      }
      
      // 4. 隠し要素からも確認（バックアップ）
      const hiddenPageElement = document.getElementById('currentPageNumber');
      const hiddenSearchElement = document.getElementById('currentSearchQuery');
      
      if (!urlPage && hiddenPageElement && hiddenPageElement.value) {
          currentPage = hiddenPageElement.value;
      }
      
      if (urlSearch === null && hiddenSearchElement) {
          currentSearch = hiddenSearchElement.value || '';
      }
      
      const pageInfo = {
          page: currentPage,
          search: currentSearch
      };
      return pageInfo;
  }
  
  // 隠し要素のページ情報を更新する関数
  function updatePageInfo(page, search) {
      const pageNumberElement = document.getElementById('currentPageNumber');
      const searchQueryElement = document.getElementById('currentSearchQuery');
      
      if (pageNumberElement) {
          pageNumberElement.value = page || '1';
      }
      
      if (searchQueryElement) {
          searchQueryElement.value = search || '';
      }
  }
  
  // FormDataに現在のページ情報を追加する関数
  function addPageInfoToFormData(formData) {
      const pageInfo = getCurrentPageInfo();
      formData.append('current_page', pageInfo.page);
      if (pageInfo.search) {
          formData.append('search_query', pageInfo.search);
      }
  }
  
  // モーダルクリーンアップ関数
  function cleanupModals() {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
  }
  
  // 完全なモーダルクリーンアップ
  function cleanupAllModals() {
      // 全ての削除モーダルを削除
      document.querySelectorAll('[id^="deleteLineModal"]').forEach(modal => {
          const instance = bootstrap.Modal.getInstance(modal);
          if (instance) {
              instance.dispose();
          }
          modal.remove();
      });
      
      // 全てのモーダルバックドロップを削除
      cleanupModals();
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
  
  // ページネーション初期化
  function initializePagination() {
      document.querySelectorAll('.pagination a').forEach(link => {
          link.addEventListener('click', function(e) {
              e.preventDefault();
              const url = this.href;
              
              // URLからページ番号を抽出
              const urlObj = new URL(url);
              const newPage = urlObj.searchParams.get('page') || '1';
              const newSearch = urlObj.searchParams.get('search') || '';
              
              fetch(url, {
                  headers: { 'HX-Request': 'true' }
              })
              .then(response => response.text())
              .then(html => {
                  document.getElementById('lineTableContainer').innerHTML = html;
                  
                  // 隠し要素を更新
                  updatePageInfo(newPage, newSearch);
                  
                  // URLを更新
                  window.history.replaceState({}, '', url);
                  
                  // 再初期化
                  setTimeout(initializeContent, 100);
              })
              .catch(error => {
                  console.error('ページネーションエラー:', error);
                  if (window.showToast) {
                      showToast('error', 'ページの読み込みに失敗しました。');
                  }
              });
          });
      });
  }
  
  // 検索初期化
  function initializeSearch() {
      const searchInput = document.querySelector('input[name="search"]');
      const searchButton = document.querySelector('.btn-outline-secondary');
      
      if (searchInput) {
          const searchUrl = searchInput.getAttribute('data-search-url') || '/manufacturing/line-master/';
          
          // 入力時の即座検索
          searchInput.addEventListener('input', function() {
              const searchQuery = this.value;
              const url = new URL(searchUrl, window.location.origin);
              url.searchParams.set('search', searchQuery);
              url.searchParams.set('page', '1'); // 検索時は1ページ目
              
              fetch(url, {
                  headers: { 'HX-Request': 'true' }
              })
              .then(response => response.text())
              .then(html => {
                  document.getElementById('lineTableContainer').innerHTML = html;
                  
                  // 隠し要素を更新
                  updatePageInfo('1', searchQuery);
                  
                  // URLも更新
                  window.history.replaceState({}, '', url.pathname + url.search);
                  
                  // 再初期化
                  setTimeout(initializeContent, 100);
              })
              .catch(error => {
                  console.error('検索エラー:', error);
                  if (window.showToast) {
                      showToast('error', '検索に失敗しました。');
                  }
              });
          });
      }
      
      // 検索ボタンのクリック処理
      if (searchButton) {
          searchButton.addEventListener('click', function(e) {
              e.preventDefault();
              // 入力イベントを発火させる
              if (searchInput) {
                  searchInput.dispatchEvent(new Event('input'));
              }
          });
      }
  }
  
  // 編集処理
  function handleEdit(button) {
      const editUrl = button.dataset.editUrl;
      const editModal = document.getElementById('lineEditModal');
      const editForm = editModal.querySelector('form');
      editForm.action = editUrl;
      
      // サーバーからラインの情報を取得
      fetch(editUrl)
          .then(response => {
              return response.json();
          })
          .then(data => {
              if (data.status === 'success') {
                  // フォームの各フィールドに値を設定
                  const nameField = editForm.querySelector('[name="name"]');
                  const xPosField = editForm.querySelector('[name="x_position"]');
                  const yPosField = editForm.querySelector('[name="y_position"]');
                  const widthField = editForm.querySelector('[name="width"]');
                  const heightField = editForm.querySelector('[name="height"]');
                  const activeField = editForm.querySelector('[name="active"]');
                  
                  nameField.value = data.line.name;
                  xPosField.value = data.line.x_position;
                  yPosField.value = data.line.y_position;
                  widthField.value = data.line.width;
                  heightField.value = data.line.height;
                  activeField.checked = data.line.active;
                  
                  // Bootstrapのモーダルインスタンスを作成して表示
                  const modal = new bootstrap.Modal(editModal);
                  modal.show();
                  
                  // フォームの送信処理
                  editForm.addEventListener('submit', function(e) {
                      e.preventDefault();
                      
                      // 現在のページ情報を取得
                      const pageInfo = getCurrentPageInfo();
                      const formData = new FormData(editForm);
                      // 現在のページ情報を追加
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
                              modal.hide();
                              if (window.showToast) {
                                  showToast('success', data.message);
                              }
                              
                              if (data.html) {
                                  document.getElementById('lineTableContainer').innerHTML = data.html;
                                  
                                  // 隠し要素のページ情報を更新
                                  updatePageInfo(pageInfo.page, pageInfo.search);
                                  
                                  setTimeout(initializeContent, 100);
                              }
                          } else {
                              if (window.showToast) {
                                  showToast('error', data.message);
                              }
                          }
                      })
                      .catch(error => {
                          console.error('編集エラー:', error);
                          if (window.showToast) {
                              showToast('error', 'エラーが発生しました。');
                          }
                      });
                  });
              } else {
                  console.error('サーバーからのエラーレスポンス:', data);
                  showToast('エラー', 'ラインの情報を取得できませんでした。', 'error');
              }
          })
          .catch(error => {
              console.error('データ取得エラー:', error);
              showToast('エラー', 'ラインの情報を取得できませんでした。', 'error');
          });
  }
  
  // 削除処理
  function handleDelete(deleteBtn) {
      const lineId = deleteBtn.getAttribute('data-line-id');
      const lineName = deleteBtn.getAttribute('data-line-name');
      const deleteUrl = deleteBtn.getAttribute('data-delete-url');
      
      // 事前に全ての削除モーダルを削除
      cleanupAllModals();
      
      const modalId = 'deleteLineModal' + lineId;
      const modalHtml = '<div class="modal fade" id="' + modalId + '" tabindex="-1" aria-hidden="true">' +
          '<div class="modal-dialog">' +
              '<div class="modal-content">' +
                  '<div class="modal-header">' +
                      '<h5 class="modal-title">ライン削除の確認</h5>' +
                      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                  '</div>' +
                  '<div class="modal-body">' +
                      '<p>本当に「' + lineName + '」を削除してもよろしいですか？</p>' +
                      '<p class="text-danger">この操作は取り消せません。</p>' +
                  '</div>' +
                  '<div class="modal-footer">' +
                      '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>' +
                      '<button type="button" class="btn btn-danger" data-confirm-delete="' + lineId + '">削除</button>' +
                  '</div>' +
              '</div>' +
          '</div>' +
      '</div>';
      
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
      const deleteConfirmBtn = newModalElement.querySelector('[data-confirm-delete="' + lineId + '"]');
      if (deleteConfirmBtn) {
          deleteConfirmBtn.addEventListener('click', function() {
              // 現在のページ情報を削除ボタンクリック時に再取得
              const pageInfo = getCurrentPageInfo();
              
              let deleteUrlObj;
              try {
                  deleteUrlObj = new URL(deleteUrl, window.location.origin);
              } catch (error) {
                  console.error('URL オブジェクト作成エラー:', error);
                  return;
              }
              
              // パラメータを設定
              deleteUrlObj.searchParams.set('current_page', pageInfo.page);
              deleteUrlObj.searchParams.set('search_query', pageInfo.search);
              
              const finalUrl = deleteUrlObj.toString();
              
              fetch(finalUrl, {
                  method: 'DELETE',
                  headers: {
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                      'Content-Type': 'application/x-www-form-urlencoded'
                  }
              })
              .then(response => {
                  return response.json();
              })
              .then(data => {
                  if (data.status === 'success') {
                      bsModal.hide();
                      if (window.showToast) {
                          showToast('success', data.message);
                      }
                      
                      if (data.html) {
                          document.getElementById('lineTableContainer').innerHTML = data.html;
                          
                          // 隠し要素のページ情報を更新
                          updatePageInfo(pageInfo.page, pageInfo.search);
                          
                          setTimeout(initializeContent, 100);
                      }
                  } else {
                      if (window.showToast) {
                          showToast('error', data.message);
                      }
                  }
              })
              .catch(error => {
                  console.error('削除エラー:', error);
                  if (window.showToast) {
                      showToast('error', '削除に失敗しました。');
                  }
              });
          });
      }
  }
  
  // テーブルイベント初期化
  function initializeTableEvents() {
      // 完全にモーダルクリーンアップ
      cleanupAllModals();
      
      // 既存のイベントリスナーを完全に削除
      document.querySelectorAll('.edit-line').forEach(btn => {
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
      });
      
      document.querySelectorAll('.delete-line').forEach(btn => {
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
      });
      
      // 編集ボタンの新しいイベントリスナー
      document.querySelectorAll('.edit-line').forEach(btn => {
          btn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              handleEdit(this);
          });
      });
      
      // 削除ボタンの新しいイベントリスナー
      document.querySelectorAll('.delete-line').forEach(btn => {
          btn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(this);
          });
      });
  }
  
  // フォーム初期化
  function initializeForm() {
      const lineForm = document.getElementById('lineForm');
      if (lineForm && !lineForm._formInitialized) {
          lineForm._formInitialized = true;
          lineForm.addEventListener('submit', function(e) {
              e.preventDefault();
              
              // 現在のページ情報を取得
              const pageInfo = getCurrentPageInfo();
              
              const formData = new FormData(lineForm);
              // 現在のページ情報を追加
              formData.append('current_page', pageInfo.page);
              formData.append('search_query', pageInfo.search);
              
              // URLを動的に取得（デフォルト値も設定）
              const createUrl = lineForm.getAttribute('data-create-url') || '/manufacturing/line-master/';
              
              fetch(createUrl, {
                  method: 'POST',
                  body: formData,
                  headers: {
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                  }
              })
              .then(response => {
                  if (!response.ok) {
                      throw new Error('Network response was not ok');
                  }
                  return response.json();
              })
              .then(data => {
                  if (data.status === 'success') {
                      const modalElement = document.getElementById('lineFormModal');
                      const modal = bootstrap.Modal.getInstance(modalElement);
                      if (modal) modal.hide();
                      
                      setTimeout(cleanupModals, 300);
                      
                      resetLineForm(lineForm);
                      if (window.showToast) {
                          showToast('success', data.message);
                      }
                      
                      if (data.html) {
                          document.getElementById('lineTableContainer').innerHTML = data.html;
                          
                          // 隠し要素のページ情報を更新
                          updatePageInfo(pageInfo.page, pageInfo.search);
                          
                          setTimeout(initializeContent, 100);
                      }
                  } else {
                      if (window.showToast) {
                          showToast('error', data.message);
                      }
                  }
              })
              .catch(error => {
                  console.error('登録エラー:', error);
                  if (window.showToast) {
                      showToast('error', 'エラーが発生しました。');
                  }
              });
          });
      }
  }
  
  // メイン初期化関数
  function initializeContent() {
      // line_master.jsとの競合チェック
      if (window.lineMasterInitialized) {
          // line_master.jsのイベントを無効化
          document.querySelectorAll('.edit-line, .delete-line').forEach(btn => {
              const newBtn = btn.cloneNode(true);
              btn.parentNode.replaceChild(newBtn, btn);
          });
      }
      
      // 重複初期化を防ぐ
      const initMarker = 'lineMasterInitialized';
      const container = document.getElementById('lineTableContainer');
      if (container && container.dataset[initMarker] && !window.lineMasterInitialized) {
          return;
      }
      
      cleanupAllModals(); // 完全なクリーンアップ
      initializePagination();
      initializeSearch();
      initializeTableEvents();
      initializeForm();
      
      // 初期化完了マーク
      if (container) {
          container.dataset[initMarker] = 'true';
      }
  }
  
  // 強制初期化関数（外部から呼ばれる）
  function forceInitializeContent() {
      // 完全なクリーンアップ
      cleanupAllModals();
      
      // line_master.jsの影響を無効化
      if (window.lineMasterInitialized) {
          window.lineMasterInitialized = false;
      }
      
      // 既存の全イベントリスナーを削除
      document.querySelectorAll('.edit-line, .delete-line').forEach(btn => {
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
      });
      
      // 初期化マークを削除
      const container = document.getElementById('lineTableContainer');
      if (container) {
          delete container.dataset['lineMasterInitialized'];
      }
      
      lineMasterContentInitialized = false;
      initializeContent();
  }
  
  // 初期化実行
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeContent);
  } else {
      setTimeout(initializeContent, 50);
  }
  
  // グローバルに公開（外部からの呼び出し用）
  window.initializeLineMasterContent = forceInitializeContent;
  
})();