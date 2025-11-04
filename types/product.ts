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
}
