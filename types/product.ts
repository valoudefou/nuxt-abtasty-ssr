export interface Product {
  id: number | string
  slug: string
  name: string
  description: string
  price: number
  category: string
  image: string
  rating: number
  highlights: string[]
  inStock: boolean
  colors: string[]
  sizes: string[]
  title?: string
  thumbnail?: string
  price_before_discount?: string | number | null
  sku?: string | null
  tag?: string | null
  recency?: string | number | null
  brand?: string
  vendor?: string
  brandId?: string
  vendorId?: string
  categoryIds?: string[]
  priceCurrency?: string
  stock?: number
  discountPercentage?: number
  availabilityStatus?: string
  returnPolicy?: string
  link?: string
  category_level2?: string
  category_level3?: string
  category_level4?: string
}
