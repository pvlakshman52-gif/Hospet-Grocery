/* ==========================================================================
   HOSPETE FRESH - CLIENT JAVASCRIPT
   - AJAX Add to cart and quantity controls
   - Dynamic pack size switching on Product Details
   - Resilient fallback image handling (Zero broken images)
   - Real-time floating basket sync
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initImageFallbacks();
  initPackSizeSelector();
  initAjaxCart();
});

// Resilient fallback image handler (including South Indian Mixture Snacks)
function initImageFallbacks() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', function() {
      // If Mixture Snacks or other item fails, serve authentic SVG placeholder
      const alt = this.alt || 'Grocery item';
      this.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="260" height="260" rx="16" fill="%23ecfdf5" stroke="%23bbf7d0" stroke-width="2"/><text x="150" y="140" font-family="sans-serif" font-size="42" text-anchor="middle" fill="%2316a34a">🥗</text><text x="150" y="180" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="%23065f46">${encodeURIComponent(alt)}</text><text x="150" y="202" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2316a34a">Hospete Fresh Verified</text></svg>`;
      this.onerror = null;
    });
  });
}

// Dynamic pack-size selector on Product Details Page
function initPackSizeSelector() {
  const packCards = document.querySelectorAll('.pack-card');
  if (!packCards.length) return;

  const priceEl = document.getElementById('pdp-current-price');
  const mrpEl = document.getElementById('pdp-current-mrp');
  const saveEl = document.getElementById('pdp-current-save');
  const stockEl = document.getElementById('pdp-current-stock');
  const variantInput = document.getElementById('pdp-variant-id');
  const addBtn = document.getElementById('pdp-add-btn');

  packCards.forEach(card => {
    card.addEventListener('click', () => {
      packCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const variantId = card.dataset.variantId;
      const price = parseFloat(card.dataset.price);
      const mrp = parseFloat(card.dataset.mrp);
      const stock = parseInt(card.dataset.stock, 10);
      const packSize = card.dataset.packSize;

      if (variantInput) variantInput.value = variantId;
      if (priceEl) priceEl.textContent = `₹${price}`;
      if (mrpEl) mrpEl.textContent = `₹${mrp}`;

      const discountPct = Math.round(((mrp - price) / mrp) * 100);
      if (saveEl) {
        if (discountPct > 0) {
          saveEl.textContent = `${discountPct}% OFF`;
          saveEl.style.display = 'inline-block';
        } else {
          saveEl.style.display = 'none';
        }
      }

      if (stockEl) {
        if (stock <= 0) {
          stockEl.textContent = 'Out of Stock';
          stockEl.style.color = '#ef4444';
          if (addBtn) {
            addBtn.disabled = true;
            addBtn.textContent = 'Out of Stock';
          }
        } else if (stock < 10) {
          stockEl.textContent = `Only ${stock} left in stock!`;
          stockEl.style.color = '#d97706';
          if (addBtn) {
            addBtn.disabled = false;
            addBtn.innerHTML = 'Add to Cart';
          }
        } else {
          stockEl.textContent = 'In Stock (Freshly packed)';
          stockEl.style.color = '#16a34a';
          if (addBtn) {
            addBtn.disabled = false;
            addBtn.innerHTML = 'Add to Cart';
          }
        }
      }
    });
  });
}

// AJAX Add to cart & Stepper
function initAjaxCart() {
  document.querySelectorAll('form.ajax-add-cart').forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitBtn = form.querySelector('.btn-add');
      if (submitBtn && submitBtn.disabled) return;

      const formData = new FormData(form);
      try {
        const response = await fetch('/add-to-cart', {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          // Update basket indicator
          updateFloatingBasket(data.cart_count, data.cart_total);
          
          // Switch button to added feedback or stepper
          if (submitBtn) {
            const originalHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '✓ Added';
            submitBtn.style.backgroundColor = '#15803d';
            setTimeout(() => {
              submitBtn.innerHTML = originalHtml;
              submitBtn.style.backgroundColor = '';
            }, 1200);
          }
        }
      } catch (err) {
        console.error('Cart add error:', err);
        form.submit(); // fallback
      }
    });
  });
}

function updateFloatingBasket(count, total) {
  let basket = document.querySelector('.floating-basket-bar');
  if (count > 0) {
    if (!basket) {
      basket = document.createElement('a');
      basket.href = '/cart';
      basket.className = 'floating-basket-bar';
      basket.innerHTML = `
        <div class="floating-basket-info">
          <span class="basket-count-price"><span id="basket-items-count">${count}</span> items • ₹<span id="basket-total-amt">${total}</span></span>
          <span class="basket-savings-note">⚡ Free Delivery available</span>
        </div>
        <div class="basket-view-action">View Cart &rarr;</div>
      `;
      const appShell = document.querySelector('.mobile-app-shell');
      if (appShell) appShell.appendChild(basket);
    } else {
      const countEl = document.getElementById('basket-items-count');
      const totalEl = document.getElementById('basket-total-amt');
      if (countEl) countEl.textContent = count;
      if (totalEl) totalEl.textContent = total;
      basket.style.display = 'flex';
    }
  } else if (basket) {
    basket.style.display = 'none';
  }
}
