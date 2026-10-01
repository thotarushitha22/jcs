import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import BannerRail from "../components/BannerRail";
import HowItWorks from "../components/HowItWorks";
import WhyChooseUs from "../components/WhyChooseUs";
import CtaBanner from "../components/CtaBanner";
import "./Home.css";

const myCategories = [
  { id: "smartphones", name: "Smartphones", slug: "smartphones" },
  { id: "laptops", name: "Laptops", slug: "laptops" },
  { id: "tvs", name: "TVs", slug: "tvs" },
  { id: "accessories", name: "Accessories", slug: "accessories" },
];

const availableBrands = ["Samsung", "Apple", "OnePlus", "Nokia", "Motorola", "Redmi", "realme", "vivo"];

export default function Home() {
  const [searchParams] = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";

  const [categories] = useState(myCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeBrand, setActiveBrand] = useState("all");
  const [activePriceRange, setActivePriceRange] = useState("all");
  const [activeDiscount, setActiveDiscount] = useState("all");
  const [sort, setSort] = useState("relevance");

  const normalizeCategory = (value) => {
    if (value == null) return "";
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  };

  const getProductCategory = (product) => {
    if (!product) return "";
    
    // 1. Check explicit category fields first[cite: 11]
    const possibleValues = [
      product.category,
      product.categoryName,
      product.categorySlug,
      product.type,
      product.department
    ];

    for (const val of possibleValues) {
      if (!val) continue;
      if (typeof val === "string") {
        const normalized = normalizeCategory(val);
        if (normalized && normalized !== "uncategorized" && normalized !== "general" && normalized !== "none") {
          return normalized;
        }
      }
      if (typeof val === "object") {
        const nested = val.name || val.title || val.slug || val.category || val.label;
        if (nested && typeof nested === "string") {
          const normalized = normalizeCategory(nested);
          if (normalized && normalized !== "uncategorized" && normalized !== "general" && normalized !== "none") {
            return normalized;
          }
        }
      }
    }

    // 2. Comprehensive Fallback: Check Laptops FIRST so they don't get misclassified as phones
    const textToCheck = normalizeCategory(
      `${product.title || product.name || ""} ${product.brand || ""} ${product.model || ""} ${product.description || ""}`
    );

    if (
      textToCheck.includes("laptop") || 
      textToCheck.includes("notebook") || 
      textToCheck.includes("macbook") || 
      textToCheck.includes("ebook") ||
      textToCheck.includes("chromebook")
    ) {
      return "laptops";
    }

    if (textToCheck.includes("tv") || textToCheck.includes("television") || textToCheck.includes("led")) {
      return "tvs";
    }

    if (textToCheck.includes("accessory") || textToCheck.includes("headphones") || textToCheck.includes("charger") || textToCheck.includes("case")) {
      return "accessories";
    }

    // Now check Smartphones safely
    if (
      textToCheck.includes("phone") || 
      textToCheck.includes("mobile") || 
      textToCheck.includes("smartphone") || 
      textToCheck.includes("cell") || 
      textToCheck.includes("5g") || 
      textToCheck.includes("4g") ||
      textToCheck.includes("moto") || 
      textToCheck.includes("galaxy") || 
      textToCheck.includes("poco") || 
      textToCheck.includes("iphone") || 
      textToCheck.includes("redmi") || 
      textToCheck.includes("vivo") || 
      textToCheck.includes("oppo") ||
      textToCheck.includes("oneplus") ||
      textToCheck.includes("realme") ||
      textToCheck.includes("nokia") ||
      textToCheck.includes("samsung")
    ) {
      return "smartphones";
    }

    return normalizeCategory(product.category || "uncategorized");
  };

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const sortParam = sort === "relevance" ? undefined : sort;
        const data = await fetchProducts({
          search: urlSearchQuery || undefined,
          sort: sortParam,
        });

        if (cancelled) return;

        const productList = Array.isArray(data)
          ? data
          : data?.products || data?.data || [];

        setProducts(Array.isArray(productList) ? productList : []);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load products:", err);
        setError(err?.message || "Unable to load products");
        setProducts([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [urlSearchQuery, sort]);

  const filteredProducts = useMemo(() => {
    let resultList = [...products];

    // 1. Category Filter
    if (activeCategory !== "all") {
      const selectedCategory = normalizeCategory(activeCategory);

      const categoryAliases = {
        smartphones: ["smartphone", "smart phones", "smart phone", "mobile", "mobiles", "mobile phones", "cell phones", "phone", "phones", "moto", "galaxy", "poco", "iphone", "redmi", "vivo", "oppo", "oneplus", "realme", "nokia", "5g", "4g"],
        laptops: ["laptop", "laptops", "notebook", "notebooks", "notebook computer", "computer", "computers", "macbook", "ebook", "chromebook"],
        tvs: ["tv", "tvs", "television", "televisions", "smart tv", "smart televisions", "led tv"],
        accessories: ["accessory", "accessories", "audio", "mobile accessories", "computer accessories", "electronics accessories"],
      };

      const activeAliases = categoryAliases[activeCategory] || [selectedCategory];

      resultList = resultList.filter((product) => {
        const productCategory = getProductCategory(product);
        const productTitle = normalizeCategory(product.title || product.name || "");
        
        return activeAliases.some(
          (alias) => productCategory.includes(alias) || productTitle.includes(alias)
        ) || productCategory.includes(selectedCategory);
      });
    }

    // 2. Brand Filter
    if (activeBrand !== "all") {
      resultList = resultList.filter((product) => {
        const productBrand = normalizeCategory(
          product.brand || product.manufacturer || product.title || product.name || ""
        );
        return productBrand.includes(normalizeCategory(activeBrand));
      });
    }

    // 3. Price Range Filter
    if (activePriceRange !== "all") {
      resultList = resultList.filter((product) => {
        const price = Number(product.price || product.cost || 0);
        if (activePriceRange === "under-1000") return price < 1000;
        if (activePriceRange === "1000-5000") return price >= 1000 && price <= 5000;
        if (activePriceRange === "5000-10000") return price > 5000 && price <= 10000;
        if (activePriceRange === "10000-20000") return price > 10000 && price <= 20000;
        if (activePriceRange === "over-20000") return price > 20000;
        return true;
      });
    }

    // 4. Discount Filter
    if (activeDiscount !== "all") {
      resultList = resultList.filter((product) => {
        const discount = Number(product.discount || product.discountPercentage || product.off || 0);
        return discount >= Number(activeDiscount);
      });
    }

    // 5. Search Query Filter
    if (urlSearchQuery.trim()) {
      const q = normalizeCategory(urlSearchQuery);

      resultList = resultList.filter((product) => {
        const title = normalizeCategory(product.title || product.name || "");
        const brand = normalizeCategory(product.brand || "");
        const sku = normalizeCategory(product.sku || "");
        const model = normalizeCategory(product.model || "");
        const category = getProductCategory(product);

        return (
          title.includes(q) ||
          brand.includes(q) ||
          sku.includes(q) ||
          model.includes(q) ||
          category.includes(q)
        );
      });
    }

    // Sorting
    if (sort === "price-asc") {
      resultList.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (sort === "price-desc") {
      resultList.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return resultList;
  }, [products, activeCategory, activeBrand, activePriceRange, activeDiscount, urlSearchQuery, sort]);

  return (
    <div className="page">
      <BannerRail />

      <section className="catalog">
        {/* Multi-tier Sidebar Filter Box */}
        <aside className="filters" data-tour="categories">
          <h4>Category</h4>
          <div className="filter-group">
            <button
              className={`filter-item ${activeCategory === "all" ? "active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`filter-item ${activeCategory === category.slug ? "active" : ""}`}
                onClick={() => setActiveCategory(category.slug)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <h4>Brands</h4>
          <div className="filter-group">
            <button
              className={`filter-item ${activeBrand === "all" ? "active" : ""}`}
              onClick={() => setActiveBrand("all")}
            >
              All Brands
            </button>
            {availableBrands.map((brand) => (
              <button
                key={brand}
                className={`filter-item ${activeBrand === brand ? "active" : ""}`}
                onClick={() => setActiveBrand(brand)}
              >
                {brand}
              </button>
            ))}
          </div>

          <h4>Price</h4>
          <div className="filter-group">
            <button
              className={`filter-item ${activePriceRange === "all" ? "active" : ""}`}
              onClick={() => setActivePriceRange("all")}
            >
              Any Price
            </button>
            <button
              className={`filter-item ${activePriceRange === "under-1000" ? "active" : ""}`}
              onClick={() => setActivePriceRange("under-1000")}
            >
              Under ₹1,000
            </button>
            <button
              className={`filter-item ${activePriceRange === "1000-5000" ? "active" : ""}`}
              onClick={() => setActivePriceRange("1000-5000")}
            >
              ₹1,000 - ₹5,000
            </button>
            <button
              className={`filter-item ${activePriceRange === "5000-10000" ? "active" : ""}`}
              onClick={() => setActivePriceRange("5000-10000")}
            >
              ₹5,000 - ₹10,000
            </button>
            <button
              className={`filter-item ${activePriceRange === "10000-20000" ? "active" : ""}`}
              onClick={() => setActivePriceRange("10000-20000")}
            >
              ₹10,000 - ₹20,000
            </button>
            <button
              className={`filter-item ${activePriceRange === "over-20000" ? "active" : ""}`}
              onClick={() => setActivePriceRange("over-20000")}
            >
              Over ₹20,000
            </button>
          </div>

          <h4>Discount</h4>
          <div className="filter-group">
            <button
              className={`filter-item ${activeDiscount === "all" ? "active" : ""}`}
              onClick={() => setActiveDiscount("all")}
            >
              All Discounts
            </button>
            <button
              className={`filter-item ${activeDiscount === "10" ? "active" : ""}`}
              onClick={() => setActiveDiscount("10")}
            >
              10% Off or more
            </button>
            <button
              className={`filter-item ${activeDiscount === "25" ? "active" : ""}`}
              onClick={() => setActiveDiscount("25")}
            >
              25% Off or more
            </button>
            <button
              className={`filter-item ${activeDiscount === "35" ? "active" : ""}`}
              onClick={() => setActiveDiscount("35")}
            >
              35% Off or more
            </button>
            <button
              className={`filter-item ${activeDiscount === "50" ? "active" : ""}`}
              onClick={() => setActiveDiscount("50")}
            >
              50% Off or more
            </button>
          </div>
        </aside>

        <div className="catalog-main">
          <h2 className="catalog-heading">
            {urlSearchQuery
              ? `Search Results for "${urlSearchQuery}"`
              : activeCategory === "all"
              ? "Best Sellers"
              : categories.find((cat) => cat.slug === activeCategory)?.name || "Best Sellers"}
          </h2>

          <div className="catalog-toolbar">
            <span className="mono">
              {loading ? "Loading…" : `${filteredProducts.length} results`}
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
            </select>
          </div>

          {error && (
            <p className="empty-state">Couldn't load products: {error}</p>
          )}

          {!error && !loading && filteredProducts.length === 0 ? (
            <p className="empty-state">
              No listings match your selected filters. Try resetting filters.
            </p>
          ) : (
            <div className="grid">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id || product._id || index}
                  product={product}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <HowItWorks />
      <WhyChooseUs />
      <CtaBanner />
    </div>
  );
}