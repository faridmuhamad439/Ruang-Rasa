// ==========================================================================
// TOAST NOTIFICATION COMPONENT WITH GOOGLE MATERIAL SYMBOLS
// ==========================================================================

const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3800) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;

        let iconName = 'info';
        if (type === 'success') iconName = 'check_circle';
        else if (type === 'error') iconName = 'error';
        else if (type === 'warning') iconName = 'warning';

        toast.innerHTML = `
            <span class="material-symbols-rounded" style="color: var(--${type === 'info' ? 'info' : type}); font-size: 22px;">${iconName}</span>
            <div class="toast-text">${message}</div>
            <button class="toast-close" title="Tutup">
                <span class="material-symbols-rounded" style="font-size: 18px;">close</span>
            </button>
        `;

        const closeBtn = toast.querySelector('button');
        closeBtn.onclick = () => this.remove(toast);

        this.container.appendChild(toast);

        setTimeout(() => {
            this.remove(toast);
        }, duration);
    },

    remove(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        toast.style.transition = 'all 0.2s ease-out';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 200);
    },

    success(msg, duration) { this.show(msg, 'success', duration); },
    error(msg, duration) { this.show(msg, 'error', duration); },
    warning(msg, duration) { this.show(msg, 'warning', duration); },
    info(msg, duration) { this.show(msg, 'info', duration); }
};
