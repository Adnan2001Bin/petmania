import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const pexels = (id: number, width = 800) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${width}&fit=crop`;

  // ─── Animals ────────────────────────────────────────────────────────────────
  const animals = await Promise.all([
    prisma.animal.upsert({
      where: { slug: "cat" },
      update: { image: pexels(320014) },
      create: {
        slug: "cat",
        name: "Cat",
        description: "Everything for your feline friends",
        image: pexels(320014),
      },
    }),
    prisma.animal.upsert({
      where: { slug: "dog" },
      update: { image: pexels(1805164) },
      create: {
        slug: "dog",
        name: "Dog",
        description: "Products for dogs of all sizes",
        image: pexels(1805164),
      },
    }),
    prisma.animal.upsert({
      where: { slug: "bird" },
      update: { image: pexels(1661174) },
      create: {
        slug: "bird",
        name: "Bird",
        description: "Food and accessories for birds",
        image: pexels(1661174),
      },
    }),
    prisma.animal.upsert({
      where: { slug: "fish" },
      update: { image: pexels(128756) },
      create: {
        slug: "fish",
        name: "Fish",
        description: "Aquarium essentials and fish food",
        image: pexels(128756),
      },
    }),
  ]);

  const [cat, dog, bird, fish] = animals;
  console.log(`Created ${animals.length} animals`);

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "cat-food" },
      update: { image: pexels(6864018) },
      create: {
        slug: "cat-food",
        name: "Cat Food",
        description: "Nutritious meals for cats",
        image: pexels(6864018),
        animalId: cat.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "cat-toys" },
      update: { image: pexels(1170986) },
      create: {
        slug: "cat-toys",
        name: "Cat Toys",
        description: "Interactive toys for cats",
        image: pexels(1170986),
        animalId: cat.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "cat-grooming" },
      update: { image: pexels(6864019) },
      create: {
        slug: "cat-grooming",
        name: "Cat Grooming",
        description: "Grooming essentials for cats",
        image: pexels(6864019),
        animalId: cat.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "dog-food" },
      update: { image: pexels(1805164) },
      create: {
        slug: "dog-food",
        name: "Dog Food",
        description: "Premium dog nutrition",
        image: pexels(1805164),
        animalId: dog.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "dog-toys" },
      update: { image: pexels(4587997) },
      create: {
        slug: "dog-toys",
        name: "Dog Toys",
        description: "Fun toys for dogs",
        image: pexels(4587997),
        animalId: dog.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "dog-accessories" },
      update: { image: pexels(1851164) },
      create: {
        slug: "dog-accessories",
        name: "Dog Accessories",
        description: "Collars, leashes, and more",
        image: pexels(1851164),
        animalId: dog.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "bird-food" },
      update: { image: pexels(459460) },
      create: {
        slug: "bird-food",
        name: "Bird Food",
        description: "Seed mixes and pellets for birds",
        image: pexels(459460),
        animalId: bird.id,
      },
    }),
    prisma.category.upsert({
      where: { slug: "fish-food" },
      update: { image: pexels(96947) },
      create: {
        slug: "fish-food",
        name: "Fish Food",
        description: "Flakes and pellets for aquarium fish",
        image: pexels(96947),
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
        "All-natural training treats made with real chicken and sweet potato. Perfect for rewarding good behavior.",
      price: 24.99,
      sku: "DOG-TRT-001",
      image: pexels(1108099),
      rating: 4.8,
      reviewCount: 128,
      inStock: true,
      categoryId: categoryBySlug["dog-food"].id,
      brandId: brands[0].id,
      tagNames: ["dog", "treats", "bestseller", "food"],
    },
    {
      slug: "organic-cat-food",
      name: "Organic Cat Food",
      description:
        "Grain-free organic cat food with real salmon and essential vitamins for a healthy, active cat.",
      price: 34.99,
      sku: "CAT-FD-002",
      image: pexels(6864018),
      rating: 4.9,
      reviewCount: 96,
      inStock: true,
      categoryId: categoryBySlug["cat-food"].id,
      brandId: brands[3].id,
      tagNames: ["cat", "food", "organic", "premium"],
    },
    {
      slug: "dry-dog-food-premium",
      name: "Dry Dog Food Premium",
      description:
        "High-protein dry kibble for adult dogs. Supports muscle health, digestion, and a shiny coat.",
      price: 42.99,
      sku: "DOG-DF-003",
      image: pexels(1805164),
      rating: 4.7,
      reviewCount: 215,
      inStock: true,
      categoryId: categoryBySlug["dog-food"].id,
      brandId: brands[1].id,
      tagNames: ["dog", "food", "premium", "bestseller"],
    },
    {
      slug: "parrot-seed-mix",
      name: "Parrot Seed Mix",
      description:
        "A balanced blend of seeds, nuts, and dried fruit formulated for parrots and medium birds.",
      price: 18.5,
      sku: "BRD-SEED-004",
      image: pexels(1661174),
      rating: 4.6,
      reviewCount: 64,
      inStock: true,
      categoryId: categoryBySlug["bird-food"].id,
      brandId: brands[2].id,
      tagNames: ["bird", "food"],
    },
    {
      slug: "aquarium-fish-food",
      name: "Aquarium Fish Food",
      description:
        "Nutrient-rich tropical fish flakes that enhance color and support a healthy immune system.",
      price: 12.5,
      sku: "FISH-FD-005",
      image: pexels(128756),
      rating: 4.5,
      reviewCount: 42,
      inStock: true,
      categoryId: categoryBySlug["fish-food"].id,
      brandId: brands[4].id,
      tagNames: ["fish", "food"],
    },
    {
      slug: "interactive-dog-toy",
      name: "Interactive Dog Toy",
      description:
        "Durable rubber chew toy that keeps dogs entertained and supports dental health.",
      price: 19.99,
      oldPrice: 25.99,
      sku: "DOG-TOY-006",
      image: pexels(4587997),
      rating: 4.8,
      reviewCount: 156,
      inStock: true,
      categoryId: categoryBySlug["dog-toys"].id,
      brandId: brands[1].id,
      tagNames: ["dog", "toy", "interactive", "bestseller"],
    },
    {
      slug: "cozy-pet-bed",
      name: "Cozy Pet Bed",
      description:
        "Ultra-soft orthopedic pet bed with a washable cover and non-slip base for dogs and cats.",
      price: 59.99,
      sku: "PET-BED-007",
      image: pexels(1741207),
      rating: 4.9,
      reviewCount: 312,
      inStock: true,
      categoryId: categoryBySlug["dog-accessories"].id,
      brandId: brands[5].id,
      tagNames: ["bed", "dog", "cat", "premium"],
    },
    {
      slug: "leather-pet-collar",
      name: "Leather Pet Collar",
      description:
        "Genuine leather collar with a sturdy brass buckle. Adjustable and available in multiple sizes.",
      price: 22.0,
      sku: "PET-CLLR-008",
      image: pexels(1851164),
      rating: 4.7,
      reviewCount: 88,
      inStock: true,
      categoryId: categoryBySlug["dog-accessories"].id,
      brandId: brands[0].id,
      tagNames: ["dog", "cat", "collar"],
    },
    {
      slug: "kitten-starter-pack",
      name: "Kitten Starter Pack",
      description:
        "Starter bundle with kitten food, treats, and a soft toy — everything for your new arrival.",
      price: 39.99,
      oldPrice: 49.99,
      sku: "CAT-KIT-009",
      image: pexels(320014),
      rating: 4.8,
      reviewCount: 74,
      inStock: true,
      categoryId: categoryBySlug["cat-food"].id,
      brandId: brands[2].id,
      tagNames: ["cat", "treats", "food", "new-arrival"],
    },
    {
      slug: "stainless-steel-bowl",
      name: "Stainless Steel Bowl",
      description:
        "Rust-resistant stainless steel feeding bowl with a non-slip rubber base. Dishwasher safe.",
      price: 14.99,
      sku: "PET-BOWL-010",
      image: pexels(6234611),
      rating: 4.6,
      reviewCount: 53,
      inStock: true,
      categoryId: categoryBySlug["dog-accessories"].id,
      brandId: brands[4].id,
      tagNames: ["dog", "cat", "bowl"],
    },
    {
      slug: "pet-grooming-kit",
      name: "Pet Grooming Kit",
      description:
        "Complete grooming set with brush, nail clippers, and gentle shampoo for dogs and cats.",
      price: 29.99,
      sku: "PET-GRM-011",
      image: pexels(5732537),
      rating: 4.7,
      reviewCount: 119,
      inStock: true,
      categoryId: categoryBySlug["cat-grooming"].id,
      brandId: brands[3].id,
      tagNames: ["dog", "cat", "grooming"],
    },
    {
      slug: "cat-feather-wand",
      name: "Cat Feather Wand Toy",
      description:
        "Interactive feather wand toy that encourages exercise and satisfies your cat's hunting instincts.",
      price: 15.99,
      sku: "CAT-TOY-012",
      image: pexels(1170986),
      rating: 4.8,
      reviewCount: 91,
      inStock: true,
      categoryId: categoryBySlug["cat-toys"].id,
      brandId: brands[1].id,
      tagNames: ["cat", "toy", "interactive", "new-arrival"],
    },
    {
      slug: "dog-rope-tug-toy",
      name: "Dog Rope Tug Toy",
      description:
        "Heavy-duty cotton rope toy for tug-of-war and fetch. Great for medium and large breeds.",
      price: 16.49,
      sku: "DOG-TOY-013",
      image: pexels(4588077),
      rating: 4.6,
      reviewCount: 67,
      inStock: true,
      categoryId: categoryBySlug["dog-toys"].id,
      brandId: brands[0].id,
      tagNames: ["dog", "toy", "interactive"],
    },
    {
      slug: "goldfish-pellets",
      name: "Goldfish Pellets",
      description:
        "Slow-sinking pellets designed for goldfish and koi. Supports growth and vibrant coloration.",
      price: 9.99,
      sku: "FISH-PLT-014",
      image: pexels(96947),
      rating: 4.4,
      reviewCount: 38,
      inStock: true,
      categoryId: categoryBySlug["fish-food"].id,
      brandId: brands[4].id,
      tagNames: ["fish", "food"],
    },
    {
      slug: "bird-treat-sticks",
      name: "Bird Treat Sticks",
      description:
        "Honey seed treat sticks for cockatiels and parakeets. Enriched with vitamins and minerals.",
      price: 11.99,
      sku: "BRD-TRT-015",
      image: pexels(459460),
      rating: 4.5,
      reviewCount: 29,
      inStock: true,
      categoryId: categoryBySlug["bird-food"].id,
      brandId: brands[2].id,
      tagNames: ["bird", "treats", "food"],
    },
    {
      slug: "cat-grooming-brush",
      name: "Cat Grooming Brush",
      description:
        "Self-cleaning slicker brush that removes loose fur and reduces shedding for long-haired cats.",
      price: 18.99,
      sku: "CAT-GRM-016",
      image: pexels(6864019),
      rating: 4.7,
      reviewCount: 102,
      inStock: true,
      categoryId: categoryBySlug["cat-grooming"].id,
      brandId: brands[3].id,
      tagNames: ["cat", "grooming", "bestseller"],
    },
  ];

  const seedSlugs = products.map((item) => item.slug);
  await prisma.product.deleteMany({
    where: { slug: { notIn: seedSlugs } },
  });

  for (let i = 0; i < products.length; i++) {
    const { tagNames: productTagNames, ...productData } = products[i];
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        ...productData,
        sortOrder: i + 1,
      },
      create: {
        ...productData,
        sortOrder: i + 1,
      },
    });

    await prisma.productTag.deleteMany({ where: { productId: product.id } });

    for (const tagName of productTagNames ?? []) {
      if (tags[tagName]) {
        await prisma.productTag.create({
          data: {
            productId: product.id,
            tagId: tags[tagName].id,
          },
        });
      }
    }
  }

  console.log(`Created ${products.length} products`);

  // ─── Banners ──────────────────────────────────────────────────────────────
  await prisma.banner.deleteMany({});

  const banners = [
    {
      title: "Felt Cat Beds For Indoor Cats",
      subtitle: "Felt products that cats love",
      description: "Limited time offer",
      discount: "15%",
      image: pexels(320014),
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
      image: pexels(1108099),
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
      image: pexels(6864018),
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
      image: pexels(1805164),
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
      image: pexels(4587997),
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
      image: pexels(459460),
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
      image: pexels(1741207),
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
      image: pexels(6864019),
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
      image: pexels(1805164),
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
      image: pexels(1108099),
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
      image: pexels(4588077),
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
      update: post,
      create: post,
    });
  }

  console.log(`Created ${blogPosts.length} blog posts`);

  // ─── Testimonials ─────────────────────────────────────────────────────────
  await prisma.testimonial.deleteMany({});

  const testimonials = [
    {
      name: "John Alvy",
      role: "Pet Owner",
      avatar: pexels(2379004, 200),
      content:
        "Petmania has completely transformed how I shop for my pets. The quality is outstanding and delivery is always on time. My dogs absolutely love the treats!",
      rating: 5,
      sortOrder: 1,
    },
    {
      name: "Sarah Jenkins",
      role: "Cat Lover",
      avatar: pexels(774909, 200),
      content:
        "Finally a pet shop that understands what cats need. The organic cat food selection is amazing and my kitty has never been healthier.",
      rating: 5,
      sortOrder: 2,
    },
    {
      name: "Michael Brown",
      role: "Dog Trainer",
      avatar: pexels(1222271, 200),
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
  await prisma.galleryImage.deleteMany({});

  const galleryImages = [
    {
      src: pexels(1108099),
      alt: "Happy pets",
      link: "https://instagram.com",
      sortOrder: 1,
    },
    {
      src: pexels(1805164),
      alt: "Dogs playing",
      link: "https://instagram.com",
      sortOrder: 2,
    },
    {
      src: pexels(320014),
      alt: "Cute cat",
      link: "https://instagram.com",
      sortOrder: 3,
    },
    {
      src: pexels(4587997),
      alt: "Pet toys",
      link: "https://instagram.com",
      sortOrder: 4,
    },
    {
      src: pexels(6864018),
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
