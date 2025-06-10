/**
 * テーブルの編集・削除・追加の処理を行うテーブルページのJavaScript
 */

import { submitForm } from './fetch/form_submit.js';
import { performDelete } from './fetch/delete.js';
import { performSearch } from './fetch/search.js';
import { showModal, hideModal, cleanupModals, updateModalMessage } from './modal/modal.js';
import { modalHandlers } from './modal/form_reset.js';
import { initializeEditForm } from './modal/form_initialize.js';

// グローバル変数
let tableMasterInitialized = false;
let htmxInitTimeout = null;

// ページ初期化関数（HTMXナビゲーション後の再初期化用）
function initializeTableMasterPage() {    
    // 既存のイベントリスナーを削除（重複防止）
    const existingForm = document.getElementById('RegisterForm');
    if (existingForm && existingForm._formInitialized) {
        return;
    }

    // 新規追加フォームの送信処理
    const registerForm = document.getElementById('RegisterForm');
    if (registerForm && !registerForm._formInitialized) {
        registerForm._formInitialized = true;
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // URLを動的に取得
            const createUrl = registerForm.action;
            
            submitForm(registerForm, createUrl, (data, pageInfo) => {
                hideModal('RegisterModal');
                setTimeout(cleanupModals, 300);
                
                modalHandlers.resetRegisterForm(registerForm);
                showToast('success', data.message);
                
                if (data.html) {
                    document.getElementById('TableContainer').innerHTML = data.html;
                    initializePaginationEvents();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('error', error.message || 'エラーが発生しました。');
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
                    document.getElementById('TableContainer').innerHTML = html;
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
        const searchUrl = searchInput.getAttribute('data-search-url');
        
        searchInput.addEventListener('input', function() {
            const searchQuery = this.value;
            
            performSearch(searchUrl, searchQuery)
                .then(() => {
                    initializePaginationEvents();
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('error', error.message || '検索に失敗しました。');
                });
        });
    }
}

// 編集・削除の初期化
function initializeTableEvents() {
    // 既存のイベントリスナーを削除
    const oldHandler = document.body._tableClickHandler;
    if (oldHandler) {
        document.removeEventListener('click', oldHandler);
    }
    
    // 新しいイベントリスナーを作成
    const clickHandler = function(e) {
        // 編集ボタンの処理
        const editBtn = e.target.closest('.edit-item');
        if (editBtn) {
            handleEditItem(e, editBtn);
            return;
        }
        
        // 削除ボタンの処理
        const deleteBtn = e.target.closest('.delete-item');
        if (deleteBtn) {
            handleDeleteItem(e, deleteBtn);
        }
    };
    
    // イベントリスナーを保存して追加
    document.body._tableClickHandler = clickHandler;
    document.addEventListener('click', clickHandler);
}

// 編集処理
function handleEditItem(e, editBtn) {
    e.preventDefault();
    e.stopPropagation();
    
    const editUrl = editBtn.getAttribute('data-edit-url');
    
    // サーバーからアイテムの情報を取得
    fetch(editUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const editModal = document.getElementById('EditModal');
                if (editModal) {
                    const form = editModal.querySelector('form');
                    if (form) {
                        form.action = editUrl;
                        
                        // フォームの初期化
                        initializeEditForm(data);
                    }
                    
                    const modal = showModal('EditModal');
                    
                    // 編集フォームの送信処理
                    if (form) {
                        // 既存のイベントリスナーを削除
                        const newForm = form.cloneNode(true);
                        form.parentNode.replaceChild(newForm, form);
                        
                        // 新しいイベントリスナーを追加
                        newForm.addEventListener('submit', function(e) {
                            handleEditFormSubmit(e, newForm, modal);
                        });
                    }
                }
            } else {
                showToast('error', 'アイテムの情報を取得できませんでした。');
            }
        })
        .catch(error => {
            showToast('error', 'アイテムの情報を取得できませんでした。');
        });
}

// 編集フォーム送信処理
function handleEditFormSubmit(e, editForm, modal) {
    e.preventDefault();
    
    submitForm(editForm, editForm.action, (data, pageInfo) => {
        modal.hide();
        modalHandlers.resetEditForm(editForm);
        showToast('success', data.message);
        
        if (data.html) {
            document.getElementById('TableContainer').innerHTML = data.html;
            initializePaginationEvents();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', error.message || 'エラーが発生しました。');
    });
}

// 削除処理
function handleDeleteItem(e, deleteBtn) {
    e.preventDefault();
    e.stopPropagation();
    
    const itemName = deleteBtn.getAttribute('data-item-name');
    const deleteUrl = deleteBtn.getAttribute('data-delete-url');
    
    // 既存の削除モーダルを使用
    const deleteModal = document.getElementById('DeleteModal');
    if (!deleteModal) {
        console.error('削除モーダルが見つかりません');
        return;
    }
    
    // モーダルのメッセージを更新
    updateModalMessage('DeleteModal', `本当に「${itemName}」を削除してもよろしいですか？`);
    
    // 削除確認ボタンの処理
    const confirmBtn = deleteModal.querySelector('#confirmDeleteBtn');
    if (confirmBtn) {
        // 既存のイベントリスナーを削除
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 新しいイベントリスナーを追加
        newConfirmBtn.addEventListener('click', function() {
            performDelete(deleteUrl, (data, pageInfo) => {
                hideModal('DeleteModal');
                showToast('success', data.message);
                
                if (data.html) {
                    document.getElementById('TableContainer').innerHTML = data.html;
                    initializePaginationEvents();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('error', error.message || '削除に失敗しました。');
            });
        });
    }
    
    // モーダルを表示
    showModal('DeleteModal');
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
    if (!tableMasterInitialized) {
        initializeTableMasterPage();
        tableMasterInitialized = true;
    }
});

// HTMXスワップ後の初期化
document.addEventListener('htmx:afterSwap', function(evt) {
    if (evt.detail.target.classList.contains('main-content')) {
        // 前のタイマーをクリア
        if (htmxInitTimeout) {
            clearTimeout(htmxInitTimeout);
        }
        
        // 少し遅延して実行（重複を防ぐため）
        htmxInitTimeout = setTimeout(() => {
            tableMasterInitialized = false; // リセット
            initializeTableMasterPage();
            tableMasterInitialized = true;
        }, 200);
    }
});
