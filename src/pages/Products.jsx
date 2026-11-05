import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { fetchProducts } from "../api/products";
import ProductCard from "../components/ProductCard";
import { groupProducts } from "../utils/variants";
import "./Home.css";

const myCategories = [
  { id: "smartphones", name: "Smartphones", slug: "smartphones" },
  { id: "laptops", name: "Laptops", slug: "laptops" },
  { id: "tvs", name: "TVs", slug: "tvs" },
  { id: "accessories", name: "Accessories", slug: "accessories" },
];

const availableBrands = ["Samsung", "Apple", "OnePlus", "Nokia", "Motorola", "Redmi", "realme", "vivo"];

export default function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const urlSearchQuery = searchParams.get("search") || "";

  const [categories] = useState(myCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeBrand, setActiveBrand] = useState("all");
  const [activePriceRange, setActivePriceRange] = useState("all");
  const [activeDiscount, setActiveDiscount] = useState("all");
  const [sort, setSort] = useState("relevance");
  
  const [sidebarSearch, setSidebarSearch] = useState(urlSearchQuery);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    price: true,
    discount: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    setSidebarSearch(urlSearchQuery);
  }, [urlSearchQuery]);

  const normalizeCategory = (value) => {
    if (value == null) return "";
    return String(value).toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  };

  const hasWord = (text, words) =>
    words.some((w) => new RegExp(`(^|[^a-z0-9])${w}s?($|[^a-z0-9])`).test(text));

  const getProductCategory = (product) => {
    if (!product) return "";
    const textToCheck = normalizeCategory(`${product.title || product.name || ""} ${product.brand || ""} ${product.model || ""} ${product.description || ""}`);
    const has = (word) => hasWord(textToCheck, [word]);

    if (has("laptop") || has("notebook") || has("macbook")) return "laptops";
    if (has("tv") || has("television") || has("led tv")) return "tvs";
    if (has("accessory") || has("headphones") || has("charger") || has("case") || has("audio")) return "accessories";
    if (has("phone") || has("mobile") || has("smartphone") || has("cell") || has("5g") || has("4g") || has("moto") || has("galaxy") || has("iphone") || has("redmi") || has("vivo") || has("oppo") || has("oneplus") || has("realme") || has("nokia") || has("samsung")) return "smartphones";
    
    return normalizeCategory(product.category || "uncategorized");
  };

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        if (cancelled) return;
        const productList = Array.isArray(data) ? data : data?.products || data?.data || [];
        setProducts(Array.isArray(productList) ? productList : []);
      } catch (err) {
        if (cancelled) return;
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProducts();
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    let resultList = [...products];

    if (activeCategory !== "all") {
      const selectedCategory = normalizeCategory(activeCategory);
      const categoryAliases = {
        smartphones: ["smartphone", "mobile", "cell", "phone", "moto", "galaxy", "iphone", "redmi", "vivo", "oppo", "oneplus", "realme", "nokia", "5g", "4g"],
        laptops: ["laptop", "notebook", "computer", "macbook"],
        tvs: ["tv", "television", "led tv"],
        accessories: ["accessory", "audio", "headphones", "charger", "case"],
      };
      const activeAliases = categoryAliases[activeCategory] || [selectedCategory];

      resultList = resultList.filter((product) => {
        const productCategory = getProductCategory(product);
        const productTitle = normalizeCategory(product.title || product.name || "");
        return activeAliases.some((alias) => productCategory.includes(alias) || hasWord(productTitle, [alias])) || productCategory.includes(selectedCategory);
      });
    }

    if (activeBrand !== "all") {
      resultList = resultList.filter((product) => {
        const productBrand = normalizeCategory(product.brand || product.manufacturer || product.title || product.name || "");
        return productBrand.includes(normalizeCategory(activeBrand));
      });
    }

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

    if (activeDiscount !== "all") {
      resultList = resultList.filter((product) => {
        const discount = Number(product.discount || product.discountPercentage || product.off || 0);
        return discount >= Number(activeDiscount);
      });
    }

    const query = urlSearchQuery.trim() || sidebarSearch.trim();
    if (query) {
      const q = normalizeCategory(query);
      resultList = resultList.filter((product) => {
        const title = normalizeCategory(product.title || product.name || "");
        const brand = normalizeCategory(product.brand || "");
        const sku = normalizeCategory(product.sku || "");
        const model = normalizeCategory(product.model || "");
        return title.includes(q) || brand.includes(q) || sku.includes(q) || model.includes(q);
      });
    }

    if (sort === "price-asc") resultList.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "price-desc") resultList.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

    return resultList;
  }, [products, activeCategory, activeBrand, activePriceRange, activeDiscount, urlSearchQuery, sidebarSearch, sort]);

  const displayProducts = useMemo(() => groupProducts(filteredProducts), [filteredProducts]);

  const handleSidebarSearch = (e) => {
    const val = e.target.value;
    setSidebarSearch(val);
    if (val.trim()) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const FilterSection = ({ title, sectionKey, children }) => (
    <div style={{ marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "transparent", border: "none", padding: "10px 0",
          fontSize: "15px", fontWeight: "700", color: "#111827", cursor: "pointer", textAlign: "left"
        }}
      >
        {title}
        {openSections[sectionKey] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <div style={{ display: openSections[sectionKey] ? "flex" : "none", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", position: "relative" }}>
      
      {/* Top Bar */}
      <div style={{ maxWidth: "1440px", width: "100%", margin: "0 auto", padding: "24px 24px 10px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button 
              onClick={() => navigate(-1)}
              style={{ 
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "40px", height: "40px", borderRadius: "50%", 
                border: "1px solid #e2e8f0", backgroundColor: "#ffffff", 
                cursor: "pointer", color: "#0f172a", fontSize: "18px", fontWeight: "bold", flexShrink: 0
              }}
            >
              &lt;
            </button>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              {urlSearchQuery ? `Search for "${urlSearchQuery}"` : "Products"}
            </h2>
          </div>

          {/* 🚨 Mobile Filter Button */}
          <button 
            className="mobile-filter-btn"
            onClick={() => setIsMobileFilterOpen(true)}
            style={{
              display: "none", alignItems: "center", gap: "6px", backgroundColor: "#fff",
              padding: "8px 14px", borderRadius: "6px", border: "1px solid #e2e8f0",
              fontWeight: "600", fontSize: "14px", cursor: "pointer"
            }}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: "1440px", width: "100%", margin: "0 auto", display: "flex", gap: "32px", padding: "0 24px 24px 24px", flex: 1 }}>
        
        {/* 🚨 SIDEBAR (Becomes a fixed drawer on mobile) */}
        <aside 
          className={`products-sidebar ${isMobileFilterOpen ? "mobile-open" : ""}`}
          style={{ 
            width: "280px", flexShrink: 0, backgroundColor: "#fff", borderRadius: "12px", 
            border: "1px solid #e5e7eb", padding: "24px", overflowY: "auto"
          }}
        >
          {/* Mobile Close Button */}
          <div className="mobile-close-filter" style={{ display: "none", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Filters</h3>
            <button onClick={() => setIsMobileFilterOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={24} />
            </button>
          </div>

          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)} 
            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "20px", outline: "none", fontSize: "14px" }}
          >
            <option value="relevance">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          <div style={{ position: "relative", marginBottom: "20px" }}>
            <input 
              type="text" placeholder="Search products..." value={sidebarSearch} onChange={handleSidebarSearch}
              style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", fontSize: "14px" }}
            />
          </div>

          <FilterSection title="Category" sectionKey="categories">
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
              <input type="radio" name="category" checked={activeCategory === "all"} onChange={() => setActiveCategory("all")} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} /> All categories
            </label>
            {categories.map((category) => (
              <label key={category.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <input type="radio" name="category" checked={activeCategory === category.slug} onChange={() => setActiveCategory(category.slug)} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} /> {category.name}
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Brands" sectionKey="brands">
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
              <input type="radio" name="brand" checked={activeBrand === "all"} onChange={() => setActiveBrand("all")} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} /> All Brands
            </label>
            {availableBrands.map((brand) => (
              <label key={brand} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <input type="radio" name="brand" checked={activeBrand === brand} onChange={() => setActiveBrand(brand)} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} /> {brand}
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Price" sectionKey="price">
            {[
              { label: "Any Price", val: "all" },
              { label: "Under ₹1,000", val: "under-1000" },
              { label: "₹1,000 - ₹5,000", val: "1000-5000" },
              { label: "Over ₹20,000", val: "over-20000" }
            ].map((item) => (
              <label key={item.val} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <input type="radio" name="price" checked={activePriceRange === item.val} onChange={() => setActivePriceRange(item.val)} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} /> {item.label}
              </label>
            ))}
          </FilterSection>
        </aside>

        {/* Overlay for mobile (darkens background) */}
        {isMobileFilterOpen && (
          <div 
            onClick={() => setIsMobileFilterOpen(false)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999 }}
          />
        )}

        {/* PRODUCTS GRID */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500" }}>
              {loading ? "Loading…" : `${displayProducts.length} results`}
            </span>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : displayProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <p>No products found matching "{urlSearchQuery}".</p>
              <button 
                onClick={() => { setSidebarSearch(""); setSearchParams({}); }} 
                style={{ marginTop: "12px", padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px", paddingBottom: "40px" }}>
              {displayProducts.map((product, index) => (
                <ProductCard key={product.id || product._id || index} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}