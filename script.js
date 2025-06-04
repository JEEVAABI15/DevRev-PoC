// Store cart in localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(name, price) {
  cart.push({ name, price });
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`${name} added to cart.`);
}

function displayCart() {
  const cartItems = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');

  if (!cartItems || !totalElement) return;

  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} - $${item.price}`;
    cartItems.appendChild(li);
    total += item.price;
  });
  totalElement.textContent = total.toFixed(2);
}

document.addEventListener('DOMContentLoaded', displayCart);
