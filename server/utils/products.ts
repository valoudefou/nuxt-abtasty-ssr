import type { Product } from '@/types/product'
import { slugifyBrand } from '@/utils/brand'

type RemoteProduct = {
  id: string | number
  title: string
  description: string
  category?: string | null
  category_level2?: string | null
  category_level3?: string | null
  category_level4?: string | null
  link?: string | null
  price?: string | number | null
  price_before_discount?: string | number | null
  discountPercentage?: string | number | null
  rating?: string | number | null
  stock?: string | number | null
  brand?: string | null
  sku?: string | null
  availabilityStatus?: string | null
  returnPolicy?: string | null
  thumbnail?: string | null
  tag?: string | null
  recency?: string | number | null
  vendor?: string | null
}

type RemoteResponse = {
  products: RemoteProduct[]
}

const PRODUCT_SOURCE_URL = 'https://live-server1.vercel.app/products'
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

let cachedProducts: Product[] | null = null
let lastFetch = 0

const PLACEHOLDER_IMAGE = 'https://images.weserv.nl/?url=assets-manager.abtasty.com/placeholder.png'

const parseNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0
  }

  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value

  return Number.isFinite(numeric) ? Number(numeric) : 0
}

const slugify = (value: string, fallback: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized.length > 0 ? normalized : fallback
}

const extractNumericId = (value: string | number) => {
  if (typeof value === 'number') {
    return value
  }

  // Prefer the last numeric segment so slugs like "2016-ford-ranger-1589"
  // resolve to the catalog ID (1589) instead of the year in the title.
  const match = String(value).match(/(\d+)(?!.*\d)/)
  return match ? Number.parseInt(match[1], 10) : Number.NaN
}

const sanitizeCategory = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return undefined
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const sanitizeVendor = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return undefined
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const buildImageUrl = (value: string | null | undefined) => {
  if (!value) {
    return PLACEHOLDER_IMAGE
  }

  const trimmed = String(value).trim()
  if (!trimmed) {
    return PLACEHOLDER_IMAGE
  }

  // Proxy external images to avoid hosts that block direct hotlinking.
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '')
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}`
}

const toProduct = (raw: RemoteProduct): Product => {
  const id = parseNumber(raw.id)
  const price = Math.max(parseNumber(raw.price ?? raw.price_before_discount), 0)
  const rating = Math.min(Math.max(parseNumber(raw.rating), 0), 5)
  const stock = Math.max(parseNumber(raw.stock), 0)
  const discount = parseNumber(raw.discountPercentage)
  const availability = raw.availabilityStatus?.trim() ?? ''

  const brand = raw.brand ? String(raw.brand).trim() : ''

  const highlightItems = [
    brand ? `Brand: ${brand}` : null,
    discount > 0 ? `Save ${discount.toFixed(0)}% today` : null,
    raw.returnPolicy ? `Returns: ${raw.returnPolicy}` : null,
    availability ? `Availability: ${availability}` : null
  ].filter((item): item is string => Boolean(item))

  if (highlightItems.length === 0) {
    highlightItems.push('Curated selection from Val Commerce partners.')
  }

  const tagSet = new Set<string>()

  if (raw.category) tagSet.add(raw.category)
  if (brand) tagSet.add(brand)
  if (raw.tag) tagSet.add(raw.tag)

  const tags = Array.from(tagSet)

  const slugBase = slugify(raw.title ?? `product-${id}`, `product-${id}`)
  const slug = `${slugBase}-${id}`

  const productLink = `/products/${id}`

  return {
    id,
    slug,
    name: raw.title ?? `Product ${id}`,
    description: raw.description ?? '',
    price,
    category: sanitizeCategory(raw.category) ?? 'General',
    category_level2: sanitizeCategory(raw.category_level2),
    category_level3: sanitizeCategory(raw.category_level3),
    category_level4: sanitizeCategory(raw.category_level4),
    image: buildImageUrl(raw.thumbnail),
    rating,
    highlights: highlightItems,
    inStock: availability.toLowerCase() === 'in stock' || stock > 0,
    colors: tags,
    sizes: ['One Size'],
    brand: brand || undefined,
    vendor: sanitizeVendor(raw.vendor),
    stock,
    discountPercentage: discount,
    availabilityStatus: availability || undefined,
    returnPolicy: raw.returnPolicy ?? undefined,
    link: productLink
  }
}

export const fetchProducts = async (): Promise<Product[]> => {
  const now = Date.now()

  if (cachedProducts && now - lastFetch < CACHE_TTL) {
    return cachedProducts
  }

  try {
    const { products } = await $fetch<RemoteResponse>(PRODUCT_SOURCE_URL)
    const mapped = products
      .filter((product) => sanitizeVendor(product.vendor)?.toLowerCase() === 'jacamo')
      .map(toProduct)

    cachedProducts = mapped
    lastFetch = now

    return mapped
  } catch (error) {
    console.error('Failed to load products from remote source', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to load product catalog right now.'
    })
  }
}

export const findProductBySlug = async (slug: string): Promise<Product | undefined> => {
  const products = await fetchProducts()
  return products.find((product) => product.slug === slug)
}

export const findProductById = async (id: string | number): Promise<Product | undefined> => {
  const numericId = extractNumericId(id)

  if (!Number.isFinite(numericId)) {
    return undefined
  }

  const products = await fetchProducts()
  return products.find((product) => product.id === numericId)
}

const sanitizeBrand = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

export const fetchProductBrands = async (): Promise<string[]> => {
  const products = await fetchProducts()
  const unique = new Set<string>()

  for (const product of products) {
    const brand = sanitizeBrand(product.brand)
    if (brand) {
      unique.add(brand)
    }
  }

  return Array.from(unique)
}

export const findProductsByBrand = async (brand: string): Promise<Product[]> => {
  const normalizedBrand = sanitizeBrand(brand)

  if (!normalizedBrand) {
    return []
  }

  const brandSlug = slugifyBrand(normalizedBrand)

  if (!brandSlug) {
    return []
  }

  try {
    const { products } = await $fetch<RemoteResponse>(`${PRODUCT_SOURCE_URL}/brand/${brandSlug}`)
    return products.map(toProduct)
  } catch (error) {
    const status =
      (error as { statusCode?: number; status?: number })?.statusCode
      ?? (error as { status?: number })?.status

    if (status === 404) {
      return []
    }

    console.error(`Failed to load products for brand slug "${brandSlug}"`, error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to load product catalog right now.'
    })
  }
}
