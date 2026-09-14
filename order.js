const ordersList = document.querySelector('#orders-list');

function getSavedOrders() {
  try {
    const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');

    if (!Array.isArray(storedOrders)) {
      return [];
    }

    if (storedOrders.length > 0 && storedOrders[0]?.item && storedOrders[0]?.product) {
      return [{
        id: 'order-previous',
        placedAt: 'Previous order',
        items: storedOrders
      }];
    }

    return storedOrders;
  } catch (error) {
    return [];
  }
}

function renderOrders(orders) {
  if (orders.length === 0) {
    ordersList.innerHTML = "<p>You haven't placed any orders yet.</p>";
    return;
  }

  ordersList.innerHTML = orders.slice().reverse().map((order) => `
    <div class="order-container">
      <div class="order-container-header">
        <span>Order placed: ${order.placedAt}</span>
        <span>Order ID: ${order.id}</span>
      </div>
      ${(order.items || []).map((entry, itemIndex) => {
        const item = entry?.item;
        const product = entry?.product;

        if (!item || !product) {
          return '';
        }

        return `
          <div class="order-item">
            <img class="order-item-image" src="${product.image}"
              onerror="this.onerror=null; this.src='product-placeholder.svg';"
              alt="${product.name}">
            <div>
              <div class="order-item-name">${product.name}</div>
              <div class="order-item-quantity">Quantity: ${item.quantity}</div>
            </div>
            <a class="button-secondary track-order-link" href="tracking.html?order=${encodeURIComponent(order.id)}&item=${itemIndex}">Track package</a>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

renderOrders(getSavedOrders());
window.addEventListener('pageshow', () => renderOrders(getSavedOrders()));
window.addEventListener('storage', () => renderOrders(getSavedOrders()));