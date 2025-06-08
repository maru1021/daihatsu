/**
 * モーダル内のフォームリセット処理
 */

// モーダル関連の処理
export const modalHandlers = {
    // 登録フォームのリセット
    resetRegisterForm: function(form) {
        if (!form) return;
        
        // フォーム内のすべての入力要素を取得
        const inputs = form.querySelectorAll('input, select, textarea');
        
        // 各入力要素をリセット
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                // チェックボックスとラジオボタンはデフォルト値に設定
                input.checked = input.defaultChecked;
            } else if (input.type === 'number') {
                // 数値入力は1に設定
                input.value = '0';
            } else if (input.type === 'text' || input.type === 'textarea') {
                // テキスト入力は空に設定
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                // セレクトボックスは最初のオプションを選択
                if (input.options.length > 0) {
                    input.selectedIndex = 0;
                }
            }
        });

        // フォームのリセットイベントを発火
        form.dispatchEvent(new Event('reset'));
    },

    // 編集フォームのリセット
    resetEditForm: function(form) {
        if (!form) return;
        
        // フォーム内のすべての入力要素を取得
        const inputs = form.querySelectorAll('input, select, textarea');
        
        // 各入力要素をリセット
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        // フォームのリセットイベントを発火
        form.dispatchEvent(new Event('reset'));
    }
}; 