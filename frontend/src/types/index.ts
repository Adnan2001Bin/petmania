export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  tags: string[];
  description: string;
  sku: string;
  inStock: boolean;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  sku: string;
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isActive: boolean;
  categoryId: number;
  category?: { id: number; name: string; slug: string };
  tags?: { tag: { id: string; name: string } }[];
}

export interface Animal {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  _count?: { categories: number };
}

export interface AdminCategory {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  animalId: number;
  animal?: Pick<Animal, 'id' | 'name' | 'slug'>;
  _count?: { products: number };
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
  tags?: string[];
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

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  avatar?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}
