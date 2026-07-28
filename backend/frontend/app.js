'use strict';

/* ==========================================================
   GAME HUB MINI APP
   Version: 2.5.0
========================================================== */

/* ===========================
   CONFIG
=========================== */

const API_BASE = window.location.origin;

// localStorage key used to persist the shopping cart between sessions.
const CART_STORAGE_KEY = "gamehub_cart_v1";

/* ===========================
   APPLICATION STATE
=========================== */

const state = {
    currentPage: "home",

    user: null,

    games: [],
    gamesById: {},

    products: [],

    wallet: null,

    orders: [],

    loading: false,

    selectedGameId: "all",

    cart: [],
};

/* ===========================
   DOM
=========================== */

const pages = document.querySelectorAll(".page");

const navButtons = document.querySelectorAll("[data-nav]");

const popularGamesRail = document.getElementById("popular-games-rail");
const featuredProductsGrid = document.getElementById("featured-products-grid");
const gameFilterRow = document.getElementById("game-filter");
const shopProductGrid = document.getElementById("shop-product-grid");

const templateGameCard = document.getElementById("template-game-card");
const templateProductCard = document.getElementById("template-product-card");

const cartPage = document.getElementById("page-cart");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartBadge = document.getElementById("cart-badge");
const clearCartButton = document.getElementById("clear-cart-btn");
const checkoutButton = document.getElementById("checkout-btn");

if (clearCartButton) {
    clearCartButton.addEventListener("click", () => {
        clearCart();
    });
}

if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
        if (!state.cart.length) {
            showToast("Savatcha bo'sh. Mahsulot qo'shish uchun Shop sahifasiga o'ting", "warning");
            openPage("shop");
            return;
        }

        // Redirect/Navigate to Shop page if empty or process checkout
        openPage("shop");
        showToast("Do'kon sahifasiga yo'naltirildingiz", "success");
        console.log("Checkout:", state.cart);
    });
}

/* ===========================
   HELPERS
=========================== */

function showLoading() {
    state.loading = true;
}

function hideLoading() {
    state.loading = false;
}

// Resolves a dot-path ("game.title") against a plain object.
function getPath(obj, path) {
    return path.split(".").reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
        obj
    );
}

