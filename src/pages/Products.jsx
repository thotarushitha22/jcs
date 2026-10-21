import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  
  // Read search from URL (from top navbar)
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
  
  // Sidebar search state
  const [sidebarSearch, setSidebarSearch] = useState(urlSearchQuery);

  // Keep sidebar search box synced with URL
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

    // 1. Category Filter
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

    // 2. Brand Filter
    if (activeBrand !== "all") {
      resultList = resultList.filter((product) => {
        const productBrand = normalizeCategory(product.brand || product.manufacturer || product.title || product.name || "");
        return productBrand.includes(normalizeCategory(activeBrand));
      });
    }

    // 3. Price Filter
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

    // 5. SEARCH FILTER (Uses URL first, then sidebar)
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

    // 6. Sorting
    if (sort === "price-asc") resultList.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "price-desc") resultList.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

    return resultList;
  }, [products, activeCategory, activeBrand, activePriceRange, activeDiscount, urlSearchQuery, sidebarSearch, sort]);

  const displayProducts = useMemo(() => groupProducts(filteredProducts), [filteredProducts]);

  // Handle typing in sidebar search
  const handleSidebarSearch = (e) => {
    const val = e.target.value;
    setSidebarSearch(val);
    if (val.trim()) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  return (
    /* Main container - locked to screen height */
    <div style={{ backgroundColor: "#f8fafc", height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* Fixed Top Bar */}
      <div style={{ maxWidth: "1440px", width: "100%", margin: "0 auto", padding: "24px 24px 10px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "40px", height: "40px", borderRadius: "50%", 
              border: "1px solid #e2e8f0", backgroundColor: "#ffffff", 
              cursor: "pointer", color: "#0f172a", fontSize: "18px", fontWeight: "bold",
              transition: "all 0.2s ease", flexShrink: 0
            }}
          >
            &lt;
          </button>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
            {urlSearchQuery ? `Search Results for "${urlSearchQuery}"` : "Products"}
          </h2>
        </div>
      </div>

      {/* Main Content Area (Sidebar + Grid) */}
      <div style={{ maxWidth: "1440px", width: "100%", margin: "0 auto", display: "flex", gap: "32px", padding: "0 24px 24px 24px", flex: 1, overflow: "hidden" }}>
        
        {/* SIDEBAR (Fixed height, scrolls if needed) */}
        <aside 
          style={{ 
            width: "280px", 
            flexShrink: 0, 
            backgroundColor: "#fff", 
            borderRadius: "12px", 
            border: "1px solid #e5e7eb", 
            padding: "24px",
            overflowY: "auto",
            height: "100%"
          }}
        >
          {/* Sort Dropdown */}
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)} 
            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "20px", outline: "none", fontSize: "14px" }}
          >
            <option value="relevance">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          {/* Search Bar */}
          <div style={{ position: "relative", marginBottom: "28px" }}>
            <svg style={{ position: "absolute", left: "10px", top: "10px", color: "#9ca3af" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={sidebarSearch}
              onChange={handleSidebarSearch}
              style={{ width: "100%", padding: "10px 10px 10px 34px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", fontSize: "14px" }}
            />
          </div>

          {/* Categories */}
          <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>Category</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
              <input type="radio" name="category" checked={activeCategory === "all"} onChange={() => setActiveCategory("all")} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} />
              All categories
            </label>
            {categories.map((category) => (
              <label key={category.id} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                <input type="radio" name="category" checked={activeCategory === category.slug} onChange={() => setActiveCategory(category.slug)} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} />
                {category.name}
              </label>
            ))}
          </div>

          {/* Brands */}
          <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>Brands</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
              <input type="radio" name="brand" checked={activeBrand === "all"} onChange={() => setActiveBrand("all")} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} />
              All Brands
            </label>
            {availableBrands.map((brand) => (
              <label key={brand} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                <input type="radio" name="brand" checked={activeBrand === brand} onChange={() => setActiveBrand(brand)} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} />
                {brand}
              </label>
            ))}
          </div>

          {/* Price */}
          <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>Price</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            {[
              { label: "Any Price", val: "all" },
              { label: "Under ₹1,000", val: "under-1000" },
              { label: "₹1,000 - ₹5,000", val: "1000-5000" },
              { label: "₹5,000 - ₹10,000", val: "5000-10000" },
              { label: "₹10,000 - ₹20,000", val: "10000-20000" },
              { label: "Over ₹20,000", val: "over-20000" }
            ].map((item) => (
              <label key={item.val} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                <input type="radio" name="price" checked={activePriceRange === item.val} onChange={() => setActivePriceRange(item.val)} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} />
                {item.label}
              </label>
            ))}
          </div>

          {/* Discount */}
          <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#111827" }}>Discount</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "All Discounts", val: "all" },
              { label: "10% Off or more", val: "10" },
              { label: "25% Off or more", val: "25" },
              { label: "35% Off or more", val: "35" },
              { label: "50% Off or more", val: "50" }
            ].map((item) => (
              <label key={item.val} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                <input type="radio" name="discount" checked={activeDiscount === item.val} onChange={() => setActiveDiscount(item.val)} style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} />
                {item.label}
              </label>
            ))}
          </div>
        </aside>

        {/* PRODUCTS GRID (Only this scrolls) */}
        <div style={{ flex: 1, minWidth: 0, overflowY: "auto", height: "100%", paddingRight: "10px" }}>
          
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px", paddingBottom: "40px" }}>
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