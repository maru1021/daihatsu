/**
 * 検索処理の共通関数
 */

/**
 * 検索を実行する
 * @param {string} searchUrl - 検索のベースURL
 * @param {string} searchQuery - 検索クエリ
 * @returns {Promise} - 検索結果のPromise
 */
export function performSearch(searchUrl, searchQuery) {
    const url = new URL(searchUrl, window.location.origin);
    url.searchParams.set('search', searchQuery);
    url.searchParams.set('page', '1'); // 検索時は1ページ目に移動
    
    // URLを更新してからHTMXリクエストを送信
    window.history.pushState({}, '', url.pathname + url.search);
    
    return fetch(url, {
        headers: { 'HX-Request': 'true' }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('検索に失敗しました。');
        }
        return response.text();
    })
    .then(html => {
        document.getElementById('TableContainer').innerHTML = html;
        return html;
    });
} 