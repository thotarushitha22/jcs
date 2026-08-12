import { useEffect, useState } from "react";
import { fetchProducts, fetchCategories } from "../api/products";
import ProductCard from "../components/ProductCard";
import HeroCarousel from "../components/HeroCarousel";
import HowItWorks from "../components/HowItWorks";
import WhyChooseUs from "../components/WhyChooseUs";
import CtaBanner from "../components/CtaBanner";
import "./Home.css";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("relevance");

  // Categories only need to load once.
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Products reload whenever a filter changes — the backend does the
  // filtering/sorting, so this is a real API call each time, not local logic.
  useEffect(() => {
    setLoading(true);
    setError(null);

    const sortParam = sort === "relevance" ? undefined : sort;
    const categoryParam = activeCategory === "all" ? undefined : activeCategory;

    fetchProducts({ category: categoryParam, search: search || undefined, sort: sortParam })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeCategory, search, sort]);

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
          <h2 className="catalog-heading">Best Sellers</h2>
          <div className="catalog-toolbar">
            <span className="mono">{loading ? "Loading…" : `${total} results`}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
            </select>
          </div>

          {error && <p className="empty-state">Couldn't load products: {error}</p>}

          {!error && !loading && products.length === 0 ? (
            <p className="empty-state">No listings match that search. Try a different brand or category.</p>
          ) : (
            <div className="grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
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