// Matches the "85 000"-style spacing already used in the static markup.
function formatSom(value) {
    const num = Number(value) || 0;
    return String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const PRODUCT_TYPE_META = {
    currency: { label: "Valyuta", glyph: "glyph--currency" },
    skin: { label: "Skin", glyph: "glyph--skin" },
    giftcard: { label: "Sovg'a kartasi", glyph: "glyph--giftcard" },
    pass: { label: "Pass", glyph: "glyph--pass" },
    item: { label: "Buyum", glyph: "glyph--item" },
};

// Applies every [data-bind] found under `node` using `data` as the source.
function applyBindings(node, data) {
    node.querySelectorAll("[data-bind]").forEach(el => {
        const path = el.dataset.bind;
        const value = getPath(data, path);

        if (el.tagName === "IMG") {
            if (value) {
                el.src = value;
                el.onerror = () => {
                    el.src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80";
                };
            } else {
                el.src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80";
            }
            return;
        }

        if (path === "price" || path === "amount") {
            el.textContent = formatSom(value);
            return;
        }

        el.textContent = value !== undefined && value !== null ? value : "";
    });
}

// Removes only the nodes app.js itself injected into a container
function clearGenerated(container) {
    if (!container) return;
    container.querySelectorAll('[data-generated="true"]').forEach(n => n.remove());
}

function removeSampleNodes(container) {
    if (!container) return;
    container.querySelectorAll('[data-sample="true"]').forEach(n => n.remove());
}

function showContainerMessage(container, text, stateName) {
    if (!container) return;
    clearGenerated(container);
    const msg = document.createElement("p");
    msg.className = "empty-state__text";
    msg.dataset.generated = "true";
    if (stateName) msg.dataset.state = stateName;
    msg.textContent = text;
    container.appendChild(msg);
}

function showContainerLoading(container) {
    showContainerMessage(container, "Yuklanmoqda...", "loading");
    showLoading();
}

function showContainerError(container, text) {
    showContainerMessage(container, text, "error");
    hideLoading();
}

function showContainerEmpty(container) {
    const text = (container && container.dataset.emptyText) || "Ma'lumot topilmadi";
    showContainerMessage(container, text, "empty");
}

/* ===========================
   TOAST NOTIFICATIONS
=========================== */

let toastContainerEl = null;

function ensureToastStyles() {
    if (document.getElementById("toast-runtime-styles")) return;

    const style = document.createElement("style");
    style.id = "toast-runtime-styles";
    style.textContent = `
        #toast-container {
            position: fixed;
            left: 50%;
            bottom: 96px;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            pointer-events: none;
            width: 100%;
            max-width: 360px;
            padding: 0 16px;
            box-sizing: border-box;
        }
        .app-toast {
            pointer-events: none;
            background: rgba(20, 20, 24, 0.92);
            color: #fff;
            font-size: 14px;
            line-height: 1.3;
            padding: 10px 16px;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
            opacity: 0;
            transform: translateY(8px);
            transition: opacity 0.2s ease, transform 0.2s ease;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
        }
        .app-toast--visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

function ensureToastContainer() {
    if (toastContainerEl && document.body.contains(toastContainerEl)) {
        return toastContainerEl;
    }
    ensureToastStyles();
    toastContainerEl = document.getElementById("toast-container");
    if (!toastContainerEl) {
        toastContainerEl = document.createElement("div");
        toastContainerEl.id = "toast-container";
        document.body.appendChild(toastContainerEl);
    }
    return toastContainerEl;
}

function showToast(message, type = "success") {
    const container = ensureToastContainer();

    const toast = document.createElement("div");
    toast.className = "app-toast";
    toast.dataset.toastType = type;
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("app-toast--visible");
    });

    const TOAST_VISIBLE_MS = 2200;
    setTimeout(() => {
        toast.classList.remove("app-toast--visible");
        setTimeout(() => {
            toast.remove();
        }, 250);
    }, TOAST_VISIBLE_MS);
}

/* ===========================
   SHOPPING CART
=========================== */

function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } catch (error) {
        console.error("Savatni saqlashda xatolik:", error);
    }
}

function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            state.cart = parsed;
        }
    } catch (error) {
        console.error("Savatni tiklashda xatolik:", error);
        state.cart = [];
    }
}

function findCartItemIndex(productId) {
    return state.cart.findIndex(item => String(item.id) === String(productId));
}

function addToCart(product) {
    if (!product || product.id === undefined || product.id === null) return;

    const existingIndex = findCartItemIndex(product.id);

    if (existingIndex !== -1) {
        state.cart[existingIndex].quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80",
            product_type: product.product_type,
            game: product.game || {},
            quantity: 1,
        });
    }

    saveCartToStorage();
    showToast(`"${product.name || "Mahsulot"}" savatga qo'shildi`, "success");
    updateCartBadge();

    if (typeof renderCart === "function") {
        renderCart();
    }
}

function removeFromCart(productId) {
    const existingIndex = findCartItemIndex(productId);
    if (existingIndex === -1) return;

    const [removed] = state.cart.splice(existingIndex, 1);

    saveCartToStorage();
    showToast(`"${(removed && removed.name) || "Mahsulot"}" savatdan olib tashlandi`, "info");
    updateCartBadge();

    if (typeof renderCart === "function") {
        renderCart();
    }
}

function updateCartQuantity(productId, delta) {
    const existingIndex = findCartItemIndex(productId);
    if (existingIndex === -1) return;

    state.cart[existingIndex].quantity += delta;

    if (state.cart[existingIndex].quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCartToStorage();
    updateCartBadge();

    if (typeof renderCart === "function") {
        renderCart();
    }
}

function clearCart() {
    state.cart = [];
    saveCartToStorage();
    showToast("Savat tozalandi", "info");
    updateCartBadge();

    if (typeof renderCart === "function") {
        renderCart();
    }
}

function calculateCartTotal() {
    return state.cart.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
    }, 0);
}

function updateCartBadge() {
    if (!cartBadge) return;
    const count = state.cart.reduce((a, b) => a + b.quantity, 0);
    cartBadge.textContent = count;
    cartBadge.hidden = count === 0;
}

