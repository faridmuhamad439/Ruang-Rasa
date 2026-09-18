// ==========================================================================
// CART & CHECKOUT ADAPTER (Legacy bridge - Redirects to CartPage)
// ==========================================================================

const CartModal = {
    isOpen: false,

    open() {
        this.close();
        window.location.hash = '#/cart';
    },

    close() {
        this.isOpen = false;
        const modal = document.getElementById('cart-modal-root');
        if (modal) modal.innerHTML = '';
    },

    setOrderType(type) {
        if (window.CartPage) {
            CartPage.setOrderType(type);
        } else {
            App.orderType = type;
        }
    },

    submitCheckout() {
        if (window.CartPage) {
            CartPage.submitCheckout();
        }
    },

    render() {
        if (window.location.hash === '#/cart' || window.location.hash === '#/checkout') {
            if (window.CartPage) CartPage.render();
        }
    }
};
