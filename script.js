// API Base URL
const API_URL = 'http://localhost:3000';

// Data: loaded from backend
let PRODUCTS = [];
let COUPONS = {};

// State
let cart = []; // {id, qty}
let wishlist = []; // array of product ids
let currentFilter = 'All';
let currentSearch = '';
let selectedProduct = null;
let activeCoupon = null;
let discountAmount = 0;
let customerInfo = null;

// Helpers
const fmt = (n) => `$${n.toFixed(2)}`;
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => document.querySelectorAll(sel);

/**
 * API Helper function
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Load products from backend
 */
async function loadProducts() {
  try {
    const response = await apiRequest('/products');
    PRODUCTS = response.data;
    renderProducts();
    renderCategories();
  } catch (error) {
    console.error('Failed to load products:', error);
    showToast('error', 'Connection Error', 'Failed to load products. Using cached data.');
    // Fallback to hardcoded products if API fails
    loadFallbackProducts();
  }
}

/**
 * Load coupons from backend
 */
async function loadCoupons() {
  try {
    const response = await apiRequest('/coupons');
    COUPONS = response.data;
  } catch (error) {
    console.error('Failed to load coupons:', error);
    // Fallback coupons
    COUPONS = {
      'WELCOME10': { type: 'percentage', value: 10, minOrder: 0, description: '10% off on first order' },
      'OFFER15': { type: 'percentage', value: 15, minOrder: 25, description: '15% off on orders above $25' },
      'OFFER5': { type: 'fixed', value: 5, minOrder: 15, description: '$5 off on orders above $15' },
      'SUPER20': { type: 'percentage', value: 20, minOrder: 40, description: '20% off on orders above $40' },
      'QUICK10': { type: 'percentage', value: 10, minOrder: 20, description: '10% off for quick orders' }
    };
  }
}

/**
 * Load orders from backend
 */
async function loadOrders() {
  try {
    const response = await apiRequest('/orders');
    return response.data;
  } catch (error) {
    console.error('Failed to load orders:', error);
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('SKY_ORDERS') || '[]');
  }
}

/**
 * Fallback products if API is unavailable
 */