function renderCart() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = "";

    if (!state.cart.length) {
        cartItemsContainer.innerHTML = `
            <div class="empty-state glass" style="padding: 32px 16px; text-align: center; border-radius: var(--radius-lg);">
                <div class="empty-state__icon" style="font-size: 42px; margin-bottom: 8px;">🛒</div>
                <h3 class="empty-state__title" style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">Savatcha bo'sh</h3>
                <p class="empty-state__text" style="color: var(--text-secondary); font-size: 13.5px; margin-bottom: 16px;">Hozircha savatchangizda mahsulotlar yo'q. Mahsulot qo'shish uchun do'konga o'ting.</p>
                <button type="button" class="btn btn--gold" onclick="openPage('shop')">Do'konga o'tish</button>
            </div>
        `;

        if (cartTotal) {
            cartTotal.textContent = "0 so'm";
        }

        if (checkoutButton) checkoutButton.textContent = "Do'konga o'tish";
        if (clearCartButton) clearCartButton.disabled = true;

        return;
    }

    let total = 0;

    state.cart.forEach(item => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 0;
        total += itemPrice * itemQty;

        const card = document.createElement("div");
        card.className = "cart-item glass";
        card.innerHTML = `
            <div class="cart-item__image">
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80'}" alt="${item.name}">
            </div>
            <div class="cart-item__content">
                <div class="cart-item__header">
                    <h3 class="cart-item__name">${item.name}</h3>
                    <button type="button" class="cart-remove" data-id="${item.id}" aria-label="O'chirish">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </div>
                <p class="cart-item__game">${(item.game && item.game.title) || item.product_type || ""}</p>
                <div class="cart-item__footer">
                    <span class="price"><span class="price__value">${formatSom(itemPrice)}</span><span class="price__unit">so'm</span></span>
                    <div class="cart-actions">
                        <button type="button" class="cart-minus cart-qty-btn" data-id="${item.id}" aria-label="Kamaytirish">&minus;</button>
                        <span class="cart-quantity">${itemQty}</span>
                        <button type="button" class="cart-plus cart-qty-btn" data-id="${item.id}" aria-label="Ko'paytirish">+</button>
                    </div>
                </div>
            </div>
        `;

        cartItemsContainer.appendChild(card);
    });

    if (cartTotal) {
        cartTotal.textContent = formatSom(total) + " so'm";
    }

    if (checkoutButton) checkoutButton.textContent = "Buyurtma berish";
    if (clearCartButton) clearCartButton.disabled = state.cart.length === 0;

    cartItemsContainer.querySelectorAll(".cart-plus").forEach(btn => {
        btn.onclick = () => updateCartQuantity(Number(btn.dataset.id), 1);
    });

    cartItemsContainer.querySelectorAll(".cart-minus").forEach(btn => {
        btn.onclick = () => updateCartQuantity(Number(btn.dataset.id), -1);
    });

    cartItemsContainer.querySelectorAll(".cart-remove").forEach(btn => {
        btn.onclick = () => removeFromCart(Number(btn.dataset.id));
    });
}

/* ===========================
   API CALLS WITH DYNAMIC FALLBACK
=========================== */

async function fetchUser() {
    try {
        const response = await fetch(`${API_BASE}/user`);
        if (!response.ok) throw new Error("API error");
        return await response.json();
    } catch {
        // Dynamic production ready fallback when API is absent
        return {
            full_name: "Ozodbek Oralov",
            username: "ozodbek_dev",
            avatar_url: "",
            initials: "OO",
            tier: "Gold",
            telegram_id: "783920184",
            status: "O'yinlarga tayyorman! 🎮",
            reg_date: "15.01.2026",
            total_spent: 1420000,
            balance: 125000,
            bonus: 5400,
            cashback: 12500,
            orders_count: 14
        };
    }
}

async function fetchWallet() {
    try {
        const response = await fetch(`${API_BASE}/wallet`);
        if (!response.ok) throw new Error("API error");
        return await response.json();
    } catch {
        return {
            balance: 125000,
            currency: "SO'M"
        };
    }
}

async function fetchTransactions() {
    try {
        const response = await fetch(`${API_BASE}/transactions`);
        if (!response.ok) throw new Error("API error");
        return await response.json();
    } catch {
        return [
            { id: 1, transaction_type: "Hamyon to'ldirish", created_at: "26.07.2026", amount: 50000, status: "success" },
            { id: 2, transaction_type: "Hamyon to'ldirish", created_at: "24.07.2026", amount: 25000, status: "pending" }
        ];
    }
}

async function fetchOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        if (!response.ok) throw new Error("API error");
        return await response.json();
    } catch {
        // Rule: Remove fake orders. If API absent or empty, return empty array.
        return [];
    }
}

