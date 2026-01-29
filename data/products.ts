import type { Product } from '@/types/product'

export const products: Product[] = [
  {
    id: 1,
    slug: 'arctic-summit-parka',
    name: 'Arctic Summit Parka',
    description:
      'Premium insulated parka with responsibly sourced down fill and water-resistant shell, perfect for urban adventures and alpine escapes.',
    price: 349,
    category: 'Outerwear',
    image: '/images/arctic-summit-parka.svg',
    rating: 4.8,
    highlights: [
      '700-fill responsibly sourced down',
      'Recycled water-resistant outer shell',
      'Detachable faux-fur hood trim',
      'Interior media pocket with headphone routing'
    ],
    inStock: true,
    tag: 'Bestseller',
    colors: ['Midnight Navy', 'Glacier White', 'Ember Red'],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 2,
    slug: 'coastal-breeze-knit',
    name: 'Coastal Breeze Knit',
    description:
      'Lightweight merino blend sweater that balances breathability with warmth for an effortless, everyday layer.',
    price: 129,
    category: 'Knitwear',
    image: '/images/coastal-breeze-knit.svg',
    rating: 4.6,
    highlights: [
      'Sustainable merino wool blend',
      'Machine washable and pill-resistant',
      'Tailored yet relaxed silhouette',
      'Breathable open-stitch pattern'
    ],
    inStock: true,
    tag: 'New',
    colors: ['Seafoam', 'Sandstone', 'Deep Charcoal'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 3,
    slug: 'skyline-tech-trousers',
    name: 'Skyline Tech Trousers',
    description:
      'Streamlined trousers with four-way stretch and water-repellent finish to keep you comfortable on commutes and long-haul journeys.',
    price: 159,
    category: 'Bottoms',
    image: '/images/skyline-tech-trousers.svg',
    rating: 4.7,
    highlights: [
      'Four-way stretch technical fabric',
      'Moisture-wicking interior waistband',
      'Hidden zip pocket for essentials',
      'Wrinkle-resistant and travel-ready'
    ],
    inStock: false,
    tag: 'Limited',
    colors: ['Carbon Black', 'Storm Grey'],
    sizes: ['28', '30', '32', '34', '36']
  },
  {
    id: 4,
    slug: 'lumina-city-backpack',
    name: 'Lumina City Backpack',
    description:
      'Versatile commuter backpack featuring padded laptop storage, quick-access pockets, and reflective accents for low-light commutes.',
    price: 189,
    category: 'Accessories',
    image: '/images/lumina-city-backpack.svg',
    rating: 4.9,
    highlights: [
      '20L capacity with modular organization',
      'Water-resistant zippers and fabric',
      'Ventilated back panel with luggage pass-through',
      'USB passthrough for portable chargers'
    ],
    inStock: true,
    tag: 'Editor’s Pick',
    colors: ['Obsidian', 'Mineral Blue'],
    sizes: ['One Size']
  }
]