function loadFallbackProducts() {
  PRODUCTS = [
    { id: 1, name: 'Grilled Kebab', desc: '400g beef kebab with special spices', price: 18.0, cat: 'Grill', image: 'https://tse2.mm.bing.net/th/id/OIP.fGBuHwmIfDvvJFvsHzh9AQHaHa?pid=Api&P=0&h=220', ingredients: ['Beef', 'Onion', 'Garlic', 'Spices', 'Parsley'], rating: 4.5, reviews: 128, popular: true },
    { id: 2, name: 'Chicken Pasta', desc: 'Creamy pasta with grilled chicken and mushrooms', price: 14.5, cat: 'Pasta', image: 'https://tse1.mm.bing.net/th/id/OIP.GxokmxtUvWSO3Rxf5C3IwQHaJ4?pid=Api&P=0&h=220', ingredients: ['Pasta', 'Chicken', 'Cream', 'Mushrooms', 'Parmesan'], rating: 4.2, reviews: 89, popular: true },
    { id: 3, name: 'Margherita Pizza', desc: 'Mozzarella, fresh tomato sauce', price: 12.0, cat: 'Pizza', image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&h=400&fit=crop', ingredients: ['Dough', 'Tomato', 'Mozzarella', 'Basil'], rating: 4.7, reviews: 215, popular: true },
    { id: 4, name: 'Greek Salad', desc: 'Fresh veggies, feta cheese, olives', price: 9.5, cat: 'Salads', image: 'https://tse2.mm.bing.net/th/id/OIP.swCy0YjErKZzreo-bhFO0QHaLH?pid=Api&P=0&h=220', ingredients: ['Lettuce', 'Tomato', 'Cucumber', 'Feta', 'Olives'], rating: 4.0, reviews: 56, popular: false },
    { id: 5, name: 'French Fries', desc: 'Crispy golden fries', price: 4.0, cat: 'Sides', image: 'https://tse2.mm.bing.net/th/id/OIP.GqUvr8wmgKYa7LL8YpnGMAHaE7?pid=Api&P=0&h=220', ingredients: ['Potato', 'Salt', 'Oil'], rating: 4.8, reviews: 342, popular: true },
    { id: 6, name: 'Club Sandwich', desc: 'Turkey, cheese, tomato, lettuce', price: 10.0, cat: 'Sandwiches', image: 'https://tse3.mm.bing.net/th/id/OIP.dXklaEouFOQHGeOxiTl8vgHaHa?pid=Api&P=0&h=220', ingredients: ['Bread', 'Turkey', 'Cheese', 'Tomato', 'Lettuce'], rating: 4.3, reviews: 78, popular: false },
    { id: 7, name: 'Orange Juice', desc: 'Freshly squeezed orange juice', price: 3.5, cat: 'Drinks', image: 'https://tse4.mm.bing.net/th/id/OIP.kxzvbAvoWNgLy8mENLyReAHaE8?pid=Api&P=0&h=220', ingredients: ['Orange'], rating: 4.6, reviews: 45, popular: true },
    { id: 8, name: 'Spaghetti Bolognese', desc: 'Traditional beef ragu pasta', price: 13.0, cat: 'Pasta', image: 'https://tse4.mm.bing.net/th/id/OIP.YU24qSUMBv5rMJOp7ZX2JgHaGl?pid=Api&P=0&h=220', ingredients: ['Pasta', 'Beef', 'Tomato', 'Onion', 'Carrot'], rating: 4.4, reviews: 112, popular: true },
    { id: 9, name: 'Pepperoni Pizza', desc: 'Mozzarella, tomato sauce, pepperoni', price: 14.0, cat: 'Pizza', image: 'https://tse3.mm.bing.net/th/id/OIP.aidaAmHr76zytGyj8e_ntQHaKX?pid=Api&P=0&h=220', ingredients: ['Dough', 'Tomato', 'Mozzarella', 'Pepperoni'], rating: 4.9, reviews: 189, popular: true },
    { id: 10, name: 'Beef Burger', desc: '200g beef patty with cheese and veggies', price: 11.0, cat: 'Grill', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop', ingredients: ['Beef', 'Bun', 'Cheese', 'Lettuce', 'Tomato'], rating: 4.6, reviews: 167, popular: true },
    { id: 11, name: 'Caesar Salad', desc: 'Romaine lettuce with Caesar dressing', price: 8.5, cat: 'Salads', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop', ingredients: ['Lettuce', 'Croutons', 'Parmesan', 'Caesar Dressing'], rating: 4.1, reviews: 72, popular: false },
    { id: 12, name: 'Iced Coffee', desc: 'Chilled coffee with milk and sugar', price: 4.5, cat: 'Drinks', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop', ingredients: ['Coffee', 'Milk', 'Ice', 'Sugar'], rating: 4.3, reviews: 98, popular: true }
  ];
  renderProducts();
  renderCategories();
}

/**
 * Show toast notification
 */
function showToast(type, title, message) {
  const container = qs('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      ${type === 'success' ? '<i class="fas fa-check-circle"></i>' :
        type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' :
        type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' :
        '<i class="fas fa-info-circle"></i>'}
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;
  
  container.appendChild(toast);
  
  // Show toast
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Create star rating HTML
 */
function createStars(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars += '<i class="fas fa-star star filled"></i>';
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt star filled"></i>';
    } else {
      stars += '<i class="far fa-star star"></i>';
    }
  }
  return stars;
}

function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

function getFilteredProducts() {
  let list = PRODUCTS.slice();
  if (currentFilter !== 'All') {
    list = list.filter(p => p.cat === currentFilter);
  }
  if (currentSearch.trim()) {
    const s = currentSearch.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.desc.toLowerCase().includes(s) ||
      p.cat.toLowerCase().includes(s)
    );
  }
  return list;
}

/**
 * Get similar products based on category and rating
 */
function getSimilarProducts(productId, limit = 4) {
  const product = getProduct(productId);
  if (!product) return [];
  
  // Get products from same category, excluding current product
  const sameCategory = PRODUCTS.filter(p => 
    p.cat === product.cat && p.id !== productId
  );
  
  // Get popular products from other categories
  const popularProducts = PRODUCTS.filter(p => 
    p.id !== productId && p.popular
  );
  
  // Combine and sort by rating
  const similar = [...sameCategory, ...popularProducts]
    .filter((p, index, self) => 
      self.findIndex(s => s.id === p.id) === index
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
  
  return similar;
}

/**
 * Render similar products in product detail modal
 */
function renderSimilarProducts(productId) {
  const container = qs('#similarProducts');
  container.innerHTML = '';
  
  const similarProducts = getSimilarProducts(productId);
  
  if (similarProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 20px;">
        <p>No similar products found</p>
      </div>
    `;
    return;
  }
  
  similarProducts.forEach(p => {
    const productEl = document.createElement('div');
    productEl.className = 'similar-product';
    productEl.innerHTML = `
      <div class="similar-product-image" style="background-image:url('${p.image}')"></div>
      <div class="similar-product-info">
        <div class="similar-product-name">${p.name}</div>
        <div class="similar-product-price">${fmt(p.price)}</div>
        <button class="similar-product-add" data-id="${p.id}">
          <i class="fas fa-plus"></i> Add to Cart
        </button>
      </div>
    `;
    
    // Click on product opens details
    productEl.addEventListener('click', (e) => {
      if (!e.target.closest('.similar-product-add')) {
        openProductDetail(p.id);
      }
    });
    
    // Add to cart button
    productEl.querySelector('.similar-product-add').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(p.id);
      showToast('success', 'Added to cart', `${p.name} has been added to your cart`);
    });
    
    container.appendChild(productEl);
  });
}

function renderProducts() {
  const container = qs('#products');
  container.innerHTML = '';
  const list = getFilteredProducts();
  
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-drumstick-bite"></i>
        <p>No items match your filters</p>
      </div>`;
    return;
  }
  
  list.forEach(p => {
    const isInWishlist = wishlist.includes(p.id);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image" style="background-image:url('${p.image}')">
        <div class="product-wishlist ${isInWishlist ? 'active' : ''}" data-id="${p.id}">
          <i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>
        </div>
        ${p.popular ? '<div class="product-badge">Popular</div>' : ''}
        <div class="product-overlay">
          <span>Click for details</span>
        </div>
      </div>
      <div class="product-rating">
        <div class="stars">${createStars(p.rating)}</div>
        <span class="rating-text">(${p.rating.toFixed(1)})</span>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <div class="product-price">${fmt(p.price)}</div>
          <button class="add-to-cart-btn" data-id="${p.id}">
            <i class="fas fa-plus"></i> Add
          </button>
        </div>
      </div>
    `;
    
    // Wishlist button
    card.querySelector('.product-wishlist').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(p.id);
    });
    
    // Click image or info opens details
    card.querySelector('.product-image').addEventListener('click', () => openProductDetail(p.id));
    card.querySelector('.product-info').addEventListener('click', (e) => {
      if (!e.target.closest('.add-to-cart-btn')) openProductDetail(p.id);
    });
    
    // Add button
    card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(p.id);
      showToast('success', 'Added to cart', `${p.name} has been added to your cart`);
    });
    
    container.appendChild(card);
  });
}

function renderCategories() {
  const cats = ['All', ...Array.from(new Set(PRODUCTS.map(p => p.cat)))];
  const container = qs('#categories');
  container.innerHTML = '';
  cats.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = 'filter-chip' + (cat === currentFilter ? ' active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      qsa('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = cat;
      renderProducts();
    });
    container.appendChild(chip);
  });
}

function addToCart(id, qty = 1) {
  const item = cart.find(c => c.id === id);
  if (item) item.qty += qty;
  else cart.push({ id, qty });
  
  renderCart();
  updateCartDiscount();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  renderCart();
  updateCartDiscount();
}

function updateQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    renderCart();
    updateCartDiscount();
  }
}

function calculateSubtotal() {
  return cart.reduce((acc, c) => acc + getProduct(c.id).price * c.qty, 0);
}

function updateCartDiscount() {
  const subtotal = calculateSubtotal();
  
  if (activeCoupon && COUPONS[activeCoupon]) {
    const coupon = COUPONS[activeCoupon];
    
    if (subtotal < coupon.minOrder) {
      showToast('warning', 'Coupon not applicable', `Minimum order of $${coupon.minOrder} required`);
      activeCoupon = null;
      discountAmount = 0;
      qs('#discountInfo').style.display = 'none';
      renderCart();
      return;
    }
    
    if (coupon.type === 'percentage') {
      discountAmount = (subtotal * coupon.value) / 100;
    } else {
      discountAmount = Math.min(coupon.value, subtotal);
    }
  } else {
    discountAmount = 0;
  }
  
  renderCart();
}

function renderCart() {
  const listEl = qs('#cartList');
  listEl.innerHTML = '';
  
  if (cart.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty</p>
        <p class="text-light">Add some delicious items from our menu</p>
      </div>
    `;
    qs('#discountInfo').style.display = 'none';
  } else {
    cart.forEach(c => {
      const p = getProduct(c.id);
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <div class="cart-item-image" style="background-image:url('${p.image}')"></div>
        <div class="cart-item-details">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${fmt(p.price)} x ${c.qty} = ${fmt(p.price * c.qty)}</div>
          <div class="cart-item-controls">
            <button class="quantity-btn" data-action="dec" title="Decrease"><i class="fas fa-minus"></i></button>
            <div class="quantity">${c.qty}</div>
            <button class="quantity-btn" data-action="inc" title="Increase"><i class="fas fa-plus"></i></button>
            <button class="remove-btn" title="Remove">Remove</button>
          </div>
        </div>
      `;
      item.querySelector('[data-action="dec"]').addEventListener('click', () => updateQty(p.id, -1));
      item.querySelector('[data-action="inc"]').addEventListener('click', () => updateQty(p.id, +1));
      item.querySelector('.remove-btn').addEventListener('click', () => {
        removeFromCart(p.id);
        showToast('info', 'Item removed', `${p.name} has been removed from cart`);
      });
      listEl.appendChild(item);
    });
  }
  
  // Update counts and prices
  const count = cart.reduce((acc, c) => acc + c.qty, 0);
  qs('#cartCount').textContent = `${count} item${count !== 1 ? 's' : ''}`;
  
  const subtotal = calculateSubtotal();
  const total = subtotal - discountAmount;
  
  qs('#subtotalPrice').textContent = fmt(subtotal);
  qs('#discountPrice').textContent = `-${fmt(discountAmount)}`;
  qs('#totalPrice').textContent = fmt(total);
  
  // Show discount info if active
  const discountInfo = qs('#discountInfo');
  if (activeCoupon && discountAmount > 0) {
    discountInfo.style.display = 'flex';
    qs('#discountAmount').textContent = `-${fmt(discountAmount)} (${activeCoupon})`;
  } else {
    discountInfo.style.display = 'none';
  }
}

function clearCart() {
  if (cart.length > 0) {
    cart = [];
    activeCoupon = null;
    discountAmount = 0;
    renderCart();
    showToast('info', 'Cart cleared', 'All items have been removed from your cart');
  }
}

function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  const product = getProduct(productId);
  
  if (index === -1) {
    wishlist.push(productId);
    showToast('success', 'Added to wishlist', `${product.name} has been added to your wishlist`);
  } else {
    wishlist.splice(index, 1);
    showToast('info', 'Removed from wishlist', `${product.name} has been removed from your wishlist`);
  }
  
  // Save to localStorage
  localStorage.setItem('SKY_WISHLIST', JSON.stringify(wishlist));
  
  // Update UI
  updateWishlistCount();
  renderProducts();
  
  // Update detail modal if open
  if (selectedProduct && selectedProduct.id === productId) {
    const wishlistBtn = qs('#toggleWishlist');
    const isInWishlist = wishlist.includes(productId);
    wishlistBtn.classList.toggle('active', isInWishlist);
    wishlistBtn.innerHTML = `<i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>`;
  }
}

function updateWishlistCount() {
  const count = wishlist.length;
  qs('#wishlistCount').textContent = count;
}

function openWishlistModal() {
  const container = qs('#wishlistItems');
  container.innerHTML = '';
  
  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-heart"></i>
        <p>Your wishlist is empty</p>
        <p class="text-light">Add items by clicking the heart icon</p>
      </div>
    `;
  } else {
    wishlist.forEach(productId => {
      const product = getProduct(productId);
      const item = document.createElement('div');
      item.className = 'wishlist-item';
      item.innerHTML = `
        <div class="wishlist-item-image" style="background-image:url('${product.image}')"></div>
        <div class="wishlist-item-details">
          <div class="wishlist-item-name">${product.name}</div>
          <div class="wishlist-item-price">${fmt(product.price)}</div>
        </div>
        <div class="wishlist-item-actions">
          <button class="btn btn-outline add-from-wishlist" data-id="${product.id}">
            <i class="fas fa-cart-plus"></i> Add
          </button>
          <button class="btn btn-outline remove-from-wishlist" data-id="${product.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      item.querySelector('.add-from-wishlist').addEventListener('click', () => {
        addToCart(product.id);
        showToast('success', 'Added to cart', `${product.name} has been added to your cart`);
      });
      
      item.querySelector('.remove-from-wishlist').addEventListener('click', () => {
        toggleWishlist(product.id);
        openWishlistModal(); // Refresh the modal
      });
      
      container.appendChild(item);
    });
  }
  
  showModal('#wishlistModal');
}

function openProductDetail(id) {
  const p = getProduct(id);
  if (!p) return;
  
  selectedProduct = p;
  const isInWishlist = wishlist.includes(id);
  
  qs('#productDetailTitle').textContent = 'Product Details';
  qs('#productDetailImage').style.backgroundImage = `url('${p.image}')`;
  qs('#productDetailName').textContent = p.name;
  qs('#productStars').innerHTML = createStars(p.rating);
  qs('#ratingText').textContent = `${p.rating.toFixed(1)} (${p.reviews} reviews)`;
  qs('#productDetailCategory').textContent = p.cat;
  qs('#productDetailPrice').textContent = fmt(p.price);
  qs('#productDetailDesc').textContent = p.desc;
  qs('#productDetailIngredients').innerHTML = p.ingredients && p.ingredients.length
    ? `<ul>${p.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>`
    : '<em>No ingredients listed</em>';
  
  // Update wishlist button
  const wishlistBtn = qs('#toggleWishlist');
  wishlistBtn.classList.toggle('active', isInWishlist);
  wishlistBtn.innerHTML = `<i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>`;
  
  // Render similar products
  renderSimilarProducts(id);
  
  showModal('#productDetailModal');
}

function addFromDetail() {
  if (!selectedProduct) return;
  addToCart(selectedProduct.id, 1);
  showToast('success', 'Added to cart', `${selectedProduct.name} has been added to your cart`);
  hideModal('#productDetailModal');
}

async function applyCoupon() {
  const couponInput = qs('#couponInput').value.trim().toUpperCase();
  
  if (!couponInput) {
    showToast('warning', 'No coupon entered', 'Please enter a coupon code');
    return;
  }

  try {
    // Validate coupon via API
    const subtotal = calculateSubtotal();
    const response = await apiRequest('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code: couponInput, subtotal })
    });

    activeCoupon = couponInput;
    updateCartDiscount();
    
    const coupon = response.data;
    const discountText = coupon.type === 'percentage' 
      ? `${coupon.value}% off` 
      : `$${coupon.value} off`;
    
    showToast('success', 'Coupon applied!', `You got ${discountText} on your order`);
    qs('#couponInput').value = '';
  } catch (error) {
    // Fallback to local validation
    if (!COUPONS[couponInput]) {
      showToast('error', 'Invalid coupon', 'The coupon code is not valid');
      return;
    }
    
    const coupon = COUPONS[couponInput];
    const subtotal = calculateSubtotal();
    
    if (subtotal < coupon.minOrder) {
      showToast('warning', 'Minimum order required', `Minimum order of $${coupon.minOrder} required for this coupon`);
      return;
    }
    
    activeCoupon = couponInput;
    updateCartDiscount();
    
    const discountText = coupon.type === 'percentage' 
      ? `${coupon.value}% off` 
      : `$${coupon.value} off`;
    
    showToast('success', 'Coupon applied!', `You got ${discountText} on your order`);
    qs('#couponInput').value = '';
  }
}

/**
 * Apply coupon from checkout modal
 */
async function applyCheckoutCoupon() {
  const couponInput = qs('#checkoutCouponInput').value.trim().toUpperCase();
  
  if (!couponInput) {
    showToast('warning', 'No coupon entered', 'Please enter a coupon code');
    return;
  }

  try {
    const subtotal = calculateSubtotal();
    const response = await apiRequest('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code: couponInput, subtotal })
    });

    activeCoupon = couponInput;
    updateCartDiscount();
    renderCheckoutSummary();
    
    const coupon = response.data;
    const discountText = coupon.type === 'percentage' 
      ? `${coupon.value}% off` 
      : `$${coupon.value} off`;
    
    showToast('success', 'Coupon applied!', `You got ${discountText} on your order`);
    qs('#checkoutCouponInput').value = '';
  } catch (error) {
    // Fallback to local validation
    if (!COUPONS[couponInput]) {
      showToast('error', 'Invalid coupon', 'The coupon code is not valid');
      return;
    }
    
    const coupon = COUPONS[couponInput];
    const subtotal = calculateSubtotal();
    
    if (subtotal < coupon.minOrder) {
      showToast('warning', 'Minimum order required', `Minimum order of $${coupon.minOrder} required for this coupon`);
      return;
    }
    
    activeCoupon = couponInput;
    updateCartDiscount();
    renderCheckoutSummary();
    
    const discountText = coupon.type === 'percentage' 
      ? `${coupon.value}% off` 
      : `$${coupon.value} off`;
    
    showToast('success', 'Coupon applied!', `You got ${discountText} on your order`);
    qs('#checkoutCouponInput').value = '';
  }
}

function removeCoupon() {
  activeCoupon = null;
  discountAmount = 0;
  renderCart();
  renderCheckoutSummary();
  showToast('info', 'Coupon removed', 'Discount has been removed from your order');
}

/**
 * Render checkout summary in modal
 */
function renderCheckoutSummary() {
  const itemsContainer = qs('#checkoutItems');
  const subtotal = calculateSubtotal();
  const total = subtotal - discountAmount;
  
  // Render items
  itemsContainer.innerHTML = '';
  if (cart.length === 0) {
    itemsContainer.innerHTML = '<div class="empty-state">Cart is empty</div>';
  } else {
    cart.forEach(c => {
      const p = getProduct(c.id);
      const item = document.createElement('div');
      item.className = 'checkout-item';
      item.innerHTML = `
        <div class="checkout-item-name">${p.name} <span class="checkout-item-qty">x${c.qty}</span></div>
        <div>${fmt(p.price * c.qty)}</div>
      `;
      itemsContainer.appendChild(item);
    });
  }
  
  // Update totals
  qs('#checkoutSubtotal').textContent = fmt(subtotal);
  qs('#checkoutDiscount').textContent = `-${fmt(discountAmount)}`;
  qs('#checkoutTotal').textContent = fmt(total);
  
  // Render available coupons
  const couponsContainer = qs('#couponBadges');
  couponsContainer.innerHTML = '';
  
  Object.keys(COUPONS).forEach(code => {
    const coupon = COUPONS[code];
    const badge = document.createElement('div');
    badge.className = `coupon-badge ${activeCoupon === code ? 'active' : ''}`;
    badge.textContent = code;
    badge.title = coupon.description;
    
    badge.addEventListener('click', () => {
      if (activeCoupon === code) {
        removeCoupon();
      } else {
        activeCoupon = code;
        updateCartDiscount();
        renderCheckoutSummary();
        showToast('success', 'Coupon applied!', `${code}: ${coupon.description}`);
      }
    });
    
    couponsContainer.appendChild(badge);
  });
  
  // Load saved customer info
  loadCustomerInfo();
}

/**
 * Load saved customer information
 */
function loadCustomerInfo() {
  if (customerInfo) {
    const form = qs('#checkoutForm');
    form.name.value = customerInfo.name || '';
    form.phone.value = customerInfo.phone || '';
    form.email.value = customerInfo.email || '';
    form.address.value = customerInfo.address || '';
    form.paymethod.value = customerInfo.paymethod || '';
    form.deliveryTime.value = customerInfo.deliveryTime || 'ASAP';
    form.saveInfo.checked = true;
  }
}

/**
 * Save customer information
 */
function saveCustomerInfo(formData) {
  customerInfo = {
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    address: formData.address,
    paymethod: formData.paymethod,
    deliveryTime: formData.deliveryTime
  };
  
  localStorage.setItem('SKY_CUSTOMER_INFO', JSON.stringify(customerInfo));
}

function openCheckout() {
  if (cart.length === 0) {
    showToast('warning', 'Empty cart', 'Your cart is empty. Add some items first.');
    return;
  }
  
  renderCheckoutSummary();
  showModal('#modal');
}

async function submitOrder(e) {
  e.preventDefault();
  const form = e.target;
  const formData = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    address: form.address.value.trim(),
    paymethod: form.paymethod.value,
    deliveryTime: form.deliveryTime.value
  };

  if (!formData.name || !formData.phone || !formData.address || !formData.paymethod) {
    showToast('error', 'Missing information', 'Please fill in all required fields (*).');
    return;
  }
  
  // Validate phone number
  const phoneRegex = /^01\d{9}$/;
  if (!phoneRegex.test(formData.phone)) {
    showToast('error', 'Invalid phone', 'Please enter a valid phone number (01XXXXXXXXX).');
    return;
  }
  
  // Validate email if provided
  if (formData.email && !formData.email.includes('@')) {
    showToast('error', 'Invalid email', 'Please enter a valid email address.');
    return;
  }

  // Save customer info if requested
  if (form.saveInfo.checked) {
    saveCustomerInfo(formData);
  }

  const orderItems = cart.map(c => {
    const p = getProduct(c.id);
    return { id: p.id, name: p.name, qty: c.qty, price: p.price, subtotal: p.price * c.qty };
  });

  const orderData = {
    customer: formData,
    items: orderItems,
    subtotal: calculateSubtotal(),
    discount: discountAmount,
    coupon: activeCoupon,
    total: calculateSubtotal() - discountAmount
  };

  try {
    // Send order to backend
    const response = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    const orderId = response.data.orderId;

    // Also save to localStorage as backup
    const order = {
      id: orderId,
      date: new Date().toLocaleString(),
      items: orderItems,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      coupon: orderData.coupon,
      total: orderData.total,
      customer: formData
    };

    const archive = JSON.parse(localStorage.getItem('SKY_ORDERS') || '[]');
    archive.unshift(order);
    localStorage.setItem('SKY_ORDERS', JSON.stringify(archive));

    updateOrdersCount();
    clearCart();
    hideModal('#modal');
    form.reset();
    
    showToast('success', 'Order confirmed!', 
      `Your order ${orderId} has been placed successfully. Total: ${fmt(orderData.total)}`);
    
    // Reset customer info for next order
    customerInfo = null;
  } catch (error) {
    // Fallback to local storage only
    const order = {
      id: 'ORD-' + Date.now(),
      date: new Date().toLocaleString(),
      items: orderItems,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      coupon: orderData.coupon,
      total: orderData.total,
      customer: formData
    };

    const archive = JSON.parse(localStorage.getItem('SKY_ORDERS') || '[]');
    archive.unshift(order);
    localStorage.setItem('SKY_ORDERS', JSON.stringify(archive));

    updateOrdersCount();
    clearCart();
    hideModal('#modal');
    form.reset();
    
    showToast('success', 'Order confirmed!', 
      `Your order ${order.id} has been placed successfully. Total: ${fmt(order.total)}`);
    
    customerInfo = null;
  }
}

// Store all orders for searching
let allOrders = [];

async function openArchive() {
  const container = qs('#archiveList');
  const resultsSection = qs('#ordersResults');
  
  // Reset search fields
  qs('#searchName').value = '';
  qs('#searchPhone').value = '';
  qs('#searchEmail').value = '';
  
  // Hide results initially
  resultsSection.style.display = 'none';
  container.innerHTML = '';
  
  showModal('#archiveModal');

  try {
    // Try to load from backend
    allOrders = await loadOrders();
  } catch (error) {
    // Fallback to localStorage
    allOrders = JSON.parse(localStorage.getItem('SKY_ORDERS') || '[]');
  }
}

function searchOrders() {
  const name = qs('#searchName').value.trim().toLowerCase();
  const phone = qs('#searchPhone').value.trim();
  const email = qs('#searchEmail').value.trim().toLowerCase();
  
  if (!name && !phone && !email) {
    showToast('warning', 'Enter search criteria', 'Please enter your name, phone, or email to find your orders');
    return;
  }
  
  // Filter orders based on search criteria
  const filteredOrders = allOrders.filter(order => {
    const customer = order.customer;
    let match = false;
    
    if (name && customer.name && customer.name.toLowerCase().includes(name)) {
      match = true;
    }
    if (phone && customer.phone && customer.phone.includes(phone)) {
      match = true;
    }
    if (email && customer.email && customer.email.toLowerCase().includes(email)) {
      match = true;
    }
    
    return match;
  });
  
  // Show results section
  qs('#ordersResults').style.display = 'block';
  
  if (filteredOrders.length === 0) {
    showToast('info', 'No orders found', 'No orders match your search criteria');
    qs('#archiveList').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No orders found</p>
        <p class="text-light">Try different search criteria</p>
      </div>
    `;
  } else {
    showToast('success', 'Orders found', `Found ${filteredOrders.length} order(s)`);
    renderOrdersList(filteredOrders);
  }
}

function showAllOrdersList() {
  qs('#ordersResults').style.display = 'block';
  renderOrdersList(allOrders);
}

function renderOrdersList(orders) {
  const container = qs('#archiveList');
  container.innerHTML = '';

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No previous orders yet</p>
      </div>
    `;
    return;
  }

  orders.forEach(ord => {
    const div = document.createElement('div');
    div.className = 'order-item';
    
    let itemsHtml = '';
    ord.items.forEach(i => {
      itemsHtml += `<div>${i.name} x ${i.qty} — ${fmt(i.subtotal)}</div>`;
    });
    
    const statusBadge = ord.status ? `<span class="status-badge status-${ord.status}">${ord.status}</span>` : '<span class="status-badge status-pending">pending</span>';
    
    const deliveryTimeText = ord.customer.deliveryTime === 'ASAP' ? 'As soon as possible' : 
          ord.customer.deliveryTime === '30min' ? 'In 30 minutes' :
          ord.customer.deliveryTime === '1hour' ? 'In 1 hour' : 'In 2 hours';
    
    div.innerHTML = `
      <div class="order-header">
        <div class="order-id">${ord.id} ${statusBadge}</div>
        <div class="order-date">${ord.date}</div>
      </div>
      <div class="order-items">
        ${itemsHtml}
      </div>
      ${ord.discount > 0 ? 
        `<div class="order-discount" style="color: var(--success); margin: 5px 0;">
          Discount: -${fmt(ord.discount)} ${ord.coupon ? `(${ord.coupon})` : ''}
        </div>` : ''}
      <div class="order-total">Total: ${fmt(ord.total)}</div>
      <div class="order-customer-info">
        <div><i class="fas fa-user"></i> ${ord.customer.name}</div>
        <div><i class="fas fa-phone"></i> ${ord.customer.phone}</div>
        ${ord.customer.email ? `<div><i class="fas fa-envelope"></i> ${ord.customer.email}</div>` : ''}
        <div><i class="fas fa-map-marker-alt"></i> ${ord.customer.address}</div>
        <div><i class="fas fa-credit-card"></i> ${ord.customer.paymethod}</div>
        <div><i class="fas fa-clock"></i> ${deliveryTimeText}</div>
      </div>
    `;
    container.appendChild(div);
  });
}

async function updateOrdersCount() {
  try {
    const orders = await loadOrders();
    qs('#ordersCount').innerHTML = `<i class="fas fa-history"></i> Previous Orders: ${orders.length}`;
  } catch (error) {
    const archive = JSON.parse(localStorage.getItem('SKY_ORDERS') || '[]');
    qs('#ordersCount').innerHTML = `<i class="fas fa-history"></i> Previous Orders: ${archive.length}`;
  }
}

function showModal(sel) {
  const m = qs(sel);
  m.classList.add('show');
}

function hideModal(sel) {
  const m = qs(sel);
  m.classList.remove('show');
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  // Load wishlist from localStorage
  const savedWishlist = localStorage.getItem('SKY_WISHLIST');
  if (savedWishlist) {
    wishlist = JSON.parse(savedWishlist);
  }
  
  // Load customer info from localStorage
  const savedCustomerInfo = localStorage.getItem('SKY_CUSTOMER_INFO');
  if (savedCustomerInfo) {
    customerInfo = JSON.parse(savedCustomerInfo);
  }
  
  // Load data from backend
  await Promise.all([
    loadProducts(),
    loadCoupons()
  ]);
  
  // Initial render
  renderCart();
  updateOrdersCount();
  updateWishlistCount();
  
  // Search
  qs('#search').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderProducts();
  });
  
  // Cart actions
  qs('#clearCart').addEventListener('click', clearCart);
  qs('#checkoutBtn').addEventListener('click', openCheckout);
  
  // Coupon (main page)
  qs('#applyCoupon').addEventListener('click', applyCoupon);
  qs('#couponInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCoupon();
    }
  });
  qs('#removeDiscount').addEventListener('click', removeCoupon);
  
  // Checkout modal
  qs('#closeModal').addEventListener('click', () => hideModal('#modal'));
  qs('#closeModalBtn').addEventListener('click', () => hideModal('#modal'));
  qs('#checkoutForm').addEventListener('submit', submitOrder);
  
  // Checkout coupon
  qs('#applyCheckoutCoupon').addEventListener('click', applyCheckoutCoupon);
  qs('#checkoutCouponInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCheckoutCoupon();
    }
  });
  
  // Product detail modal
  qs('#closeProductDetail').addEventListener('click', () => hideModal('#productDetailModal'));
  qs('#addFromDetail').addEventListener('click', addFromDetail);
  qs('#toggleWishlist').addEventListener('click', () => {
    if (selectedProduct) {
      toggleWishlist(selectedProduct.id);
    }
  });
  
  // Wishlist
  qs('#wishlistBtn').addEventListener('click', openWishlistModal);
  qs('#closeWishlist').addEventListener('click', () => hideModal('#wishlistModal'));
  
  // Archive
  qs('#viewOrders').addEventListener('click', openArchive);
  qs('#closeArchive').addEventListener('click', () => hideModal('#archiveModal'));
  qs('#searchOrdersBtn').addEventListener('click', searchOrders);
  qs('#showAllOrders').addEventListener('click', showAllOrdersList);
  
  // Search on Enter key
  ['#searchName', '#searchPhone', '#searchEmail'].forEach(sel => {
    qs(sel).addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchOrders();
      }
    });
  });
  
  // Show welcome message
  setTimeout(() => {
    showToast('info', 'Welcome to Sky Restaurant!', 'Use coupon WELCOME10 for 10% off your first order');
  }, 1000);
});