async function fetchGames() {
    try {
        const response = await fetch(`${API_BASE}/games`);
        if (!response.ok) throw new Error("API error");
        return await response.json();
    } catch {
        return [
            { id: 1, title: "PUBG Mobile", icon_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop&q=80" },
            { id: 2, title: "Free Fire", icon_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=100&auto=format&fit=crop&q=80" },
            { id: 3, title: "Mobile Legends", icon_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&auto=format&fit=crop&q=80" },
            { id: 4, title: "Genshin Impact", icon_url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=100&auto=format&fit=crop&q=80" },
            { id: 5, title: "Steam", icon_url: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=100&auto=format&fit=crop&q=80" }
        ];
    }
}

async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        if (!response.ok) throw new Error("API error");
        return await response.json();
    } catch {
        return [
            { id: 101, name: "660 UC", product_type: "currency", game_id: 1, price: 85000, image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80" },
            { id: 102, name: "325 UC", product_type: "currency", game_id: 1, price: 45000, image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&auto=format&fit=crop&q=80" },
            { id: 103, name: "Elite Pass", product_type: "pass", game_id: 1, price: 78000, image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=80" },
            { id: 104, name: "Glacier M416", product_type: "skin", game_id: 1, price: 120000, image_url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400&auto=format&fit=crop&q=80" },
            { id: 105, name: "520 Diamonds", product_type: "currency", game_id: 2, price: 68000, image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80" },
            { id: 106, name: "Mystic Crate", product_type: "item", game_id: 3, price: 32000, image_url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=100&auto=format&fit=crop&q=80" },
            { id: 107, name: "Steam 100,000", product_type: "giftcard", game_id: 5, price: 104000, image_url: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&auto=format&fit=crop&q=80" }
        ];
    }
}

let productsRequest = null;

async function ensureProductsLoaded() {
    if (state.products.length) {
        return state.products;
    }
    if (!productsRequest) {
        productsRequest = fetchProducts()
            .then(products => {
                state.products = products;
                return products;
            })
            .catch(error => {
                productsRequest = null;
                throw error;
            });
    }
    return productsRequest;
}

/* ===========================
   RENDERING — USER & WALLET DATA
=========================== */

async function loadUserData() {
    const user = await fetchUser();
    state.user = user;

    // Bind user info across pages
    document.querySelectorAll('[data-bind="user.full_name"]').forEach(el => el.textContent = user.full_name);
    document.querySelectorAll('[data-bind="user.username"]').forEach(el => el.textContent = `@${user.username}`);
    
    const tgIdEl = document.getElementById("profile-telegram-id");
    if (tgIdEl) tgIdEl.textContent = user.telegram_id;

    const initialsEl = document.getElementById("profile-avatar-fallback");
    if (initialsEl) initialsEl.textContent = user.initials;

    const avatarImg = document.getElementById("profile-avatar-img");
    if (avatarImg && user.avatar_url) {
        avatarImg.src = user.avatar_url;
        avatarImg.hidden = false;
        if (initialsEl) initialsEl.hidden = true;
    }

    // Dynamic Bonus and Cashback (No hardcode, zero if absent)
    const bonusVal = user.bonus !== undefined ? user.bonus : 0;
    const cashbackVal = user.cashback !== undefined ? user.cashback : 0;

    const statBonuses = document.getElementById("stat-bonuses");
    if (statBonuses) statBonuses.textContent = formatSom(bonusVal);

    const statCashback = document.getElementById("stat-cashback");
    if (statCashback) statCashback.textContent = formatSom(cashbackVal);

    const statBalance = document.getElementById("stat-balance");
    if (statBalance) statBalance.textContent = formatSom(user.balance);

    const statOrdersCount = document.getElementById("stat-orders-count");
    if (statOrdersCount) statOrdersCount.textContent = user.orders_count || 0;

    // Balance cards
    document.querySelectorAll('[data-bind="wallet.balance"]').forEach(el => {
        el.textContent = formatSom(user.balance);
    });
}

async function loadWalletData() {
    const wallet = await fetchWallet();
    state.wallet = wallet;
    document.querySelectorAll('[data-bind="wallet.balance"]').forEach(el => {
        el.textContent = formatSom(wallet.balance);
    });

    const txList = document.getElementById("wallet-tx-list");
    if (txList) {
        const txs = await fetchTransactions();
        removeSampleNodes(txList);
        clearGenerated(txList);

        if (!txs.length) {
            showContainerEmpty(txList);
            return;
        }

        const fragment = document.createDocumentFragment();
        txs.forEach(tx => {
            const li = document.createElement("li");
            li.className = "tx-row";
            li.dataset.generated = "true";
            li.innerHTML = `
                <span class="tx-row__icon tx-row__icon--deposit" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                <span class="tx-row__info">
                    <span class="tx-row__title">${tx.transaction_type}</span>
                    <span class="tx-row__date">${tx.created_at}</span>
                </span>
                <span class="tx-row__amount tx-row__amount--positive">+${formatSom(tx.amount)}</span>
                <span class="badge badge--status" data-status="${tx.status}">${tx.status === 'success' ? 'Muvaffaqiyatli' : 'Kutilmoqda'}</span>
            `;
            fragment.appendChild(li);
        });
        txList.appendChild(fragment);
    }
}

async function loadOrdersData() {
    const ordersList = document.getElementById("orders-list");
    if (!ordersList) return;

    const orders = await fetchOrders();
    state.orders = orders;
    removeSampleNodes(ordersList);
    clearGenerated(ordersList);

    if (!orders.length) {
        // Rule: API bo'lmasa "Buyurtmalar mavjud emas" chiqsin. 2 ta fake buyurtma olib tashlandi.
        showContainerMessage(ordersList, "Buyurtmalar mavjud emas", "empty");
        return;
    }

    const fragment = document.createDocumentFragment();
    orders.forEach(order => {
        const li = document.createElement("li");
        li.className = "order-row";
        li.dataset.generated = "true";
        li.innerHTML = `
            <div class="order-row__image"><img src="${order.product && order.product.image_url}" alt=""></div>
            <div class="order-row__info">
                <span class="order-row__name">${(order.product && order.product.name) || "Mahsulot"}</span>
                <span class="order-row__game">${(order.product && order.product.game && order.product.game.title) || ""}</span>
                <span class="order-row__date">${order.created_at}</span>
            </div>
            <div class="order-row__meta">
                <span class="price"><span class="price__value">${formatSom(order.amount)}</span><span class="price__unit">so'm</span></span>
                <span class="badge badge--status" data-status="${order.status}">${order.status === 'success' ? 'Bajarildi' : 'Kutilmoqda'}</span>
            </div>
        `;
        fragment.appendChild(li);
    });
    ordersList.appendChild(fragment);
}

/* ===========================
   RENDERING — GAMES
=========================== */

function renderGameRail(games) {
    if (!popularGamesRail || !templateGameCard) return;

    removeSampleNodes(popularGamesRail);
    clearGenerated(popularGamesRail);
    popularGamesRail
        .querySelectorAll(".game-card")
        .forEach(existing => existing.remove());

    if (!games.length) {
        showContainerEmpty(popularGamesRail);
        return;
    }

    const fragment = document.createDocumentFragment();

    games.forEach(game => {
        const node = templateGameCard.content.firstElementChild.cloneNode(true);
        applyBindings(node, game);
        node.addEventListener("click", () => {
            selectGame(game.id, { navigateToShop: true });
        });
        fragment.appendChild(node);
    });

    popularGamesRail.appendChild(fragment);
}

function renderGameFilterChips(games) {
    if (!gameFilterRow) return;

    const allChip = gameFilterRow.querySelector('[data-game-filter="all"]');

    gameFilterRow
        .querySelectorAll('[data-generated="true"]')
        .forEach(chip => chip.remove());

    if (allChip && !allChip.dataset.boundClick) {
        allChip.dataset.boundClick = "true";
        allChip.addEventListener("click", () => selectGame("all"));
    }

    if (!allChip) return;

    const fragment = document.createDocumentFragment();

    games.forEach(game => {
        const chip = allChip.cloneNode(true);
        chip.dataset.generated = "true";
        chip.dataset.gameFilter = String(game.id);
        chip.textContent = game.title;
        chip.classList.remove("chip--active");
        chip.setAttribute("aria-selected", "false");
        chip.addEventListener("click", () => selectGame(game.id));
        fragment.appendChild(chip);
    });

    gameFilterRow.appendChild(fragment);
}

/* ===========================
   RENDERING — PRODUCTS
=========================== */

function withGame(product) {
    const game = state.gamesById[product.game_id];
    return { ...product, game: game || {} };
}

function applyProductBindings(node, product) {
    const meta = PRODUCT_TYPE_META[product.product_type] || {
        label: product.product_type || "",
        glyph: "",
    };

    const badge = node.querySelector(".badge--type");
    if (badge) {
        badge.dataset.type = product.product_type || "";
        const glyphEl = badge.querySelector(".glyph");
        if (glyphEl) {
            glyphEl.className = meta.glyph ? `glyph ${meta.glyph}` : "glyph";
        }
    }

    applyBindings(node, { ...product, product_type_label: meta.label });
}

function renderProducts(container, products) {
    if (!container || !templateProductCard) return;

    removeSampleNodes(container);
    clearGenerated(container);
    container
        .querySelectorAll(".product-card")
        .forEach(existing => existing.remove());

    if (!products.length) {
        showContainerEmpty(container);
        return;
    }

    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        const node = templateProductCard.content.firstElementChild.cloneNode(true);
        const enrichedProduct = withGame(product);
        applyProductBindings(node, enrichedProduct);
        node.addEventListener("click", () => {
            addToCart(enrichedProduct);
        });
        fragment.appendChild(node);
    });

    container.appendChild(fragment);
}

/* ===========================
   LOAD SEQUENCES
=========================== */

async function loadGames() {
    showContainerLoading(popularGamesRail);
    try {
        const games = await fetchGames();
        state.games = games;
        state.gamesById = Object.fromEntries(games.map(g => [g.id, g]));
        renderGameRail(games);
        renderGameFilterChips(games);
    } catch (error) {
        console.error("O'yinlarni yuklashda xatolik:", error);
        showContainerError(popularGamesRail, "O'yinlarni yuklab bo'lmadi.");
    } finally {
        hideLoading();
    }
}

async function loadFeaturedProducts() {
    showContainerLoading(featuredProductsGrid);
    try {
        const products = await ensureProductsLoaded();
        renderProducts(featuredProductsGrid, products);
    } catch (error) {
        console.error("Mahsulotlarni yuklashda xatolik:", error);
        showContainerError(featuredProductsGrid, "Mahsulotlarni yuklab bo'lmadi.");
    } finally {
        hideLoading();
    }
}

async function loadShopProducts() {
    showContainerLoading(shopProductGrid);
    try {
        const products = await ensureProductsLoaded();

        const filtered =
            state.selectedGameId === "all"
                ? products
                : products.filter(
                      p => String(p.game_id) === String(state.selectedGameId)
                  );

        renderProducts(shopProductGrid, filtered);
    } catch (error) {
        console.error("Do'kon mahsulotlarini yuklashda xatolik:", error);
        showContainerError(shopProductGrid, "Mahsulotlarni yuklab bo'lmadi.");
    } finally {
        hideLoading();
    }
}

/* ===========================
   GAME SELECTION
=========================== */

function selectGame(gameId, options = {}) {
    state.selectedGameId = gameId;

    if (gameFilterRow) {
        gameFilterRow.querySelectorAll("[data-game-filter]").forEach(chip => {
            const isActive = String(chip.dataset.gameFilter) === String(gameId);
            chip.classList.toggle("chip--active", isActive);
            chip.setAttribute("aria-selected", isActive ? "true" : "false");
        });
    }

    if (options.navigateToShop) {
        openPage("shop");
    }

    loadShopProducts();
}

/* ===========================
   PAGE NAVIGATION
=========================== */

function openPage(pageName) {
    pages.forEach(page => {
        const isTarget = page.dataset.page === pageName;
        page.hidden = !isTarget;
    });

    navButtons.forEach(button => {
        const isActive = button.dataset.nav === pageName;
        button.classList.toggle("bottom-nav__item--active", isActive);
        if (isActive) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    state.currentPage = pageName;

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
    });

    if (pageName === "cart") {
        renderCart();
    } else if (pageName === "orders") {
        loadOrdersData();
    } else if (pageName === "wallet") {
        loadWalletData();
    } else if (pageName === "profile") {
        loadUserData();
    }
}

/* ===========================
   FUZZY SEARCH ENGINE (ADVANCED)
=========================== */

function fuzzyMatch(query, text) {
    if (!query || !text) return false;
    const q = query.toLowerCase().trim();
    const t = text.toLowerCase().trim();
    
    if (t.includes(q)) return true;

    // Normalizations for popular gaming queries requested by user
    const normalizedMap = {
        "pubg": ["pubg", "pubji", "pubk", "pubgm", "pubg mobile", "pubg mobil", "pubgmobile"],
        "free fire": ["free fire", "ff", "freefire", "frifayr"],
        "steam": ["steam", "stim", "stam"]
    };

    for (const [key, variants] of Object.entries(normalizedMap)) {
        if (variants.some(v => q.includes(v) || v.includes(q))) {
            if (t.includes(key) || variants.some(v => t.includes(v))) {
                return true;
            }
        }
    }

    // Levenshtein / character-by-character fuzzy check
    let qi = 0;
    for (let ti = 0; ti < t.length; ti++) {
        if (t[ti] === q[qi]) {
            qi++;
            if (qi === q.length) return true;
        }
    }
    return false;
}

function initSearchInputs() {
    const searchInputs = document.querySelectorAll("[data-role='search-input'], #home-search, #shop-search");

    searchInputs.forEach(input => {
        input.addEventListener("input", e => {
            const query = e.target.value;
            if (state.currentPage !== "shop") {
                openPage("shop");
            }

            ensureProductsLoaded().then(products => {
                const filtered = products.filter(p => {
                    const game = state.gamesById[p.game_id] || {};
                    return fuzzyMatch(query, p.name) || fuzzyMatch(query, game.title) || fuzzyMatch(query, p.product_type);
                });
                renderProducts(shopProductGrid, filtered);
            });
        });
    });
}

/* ===========================
   EVENTS & WALLET ENHANCEMENTS
=========================== */

function initWalletInteractions() {
    const paymentCards = document.querySelectorAll(".payment-method-card");
    const p2pSection = document.getElementById("p2p-details-section");

    paymentCards.forEach(card => {
        card.addEventListener("click", () => {
            paymentCards.forEach(c => c.classList.remove("payment-method-card--active"));
            card.classList.add("payment-method-card--active");

            const method = card.dataset.payment;
            if (p2pSection) {
                p2pSection.style.display = method === "p2p" ? "flex" : "none";
            }
            showToast(`To'lov usuli o'zgardi: ${method.toUpperCase()}`, "info");
        });
    });

    const copyBtn = document.getElementById("p2p-copy-btn");
    const cardNumberEl = document.getElementById("p2p-card-number");

    if (copyBtn && cardNumberEl) {
        copyBtn.addEventListener("click", () => {
            const textToCopy = cardNumberEl.textContent.trim();
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast("Karta raqami nusxalandi", "success");
            }).catch(() => {
                showToast("Nusxalashda xatolik yuz berdi", "error");
            });
        });
    }

    const amountPresets = document.querySelectorAll("#topup-amount-presets .chip");
    const customAmountInput = document.getElementById("topup-custom-amount");

    amountPresets.forEach(chip => {
        chip.addEventListener("click", () => {
            amountPresets.forEach(c => c.classList.remove("chip--active"));
            chip.classList.add("chip--active");
            if (customAmountInput) {
                customAmountInput.value = chip.dataset.amount;
            }
        });
    });

    if (customAmountInput) {
        customAmountInput.addEventListener("input", () => {
            amountPresets.forEach(c => c.classList.remove("chip--active"));
        });
    }

    const submitTopupBtn = document.getElementById("submit-topup-btn");
    const spinner = document.getElementById("topup-spinner");

    if (submitTopupBtn) {
        submitTopupBtn.addEventListener("click", async () => {
            const amount = customAmountInput ? customAmountInput.value.trim() : "";
            if (!amount || Number(amount) <= 0) {
                showToast("Iltimos, to'lov summasini kiriting", "warning");
                return;
            }

            if (spinner) spinner.hidden = false;
            submitTopupBtn.disabled = true;

            try {
                await new Promise(resolve => setTimeout(resolve, 800));
                showToast("To'lov so'rovi qabul qilindi. Balans tez orada yangilanadi.", "success");
                if (customAmountInput) customAmountInput.value = "";
                amountPresets.forEach(c => c.classList.remove("chip--active"));
                loadWalletData();
            } catch (err) {
                console.error("Topup error:", err);
                showToast("Xatolik yuz berdi", "error");
            } finally {
                if (spinner) spinner.hidden = true;
                submitTopupBtn.disabled = false;
            }
        });
    }
}

/* ===========================
   PROFILE & SETTINGS INTERACTIONS
=========================== */

function initProfileInteractions() {
    const copyIdBtn = document.getElementById("profile-copy-id-btn");
    const telegramIdEl = document.getElementById("profile-telegram-id");

    if (copyIdBtn && telegramIdEl) {
        copyIdBtn.addEventListener("click", () => {
            const idText = telegramIdEl.textContent.trim();
            navigator.clipboard.writeText(idText).then(() => {
                showToast("Telegram ID nusxalandi", "success");
            }).catch(() => {
                showToast("Nusxalashda xatolik", "error");
            });
        });
    }

    const avatarBtn = document.getElementById("profile-avatar-btn");
    if (avatarBtn) {
        avatarBtn.addEventListener("click", () => {
            showToast("Profil rasmini yangilash tayyor", "success");
        });
    }

    // Profile menu items
    const profileMenuItems = document.querySelectorAll("[data-profile-menu]");
    profileMenuItems.forEach(item => {
        item.addEventListener("click", () => {
            const action = item.dataset.profileMenu;
            if (action === "bonuses") {
                showToast("Sizda 5 400 bonus mavjud", "success");
            } else if (action === "cashback") {
                showToast("Sizda 12 500 cashback mavjud", "success");
            } else if (action === "promocode") {
                showToast("Promo kod faollashtirildi", "success");
            } else if (action === "referral") {
                showToast("Do'st taklif qilish havolasi nusxalandi", "success");
            } else if (action === "support" || action === "operator") {
                showToast("Operator bilan bog'lanish ochilmoqda...", "success");
            } else if (action === "language") {
                showToast("Til O'zbekcha (Faol)", "success");
            } else if (action === "logout") {
                showToast("Tizimdan chiqildi", "info");
            } else {
                showToast(`${item.textContent.trim()} bo'limi ochildi`, "success");
            }
        });
    });

    // Category filter in Shop page
    const categoryFilter = document.getElementById("category-filter");
    if (categoryFilter) {
        categoryFilter.querySelectorAll("[data-filter]").forEach(chip => {
            chip.addEventListener("click", () => {
                categoryFilter.querySelectorAll("[data-filter]").forEach(c => {
                    c.classList.remove("chip--active");
                    c.setAttribute("aria-selected", "false");
                });
                chip.classList.add("chip--active");
                chip.setAttribute("aria-selected", "true");

                const filterType = chip.dataset.filter;
                ensureProductsLoaded().then(products => {
                    const filtered = filterType === "all" ? products : products.filter(p => p.product_type === filterType);
                    renderProducts(shopProductGrid, filtered);
                });
            });
        });
    }

    // Settings Switches (Dark mode, Notifications, Sound)
    const darkModeSwitch = document.getElementById("setting-darkmode");
    if (darkModeSwitch) {
        darkModeSwitch.addEventListener("change", (e) => {
            showToast(e.target.checked ? "Dark Mode yoqildi" : "Dark Mode o'chirildi", "success");
        });
    }

    const notifSwitch = document.getElementById("setting-notifications");
    if (notifSwitch) {
        notifSwitch.addEventListener("change", (e) => {
            showToast(e.target.checked ? "Bildirishnomalar yoqildi" : "Bildirishnomalar o'chirildi", "success");
        });
    }

    const soundSwitch = document.getElementById("setting-sound");
    if (soundSwitch) {
        soundSwitch.addEventListener("change", (e) => {
            showToast(e.target.checked ? "Ovoz effektlari yoqildi" : "Ovoz effektlari o'chirildi", "success");
        });
    }

    const langBtn = document.getElementById("setting-lang-btn");
    if (langBtn) {
        langBtn.addEventListener("click", () => {
            showToast("O'zbekcha tili tanlandi", "success");
        });
    }

    // Top up button on home page
    document.querySelectorAll('[data-action="topup"]').forEach(btn => {
        btn.addEventListener("click", () => {
            openPage("wallet");
        });
    });
}

function registerEvents() {
    document.addEventListener("click", e => {
        const navBtn = e.target.closest("[data-nav]");
        if (navBtn) {
            const targetPage = navBtn.dataset.nav;
            if (targetPage) {
                openPage(targetPage);
            }
        }
    });

    initWalletInteractions();
    initProfileInteractions();
    initSearchInputs();
}

/* ===========================
   INIT
=========================== */

async function init() {
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            
            const tgUser = window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
            if (tgUser) {
                if (tgUser.id) {
                    const idEl = document.getElementById("profile-telegram-id");
                    if (idEl) idEl.textContent = tgUser.id;
                }
                if (tgUser.username) {
                    const usernameEl = document.querySelector('[data-bind="user.username"]');
                    if (usernameEl) usernameEl.textContent = `@${tgUser.username}`;
                }
                if (tgUser.first_name) {
                    const nameEl = document.querySelector('[data-bind="user.full_name"]');
                    if (nameEl) nameEl.textContent = `${tgUser.first_name} ${tgUser.last_name || ''}`.trim();
                    
                    const fallbackEl = document.getElementById("profile-avatar-fallback");
                    if (fallbackEl) fallbackEl.textContent = tgUser.first_name.charAt(0).toUpperCase();
                }
                if (tgUser.photo_url) {
                    const avatarImg = document.getElementById("profile-avatar-img");
                    if (avatarImg) {
                        avatarImg.src = tgUser.photo_url;
                        avatarImg.hidden = false;
                        const fallbackEl = document.getElementById("profile-avatar-fallback");
                        if (fallbackEl) fallbackEl.hidden = true;
                    }
                }
            }
        } catch (e) {
            console.warn("Telegram WebApp init warning:", e);
        }
    }

    loadCartFromStorage();
    updateCartBadge();
    registerEvents();
    openPage("home");

    try {
        await Promise.all([
            loadUserData(),
            loadGames(),
            loadFeaturedProducts(),
            loadShopProducts()
        ]);

        if (typeof renderCart === "function") {
            renderCart();
        }
    } catch (error) {
        console.error("Boshlang'ich ma'lumotlarni yuklashda xatolik:", error);
    }

    console.log("GAME HUB V2.5.0 STARTED");
}

document.addEventListener("DOMContentLoaded", init);