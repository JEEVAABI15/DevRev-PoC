function showLoginPrompt() {
  const email = prompt("Enter your email:");
  const password = prompt("Enter your password:");
  const name = prompt("Enter your full name:");

  if (!email || !password || !name) {
    alert("All fields are required.");
    return null;
  }
  localStorage.setItem('user', JSON.stringify({ email, password, name }));
  return { email, password, name };
}

function getUser() {
  return JSON.parse(localStorage.getItem('user'));
}

// Global event tracking wrapper
window.shopEasyTrackEvent = function(eventName, rawProperties) {
  const user = getUser();
  let propertiesForStorage = { ...rawProperties };

  // Remove or redact sensitive data before storing for local log
  if (propertiesForStorage.password) {
    // delete propertiesForStorage.password; // Option 1: Remove
    propertiesForStorage.password = "[REDACTED]"; // Option 2: Redact
  }

  const eventData = {
    eventName,
    properties: {
      ...propertiesForStorage, // Include other properties
      email: user ? user.email : 'N/A',    // Ensure email is present for logging
      name: user ? user.name : 'N/A'       // Ensure name is present for logging
    },
    timestamp: new Date().toISOString()
  };

  let userEvents = JSON.parse(localStorage.getItem('userEvents')) || [];
  userEvents.push(eventData);
  localStorage.setItem('userEvents', JSON.stringify(userEvents));

  // Send original rawProperties to plugSDK
  if (window.plugSDK && typeof window.plugSDK.trackEvent === 'function') {
    window.plugSDK.trackEvent(eventName, rawProperties);
  } else {
    console.warn("plugSDK not initialized or trackEvent not a function, event not sent to DevRev:", eventName);
  }
};

async function ensureLoginAndInitPlug() {
  let user = getUser();
  if (!user) {
    user = showLoginPrompt();
    if (!user) return;
  }

  // Get session token from backend
  const response = await fetch('http://localhost:3001/api/get-devrev-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, name: user.name })
  });
  console.log("Response from backend for session token:", response);

  if (!response.ok) {
    const errorData = await response.json();
    alert("Failed to get session token: " + (errorData.error || "Unknown error"));
    logout(); // Attempt to logout to clear partial state
    return;
  }

  const data = await response.json();
  const sessionToken = data.sessionToken;

  // Base PLuG SDK initialization options
  let plugInitOptions = {
    app_id: 'DvRvStPZG9uOmNvcmU6ZHZydi1pbi0xOmRldm8vMlVLTnF5R0dkZDpwbHVnX3NldHRpbmcvMV9ffHxfXzIwMjUtMDQtMTYgMDU6MjM6MTMuNzMyMjMwODM4ICswMDAwIFVUQw==xlxendsDvRv',
    session_token: sessionToken
  };

  let onWidgetReadyPageSpecificCallback = null;

  // Page-specific configurations
  if (window.location.pathname.endsWith('/about.html') || window.location.pathname.endsWith('/about')) {
    plugInitOptions.disable_plug_chat_window = true;
    onWidgetReadyPageSpecificCallback = () => {
      if (window.plugSDK && typeof window.plugSDK.initSearchAgent === 'function' && typeof window.plugSDK.toggleSearchAgent === 'function') {
        console.log('About.html: Initializing and toggling search agent.');
        window.plugSDK.initSearchAgent();
        window.plugSDK.toggleSearchAgent();
      } else {
        console.warn("plugSDK search agent functions not available when trying to call from about.html specific logic.");
      }
    };
  }

  // Initialize PLuG widget
  if (window.plugSDK && typeof window.plugSDK.init === 'function') {
    window.plugSDK.init(plugInitOptions);

    // Setup a global event listener for PLuG SDK events
    if (typeof window.plugSDK.onEvent === 'function') {
      window.plugSDK.onEvent((payload) => {
        console.log('Plug SDK Event (handled in auth.js):', payload);
        if (payload.type === 'ON_PLUG_WIDGET_READY') {
          if (onWidgetReadyPageSpecificCallback) {
            onWidgetReadyPageSpecificCallback(payload);
          }
          // Other global actions on widget ready can be placed here
        }
        // Handle other event types globally if needed
      });
    }

  } else {
      console.error("plugSDK not available for init.");
      alert("Error initializing support chat. PLuG SDK not found.");
      return;
  }

  // Track login event using the new wrapper
  window.shopEasyTrackEvent("User_Login", {
    email: user.email,
    password: user.password, 
    name: user.name,
    source: "ShopEasy"
  });
}

