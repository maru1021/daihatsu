/**
 * フォーム送信処理の共通関数
 */
import { getFormPageInfo } from './page_info.js';

/**
 * フォームを送信する
 * @param {HTMLFormElement} form - 送信するフォーム要素
 * @param {string} url - 送信先URL
 * @param {Function} successCallback - 成功時のコールバック関数
 * @returns {Promise} - 送信結果のPromise
 */
export function submitForm(form, url, successCallback) {
    const pageInfo = getFormPageInfo();
    const formData = new FormData(form);
    
    // 現在のページ情報を追加
    formData.append('current_page', pageInfo.page);
    formData.append('search_query', pageInfo.search);
    
    return fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw { response, data };
        }
        return data;
    })
    .then(data => {
        if (data.status === 'success') {
            if (successCallback) {
                successCallback(data, pageInfo);
            }
            return data;
        } else {
            throw new Error(data.message || 'エラーが発生しました。');
        }
    });
} 