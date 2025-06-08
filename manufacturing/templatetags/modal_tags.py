# manufacturing/templatetags/modal_tags.py
from django import template
from django.template.loader import render_to_string

register = template.Library()

@register.inclusion_tag('components/modal/form_modal.html', takes_context=True)
def form_modal(context, modal_id, modal_title, form_id, form_action_url, form_template, **kwargs):
    """
    汎用フォームモーダルを生成
    
    Args:
        modal_id: モーダルのID
        modal_title: モーダルのタイトル
        form_id: フォームのID
        form_action_url: フォームの送信先URL
        form_template: フォームフィールドのテンプレートパス
        **kwargs: 追加オプション（modal_size, submit_text, cancel_text等）
    """
    # フォームコンテンツを動的に読み込み
    form_content = render_to_string(form_template, context.flatten())
    
    return {
        'modal_id': modal_id,
        'modal_title': modal_title,
        'form_id': form_id,
        'form_action_url': form_action_url,
        'form_content': form_content,
        'modal_size': kwargs.get('modal_size', ''),
        'submit_text': kwargs.get('submit_text', '登録'),
        'cancel_text': kwargs.get('cancel_text', 'キャンセル'),
    }

@register.inclusion_tag('components/modal/confirm_modal.html')
def confirm_modal(modal_id, modal_title, modal_message, confirm_action, item_id, **kwargs):
    """
    汎用確認モーダルを生成
    
    Args:
        modal_id: モーダルのID
        modal_title: モーダルのタイトル
        modal_message: 確認メッセージ
        confirm_action: 確認ボタンのアクション（delete, activate等）
        item_id: 対象アイテムのID
        **kwargs: 追加オプション
    """
    return {
        'modal_id': modal_id,
        'modal_title': modal_title,
        'modal_message': modal_message,
        'confirm_action': confirm_action,
        'item_id': item_id,
        'warning_message': kwargs.get('warning_message', ''),
        'modal_size': kwargs.get('modal_size', ''),
        'cancel_text': kwargs.get('cancel_text', 'キャンセル'),
        'confirm_text': kwargs.get('confirm_text', '削除'),
        'confirm_btn_class': kwargs.get('confirm_btn_class', 'btn-danger'),
    }

@register.inclusion_tag('components/modal/edit_modal.html', takes_context=True)
def edit_modal(context, modal_title, form_action_url, form_template, **kwargs):
    """
    汎用編集モーダルを生成
    
    Args:
        modal_title: モーダルのタイトル
        form_action_url: フォームの送信先URL
        form_template: フォームフィールドのテンプレートパス
        **kwargs: 追加オプション
    """
    # フォームコンテンツを動的に読み込み
    form_content = render_to_string(form_template, context.flatten())
    
    return {
        'modal_title': modal_title,
        'form_action_url': form_action_url,
        'form_content': form_content,
        'submit_text': kwargs.get('submit_text', '更新'),
        'cancel_text': kwargs.get('cancel_text', 'キャンセル'),
    }

@register.simple_tag(takes_context=True)
def render_form_fields(context, template_path, **extra_context):
    """
    フォームフィールドを動的にレンダリング
    """
    # コンテキストに追加データをマージ
    merged_context = context.flatten()
    merged_context.update(extra_context)
    
    return render_to_string(template_path, merged_context)