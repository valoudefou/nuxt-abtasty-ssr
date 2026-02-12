import { u as useRuntimeConfig } from '../nitro/nitro.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { f as fetchUpstreamJson, g as getSelectedVendor } from './vendors.mjs';

const products = [
  {
    id: 1,
    slug: "arctic-summit-parka",
    name: "Arctic Summit Parka",
    description: "Premium insulated parka with responsibly sourced down fill and water-resistant shell, perfect for urban adventures and alpine escapes.",
    price: 349,
    category: "Outerwear",
    image: "/images/arctic-summit-parka.svg",
    rating: 4.8,
    highlights: [
      "700-fill responsibly sourced down",
      "Recycled water-resistant outer shell",
      "Detachable faux-fur hood trim",
      "Interior media pocket with headphone routing"
    ],
    inStock: true,
    tag: "Bestseller",
    colors: ["Midnight Navy", "Glacier White", "Ember Red"],
    sizes: ["XS", "S", "M", "L", "XL"]
  },
  {
    id: 2,
    slug: "coastal-breeze-knit",
    name: "Coastal Breeze Knit",
    description: "Lightweight merino blend sweater that balances breathability with warmth for an effortless, everyday layer.",
    price: 129,
    category: "Knitwear",
    image: "/images/coastal-breeze-knit.svg",
    rating: 4.6,
    highlights: [
      "Sustainable merino wool blend",
      "Machine washable and pill-resistant",
      "Tailored yet relaxed silhouette",
      "Breathable open-stitch pattern"
    ],
    inStock: true,
    tag: "New",
    colors: ["Seafoam", "Sandstone", "Deep Charcoal"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"]
  },
  {
    id: 3,
    slug: "skyline-tech-trousers",
    name: "Skyline Tech Trousers",
    description: "Streamlined trousers with four-way stretch and water-repellent finish to keep you comfortable on commutes and long-haul journeys.",
    price: 159,
    category: "Bottoms",
    image: "/images/skyline-tech-trousers.svg",
    rating: 4.7,
    highlights: [
      "Four-way stretch technical fabric",
      "Moisture-wicking interior waistband",
      "Hidden zip pocket for essentials",
      "Wrinkle-resistant and travel-ready"
    ],
    inStock: false,
    tag: "Limited",
    colors: ["Carbon Black", "Storm Grey"],
    sizes: ["28", "30", "32", "34", "36"]
  },
  {
    id: 4,
    slug: "lumina-city-backpack",
    name: "Lumina City Backpack",
    description: "Versatile commuter backpack featuring padded laptop storage, quick-access pockets, and reflective accents for low-light commutes.",
    price: 189,
    category: "Accessories",
    image: "/images/lumina-city-backpack.svg",
    rating: 4.9,
    highlights: [
      "20L capacity with modular organization",
      "Water-resistant zippers and fabric",
      "Ventilated back panel with luggage pass-through",
      "USB passthrough for portable chargers"
    ],
    inStock: true,
    tag: "Editor\u2019s Pick",
    colors: ["Obsidian", "Mineral Blue"],
    sizes: ["One Size"]
  }
];

const DEFAULT_API_BASE = "https://api.live-server1.com";
const CACHE_TTL = 1e3 * 60 * 5;
const CACHE_VERSION = 1;
const CACHE_FILE = process.env.VERCEL ? path.resolve("/tmp", "products-cache.json") : path.resolve(process.cwd(), "data", "products-cache.json");
const REMOTE_FETCH_TIMEOUT_MS = 0;
const LOG_PREFIX = "[ProductsAPI]";
const REMOTE_BACKOFF_MS = 0;
const PAGE_SIZE = 100;
const PAGE_RETRY_COUNT = 2;
const PAGE_RETRY_DELAY_MS = 300;
const PRELOAD_MAX_PAGES_PROD = 2;
let cachedProducts = null;
let lastFetch = 0;
let cachedVersion = 0;
let remoteBackoffUntil = 0;
const PLACEHOLDER_IMAGE = "https://assets-manager.abtasty.com/placeholder.png";
const normalizeTag = (value) => {
  var _a, _b, _c;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = normalizeTag(entry);
      if (candidate) return candidate;
    }
    return null;
  }
  if (value && typeof value === "object") {
    const record = value;
    return (_c = (_b = (_a = normalizeTag(record.label)) != null ? _a : normalizeTag(record.name)) != null ? _b : normalizeTag(record.value)) != null ? _c : null;
  }
  return null;
};
const resolveRemoteTag = (raw) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
  const record = raw;
  const nested = record.raw && typeof record.raw === "object" ? record.raw : null;
  return (_x = (_w = (_v = (_u = (_t = (_s = (_r = (_q = (_p = (_o = (_n = (_m = (_l = (_k = (_j = (_i = (_h = (_g = (_f = (_e = (_d = (_c = (_b = (_a = normalizeTag(raw.tag)) != null ? _a : normalizeTag(raw.tags)) != null ? _b : normalizeTag(nested == null ? void 0 : nested.tag)) != null ? _c : normalizeTag(nested == null ? void 0 : nested.tags)) != null ? _d : normalizeTag(record.badge)) != null ? _e : normalizeTag(record.productTag)) != null ? _f : normalizeTag(record.madeIn)) != null ? _g : normalizeTag(record.made_in)) != null ? _h : normalizeTag(record.made_in_country)) != null ? _i : normalizeTag(record.manufactured_in)) != null ? _j : normalizeTag(record.origin)) != null ? _k : normalizeTag(record.countryOfOrigin)) != null ? _l : normalizeTag(record.country_of_origin)) != null ? _m : normalizeTag(record.origin_country)) != null ? _n : normalizeTag(nested == null ? void 0 : nested.badge)) != null ? _o : normalizeTag(nested == null ? void 0 : nested.productTag)) != null ? _p : normalizeTag(nested == null ? void 0 : nested.madeIn)) != null ? _q : normalizeTag(nested == null ? void 0 : nested.made_in)) != null ? _r : normalizeTag(nested == null ? void 0 : nested.made_in_country)) != null ? _s : normalizeTag(nested == null ? void 0 : nested.manufactured_in)) != null ? _t : normalizeTag(nested == null ? void 0 : nested.origin)) != null ? _u : normalizeTag(nested == null ? void 0 : nested.countryOfOrigin)) != null ? _v : normalizeTag(nested == null ? void 0 : nested.country_of_origin)) != null ? _w : normalizeTag(nested == null ? void 0 : nested.origin_country)) != null ? _x : null;
};
const normalizeStringList = (value) => {
  if (value === null || value === void 0) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeStringList(entry));
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return [String(value)];
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const looksLikeJsonArray = trimmed.startsWith("[") && trimmed.endsWith("]");
    const looksLikeQuotedJson = trimmed.startsWith('"') && trimmed.endsWith('"');
    if (looksLikeJsonArray || looksLikeQuotedJson) {
      try {
        const parsed = JSON.parse(trimmed);
        const parsedList = normalizeStringList(parsed);
        if (parsedList.length) return parsedList;
      } catch {
      }
    }
    if (trimmed.includes(",")) {
      const split = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
      if (split.length > 1) return split;
    }
    return [trimmed];
  }
  return [];
};
const readCacheFile = async () => {
  try {
    const data = await readFile(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed || !Array.isArray(parsed.products) || parsed.products.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
const writeCacheFile = async (payload) => {
  if (payload.products.length === 0) {
    return;
  }
  try {
    await mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to write product cache file", error);
  }
};
const normalizeProductsResponse = (response) => {
  var _a, _b;
  return Array.isArray(response) ? response : (_b = (_a = response.data) != null ? _a : response.products) != null ? _b : [];
};
const getApiConfig = async (event) => {
  var _a, _b, _c, _d;
  const config = useRuntimeConfig();
  const baseRaw = ((_a = config.public) == null ? void 0 : _a.apiBase) || ((_b = config.public) == null ? void 0 : _b.productsApiBase) || DEFAULT_API_BASE;
  const base = baseRaw.replace(/\/+$/, "");
  const disableRemote = Boolean((_c = config.public) == null ? void 0 : _c.productsDisableRemote);
  const configuredVendorId = ((_d = config.public) == null ? void 0 : _d.productsVendorId) ? String(config.public.productsVendorId).trim() : "";
  const vendorId = event ? await getSelectedVendor(event) : configuredVendorId;
  return { base, disableRemote, vendorId };
};
const withTimeout = async (promise, timeoutMs) => {
  {
    return await promise;
  }
};
const getRetryAfterMs = (error) => {
  var _a, _b, _c;
  const headerValue = (_c = (_b = (_a = error == null ? void 0 : error.response) == null ? void 0 : _a.headers) == null ? void 0 : _b.get) == null ? void 0 : _c.call(_b, "retry-after");
  if (!headerValue) {
    return null;
  }
  const seconds = Number.parseInt(headerValue, 10);
  return Number.isFinite(seconds) ? seconds * 1e3 : null;
};
const parseNumber = (value) => {
  if (value === null || value === void 0) {
    return 0;
  }
  const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(numeric) ? Number(numeric) : 0;
};
const slugify = (value, fallback) => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : fallback;
};
const sanitizeCategory = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : void 0;
};
const sanitizeVendor = (value) => {
  if (value === null || value === void 0) {
    return void 0;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : void 0;
};
const buildImageUrl = (value) => {
  if (!value) {
    return PLACEHOLDER_IMAGE;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return PLACEHOLDER_IMAGE;
  }
  return trimmed;
};
const normalizeFallbackProduct = (product) => {
  var _a, _b;
  return {
    ...product,
    title: (_a = product.title) != null ? _a : product.name,
    thumbnail: (_b = product.thumbnail) != null ? _b : product.image
  };
};
const fallbackCatalog = products.map(normalizeFallbackProduct);
const normalizeRemoteProduct = (raw) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C;
  const rawRecord = raw.raw && typeof raw.raw === "object" ? raw.raw : null;
  const id = raw.id;
  const name = (_b = (_a = raw.name) != null ? _a : raw.title) != null ? _b : `Product ${String(id)}`;
  const pricePayload = raw.price;
  const priceAmount = pricePayload && typeof pricePayload === "object" ? parseNumber((_c = pricePayload.amount) != null ? _c : 0) : parseNumber(pricePayload != null ? pricePayload : raw.price_before_discount);
  const price = Math.max(priceAmount, 0);
  const priceCurrency = pricePayload && typeof pricePayload === "object" && typeof pricePayload.currency === "string" ? pricePayload.currency : void 0;
  const rating = raw.rating === null || raw.rating === void 0 ? null : Math.min(Math.max(parseNumber(raw.rating), 0), 5);
  const stock = Math.max(parseNumber(raw.stock), 0);
  const discountCandidate = (_f = (_e = (_d = raw.discountPercentage) != null ? _d : typeof (rawRecord == null ? void 0 : rawRecord.discountPercentage) === "string" || typeof (rawRecord == null ? void 0 : rawRecord.discountPercentage) === "number" ? rawRecord.discountPercentage : null) != null ? _e : typeof (rawRecord == null ? void 0 : rawRecord.discount_percentage) === "string" || typeof (rawRecord == null ? void 0 : rawRecord.discount_percentage) === "number" ? rawRecord.discount_percentage : null) != null ? _f : typeof (rawRecord == null ? void 0 : rawRecord.discountPercent) === "string" || typeof (rawRecord == null ? void 0 : rawRecord.discountPercent) === "number" ? rawRecord.discountPercent : null;
  const discount = parseNumber(discountCandidate != null ? discountCandidate : null);
  const priceBeforeDiscount = (_k = (_j = (_i = (_h = (_g = raw.price_before_discount) != null ? _g : raw.beforePrice) != null ? _h : typeof (rawRecord == null ? void 0 : rawRecord.price_before_discount) === "string" || typeof (rawRecord == null ? void 0 : rawRecord.price_before_discount) === "number" ? rawRecord.price_before_discount : null) != null ? _i : typeof (rawRecord == null ? void 0 : rawRecord.beforePrice) === "string" || typeof (rawRecord == null ? void 0 : rawRecord.beforePrice) === "number" ? rawRecord.beforePrice : null) != null ? _j : typeof (rawRecord == null ? void 0 : rawRecord.before_price) === "string" || typeof (rawRecord == null ? void 0 : rawRecord.before_price) === "number" ? rawRecord.before_price : null) != null ? _k : typeof (rawRecord == null ? void 0 : rawRecord.priceBeforeDiscount) === "string" || typeof (rawRecord == null ? void 0 : rawRecord.priceBeforeDiscount) === "number" ? rawRecord.priceBeforeDiscount : null;
  const availability = (_m = (_l = raw.availabilityStatus) == null ? void 0 : _l.trim()) != null ? _m : "";
  const status = (_o = (_n = raw.status) == null ? void 0 : _n.trim()) != null ? _o : "";
  const hasStockSignal = raw.stock !== null && raw.stock !== void 0;
  const hasAvailabilitySignal = availability.length > 0;
  const hasStatusSignal = status.length > 0;
  const inStock = hasAvailabilitySignal || hasStatusSignal || hasStockSignal ? availability.toLowerCase() === "in stock" || status.toLowerCase() === "active" || stock > 0 : true;
  const brandValue = sanitizeBrand((_p = raw.brandId) != null ? _p : raw.brand);
  const vendor = sanitizeVendor((_q = raw.vendorId) != null ? _q : raw.vendor);
  const sku = (_r = normalizeTag(raw.sku)) != null ? _r : normalizeTag(rawRecord == null ? void 0 : rawRecord.sku);
  const sizeCandidates = [
    normalizeStringList(raw.size),
    normalizeStringList(raw.sizes),
    normalizeStringList(rawRecord == null ? void 0 : rawRecord.size),
    normalizeStringList(rawRecord == null ? void 0 : rawRecord.sizes)
  ];
  const sizes = (_s = sizeCandidates.find((list) => list.length > 0)) != null ? _s : [];
  const categoryIds = Array.isArray(raw.categoryIds) ? raw.categoryIds.map((value) => String(value).trim()).filter(Boolean) : [];
  const normalizedCategory = sanitizeCategory(raw.category);
  if (normalizedCategory && !categoryIds.includes(normalizedCategory)) {
    categoryIds.unshift(normalizedCategory);
  }
  const categoryPrimary = normalizedCategory != null ? normalizedCategory : categoryIds[0];
  const highlightItems = [
    brandValue ? `Brand: ${brandValue}` : null,
    vendor ? `Vendor: ${vendor}` : null,
    discount > 0 ? `Save ${discount.toFixed(0)}% today` : null,
    raw.returnPolicy ? `Returns: ${raw.returnPolicy}` : null,
    availability ? `Availability: ${availability}` : null,
    status ? `Status: ${status}` : null
  ].filter((item) => Boolean(item));
  if (highlightItems.length === 0) {
    highlightItems.push("Curated selection from Commerce Demo partners.");
  }
  const tagSet = /* @__PURE__ */ new Set();
  const tag = resolveRemoteTag(raw);
  if (categoryPrimary) tagSet.add(categoryPrimary);
  if (brandValue) tagSet.add(brandValue);
  if (tag) tagSet.add(tag);
  const tags = Array.from(tagSet);
  const slugBase = slugify(name, `product-${String(id)}`);
  const slug = `${slugBase}-${String(id)}`;
  const productLink = `/products/${encodeURIComponent(String(id))}`;
  return {
    id,
    slug,
    name,
    title: name,
    description: (_t = raw.description) != null ? _t : "",
    price,
    category: categoryPrimary != null ? categoryPrimary : "General",
    category_level2: sanitizeCategory(raw.category_level2),
    category_level3: sanitizeCategory(raw.category_level3),
    category_level4: sanitizeCategory(raw.category_level4),
    image: buildImageUrl((_w = (_v = (_u = raw.images) == null ? void 0 : _u[0]) == null ? void 0 : _v.url) != null ? _w : raw.thumbnail),
    thumbnail: (_A = (_z = (_y = (_x = raw.images) == null ? void 0 : _x[0]) == null ? void 0 : _y.url) != null ? _z : raw.thumbnail) != null ? _A : void 0,
    rating,
    highlights: highlightItems,
    inStock,
    colors: tags,
    sizes: sizes.length ? sizes : ["One Size"],
    brand: brandValue || void 0,
    vendor: vendor || void 0,
    brandId: brandValue || void 0,
    vendorId: vendor || void 0,
    categoryIds,
    priceCurrency,
    stock,
    discountPercentage: discount,
    price_before_discount: priceBeforeDiscount != null ? priceBeforeDiscount : void 0,
    sku: sku != null ? sku : void 0,
    tag: tag != null ? tag : void 0,
    recency: (_B = raw.recency) != null ? _B : void 0,
    availabilityStatus: availability || void 0,
    returnPolicy: (_C = raw.returnPolicy) != null ? _C : void 0,
    link: productLink
  };
};
const fetchRemoteProducts = async (base, params = {}, options = {}) => {
  var _a, _b, _c, _d, _e;
  const products = [];
  const maxPages = (_a = options.maxPages) != null ? _a : Number.POSITIVE_INFINITY;
  let cursor = null;
  const vendorId = typeof params.vendorId === "string" ? params.vendorId.trim() : "";
  for (let page = 1; page <= maxPages; page += 1) {
    let response = null;
    let attempt = 0;
    let pageError = null;
    while (attempt <= PAGE_RETRY_COUNT) {
      try {
        response = await withTimeout(
          fetchUpstreamJson(
            base,
            vendorId ? `/vendors/${encodeURIComponent(vendorId)}/products` : "/products",
            {
              params: {
                ...params,
                ...vendorId ? { vendorId: void 0 } : {},
                limit: PAGE_SIZE,
                ...cursor ? { cursor } : {},
                includeRaw: "true"
              }
            }
          ),
          REMOTE_FETCH_TIMEOUT_MS
        );
        pageError = null;
        break;
      } catch (error) {
        pageError = error;
        const status = (_c = error == null ? void 0 : error.statusCode) != null ? _c : (_b = error == null ? void 0 : error.response) == null ? void 0 : _b.status;
        attempt += 1;
        if (attempt <= PAGE_RETRY_COUNT) {
          const retryAfterMs = status === 429 ? getRetryAfterMs(error) : null;
          const delayMs = retryAfterMs != null ? retryAfterMs : PAGE_RETRY_DELAY_MS * attempt;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    if (!response) {
      console.warn(`${LOG_PREFIX} failed to fetch page; returning partial catalog.`, {
        page,
        error: pageError
      });
      break;
    }
    const batch = normalizeProductsResponse(response);
    if (batch.length === 0) {
      break;
    }
    products.push(...batch);
    cursor = Array.isArray(response) ? null : (_e = (_d = response.nextCursor) != null ? _d : response.next_cursor) != null ? _e : null;
    if (!cursor) {
      break;
    }
  }
  return products;
};
const fetchProducts = async (event) => {
  const now = Date.now();
  const { base, disableRemote, vendorId } = await getApiConfig(event);
  const vendorFilter = vendorId.trim().toLowerCase();
  const filterByVendor = (items) => {
    if (!vendorFilter) return items;
    return items.filter((product) => {
      var _a;
      return ((_a = product.vendor) == null ? void 0 : _a.trim().toLowerCase()) === vendorFilter;
    });
  };
  if (cachedProducts && cachedVersion === CACHE_VERSION && now - lastFetch < CACHE_TTL) {
    return filterByVendor(cachedProducts);
  }
  if (now < remoteBackoffUntil) {
    if (cachedProducts && cachedVersion === CACHE_VERSION) {
      return filterByVendor(cachedProducts);
    }
  }
  try {
    if (!cachedProducts) {
      const cached = await readCacheFile();
      if (cached && cached.version === CACHE_VERSION) {
        cachedProducts = cached.products;
        cachedVersion = cached.version;
        lastFetch = cached.fetchedAt;
        if (now - cached.fetchedAt < CACHE_TTL) {
          return filterByVendor(cached.products);
        }
      }
    }
    if (disableRemote) {
      console.warn(`${LOG_PREFIX} remote fetch disabled; using cache/fallback only.`);
      if (cachedProducts && cachedVersion === CACHE_VERSION) {
        return filterByVendor(cachedProducts);
      }
      return filterByVendor(fallbackCatalog);
    }
    if (false) ;
    const requestStart = Date.now();
    const products = await fetchRemoteProducts(
      base,
      vendorId ? { vendorId } : {},
      { maxPages: false ? 0 : PRELOAD_MAX_PAGES_PROD }
    );
    console.info(`${LOG_PREFIX} upstream response`, {
      url: `${base}/products`,
      count: products.length,
      durationMs: Date.now() - requestStart
    });
    const mapped = products.map(normalizeRemoteProduct);
    if (mapped.length === 0) {
      console.warn(`${LOG_PREFIX} no products from upstream; using cached/fallback catalog.`, {
        upstreamCount: products.length
      });
      if (cachedProducts && cachedVersion === CACHE_VERSION) {
        return filterByVendor(cachedProducts);
      }
      return filterByVendor(fallbackCatalog);
    }
    cachedProducts = mapped;
    lastFetch = now;
    cachedVersion = CACHE_VERSION;
    remoteBackoffUntil = 0;
    await writeCacheFile({ version: CACHE_VERSION, fetchedAt: now, products: mapped });
    return filterByVendor(mapped);
  } catch (error) {
    console.error("Failed to load products from remote source", error);
    remoteBackoffUntil = Date.now() + REMOTE_BACKOFF_MS;
    if (cachedProducts && cachedVersion === CACHE_VERSION) {
      console.warn(`${LOG_PREFIX} using cached products after error`, {
        source: "memory",
        count: cachedProducts.length
      });
      return filterByVendor(cachedProducts);
    }
    console.warn(`${LOG_PREFIX} using cached/fallback catalog because remote feed is unavailable.`);
    if (cachedProducts && cachedVersion === CACHE_VERSION) {
      return filterByVendor(cachedProducts);
    }
    return filterByVendor(fallbackCatalog);
  }
};
const findProductBySlug = async (slug, event) => {
  const products = await fetchProducts(event);
  return products.find((product) => product.slug === slug);
};
const findProductById = async (id, event) => {
  const targetId = String(id);
  const { base, vendorId } = await getApiConfig(event);
  const normalizedVendor = vendorId.trim();
  try {
    if (cachedProducts && cachedVersion === CACHE_VERSION) {
      const cachedMatch = cachedProducts.find((product) => String(product.id) === targetId);
      if (cachedMatch) {
        return cachedMatch;
      }
    }
    const response = await fetchUpstreamJson(
      base,
      normalizedVendor ? `/vendors/${encodeURIComponent(normalizedVendor)}/products/${encodeURIComponent(targetId)}` : `/products/${encodeURIComponent(targetId)}`,
      { params: { includeRaw: "true" } }
    );
    return normalizeRemoteProduct(response);
  } catch (error) {
    const cached = cachedProducts != null ? cachedProducts : await fetchProducts(event);
    return cached.find((product) => String(product.id) === targetId);
  }
};
const sanitizeBrand = (value) => {
  if (value === null || value === void 0) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};
const fetchProductBrands = async (event) => {
  var _a;
  const { base, vendorId } = await getApiConfig(event);
  try {
    const response = vendorId ? await $fetch(
      `${base}/vendors/${encodeURIComponent(vendorId)}/brands`,
      { params: { limit: 1e5 } }
    ) : await $fetch(`${base}/brands`, {
      params: { limit: 1e5 }
    });
    const brands = (_a = response == null ? void 0 : response.data) != null ? _a : [];
    return brands.map((brand) => (brand == null ? void 0 : brand.id) ? String(brand.id).trim() : "").filter(Boolean);
  } catch (error) {
    const products = await fetchProducts(event);
    const unique = /* @__PURE__ */ new Set();
    for (const product of products) {
      const brand = sanitizeBrand(product.brand);
      if (brand) {
        unique.add(brand);
      }
    }
    return Array.from(unique);
  }
};
const findProductsByBrand = async (brand, event) => {
  const normalizedBrand = sanitizeBrand(brand);
  if (!normalizedBrand) {
    return [];
  }
  const { base, vendorId } = await getApiConfig(event);
  try {
    const response = await fetchRemoteProducts(base, {
      brandId: normalizedBrand,
      ...vendorId ? { vendorId } : {}
    });
    const mapped = response.map(normalizeRemoteProduct);
    if (mapped.length > 0) {
      return mapped;
    }
    const brands = await fetchProductBrands(event);
    const canonical = brands.find(
      (entry) => entry.trim().toLowerCase() === normalizedBrand.toLowerCase()
    );
    if (canonical && canonical !== normalizedBrand) {
      const retry = await fetchRemoteProducts(base, {
        brandId: canonical,
        ...vendorId ? { vendorId } : {}
      });
      const retried = retry.map(normalizeRemoteProduct);
      if (retried.length > 0) {
        return retried;
      }
    }
  } catch (error) {
    console.error("Failed to load products by brand from upstream", error);
  }
  const products = await fetchProducts(event);
  const target = normalizedBrand.toLowerCase();
  return products.filter((product) => {
    var _a;
    return ((_a = product.brand) == null ? void 0 : _a.toLowerCase()) === target;
  });
};

export { findProductBySlug as a, findProductsByBrand as b, fetchProductBrands as c, fetchProducts as d, findProductById as f, normalizeRemoteProduct as n };
//# sourceMappingURL=products.mjs.map
