import PageManager from './page-manager';
import utils from '@bigcommerce/stencil-utils';
import Swal from './global/sweet-alert';
import cartPreview from './global/cart-preview';
import _ from 'lodash';
import 'regenerator-runtime/runtime';
export default class AddAllSpecialItems extends PageManager {
    constructor(context) {
        super(context);

        this.productList = this.context.productList;
        this.cartId = this.context.cartId;
        this.secureBaseUrl = this.context.secureBaseUrl;
    }

    onReady() {
        this.onAddAllToCart();
        this.onRemoveAll();
        this.getCart().then((data) => {
            data.length > 0 ? $('#remove-all-special').show() : $('#remove-all-special').hide();
        });
    }

    onRemoveAll() {
        /**
         * 1. Remove the product match the special list id
         */
        let binding = this;
        $('#remove-all-special').on('click', function (event) {
            event.preventDefault();
            binding
                .getCart()
                .then((data) => {
                    if (data.length > 0) {
                        var mapped = [];
                        var newarra = data[0].lineItems;
                        var isDelete = [];
                        Object.values(newarra).map((value) => {
                            //console.log([...mapped,value]);
                            if (value.length > 0) mapped.push(value);
                        });
                        mapped = Array.prototype.concat.apply([], mapped);
                        console.log('Run Mapped first ', mapped);

                        mapped.map((el) => {
                            binding.deleteCartItem(el.id).then((data) => {
                                isDelete.push(data);
                            });
                        });

                        if (isDelete) {
                            Swal.fire({
                                text: 'Cart is empty!',
                                icon: 'info',
                            }).then(() => {
                                cartPreview(binding.secureBaseUrl, data.id);
                                $('#remove-all-special').hide();
                                // window.location.reload();
                            });
                        }
                        //var mapped = _.mapValues(newarra,'productId');
                    } else {
                        Swal.fire({
                            text: 'There is no items in Cart',
                            icon: 'info',
                        });
                    }
                })
                .catch((error) => console.error(error));
        });
    }

    onAddAllToCart() {

        let lineItems = [];
        let binding = this;
        this.productList.map((product) => {
            lineItems.push({
                productId: product.id,
                quantity: 1,
            });
        });
        const cartItems = {
            lineItems: lineItems,
        };

        $('#add-all-special').on('click', function (event) {
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
            binding.getCart('/api/storefront/carts?include=lineItems.digitalItems.options,lineItems.physicalItems.options').then((data) => {
                console.log('cartdata', data);
                // 1. Check if non-exist cartId
                if (data.length === 0) {
                    // create a new cart
                    binding
                        .createCart(`/api/storefront/carts`, cartItems)
                        .then((data) => {
                            Swal.fire({
                                text: 'Added all special items in your cart',
                                icon: 'success',
                            }).then(() => {
                                cartPreview(binding.secureBaseUrl, data.id);
                                $('#remove-all-special').show();
                            });
                        })
                        .catch((error) => console.error(error));
                } else {
                    // Cart found
                    //Update the cart with +1 quantity
                    const cartId = data[0].id;
                    binding
                        .addCartItem(`/api/storefront/carts/`, cartId, cartItems)
                        .then((data) => {
                            Swal.fire({
                                text: 'Added all special items in your cart',
                                icon: 'success',
                            }).then(() => {
                                cartPreview(binding.secureBaseUrl, cartId);
                            });
                        })
                        .catch((err) => console.log(err));
                }
            });
            return;
        });
    }

    /**
     * Get current cart
     * @param {string} url
     */
    getCart() {
        var url = '/api/storefront/carts?include=lineItems.digitalItems.options,lineItems.physicalItems.options';
        return fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
        }).then((response) => response.json());
    }

    /**
     *
     * @param {*} url
     * @param {*} cartId
     * @param {*} itemId
     */
    deleteCartItem(itemId) {
        const removeItemPromise = new Promise((resolve, reject) => {
            utils.api.cart.itemRemove(itemId, (err, response) => {
                if (response.data.status === 'succeed') {
                    resolve(1);
                    this.getCart().then((data) => {
                        //console.log('Inside Delete Func', data);
                        if (data.length > 0) {
                            var mapped = [];
                            var newarra = data[0].lineItems;
                            var isDelete = [];
                            Object.values(newarra).map((value) => {
                                //console.log([...mapped,value]);
                                if (value.length > 0) mapped.push(value);
                            });
                            mapped = Array.prototype.concat.apply([], mapped);

                            mapped.map((el) => {
                                this.deleteCartItem(el.id).then((data) => {
                                    isDelete.push(data);
                                });
                            });
                        }
                    });
                } else {
                    reject('error');
                }
            });
        });
        return removeItemPromise;
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
        return fetch(url + cartId + '/items', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify(cartItems),
        }).then((res) => res.json());
    }
}
