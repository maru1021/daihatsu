/**
 * フォームの初期化処理を行うモジュール
 */

// 編集フォームの初期化
export function initializeEditForm(data) {
    if (!data || !data.line) {
        console.error('Invalid data format:', data);
        return;
    }

    const form = document.getElementById('EditForm');
    if (!form) {
        console.error('Edit form not found');
        return;
    }

    // フォームの各フィールドに値を設定
    const formData = data.line;
    for (const [key, value] of Object.entries(formData)) {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = value;
            } else {
                input.value = value;
            }
        }
    }

    // フォームのaction属性を設定
    if (data.edit_url) {
        form.action = data.edit_url;
    }
}

// 新規登録フォームの初期化
export function initializeRegisterForm() {
    const form = document.getElementById('RegisterForm');
    if (!form) {
        console.error('Register form not found');
        return;
    }

    // フォームをリセット
    form.reset();
} 