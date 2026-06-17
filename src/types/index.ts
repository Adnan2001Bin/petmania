export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  hoverImage?: string;
  category: string;
  tags: string[];
  badge?: 'sale' | 'new' | 'hot' | 'sold-out';
  description: string;
  sku: string;
  inStock: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
  productCount: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  discount?: string;
  image: string;
  link: string;
  align?: 'left' | 'right' | 'center';
  size?: 'small' | 'medium' | 'large';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  category: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  link?: string;
}
