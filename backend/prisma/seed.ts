import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Animals ────────────────────────────────────────────────────────────────
  const animals = await Promise.all([
    prisma.animal.upsert({
      where: { slug: "cat" },
      update: {},
      create: {
        slug: "cat",
        name: "Cat",
        description: "Everything for your feline friends",
        image: "/images/categories/category-1.jpg",
      },
    }),
    prisma.animal.upsert({
      where: { slug: "dog" },
      update: {},
      create: {
        slug: "dog",
        name: "Dog",
        description: "Products for dogs of all sizes",
        image: "/images/categories/category-2.jpg",
      },
    }),
    prisma.animal.upsert({
      where: { slug: "bird" },
      update: {},
      create: {
        slug: "bird",
        name: "Bird",
        description: "Food and accessories for birds",
        image: "/images/categories/category-3.jpg",
      },
    }),
    prisma.animal.upsert({
      where: { slug: "fish" },
      update: {},
      create: {
        slug: "fish",
        name: "Fish",
        description: "Aquarium essentials and fish food",
        image: "/images/categories/category-4.jpg",
      },
    }),
  ]);

  const [cat, dog, bird, fish] = animals;
  console.log(`Created ${animals.length} animals`);

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "cat-food" },
      update: {},
      create: {
        slug: "cat-food",
        name: "Cat Food",
        description: "Nutritious meals for cats",
        image: "/images/categories/category-1.jpg",
        animalId: cat.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "cat-toys" },
      update: {},
      create: {
        slug: "cat-toys",
        name: "Cat Toys",
        description: "Interactive toys for cats",
        image: "/images/categories/category-2.jpg",
        animalId: cat.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "cat-grooming" },
      update: {},
      create: {
        slug: "cat-grooming",
        name: "Cat Grooming",
        description: "Grooming essentials for cats",
        image: "/images/categories/category-3.jpg",
        animalId: cat.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "dog-food" },
      update: {},
      create: {
        slug: "dog-food",
        name: "Dog Food",
        description: "Premium dog nutrition",
        image: "/images/categories/category-4.jpg",
        animalId: dog.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "dog-toys" },
      update: {},
      create: {
        slug: "dog-toys",
        name: "Dog Toys",
        description: "Fun toys for dogs",
        image: "/images/categories/category-5.jpg",
        animalId: dog.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "dog-accessories" },
      update: {},
      create: {
        slug: "dog-accessories",
        name: "Dog Accessories",
        description: "Collars, leashes, and more",
        image: "/images/categories/category-6.jpg",
        animalId: dog.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "bird-food" },
      update: {},
      create: {
        slug: "bird-food",
        name: "Bird Food",
        description: "Seed mixes and pellets for birds",
        image: "/images/categories/category-1.jpg",
        animalId: bird.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "fish-food" },
      update: {},
      create: {
        slug: "fish-food",
        name: "Fish Food",
        description: "Flakes and pellets for aquarium fish",
        image: "/images/categories/category-2.jpg",
        animalId: fish.id,
      },
    }),
  ]);

  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  console.log(`Created ${categories.length} categories`);

  // ─── Brands ───────────────────────────────────────────────────────────────
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: "PetPro" },
      update: {},
      create: { name: "PetPro" },
    }),
    prisma.brand.upsert({
      where: { name: "HappyPaws" },
      update: {},
      create: { name: "HappyPaws" },
    }),
    prisma.brand.upsert({
      where: { name: "FurryFriends" },
      update: {},
      create: { name: "FurryFriends" },
    }),
    prisma.brand.upsert({
      where: { name: "NaturePet" },
      update: {},
      create: { name: "NaturePet" },
    }),
    prisma.brand.upsert({
      where: { name: "AnimalCare" },
      update: {},
      create: { name: "AnimalCare" },
    }),
    prisma.brand.upsert({
      where: { name: "PetLuxury" },
      update: {},
      create: { name: "PetLuxury" },
    }),
  ]);

  console.log(`Created ${brands.length} brands`);

  // ─── Tags ─────────────────────────────────────────────────────────────────
  const tagNames = [
    "dog",
    "cat",
    "treats",
    "food",
    "toy",
    "bed",
    "bowl",
    "grooming",
    "bird",
    "fish",
    "hamster",
    "collar",
    "organic",
    "premium",
    "interactive",
    "bestseller",
    "sale",
    "new-arrival",
  ];

  const tags: Record<string, { id: string }> = {};
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tags[name] = tag;
  }

  console.log(`Created ${Object.keys(tags).length} tags`);

  // ─── Products ─────────────────────────────────────────────────────────────
  const products = [
    {
      slug: "premium-dog-treats",
      name: "Premium Dog Treats",
      description:
        "Healthy and delicious premium dog treats made with natural ingredients. Perfect for training and rewarding your furry friend.",
      price: 60.4,
      sku: "DOG-TRT-001",
      image: "/images/products/product-1.jpg",
      rating: 4.8,
      reviewCount: 128,
      inStock: true,
      categoryId: categoryBySlug["dog-food"].id,
      brandId: brands[0].id, // PetPro
      tagNames: ["dog", "treats", "bestseller"],
    },
    {
      slug: "organic-cat-food",
      name: "Organic Cat Food",
      description:
        "Grain-free organic cat food packed with real meat and essential nutrients for a healthy, active cat.",
      price: 426.03,
      sku: "CAT-FD-002",
      image: "/images/products/product-2.jpg",
      rating: 4.9,
      reviewCount: 96,
      inStock: true,
      categoryId: categoryBySlug["cat-food"].id,
      brandId: brands[3].id, // NaturePet
      tagNames: ["cat", "food", "organic"],
    },
    {
      slug: "dry-dog-food-premium",
      name: "Dry Dog Food Premium",
      description:
        "High-protein dry dog food formulated for adult dogs of all breeds. Supports muscle health and shiny coat.",
      price: 853.93,
      sku: "DOG-DF-003",
      image: "/images/products/product-3.jpg",
      rating: 4.7,
      reviewCount: 215,
      inStock: true,
      categoryId: categoryBySlug["dog-food"].id,
      brandId: brands[1].id, // HappyPaws
      tagNames: ["dog", "food", "premium"],
    },
    {
      slug: "parrot-seed-mix",
      name: "Parrot Seed Mix",
      description:
        "A balanced blend of seeds, nuts, and fruits designed to keep your parrot happy and healthy.",
      price: 179.5,
      sku: "BRD-SEED-004",
      image: "/images/products/product-4.jpg",
      rating: 4.6,
      reviewCount: 64,
      inStock: true,
      categoryId: categoryBySlug["bird-food"].id,
      brandId: brands[2].id, // FurryFriends
      tagNames: ["bird", "food"],
    },
    {
      slug: "aquarium-fish-food",
      name: "Aquarium Fish Food",
      description:
        "Nutrient-rich flakes for tropical fish. Helps enhance color and support immune system.",
      price: 12.5,
      sku: "FISH-FD-005",
      image: "/images/products/product-5.jpg",
      rating: 4.5,
      reviewCount: 42,
      inStock: true,
      categoryId: categoryBySlug["fish-food"].id,
      brandId: brands[4].id, // AnimalCare
      tagNames: ["fish", "food"],
    },
    {
      slug: "interactive-dog-toy",
      name: "Interactive Dog Toy",
      description:
        "Keep your dog entertained for hours with this durable interactive toy. Great for mental stimulation.",
      price: 19.99,
      oldPrice: 25.99,
      sku: "DOG-TOY-006",
      image: "/images/products/product-6.jpg",
      rating: 4.8,
      reviewCount: 156,
      inStock: true,
      categoryId: categoryBySlug["dog-toys"].id,
      brandId: brands[1].id, // HappyPaws
      tagNames: ["dog", "toy", "interactive"],
    },
    {
      slug: "cozy-pet-bed",
      name: "Cozy Pet Bed",
      description:
        "Ultra-soft pet bed with orthopedic support. Machine washable cover and non-slip bottom.",
      price: 59.99,
      sku: "PET-BED-007",
      image: "/images/products/product-7.jpg",
      rating: 4.9,
      reviewCount: 312,
      inStock: true,
      categoryId: categoryBySlug["dog-accessories"].id,
      brandId: brands[5].id, // PetLuxury
      tagNames: ["bed", "dog", "cat"],
    },
    {
      slug: "leather-pet-collar",
      name: "Leather Pet Collar",
      description:
        "Genuine leather collar with sturdy buckle. Available in multiple sizes and colors.",
      price: 22.0,
      sku: "PET-CLLR-008",
      image: "/images/products/product-8.jpg",
      rating: 4.7,
      reviewCount: 88,
      inStock: true,
      categoryId: categoryBySlug["dog-accessories"].id,
      brandId: brands[0].id, // PetPro
      tagNames: ["dog", "cat", "collar"],
    },
    {
      slug: "kitten-starter-pack",
      name: "Kitten Starter Pack",
      description:
        "Everything you need for your new kitten: food, treats, toys, and grooming essentials.",
      price: 39.99,
      oldPrice: 49.99,
      sku: "CAT-KIT-009",
      image: "/images/products/product-9.jpg",
      rating: 4.8,
      reviewCount: 74,
      inStock: true,
      categoryId: categoryBySlug["cat-food"].id,
      brandId: brands[2].id, // FurryFriends
      tagNames: ["cat", "treats"],
    },
    {
      slug: "stainless-steel-bowl",
      name: "Stainless Steel Bowl",
      description:
        "Durable stainless steel feeding bowl with non-slip rubber base. Rust resistant and dishwasher safe.",
      price: 14.99,
      sku: "PET-BOWL-010",
      image: "/images/products/product-10.jpg",
      rating: 4.6,
      reviewCount: 53,
      inStock: true,
      categoryId: categoryBySlug["dog-accessories"].id,
      brandId: brands[4].id, // AnimalCare
      tagNames: ["dog", "cat", "bowl"],
    },
    {
      slug: "pet-grooming-kit",
      name: "Pet Grooming Kit",
      description:
        "Complete grooming set with brush, nail clippers, and shampoo for a clean, happy pet.",
      price: 29.99,
      sku: "PET-GRM-011",
      image: "/images/products/product-11.jpg",
      rating: 4.7,
      reviewCount: 119,
      inStock: true,
      categoryId: categoryBySlug["cat-grooming"].id,
      brandId: brands[3].id, // NaturePet
      tagNames: ["dog", "cat", "grooming"],
    },
    {
      slug: "hamster-food-mix",
      name: "Hamster Food Mix",
      description:
        "Nutritious blend of seeds, grains, and pellets specially formulated for hamsters.",
      price: 9.99,
      sku: "SML-HAM-012",
      image: "/images/products/product-12.jpg",
      rating: 4.5,
      reviewCount: 36,
      inStock: true,
      categoryId: categoryBySlug["bird-food"].id,
      brandId: brands[2].id, // FurryFriends
      tagNames: ["hamster", "food"],
    },
  ];

  for (let i = 0; i < products.length; i++) {
    const { tagNames: productTagNames, ...productData } = products[i];
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        sortOrder: i + 1,
      },
    });

    // Connect tags
    for (const tagName of productTagNames ?? []) {
      if (tags[tagName]) {
        await prisma.productTag.upsert({
          where: {
            productId_tagId: {
              productId: product.id,
              tagId: tags[tagName].id,
            },
          },
          update: {},
          create: {
            productId: product.id,
            tagId: tags[tagName].id,
          },
        });
      }
    }
  }

  console.log(`Created ${products.length} products`);

  // ─── Banners ──────────────────────────────────────────────────────────────
  const banners = [
    {
      title: "Felt Cat Beds For Indoor Cats",
      subtitle: "Felt products that cats love",
      description: "Limited time offer",
      discount: "15%",
      image: "/images/hero/hero-1.jpg",
      link: "/shop",
      type: "HERO" as const,
      size: "LARGE" as const,
      align: "LEFT" as const,
      sortOrder: 1,
    },
    {
      title: "Premium Pet Food Collection",
      subtitle: "Summer Sale",
      description: "Premium quality products for your best friends.",
      discount: "30%",
      image: "/images/hero/hero-2.jpg",
      link: "/shop",
      type: "HERO" as const,
      size: "LARGE" as const,
      align: "LEFT" as const,
      sortOrder: 2,
    },
    {
      title: "For Your Feline Friend",
      subtitle: "New Arrivals",
      description: "Discover the latest cat food, toys, and accessories.",
      discount: "20%",
      image: "/images/hero/hero-3.jpg",
      link: "/shop",
      type: "HERO" as const,
      size: "LARGE" as const,
      align: "LEFT" as const,
      sortOrder: 3,
    },
    {
      title: "50% Off",
      subtitle: "Pet Food & Accessories",
      description: "Everything for your pet.",
      image: "/images/banners/banner-1.jpg",
      link: "/shop",
      type: "PROMO" as const,
      size: "SMALL" as const,
      align: "LEFT" as const,
      sortOrder: 4,
    },
    {
      title: "30% Sale Off",
      subtitle: "FREE SHIPPING",
      description: "Shop Now",
      image: "/images/banners/banner-2.jpg",
      link: "/shop",
      type: "PROMO" as const,
      size: "SMALL" as const,
      align: "LEFT" as const,
      sortOrder: 5,
    },
    {
      title: "Healthy formula",
      subtitle: "Parrot Food",
      description: "Premium bird nutrition",
      image: "/images/banners/banner-3.jpg",
      link: "/shop",
      type: "PROMO" as const,
      size: "SMALL" as const,
      align: "LEFT" as const,
      sortOrder: 6,
    },
    {
      title: "25% Off",
      subtitle: "Dog Supplies",
      description: "Hotline Order (877) 123-4567",
      image: "/images/banners/banner-4.jpg",
      link: "/shop",
      type: "PROMO" as const,
      size: "MEDIUM" as const,
      align: "LEFT" as const,
      sortOrder: 7,
    },
    {
      title: "Save 30%",
      subtitle: "Premium Cat Food",
      description: "GIFT FOR PET",
      image: "/images/banners/banner-1.jpg",
      link: "/shop",
      type: "PROMO" as const,
      size: "MEDIUM" as const,
      align: "LEFT" as const,
      sortOrder: 8,
    },
  ];

  for (const banner of banners) {
    await prisma.banner.create({ data: banner });
  }

  console.log(`Created ${banners.length} banners`);

  // ─── Blog Posts ───────────────────────────────────────────────────────────
  const blogPosts = [
    {
      slug: "how-to-choose-the-best-dog-food",
      title: "How to Choose the Right Bully Stick for Your Dog",
      excerpt:
        "Below is an excerpt of porch.com's article \"Moving With Pets? We Have the Experts' Advice to Do It Properly\". For...",
      content:
        "Choosing the right treats for your dog can be overwhelming with so many options available. In this guide, we'll walk you through everything you need to know about selecting the best bully sticks and treats for your canine companion.",
      image: "/images/blog/blog-1.jpg",
      date: new Date("2022-06-03"),
      author: "Admin",
      category: "Pet Care",
      tags: JSON.stringify(["Lifestyles"]),
      isPublished: true,
    },
    {
      slug: "saving-lives-animal-house-shelter",
      title: "Saving Lives: Animal House Shelter And Downtown Pet Supply",
      excerpt:
        "Below is an excerpt of porch.com's article \"Moving With Pets? We Have the Experts' Advice to Do It Properly\". For...",
      content:
        "Animal shelters play a vital role in our communities. Learn how you can help make a difference in the lives of shelter animals.",
      image: "/images/blog/blog-2.jpg",
      date: new Date("2022-06-03"),
      author: "Admin",
      category: "Pet Toys",
      tags: JSON.stringify(["Educational", "Lifestyles"]),
      isPublished: true,
    },
    {
      slug: "himalayan-yak-chews-benefits",
      title: "Himalayan Yak Chews: 11 Benefits You Need To Know",
      excerpt:
        "Below is an excerpt of porch.com's article \"Moving With Pets? We Have the Experts' Advice to Do It Properly\". For...",
      content:
        "Himalayan yak chews are becoming increasingly popular among dog owners. Discover the 11 key benefits that make them a great choice for your pet.",
      image: "/images/blog/blog-3.jpg",
      date: new Date("2022-06-03"),
      author: "Admin",
      category: "Pet Care",
      tags: JSON.stringify(["Educational", "New"]),
      isPublished: true,
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }

  console.log(`Created ${blogPosts.length} blog posts`);

  // ─── Testimonials ─────────────────────────────────────────────────────────
  const testimonials = [
    {
      name: "John Alvy",
      role: "Pet Owner",
      avatar: "/images/testimonials/avatar-1.jpg",
      content:
        "Petmania has completely transformed how I shop for my pets. The quality is outstanding and delivery is always on time. My dogs absolutely love the treats!",
      rating: 5,
      sortOrder: 1,
    },
    {
      name: "Sarah Jenkins",
      role: "Cat Lover",
      avatar: "/images/testimonials/avatar-2.jpg",
      content:
        "Finally a pet shop that understands what cats need. The organic cat food selection is amazing and my kitty has never been healthier.",
      rating: 5,
      sortOrder: 2,
    },
    {
      name: "Michael Brown",
      role: "Dog Trainer",
      avatar: "/images/testimonials/avatar-3.jpg",
      content:
        "I recommend Petmania to all my clients. Their training treats and toys are top-notch, and the prices are very competitive.",
      rating: 4,
      sortOrder: 3,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.create({ data: testimonial });
  }

  console.log(`Created ${testimonials.length} testimonials`);

  // ─── Gallery Images ───────────────────────────────────────────────────────
  const galleryImages = [
    {
      src: "/images/gallery/gallery-1.jpg",
      alt: "Happy pets",
      link: "https://instagram.com",
      sortOrder: 1,
    },
    {
      src: "/images/gallery/gallery-2.jpg",
      alt: "Dogs playing",
      link: "https://instagram.com",
      sortOrder: 2,
    },
    {
      src: "/images/gallery/gallery-3.jpg",
      alt: "Cute cat",
      link: "https://instagram.com",
      sortOrder: 3,
    },
    {
      src: "/images/gallery/gallery-4.jpg",
      alt: "Pet toys",
      link: "https://instagram.com",
      sortOrder: 4,
    },
    {
      src: "/images/gallery/gallery-5.jpg",
      alt: "Dog treats",
      link: "https://instagram.com",
      sortOrder: 5,
    },
  ];

  for (const image of galleryImages) {
    await prisma.galleryImage.create({ data: image });
  }

  console.log(`Created ${galleryImages.length} gallery images`);

  // ─── Admin User ─────────────────────────────────────────────────────────
  const bcrypt = await import("bcryptjs");
  const adminPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@petmania.com" },
    update: {},
    create: {
      email: "admin@petmania.com",
      password: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // ─── Test User ───────────────────────────────────────────────────────────
  const userPassword = await bcrypt.hash("user123", 12);

  await prisma.user.upsert({
    where: { email: "user@petmania.com" },
    update: {},
    create: {
      email: "user@petmania.com",
      password: userPassword,
      name: "Test User",
      role: "USER",
    },
  });

  console.log("Created admin and test users");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
