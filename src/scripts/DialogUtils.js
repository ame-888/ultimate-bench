// Make every sibling outside a dialog inert, including siblings of its ancestors.
// Restore existing inert state so overlapping UI does not enable hidden content.
export function isolateDialog(dialog) {
    const previous = new Map();
    for (let node = dialog; node?.parentElement; node = node.parentElement) {
        for (const sibling of node.parentElement.children) {
            if (sibling !== node && sibling instanceof HTMLElement) {
                previous.set(sibling, sibling.inert);
                sibling.inert = true;
            }
        }
    }
    const overflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
        previous.forEach((inert, element) => { element.inert = inert; });
        document.body.style.overflow = overflow;
        document.documentElement.style.overflow = rootOverflow;
    };
}

export function trapDialogFocus(event, dialog) {
    if (event.key !== 'Tab') return;
    const elements = [...dialog.querySelectorAll('button, a[href], select, input, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(element => !element.disabled && !element.closest('[inert]') && element.getClientRects().length);
    const first = elements[0], last = elements.at(-1);
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
    }
}
