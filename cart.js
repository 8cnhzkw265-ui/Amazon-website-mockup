let cart = [];

try {
	const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
	cart = Array.isArray(savedCart) ? savedCart : [];
} catch (error) {
	cart = [];
}

function saveCart() {
	localStorage.setItem('cart', JSON.stringify(cart));
}