async function logout() { // Make the function async if it's not already
  const user = getUser();

  // Track logout attempt event immediately
  if (window.shopEasyTrackEvent) {
    window.shopEasyTrackEvent("User_Logout_Attempt", {
      source: "Navigation", 
      userExists: !!user 
    });
  }

  if (!user) {
    localStorage.removeItem('cart');
    localStorage.removeItem('userEvents');
    localStorage.removeItem('orderPlaced');
    window.location.reload();
    return;
  }

  const orderPlaced = localStorage.getItem('orderPlaced') === 'true';
  if (!orderPlaced) {
    alert("You must place an order from the cart page before logging out.");
    if (window.shopEasyTrackEvent) {
        window.shopEasyTrackEvent("User_Logout_Blocked", {
          reason: "OrderNotPlaced",
          source: "Navigation"
        });
    }
    return;
  }

  const userEvents = JSON.parse(localStorage.getItem('userEvents')) || [];
  const orderedProducts = JSON.parse(localStorage.getItem('cart')) || [];

  const logoutSummaryJSON = {
    userName: user.name,
    userEmail: user.email,
    orderedProducts: orderedProducts,
    userActivity: userEvents
  };

  console.log("--- User Logout Summary (JSON) ---");
  console.log(JSON.stringify(logoutSummaryJSON, null, 2));
  console.log("---------------------------------");

  // Send summary to backend to create DevRev issue
  try {
    const issueResponse = await fetch('/api/create-devrev-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logoutSummaryJSON),
    });
    const issueResult = await issueResponse.json();
    if (issueResponse.ok) {
      console.log('DevRev issue creation initiated:', issueResult);
      // Optionally alert the user or handle success
    } else {
      console.error('Failed to create DevRev issue:', issueResult);
      // Optionally alert the user about the failure
    }
  } catch (error) {
    console.error('Error sending data to backend for DevRev issue:', error);
  }

  // Prepare string content for the alert
  let summaryContentString = "--- User Logout Summary ---\n\n";
  summaryContentString += `User Name: ${user.name}\n`;
  summaryContentString += `User Email: ${user.email}\n\n`;
  summaryContentString += "Ordered Products:\n";
  if (orderedProducts.length > 0) {
    orderedProducts.forEach(item => {
      summaryContentString += `  - ${item.product} ($${item.price.toFixed(2)})\n`;
    });
  } else {
    summaryContentString += "  No products were recorded for the order.\n";
  }
  summaryContentString += "\n";
  summaryContentString += "User Activity (Events):\n";
  if (userEvents.length > 0) {
    userEvents.forEach(event => {
      let eventPropertiesSummary = Object.entries(event.properties)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join(', ');
      summaryContentString += `  - Event: ${event.eventName}\n    Timestamp: ${event.timestamp}\n    Details: ${eventPropertiesSummary}\n\n`;
    });
  } else {
    summaryContentString += "  No events tracked for this session.\n";
  }
  summaryContentString += "-------------------------\n";

  alert(summaryContentString);

  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  localStorage.removeItem('userEvents');
  localStorage.removeItem('orderPlaced');
  
  window.location.reload();
}

// Add logout button to nav
function addLogoutButton() {
  const nav = document.querySelector('nav');
  if (nav && !document.getElementById('logout-btn')) {
    const btn = document.createElement('button');
    btn.textContent = 'Logout';
    btn.id = 'logout-btn';
    btn.style.marginLeft = '1rem';
    btn.onclick = logout;
    nav.appendChild(btn);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  addLogoutButton();
  ensureLoginAndInitPlug();

  // Track "Shop Now" button click on index.html
  const shopNowButton = document.getElementById('shop-now-btn');
  if (shopNowButton) {
    shopNowButton.addEventListener('click', (e) => {
      // You can choose to prevent default if you want to handle navigation
      // purely via JS after tracking, or let the default <a> tag behavior proceed.
      // For now, we'll just track the click and let the link navigate.
      // e.preventDefault(); 

      if (window.shopEasyTrackEvent) {
        window.shopEasyTrackEvent("Shop_Now_Clicked", {
          source: "HomePageHero",
          targetUrl: shopNowButton.href // Log where the button was supposed to go
        });
      }
      // If you had used e.preventDefault(), you might navigate like this:
      // window.location.href = shopNowButton.href;
    });
  }
});