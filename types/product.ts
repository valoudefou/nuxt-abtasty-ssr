export interface Product {
  id: number
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
  brand?: string
  stock?: number
  discountPercentage?: number
  availabilityStatus?: string
  returnPolicy?: string
  link?: string
  category_level2?: string
  category_level3?: string
  category_level4?: string
}
