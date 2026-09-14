let productsHTML = '';
let savedRatings = {};
const productsGrid = document.querySelector('.js-products-grid');
const addProductForm = document.querySelector('#add-product-form');

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

try {
  savedRatings = JSON.parse(localStorage.getItem('productRatings')) || {};
} catch (error) {
  savedRatings = {};
}

products.forEach((product) => {
  const productImage = escapeHTML(product.image);
  const productName = escapeHTML(product.name);
  const selectedRating = savedRatings[product.id] || 0;
  const userRatingStars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const selectedClass = starValue <= selectedRating ? ' is-selected' : '';

    return `
      <button class="user-rating-star${selectedClass}"
        type="button"
        data-rating="${starValue}"
        aria-label="Rate ${starValue} out of 5"
        aria-pressed="${starValue <= selectedRating}">
        ★
      </button>`;
  }).join('');

  productsHTML += `
    <div class="product-container" data-product-id="${product.id}">
      <div class="product-image-container">
        <img class="product-image"
          src="${productImage}"
          onerror="this.onerror=null; this.src='product-placeholder.svg';"
          alt="${productName}">
      </div>

      <div class="product-name limit-text-to-2-lines">
        ${productName}
      </div>

      <div class="product-rating-container">
        <span class="product-rating-stars" role="img"
          aria-label="${product.rating.stars} out of 5 stars">★★★★★</span>
        <div class="product-rating-count link-primary">
          ${product.rating.count}
        </div>
      </div>

      <div class="user-rating" data-product-id="${product.id}">
        <span class="user-rating-label">Your rating:</span>
        <span class="user-rating-stars">${userRatingStars}</span>
      </div>

      <div class="product-price">
        $${(product.priceCents / 100).toFixed(2)}
      </div>

      <div class="product-quantity-container">
        <label for="quantity-${product.id}">Cart quantity</label>
        <div class="quantity-controls">
          <button class="quantity-button js-decrease-quantity"
            type="button" aria-label="Decrease quantity">−</button>
          <input id="quantity-${product.id}"
            class="cart-quantity-input"
            type="number"
            min="1"
            max="1000"
            value="1"
            inputmode="numeric">
          <button class="quantity-button js-increase-quantity"
            type="button" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <div class="product-spacer"></div>

      <div class="added-to-cart">
        Added
      </div>

      <button class="add-to-cart-button button-primary js-add-to-cart"
      data-product-id="${product.id}">
        Add to Cart
      </button>
    </div>
  `;
});

productsGrid.innerHTML = productsHTML;

const searchBar = document.querySelector('.search-bar');
const searchButton = document.querySelector('.search-button');
const toast = document.createElement('div');
toast.className = 'toast';
toast.setAttribute('role', 'status');
toast.setAttribute('aria-live', 'polite');
document.body.appendChild(toast);

let toastTimeout;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function saveCustomProduct(product) {
  let customProducts = [];

  try {
    const storedProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
    customProducts = Array.isArray(storedProducts) ? storedProducts : [];
  } catch (error) {
    customProducts = [];
  }

  customProducts.push(product);
  localStorage.setItem('customProducts', JSON.stringify(customProducts));
}

function filterProducts() {
  const searchTerm = searchBar.value.trim().toLowerCase();
  let visibleProducts = 0;

  productsGrid.querySelectorAll('.product-container').forEach((container) => {
    const product = products.find((item) => item.id === container.dataset.productId);
    if (!product) {
      container.classList.add('is-hidden');
      return;
    }

    const searchableText = `${product.name} ${product.keywords.join(' ')}`.toLowerCase();
    const isVisible = searchableText.includes(searchTerm);
    container.classList.toggle('is-hidden', !isVisible);
    visibleProducts += isVisible ? 1 : 0;
  });

  let emptyMessage = productsGrid.querySelector('.no-results-message');
  if (visibleProducts === 0) {
    if (!emptyMessage) {
      emptyMessage = document.createElement('p');
      emptyMessage.className = 'no-results-message';
      productsGrid.appendChild(emptyMessage);
    }
    emptyMessage.textContent = `No products found for "${searchBar.value.trim()}".`;
  } else if (emptyMessage) {
    emptyMessage.remove();
  }
}

searchBar.addEventListener('input', filterProducts);
searchButton.addEventListener('click', () => {
  searchBar.focus();
  filterProducts();
});

document.querySelectorAll('.user-rating').forEach((ratingControl) => {
  ratingControl.querySelectorAll('.user-rating-star')
    .forEach((ratingButton) => {
      ratingButton.addEventListener('click', () => {
        const productId = ratingControl.dataset.productId;
        const selectedRating = Number(ratingButton.dataset.rating);

        savedRatings[productId] = selectedRating;
        localStorage.setItem('productRatings', JSON.stringify(savedRatings));

        ratingControl.querySelectorAll('.user-rating-star')
          .forEach((button) => {
            const isSelected = Number(button.dataset.rating) <= selectedRating;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', isSelected);
          });
        showToast(`Rating saved: ${selectedRating} out of 5`);
      });
    });
});

document.querySelectorAll('.js-decrease-quantity, .js-increase-quantity')
  .forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('.cart-quantity-input');
      const adjustment = button.classList.contains('js-increase-quantity') ? 1 : -1;
      const quantity = Math.min(1000, Math.max(1, Number(input.value) + adjustment || 1));
      input.value = quantity;
    });
  });

document.querySelectorAll('.js-add-to-cart')
    .forEach((button) => {
      button.addEventListener('click', () => {
      const productId = button.dataset.productId;
      const productContainer = button.closest('.product-container');
      const requestedQuantity = Number(
        productContainer.querySelector('.cart-quantity-input').value
      );
      const selectedQuantity = Math.min(
        1000,
        Math.max(1, requestedQuantity || 1)
      );

      let matchingItem;

      cart.forEach((item) => {
        if (productId === item.productId) {
          matchingItem = item;
        }
      });

      if (matchingItem) {
        matchingItem.quantity = Math.min(1000, matchingItem.quantity + selectedQuantity);
      } else {
        cart.push({
          productId: productId,
          quantity: selectedQuantity
        });
      }

      let cartQuantity = 0;

      cart.forEach((item) => {
        cartQuantity += item.quantity;
      });

      saveCart();
      document.querySelector('.js-cart-quantity')
        .innerHTML = cartQuantity;
      showToast(`${selectedQuantity} item${selectedQuantity === 1 ? '' : 's'} added to cart`);
      });
    });

addProductForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(addProductForm);
  const name = formData.get('name').trim();
  const price = Number(formData.get('price'));
  const image = formData.get('image').trim() || 'amazon-logo.png';
  const keywords = formData.get('keywords')
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);

  if (!name || !Number.isFinite(price) || price <= 0) {
    showToast('Enter a product name and a valid price');
    return;
  }

  const product = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    image,
    name,
    rating: { stars: 0, count: 0 },
    priceCents: Math.round(price * 100),
    keywords
  };

  saveCustomProduct(product);
  showToast(`${name} added to your catalog`);
  window.setTimeout(() => window.location.reload(), 500);
});
