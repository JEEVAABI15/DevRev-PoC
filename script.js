// Store cart in localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(product, price) {
  cart = JSON.parse(localStorage.getItem('cart')) || []; // Ensure cart is latest
  cart.push({ product, price });
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`${product} added to cart.`);

  if (window.shopEasyTrackEvent) {
    window.shopEasyTrackEvent("Add_To_Cart", {
      productName: product,
      productPrice: price,
      source: "ProductsPage"
    });
  }
  // No need to call displayCart() here, it's handled on cart page load
}

function displayCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');
  const orderButton = document.getElementById('place-order-btn');

  if (!cartItemsEl || !totalElement) return; // Only run on cart page

  cart = JSON.parse(localStorage.getItem('cart')) || []; // Load current cart

  cartItemsEl.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.product} - $${item.price.toFixed(2)}`;
    cartItemsEl.appendChild(li);
    total += item.price;
  });
  totalElement.textContent = total.toFixed(2);

  // Disable order button if cart is empty or order already placed
  if (orderButton) {
    const orderPlaced = localStorage.getItem('orderPlaced') === 'true';
    if (orderPlaced) {
        orderButton.disabled = true;
        orderButton.textContent = "Order Placed";
    } else {
        orderButton.disabled = cart.length === 0;
        orderButton.textContent = "Order Now";
    }
  }
}

function placeOrder() {
  cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    alert("Your cart is empty. Please add products before placing an order.");
    return;
  }

  localStorage.setItem('orderPlaced', 'true');

  if (window.shopEasyTrackEvent) {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    window.shopEasyTrackEvent("Order_Placed", {
      itemCount: cart.length,
      totalAmount: total.toFixed(2),
      items: cart.map(item => ({ product: item.product, price: item.price })),
      source: "CartPage"
    });
  }

  alert("Order placed successfully! You can now logout.");
  
  // Update button state
  const orderButton = document.getElementById('place-order-btn');
  if (orderButton) {
      orderButton.disabled = true;
      orderButton.textContent = "Order Placed";
  }
  // Optionally, you might want to prevent further cart modifications here.
}

// Ensure displayCart is called when the DOM is loaded, specifically for the cart page.
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cart-items')) { // Check if we are on cart page
        displayCart();
    }
});
