import type { Product } from '@/types/product'

type RemoteProduct = {
  id: string | number
  title: string
  description: string
  category?: string | null
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

  return {
    id,
    slug,
    name: raw.title ?? `Product ${id}`,
    description: raw.description ?? '',
    price,
    category: raw.category ?? 'General',
    image: raw.thumbnail ?? '',
    rating,
    highlights: highlightItems,
    inStock: availability.toLowerCase() === 'in stock' || stock > 0,
    colors: tags,
    sizes: ['One Size'],
    brand: brand || undefined,
    stock,
    discountPercentage: discount,
    availabilityStatus: availability || undefined,
    returnPolicy: raw.returnPolicy ?? undefined,
    link: raw.link ?? undefined
  }
}

export const fetchProducts = async (): Promise<Product[]> => {
  const now = Date.now()

  if (cachedProducts && now - lastFetch < CACHE_TTL) {
    return cachedProducts
  }

  try {
    const { products } = await $fetch<RemoteResponse>(PRODUCT_SOURCE_URL)
    const mapped = products.map(toProduct)

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

  const products = await fetchProducts()
  const target = normalizedBrand.toLowerCase()

  return products.filter((product) => {
    const productBrand = sanitizeBrand(product.brand)
    return productBrand ? productBrand.toLowerCase() === target : false
  })
}
