const trackingProductName = document.querySelector('#tracking-product-name');
const trackingProductQuantity = document.querySelector('#tracking-product-quantity');
const trackingProductImage = document.querySelector('#tracking-product-image');
const deliveryDate = document.querySelector('#delivery-date');
const trackingStatusTitle = document.querySelector('#tracking-status-title');
const trackingStatusDetail = document.querySelector('#tracking-status-detail');
const advanceStatusButton = document.querySelector('#advance-status-button');
const progressBar = document.querySelector('#tracking-progress-bar');
const statusButtons = document.querySelectorAll('[data-status-index]');
const trackingParams = new URLSearchParams(window.location.search);
const orderId = trackingParams.get('order');
const requestedItemIndex = Number.parseInt(trackingParams.get('item') || '0', 10);

function getOrders() {
  try {
    const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');

    if (!Array.isArray(storedOrders)) {
      return [];
    }

    // Older versions stored order items directly instead of wrapping them in
    // an order object. Keep those saved orders compatible with tracking links.
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

const orders = getOrders();

function clearStaleTrackingStatuses() {
  // Remove progress saved by the earlier localStorage-based implementation.
  localStorage.removeItem('trackingStatuses');

  if (!orderId) {
    return;
  }

  const orderExists = orders.some((order) => order.id === orderId);
  if (!orderExists) {
    try {
      const savedStatuses = JSON.parse(sessionStorage.getItem('trackingStatuses') || '{}');
      if (savedStatuses && typeof savedStatuses === 'object') {
        delete savedStatuses[orderId];
        sessionStorage.setItem('trackingStatuses', JSON.stringify(savedStatuses));
      }
    } catch (error) {
      sessionStorage.removeItem('trackingStatuses');
    }
  }
}

const selectedOrder = orderId
  ? orders.find((order) => order.id === orderId)
  : orders[orders.length - 1];
const selectedItem = selectedOrder && Array.isArray(selectedOrder.items)
  ? selectedOrder.items[requestedItemIndex] || selectedOrder.items[0]
  : null;

const statuses = [
  { title: 'Preparing', detail: 'Your order is being prepared.' },
  { title: 'Shipped', detail: 'Your package is on its way.' },
  { title: 'Delivered', detail: 'Your package has been delivered.' }
];

clearStaleTrackingStatuses();

function getSavedStatus() {
  try {
    const savedStatuses = JSON.parse(sessionStorage.getItem('trackingStatuses') || '{}');
    const savedStatus = orderId ? Number(savedStatuses[orderId]) : NaN;
    return Number.isInteger(savedStatus) && savedStatus >= 0 && savedStatus < statuses.length
      ? savedStatus
      : 1;
  } catch (error) {
    return 1;
  }
}

function saveStatus(statusIndex) {
  let savedStatuses = {};

  try {
    const storedStatuses = JSON.parse(sessionStorage.getItem('trackingStatuses') || '{}');
    savedStatuses = storedStatuses && typeof storedStatuses === 'object' ? storedStatuses : {};
  } catch (error) {
    savedStatuses = {};
  }

  savedStatuses[orderId] = statusIndex;
  sessionStorage.setItem('trackingStatuses', JSON.stringify(savedStatuses));
}

function renderStatus(statusIndex) {
  const status = statuses[statusIndex];
  trackingStatusTitle.textContent = status.title;
  trackingStatusDetail.textContent = status.detail;
  progressBar.style.width = `${statusIndex * 50}%`;

  statusButtons.forEach((button) => {
    const buttonIndex = Number(button.dataset.statusIndex);
    button.classList.toggle('is-complete', buttonIndex <= statusIndex);
    button.classList.toggle('current-status', buttonIndex === statusIndex);
    button.setAttribute('aria-current', buttonIndex === statusIndex ? 'step' : 'false');
  });

  advanceStatusButton.disabled = statusIndex === statuses.length - 1;
  advanceStatusButton.textContent = statusIndex === statuses.length - 1
    ? 'Delivered'
    : 'Simulate next update';
}

if (!selectedItem || !selectedItem.product) {
  deliveryDate.textContent = 'Order details are unavailable.';
  trackingProductName.textContent = 'Return to Your Orders to select an order.';
  trackingProductQuantity.textContent = '';
  trackingProductImage.hidden = true;
  document.querySelector('.tracking-status-card').hidden = true;
  document.querySelector('.progress-labels-container').hidden = true;
  document.querySelector('.progress-bar-container').hidden = true;
} else {
  const currentStatus = getSavedStatus();
  deliveryDate.textContent = currentStatus === 2 ? 'Delivered' : 'Arriving soon';
  trackingProductName.textContent = selectedItem.product.name;
  trackingProductQuantity.textContent = `Quantity: ${selectedItem.item.quantity}`;
  trackingProductImage.src = selectedItem.product.image;
  trackingProductImage.onerror = () => {
    trackingProductImage.onerror = null;
    trackingProductImage.src = 'product-placeholder.svg';
  };
  trackingProductImage.alt = selectedItem.product.name;
  renderStatus(currentStatus);
}

statusButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const statusIndex = Number(button.dataset.statusIndex);
    saveStatus(statusIndex);
    renderStatus(statusIndex);
    deliveryDate.textContent = statusIndex === 2 ? 'Delivered' : 'Arriving soon';
  });
});

advanceStatusButton.addEventListener('click', () => {
  const currentStatus = getSavedStatus();
  if (currentStatus < statuses.length - 1) {
    const nextStatus = currentStatus + 1;
    saveStatus(nextStatus);
    renderStatus(nextStatus);
    deliveryDate.textContent = nextStatus === 2 ? 'Delivered' : 'Arriving soon';
  }
});