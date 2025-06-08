/**
 * ライン管理ページ - コンテンツ専用JavaScript
 * ファイル: static/js/line_master_content.js
 */

(function() {
  'use strict';
  
  console.log('line_master_content.js: 読み込み開始');
  
  // デバッグ: JavaScriptが正しく読み込まれているかを確認
  window.lineMasterDebug = function() {
      console.log('JavaScript正常読み込み確認');
      console.log('現在のURL:', window.location.href);
      const pageInfo = getCurrentPageInfo();
      console.log('取得したページ情報:', pageInfo);
      return pageInfo;
  };
  
  // グローバル変数
  let lineMasterContentInitialized = false;
  
  // 現在のページ情報を取得する関数（デバッグ強化版）
  function getCurrentPageInfo() {
      let currentPage = '1';
      let currentSearch = '';
      
      console.log('=== getCurrentPageInfo デバッグ開始 ===');
      console.log('現在のlocation.href:', window.location.href);
      console.log('現在のlocation.search:', window.location.search);
      
      // 1. URLパラメータから取得（最優先）
      const urlParams = new URLSearchParams(window.location.search);
      const urlPage = urlParams.get('page');
      const urlSearch = urlParams.get('search');
      
      console.log('URLSearchParams結果:');
      console.log('  page:', urlPage);
      console.log('  search:', urlSearch);
      
      if (urlPage) {
          currentPage = urlPage;
          console.log('URLからページ取得:', currentPage);
      }
      
      if (urlSearch !== null) {
          currentSearch = urlSearch;
          console.log('URLから検索取得:', currentSearch);
      }
      
      // 2. アクティブなページネーション要素から取得（URLが無い場合）
      if (!urlPage) {
          const activePageElement = document.querySelector('.pagination .page-item.active .page-link');
          console.log('アクティブページ要素:', activePageElement);
          if (activePageElement) {
              const pageFromDOM = activePageElement.textContent.trim();
              console.log('DOM要素のテキスト:', pageFromDOM);
              if (pageFromDOM && !isNaN(pageFromDOM)) {
                  currentPage = pageFromDOM;
                  console.log('DOMからページ取得:', currentPage);
              }
          }
      }
      
      // 3. 検索入力フィールドから取得
      const searchInput = document.querySelector('input[name="search"]');
      console.log('検索入力要素:', searchInput);
      if (searchInput && urlSearch === null) {
          currentSearch = searchInput.value || '';
          console.log('検索入力から取得:', currentSearch);
      }
      
      // 4. 隠し要素からも確認（バックアップ）
      const hiddenPageElement = document.getElementById('currentPageNumber');
      const hiddenSearchElement = document.getElementById('currentSearchQuery');
      console.log('隠し要素:');
      console.log('  pageElement:', hiddenPageElement, 'value:', hiddenPageElement ? hiddenPageElement.value : 'null');
      console.log('  searchElement:', hiddenSearchElement, 'value:', hiddenSearchElement ? hiddenSearchElement.value : 'null');
      
      if (!urlPage && hiddenPageElement && hiddenPageElement.value) {
          currentPage = hiddenPageElement.value;
          console.log('隠し要素からページ取得:', currentPage);
      }
      
      if (urlSearch === null && hiddenSearchElement) {
          currentSearch = hiddenSearchElement.value || '';
          console.log('隠し要素から検索取得:', currentSearch);
      }
      
      const pageInfo = {
          page: currentPage,
          search: currentSearch
      };
      
      console.log('=== 最終的なページ情報 ===', pageInfo);
      console.log('=== getCurrentPageInfo デバッグ終了 ===');
      
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
      
      console.log('隠し要素のページ情報を更新:', { page: page || '1', search: search || '' });
  }
  
  // FormDataに現在のページ情報を追加する関数
  function addPageInfoToFormData(formData) {
      const pageInfo = getCurrentPageInfo();
      formData.append('current_page', pageInfo.page);
      if (pageInfo.search) {
          formData.append('search_query', pageInfo.search);
      }
      console.log('FormDataにページ情報を追加:', pageInfo);
      
      // デバッグ: FormDataの内容を確認
      console.log('FormData内容:');
      for (let [key, value] of formData.entries()) {
          console.log('  ' + key + ': ' + value);
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
      
      console.log('全てのモーダルをクリーンアップしました');
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
              
              console.log('ページネーションクリック:', { newPage: newPage, newSearch: newSearch, url: url });
              
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
              
              console.log('検索実行:', { searchQuery: searchQuery, url: url.toString() });
              
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
  function handleEdit(editBtn) {
      const lineId = editBtn.getAttribute('data-line-id');
      const editUrl = editBtn.getAttribute('data-edit-url');
      
      console.log('編集処理開始 - Line ID:', lineId);
      
      fetch(editUrl, {
          headers: { 'HX-Request': 'true' }
      })
      .then(response => response.text())
      .then(html => {
          const modal = document.getElementById('lineEditModal');
          
          // 既存のモーダルインスタンスを削除
          const existingModal = bootstrap.Modal.getInstance(modal);
          if (existingModal) existingModal.dispose();
          
          cleanupModals();
          
          // モーダルコンテンツを更新
          modal.querySelector('.modal-content').innerHTML = html;
          
          // 新しいモーダルインスタンスを作成
          const bsModal = new bootstrap.Modal(modal);
          
          // モーダル非表示時のクリーンアップ
          modal.addEventListener('hidden.bs.modal', cleanupModals, { once: true });
          
          // モーダルを表示
          bsModal.show();
          
          // 編集フォームの送信処理
          const editForm = modal.querySelector('form');
          if (editForm) {
              editForm.addEventListener('submit', function(e) {
                  e.preventDefault();
                  
                  // 現在のページ情報を取得
                  const pageInfo = getCurrentPageInfo();
                  console.log('=== 編集フォーム送信 ===');
                  console.log('送信時のページ情報:', pageInfo);
                  
                  const formData = new FormData(editForm);
                  // 現在のページ情報を追加
                  formData.append('current_page', pageInfo.page);
                  formData.append('search_query', pageInfo.search);
                  
                  console.log('編集FormData内容:');
                  for (let [key, value] of formData.entries()) {
                      console.log('  ' + key + ': ' + value);
                  }
                  
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
                      console.log('編集レスポンス:', data);
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
                      console.error('編集エラー:', error);
                      if (window.showToast) {
                          showToast('error', 'エラーが発生しました。');
                      }
                  });
              });
          }
      })
      .catch(error => {
          console.error('編集画面読み込みエラー:', error);
          if (window.showToast) {
              showToast('error', '編集画面の読み込みに失敗しました。');
          }
      });
  }
  
  // 削除処理
  function handleDelete(deleteBtn) {
      const lineId = deleteBtn.getAttribute('data-line-id');
      const lineName = deleteBtn.getAttribute('data-line-name');
      const deleteUrl = deleteBtn.getAttribute('data-delete-url');
      
      console.log('削除処理開始:', { lineId: lineId, lineName: lineName, deleteUrl: deleteUrl });
      
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
              console.log('=== 削除確認ボタンクリック開始 ===');
              
              // 現在のページ情報を削除ボタンクリック時に再取得
              const pageInfo = getCurrentPageInfo();
              console.log('削除実行時のページ情報:', pageInfo);
              
              // URL構築の詳細デバッグ
              console.log('元の削除URL:', deleteUrl);
              console.log('window.location.origin:', window.location.origin);
              
              let deleteUrlObj;
              try {
                  deleteUrlObj = new URL(deleteUrl, window.location.origin);
                  console.log('URL オブジェクト作成成功:', deleteUrlObj.href);
              } catch (error) {
                  console.error('URL オブジェクト作成エラー:', error);
                  return;
              }
              
              // パラメータ設定前のURL
              console.log('パラメータ設定前URL:', deleteUrlObj.toString());
              console.log('パラメータ設定前searchParams:', deleteUrlObj.searchParams.toString());
              
              // パラメータを設定
              deleteUrlObj.searchParams.set('current_page', pageInfo.page);
              deleteUrlObj.searchParams.set('search_query', pageInfo.search);
              
              // パラメータ設定後のURL
              console.log('パラメータ設定後URL:', deleteUrlObj.toString());
              console.log('パラメータ設定後searchParams:', deleteUrlObj.searchParams.toString());
              console.log('searchParams entries:');
              for (let [key, value] of deleteUrlObj.searchParams.entries()) {
                  console.log('  ' + key + ':', value);
              }
              
              const finalUrl = deleteUrlObj.toString();
              console.log('最終的な送信URL:', finalUrl);
              
              fetch(finalUrl, {
                  method: 'DELETE',
                  headers: {
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                      'Content-Type': 'application/x-www-form-urlencoded'
                  }
              })
              .then(response => {
                  console.log('削除レスポンス受信:', response.status);
                  console.log('実際に送信されたURL:', response.url);
                  return response.json();
              })
              .then(data => {
                  console.log('削除レスポンスデータ:', data);
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
      console.log('テーブルイベント初期化開始');
      
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
              console.log('編集ボタンクリック');
              handleEdit(this);
          });
      });
      
      // 削除ボタンの新しいイベントリスナー
      document.querySelectorAll('.delete-line').forEach(btn => {
          btn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              console.log('削除ボタンクリック - イベント発火確認');
              console.log('クリックされた要素:', this);
              console.log('data-line-id:', this.getAttribute('data-line-id'));
              console.log('data-line-name:', this.getAttribute('data-line-name'));
              console.log('data-delete-url:', this.getAttribute('data-delete-url'));
              handleDelete(this);
          });
      });
      
      console.log('編集ボタン: ' + document.querySelectorAll('.edit-line').length + '個, 削除ボタン: ' + document.querySelectorAll('.delete-line').length + '個を初期化');
  }
  
  // フォーム初期化
  function initializeForm() {
      const lineForm = document.getElementById('lineForm');
      if (lineForm) {
          lineForm.addEventListener('submit', function(e) {
              e.preventDefault();
              
              // 現在のページ情報を取得
              const pageInfo = getCurrentPageInfo();
              console.log('=== 新規登録フォーム送信 ===');
              console.log('送信時のページ情報:', pageInfo);
              
              const formData = new FormData(lineForm);
              // 現在のページ情報を追加
              formData.append('current_page', pageInfo.page);
              formData.append('search_query', pageInfo.search);
              
              console.log('新規登録FormData内容:');
              for (let [key, value] of formData.entries()) {
                  console.log('  ' + key + ': ' + value);
              }
              
              const createUrl = lineForm.getAttribute('data-create-url');
              
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
                  console.log('新規登録レスポンス:', data);
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
          console.log('line_master.jsが既に初期化済み。line_master_content.jsを優先します。');
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
          console.log('既に初期化済み、スキップ');
          return;
      }
      
      console.log('ライン管理コンテンツ初期化中...');
      
      cleanupAllModals(); // 完全なクリーンアップ
      initializePagination();
      initializeSearch();
      initializeTableEvents();
      initializeForm();
      
      // 初期化完了マーク
      if (container) {
          container.dataset[initMarker] = 'true';
      }
      
      console.log('ライン管理コンテンツ初期化完了');
  }
  
  // 強制初期化関数（外部から呼ばれる）
  function forceInitializeContent() {
      console.log('強制初期化実行 - line_master競合対策');
      
      // 完全なクリーンアップ
      cleanupAllModals();
      
      // line_master.jsの影響を無効化
      if (window.lineMasterInitialized) {
          console.log('line_master.jsが検出されました。無効化します。');
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