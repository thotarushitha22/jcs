import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import { groupProducts } from "../utils/variants";
import BannerRail from "../components/BannerRail";
import HowItWorks from "../components/HowItWorks";
import WhyChooseUs from "../components/WhyChooseUs";
import CtaBanner from "../components/CtaBanner";
import "./Home.css";

export default function Home() {
  const [searchParams] = useSearchParams();
  // Get the search query from the URL (e.g., "?search=apple")
  const urlSearchQuery = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all products from the backend
        const data = await fetchProducts();

        if (cancelled) return;
        const productList = Array.isArray(data) ? data : data?.products || data?.data || [];
        setProducts(Array.isArray(productList) ? productList : []);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Unable to load products");
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProducts();
    return () => { cancelled = true; };
  }, []);

  // Filter the products based on the search query
  const displayProducts = useMemo(() => {
    let result = [...products];

    if (urlSearchQuery.trim()) {
      const q = urlSearchQuery.toLowerCase().trim();
      result = result.filter((product) => {
        const title = String(product.title || product.name || "").toLowerCase();
        const brand = String(product.brand || "").toLowerCase();
        const sku = String(product.sku || "").toLowerCase();
        const model = String(product.model || "").toLowerCase();
        
        return title.includes(q) || brand.includes(q) || sku.includes(q) || model.includes(q);
      });
    }

    return groupProducts(result);
  }, [products, urlSearchQuery]);

  return (
    <div className="page">
      <BannerRail />

      <section style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto", marginBottom: "96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: 0 }}>
            {urlSearchQuery ? `Search Results for "${urlSearchQuery}"` : "Featured Products"}
          </h2>
          
          <Link 
            to="/products"
            style={{ 
              textDecoration: "none", color: "#2563eb", fontSize: "16px", fontWeight: "600", 
              display: "flex", alignItems: "center", gap: "6px" 
            }}
          >
            View All →
          </Link>
        </div>

        {error && <p style={{ color: "red" }}>Couldn't load products: {error}</p>}

        {loading ? (
          <p>Loading products...</p>
        ) : displayProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: "16px", color: "#6b7280" }}>No products found matching "{urlSearchQuery}".</p>
            <Link to="/" style={{ display: "inline-block", marginTop: "12px", padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", borderRadius: "6px", textDecoration: "none" }}>
              Clear Search
            </Link>
          </div>
        ) : (
          <div 
            className="grid" 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", 
              gap: "20px" 
            }}
          >
            {/* 
              If searching, show all results. 
              If not searching, show only 10 (2 rows) on the homepage.
            */}
            {(urlSearchQuery ? displayProducts : displayProducts.slice(0, 10)).map((product, index) => (
              <ProductCard key={product.id || product._id || index} product={product} />
            ))}
          </div>
        )}
      </section>

      <HowItWorks />
      <WhyChooseUs />
      <CtaBanner />
    </div>
  );
}