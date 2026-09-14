const orderSummary = document.querySelector('#order-summary');
const paymentSummary = document.querySelector('#payment-summary');
const checkoutItemCount = document.querySelector('.checkout-item-count');
const productById = new Map(products.map((product) => [product.id, product]));

function renderCheckout() {
  const cartItems = cart
    .map((item) => ({
      item,
      product: productById.get(item.productId)
    }))
    .filter(({ product }) => product);
  const itemCount = cartItems.reduce((total, { item }) => total + item.quantity, 0);
  const totalCents = cartItems.reduce(
    (total, { item, product }) => total + product.priceCents * item.quantity,
    0
  );

  checkoutItemCount.textContent = itemCount;

  if (cartItems.length === 0) {
    orderSummary.innerHTML = `
      <p class="empty-cart-message">Your cart is empty.</p>
      <a class="return-to-home-link" href="index.html">Continue shopping</a>
    `;
    paymentSummary.innerHTML = '';
    return;
  }

  orderSummary.innerHTML = cartItems.map(({ item, product }) => `
    <div class="checkout-item">
      <img class="checkout-item-image" src="${product.image}"
        onerror="this.onerror=null; this.src='product-placeholder.svg';"
        alt="${product.name}">
      <div>
        <div class="checkout-item-name">${product.name}</div>
        <div class="checkout-item-quantity">Quantity: ${item.quantity}</div>
        <div class="checkout-item-price">$${(product.priceCents / 100).toFixed(2)} each</div>
      </div>
      <strong>$${((product.priceCents * item.quantity) / 100).toFixed(2)}</strong>
    </div>
  `).join('');

  paymentSummary.innerHTML = `
    <div class="payment-summary-title">Order Summary</div>
    <div>${itemCount} item${itemCount === 1 ? '' : 's'}</div>
    <div class="payment-summary-total">
      <span>Order total</span>
      <span>$${(totalCents / 100).toFixed(2)}</span>
    </div>
    <button class="place-order-button button-primary" type="button">
      Place order
    </button>
  `;

  paymentSummary.querySelector('.place-order-button').addEventListener('click', () => {
    let savedOrders = [];

    try {
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      savedOrders = Array.isArray(storedOrders) ? storedOrders : [];
    } catch (error) {
      savedOrders = [];
    }

    savedOrders.push({
      id: `order-${Date.now()}`,
      placedAt: new Date().toLocaleDateString(),
      items: cartItems
    });
    localStorage.setItem('orders', JSON.stringify(savedOrders));
    cart.length = 0;
    saveCart();
    window.location.href = 'order.html';
  });
}

renderCheckout();
