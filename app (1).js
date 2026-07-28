'use strict';

/* ==========================================================
   GAME HUB MINI APP
   Version: 1.0
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
// (loading/error text, or previously rendered cards), never the
// original static markup structure of the container itself.
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

// Injects the minimal styling the toast system needs at runtime, since
// style.css is not to be modified. Runs once.
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

// Shows a short-lived toast message. `type` is informational only
// (e.g. "success", "error") and can be used later for styling variants.
function showToast(message, type = "success") {
    const container = ensureToastContainer();

    const toast = document.createElement("div");
    toast.className = "app-toast";
    toast.dataset.toastType = type;
    toast.textContent = message;

    container.appendChild(toast);

    // Force reflow so the transition to the visible state animates.
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

// Persists state.cart to localStorage. Failures (e.g. storage disabled
// or quota exceeded) are logged but never break the cart in memory.
function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } catch (error) {
        console.error("Savatni saqlashda xatolik:", error);
    }
}

// Restores state.cart from localStorage. Called once at startup.
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

// Adds a product to the cart. If the product is already in the cart,
// its quantity is increased instead of creating a duplicate entry.
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
            image_url: product.image_url,
            product_type: product.product_type,
            game: product.game || {},
            quantity: 1,
        });
    }

    saveCartToStorage();
    showToast(`"${product.name || "Mahsulot"}" savatga qo'shildi`, "success");
}

// Removes a product from the cart entirely, regardless of quantity.
function removeFromCart(productId) {
    const existingIndex = findCartItemIndex(productId);
    if (existingIndex === -1) return;

    const [removed] = state.cart.splice(existingIndex, 1);

    saveCartToStorage();
    showToast(`"${(removed && removed.name) || "Mahsulot"}" savatdan olib tashlandi`, "info");
}

// Increases or decreases a cart item's quantity by `delta`. If the
// resulting quantity drops to 0 or below, the item is removed.
function updateCartQuantity(productId, delta) {
    const existingIndex = findCartItemIndex(productId);
    if (existingIndex === -1) return;

    state.cart[existingIndex].quantity += delta;

    if (state.cart[existingIndex].quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCartToStorage();
}

// Empties the cart completely.
function clearCart() {
    state.cart = [];
    saveCartToStorage();
    showToast("Savat tozalandi", "info");
}

// Returns the total cost of everything currently in the cart.
function calculateCartTotal() {
    return state.cart.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
    }, 0);
}

/* ===========================
   API CALLS
=========================== */

async function fetchGames() {
    const response = await fetch(`${API_BASE}/games`);
    if (!response.ok) {
        throw new Error(`GET /games failed with status ${response.status}`);
    }
    return response.json();
}

async function fetchProducts() {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) {
        throw new Error(`GET /products failed with status ${response.status}`);
    }
    return response.json();
}

// Ensures GET /products is requested at most once. Concurrent callers
// (e.g. loadFeaturedProducts + loadShopProducts at init) share the same
// in-flight request; later callers (e.g. selectGame) reuse state.products
// without hitting the network again.
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

    // Remove chips generated by a previous render, keep the static "all" chip.
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

// Attaches { game: { ...title } } to each product using the already
// loaded games list, since GET /products returns a flat game_id only.
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
   GAME SELECTION (Home + Shop filter)
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

        page.hidden = page.dataset.page !== pageName;

    });

    navButtons.forEach(button => {

        button.classList.toggle(
            "bottom-nav__item--active",
            button.dataset.nav === pageName
        );

    });

    state.currentPage = pageName;
}

/* ===========================
   EVENTS
=========================== */

function registerEvents() {

    navButtons.forEach(button => {

        button.addEventListener("click", () => {

            openPage(button.dataset.nav);

        });

    });

}

/* ===========================
   INIT
=========================== */

async function init() {

    loadCartFromStorage();

    registerEvents();

    openPage("home");

    try {
        await loadGames();
        await Promise.all([loadFeaturedProducts(), loadShopProducts()]);
    } catch (error) {
        console.error("Boshlang'ich ma'lumotlarni yuklashda xatolik:", error);
    }

    console.log("GAME HUB V1 STARTED");

}

document.addEventListener("DOMContentLoaded", init);