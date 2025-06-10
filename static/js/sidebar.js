$(function () {
    const STORAGE_KEY = "sidebarState";

    const getStoredState = () => {
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
        } catch {
            return {};
        }
    };

    // サイドバーの状態を保存
    const saveCurrentDOMState = () => {
        const state = {};
        $(".collapse").each((i, el) => {
            state[el.id] = $(el).hasClass("show");
        });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    // サイドバーの状態を復元
    const restoreStates = () => {
        const state = getStoredState();

        Object.keys(state).forEach((elementId) => {
            const $element = $("#" + elementId);
            const $trigger = $(`[data-bs-target="#${elementId}"]`);
            const shouldBeOpen = state[elementId];
            const isCurrentlyOpen = $element.hasClass("show");

            if ($element.length && shouldBeOpen !== isCurrentlyOpen) {
                if (shouldBeOpen) {
                    $element.addClass("show");
                    $trigger.attr("aria-expanded", "true");
                } else {
                    $element.removeClass("show");
                    $trigger.attr("aria-expanded", "false");
                }
            }
        });
    };

    $(".collapse").on("shown.bs.collapse hidden.bs.collapse", function () {
        saveCurrentDOMState();
    });

    setTimeout(() => {
        restoreStates();
    }, 0);
}); 