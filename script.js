// Store cart in localStorage

function addToCart(name, price) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push({ name: name, price: price });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay(); 
  alert(`${name} added to cart.`);

}

function displayCart() {
  const cartItems = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');

  if (!cartItems || !totalElement) return;

  cartItems.innerHTML = '';
  let total = 0;
  const cart = JSON.parse(localStorage.getItem('cart')) || []; // Get cart from localStorage
  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} - $${item.price}`;
    cartItems.appendChild(li);
    total += item.price;
  });
  totalElement.textContent = total.toFixed(2);
}

function updateCartDisplay() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const cartList = document.getElementById('cart-items'); // Assuming you have a <ul> with id="cart-items"

  if (cartList) {
    cartList.innerHTML = ''; // Clear existing cart items
    cartItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - $${item.price}`;
      cartList.appendChild(li);
    });
  }
}

document.addEventListener('DOMContentLoaded', displayCart);
