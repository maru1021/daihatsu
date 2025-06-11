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
let htmxInitTimeout = null;

// ページ初期化関数（HTMXナビゲーション後の再初期化用）
function initializeTableMasterPage() {
    // 必要な要素が存在するかチェック
    const registerForm = document.getElementById('RegisterForm');
    const registerModal = document.getElementById('RegisterModal');
    const tableContainer = document.getElementById('TableContainer');

    // 必要な要素が存在しない場合は初期化をスキップ
    if (!registerForm || !registerModal || !tableContainer) {
        return;
    }

    // 新規追加フォームの送信処理
    // モーダルを開く前にフォームをリセット
    registerModal.addEventListener('show.bs.modal', function() {
        modalHandlers.resetRegisterForm(registerForm);
    });

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // 既存のエラーメッセージをクリア
        modalHandlers.clearFormErrors(registerForm);

        // URLを動的に取得
        const createUrl = registerForm.action;

        submitForm(registerForm, createUrl, (data) => {
            hideModal('RegisterModal');
            cleanupModals();
            showToast('success', data.message);
            
            if (data.html) {
                document.getElementById('TableContainer').innerHTML = data.html;
                initializePaginationEvents();
            }
        })
        .catch(error => {
            if (error.response && error.response.status === 400) {
                // バリデーションエラーの場合
                if (error.data.errors) {
                    // エラーメッセージを表示
                    Object.entries(error.data.errors).forEach(([field, message]) => {
                        const input = registerForm.querySelector(`[name="${field}"]`);
                        if (input) {
                            input.classList.add('is-invalid');
                            const feedback = document.createElement('div');
                            feedback.className = 'invalid-feedback d-block';
                            feedback.textContent = message;
                            input.parentNode.appendChild(feedback);
                        }
                    });
                }
            } else {
                console.error('Error:', error);
                // 予期せぬエラーの場合のみトーストを表示
                showToast('error', error.message || 'エラーが発生しました。');
            }
        });
    });

    // ページネーションのイベント初期化
    initializePaginationEvents();

    // 検索フォームの処理
    initializeSearchForm();

    // 編集・削除ボタンのクリックイベント
    initializeTableEvents();
}

// ページネーションの処理
function initializePaginationEvents() {
    document.querySelectorAll('.pagination a').forEach(link => {
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
    });
}

// 検索フォームの処理
function initializeSearchForm() {
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
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
                const form = editModal.querySelector('form');
                if (form) {
                    form.action = editUrl;

                    // フォームの初期化
                    initializeEditForm(data);
                }

                // モーダルを表示する前にクリーンアップ
                cleanupModals();
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
    
    // 既存のエラーメッセージをクリア
    const invalidFeedbacks = editForm.querySelectorAll('.invalid-feedback');
    invalidFeedbacks.forEach(feedback => feedback.remove());
    const invalidInputs = editForm.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => input.classList.remove('is-invalid'));
    
    submitForm(editForm, editForm.action, (data) => {
        hideModal('EditModal');
        cleanupModals();
        showToast('success', data.message);
        
        if (data.html) {
            document.getElementById('TableContainer').innerHTML = data.html;
            initializePaginationEvents();
        }
    })
    .catch(error => {
        if (error.response && error.response.status === 400) {
            // バリデーションエラーの場合
            if (error.data.errors) {
                // エラーメッセージを表示
                Object.entries(error.data.errors).forEach(([field, message]) => {
                    const input = editForm.querySelector(`[name="${field}"]`);
                    if (input) {
                        input.classList.add('is-invalid');
                        const feedback = document.createElement('div');
                        feedback.className = 'invalid-feedback d-block';
                        feedback.textContent = message;
                        input.parentNode.appendChild(feedback);
                    }
                });
            }
        } else {
            console.error('Error:', error);
            // 予期せぬエラーの場合のみトーストを表示
            showToast('error', error.message || 'エラーが発生しました。');
        }
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
            performDelete(deleteUrl, (data) => {
                hideModal('DeleteModal');
                cleanupModals();
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
    
    // モーダルを表示する前にクリーンアップ
    cleanupModals();
    showModal('DeleteModal');
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
    cleanupModals();
    initializeTableMasterPage();
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
            cleanupModals();
            initializeTableMasterPage();
        }, 0);
    }
});

// ページ遷移時のクリーンアップ
document.addEventListener('htmx:beforeSwap', function(evt) {
    // 既存のイベントリスナーを削除
    const tableContainer = document.getElementById('TableContainer');
    if (tableContainer) {
        const newTableContainer = tableContainer.cloneNode(true);
        tableContainer.parentNode.replaceChild(newTableContainer, tableContainer);
    }
});
