import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import HeroCarousel from "../components/HeroCarousel";
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

export default function Home() {
  const [searchParams] = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";

  const [categories] = useState(myCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("all");
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
    if (typeof product.category === "string") {
      return normalizeCategory(product.category);
    }
    if (product.category && typeof product.category === "object") {
      return normalizeCategory(
        product.category.name ||
          product.category.title ||
          product.category.slug ||
          product.category.category
      );
    }
    if (product.categoryName) return normalizeCategory(product.categoryName);
    if (product.categorySlug) return normalizeCategory(product.categorySlug);
    return "";
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

    if (activeCategory !== "all") {
      const selectedCategory = normalizeCategory(activeCategory);

      resultList = resultList.filter((product) => {
        const productCategory = getProductCategory(product);
        if (!productCategory) return false;

        if (productCategory === selectedCategory) return true;

        const selectedSingular = selectedCategory.endsWith("s")
          ? selectedCategory.slice(0, -1)
          : selectedCategory;

        const productSingular = productCategory.endsWith("s")
          ? productCategory.slice(0, -1)
          : productCategory;

        if (productSingular === selectedSingular) return true;

        const categoryAliases = {
          smartphones: ["smartphone", "smart phones", "smart phone", "mobile", "mobiles", "mobile phones", "cell phones"],
          laptops: ["laptop", "notebook", "notebooks", "notebook computer"],
          tvs: ["tv", "television", "televisions", "smart tv", "smart televisions"],
          accessories: ["accessory", "accessories", "audio", "mobile accessories", "computer accessories", "electronics accessories"],
        };

        const aliases = categoryAliases[selectedCategory] || [];
        return aliases.some((alias) => normalizeCategory(alias) === productCategory);
      });
    }

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

    if (sort === "price-asc") {
      resultList.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (sort === "price-desc") {
      resultList.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return resultList;
  }, [products, activeCategory, urlSearchQuery, sort]);

  return (
    <div className="page">
      <HeroCarousel />

      <section className="catalog">
        <aside className="filters" data-tour="categories">
          <h4>Category</h4>
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
              No listings match your search or category. Try clearing filters.
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