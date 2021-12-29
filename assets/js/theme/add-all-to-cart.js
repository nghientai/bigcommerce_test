import PageManager from './page-manager';
import utils from '@bigcommerce/stencil-utils';
import Swal from './global/sweet-alert';
import cartPreview from './global/cart-preview';
import 'regenerator-runtime/runtime';

export default class AddAllSpecialItems extends PageManager {
    constructor(context) {
        super(context);

        this.productList = this.context.productList;
        this.cartId = this.context.cartId;
        this.secureBaseUrl = this.context.secureBaseUrl;
    }

    /**
     * Initialize the page
     */
    onReady() {
        this.onAddAllToCart();
        this.onRemoveAll();
        utils.api.cart.getCart({ includeOptions: true }, (err, data) => {
            // eslint-disable-next-line no-unused-expressions
            typeof data !== 'undefined' ? $('#remove-all-special').show() : $('#remove-all-special').hide();
        });
    }

    /**
     * Remove all items from a cart
     */
    onRemoveAll() {
        const binding = this;
        $('#remove-all-special').on('click', (event) => {
            event.preventDefault();
            const deleteCart = binding.deleteCart(binding.cartId);
            deleteCart.then(() => {
                Swal.fire({
                    text: 'Removed all items in your cart',
                    icon: 'success',
                });
                cartPreview(binding.secureBaseUrl, binding.cartId);
                $('#remove-all-special').hide();
            });
        });
    }

    /**
     * Add all items to a cart
     */
    onAddAllToCart() {
        const lineItems = [];
        const binding = this;
        this.productList.map((product) => {
            lineItems.push({
                productId: product.id,
                quantity: 1,
            });
        });
        const cartItems = {
            lineItems,
        };

        $('#add-all-special').on('click', (event) => {
            event.preventDefault();
            /**
             * Add to cart process
             * 1. Check if items in the cart
             *     1.1. Yes
             *         - Show Remove ALl Cart
             *         - Update the cart with +1 quantity
             *     1.2. No
             *         - Add All Items to the empty cart
             */
            // 1. Check if non-exist cartId
            if (binding.cartId === null) {
                // create a new cart
                binding
                    .createCart('/api/storefront/carts', cartItems)
                    .then((res) => {
                        Swal.fire({
                            text: 'Added all special items in your cart',
                            icon: 'success',
                        }).then(() => {
                            binding.cartId = res.id;
                            cartPreview(binding.secureBaseUrl, res.id);
                            $('#remove-all-special').show();
                        });
                    })
                    .catch((error) => console.error(error));
            } else {
                // Cart found Update the cart with +1 quantity
                binding
                    .addCartItem('/api/storefront/carts/', binding.cartId, cartItems)
                    .then(() => {
                        Swal.fire({
                            text: 'Added all special items in your cart',
                            icon: 'success',
                        }).then(() => {
                            cartPreview(binding.secureBaseUrl, binding.cartId);
                        });
                    })
                    .catch((err) => console.log(err));
            }
        });
    }

    /**
     *
     * @param cartId
     * @returns {Promise<void>}
     */
    deleteCart(cartId) {
        const url = `/api/storefront/carts/${cartId}`;
        return fetch(url, {
            method: 'DELETE',
            credentials: 'same-origin',
        }).then(res => res);
    }

    /**
     * Creat a brand new cart
     * @param {string} url
     * @param {array} cartItems
     */
    createCart(url, cartItems) {
        return fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cartItems),
        }).then((response) => response.json());
    }

    /**
     * Add items to a cart
     * @param {string} url
     * @param {int} cartId
     * @param {array} cartItems
     */
    addCartItem(url, cartId, cartItems) {
        return fetch(`${url + cartId}/items`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify(cartItems),
        }).then((res) => res.json());
    }
}
