import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom"; // 1. Import useSearchParams
import { fetchProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import HeroCarousel from "../components/HeroCarousel";
import HowItWorks from "../components/HowItWorks";
import WhyChooseUs from "../components/WhyChooseUs";
import CtaBanner from "../components/CtaBanner";
import "./Home.css";

// Your exact custom categories
const myCategories = [
  { id: "smartphones", name: "Smartphones", slug: "smartphones" },
  { id: "laptops", name: "Laptops", slug: "laptops" },
  { id: "tvs", name: "TVs", slug: "tvs" },
  { id: "accessories", name: "Accessories", slug: "accessories" },
];

export default function Home() {
  const [searchParams] = useSearchParams(); // 2. Initialize search params
  const urlSearchQuery = searchParams.get("search") || ""; // Get ?search= from URL

  const [categories] = useState(myCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState("relevance");

  // Fetch products when API params change (including URL search query)
  useEffect(() => {
    setLoading(true);
    setError(null);

    const sortParam = sort === "relevance" ? undefined : sort;
    const categoryParam = activeCategory === "all" ? undefined : activeCategory;

    fetchProducts({ 
      category: categoryParam, 
      search: urlSearchQuery || undefined, 
      sort: sortParam 
    })
      .then((data) => {
        const productList = Array.isArray(data) ? data : (data?.products || data?.data || []);
        setProducts(productList);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeCategory, urlSearchQuery, sort]);

  // Client-side filtering ensures instant & robust matching (category + local search fallback)
  const filteredProducts = useMemo(() => {
    let resultList = [...products];

    // Filter by category if not "all"
    if (activeCategory !== "all") {
      resultList = resultList.filter((product) => {
        if (!product.category) return false;
        
        const prodCategory = String(product.category).toLowerCase().trim();
        const selected = activeCategory.toLowerCase().trim();

        return (
          prodCategory === selected ||
          prodCategory.startsWith(selected) ||
          selected.startsWith(prodCategory)
        );
      });
    }

    // Optional extra client-side safety filter for title, brand, or SKU matching
    if (urlSearchQuery.trim()) {
      const q = urlSearchQuery.toLowerCase().trim();
      resultList = resultList.filter((product) => {
        const title = (product.title || product.name || "").toLowerCase();
        const brand = (product.brand || "").toLowerCase();
        const sku = (product.sku || "").toLowerCase();
        return title.includes(q) || brand.includes(q) || sku.includes(q);
      });
    }

    return resultList;
  }, [products, activeCategory, urlSearchQuery]);

  return (
    <div className="page">
      <HeroCarousel />

      <section className="catalog">
        <aside className="filters">
          <h4>Category</h4>
          <button
            className={`filter-item ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`filter-item ${activeCategory === c.slug ? "active" : ""}`}
              onClick={() => setActiveCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </aside>

        <div className="catalog-main">
          <h2 className="catalog-heading">
            {urlSearchQuery
              ? `Search Results for "${urlSearchQuery}"`
              : activeCategory === "all"
              ? "Best Sellers"
              : categories.find((c) => c.slug === activeCategory)?.name || "Best Sellers"}
          </h2>
          
          <div className="catalog-toolbar">
            <span className="mono">{loading ? "Loading…" : `${filteredProducts.length} results`}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
            </select>
          </div>

          {error && <p className="empty-state">Couldn't load products: {error}</p>}

          {!error && !loading && filteredProducts.length === 0 ? (
            <p className="empty-state">No listings match your search or category. Try clearing filters.</p>
          ) : (
            <div className="grid">
              {filteredProducts.map((p, index) => (
                <ProductCard key={p.id || p._id || index} product={p} />
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