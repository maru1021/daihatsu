/**
 * 削除用の共通関数
 */
import { getDeletePageInfo } from './page_info.js';

// 削除実行処理
export function performDelete(deleteUrl, successCallback) {
    const pageInfo = getDeletePageInfo();
    
    // URLパラメータとして送信
    const deleteUrlObj = new URL(deleteUrl, window.location.origin);
    deleteUrlObj.searchParams.set('current_page', pageInfo.page);
    deleteUrlObj.searchParams.set('search_query', pageInfo.search);
    
    return fetch(deleteUrlObj.toString(), {
        method: 'DELETE',
        body: JSON.stringify({
            'current_page': pageInfo.page,
            'search_query': pageInfo.search
        }),
        headers: {
            'Content-Type': 'application/json',
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
            if (successCallback) {
                successCallback(data, pageInfo);
            }
            return data;
        } else {
            throw new Error(data.message || 'エラーが発生しました。');
        }
    });
} 