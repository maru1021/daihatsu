// ページ遷移時の処理
document.addEventListener('htmx:afterSwap', function(evt) {
    // 検索フォームのinputにフォーカスを移動
    const searchInput = document.querySelector('input[data-search-url]');
    if (searchInput) {
        searchInput.focus();
    }
});
