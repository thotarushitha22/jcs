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
  const [searchParams] = useSearchParams();
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
  const [sidebarSearch, setSidebarSearch] = useState("");

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
        const data = await fetchProducts({ search: urlSearchQuery || undefined });
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
  }, [urlSearchQuery]);

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

    if (sidebarSearch.trim()) {
      const q = normalizeCategory(sidebarSearch);
      resultList = resultList.filter((product) => {
        const title = normalizeCategory(product.title || product.name || "");
        return title.includes(q);
      });
    }

    if (sort === "price-asc") resultList.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "price-desc") resultList.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

    return resultList;
  }, [products, activeCategory, activeBrand, activePriceRange, activeDiscount, sidebarSearch, sort]);

  const displayProducts = useMemo(() => groupProducts(filteredProducts), [filteredProducts]);

  return (
    /* Increased padding here to give space around the whole layout */
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "32px 24px" }}>
      
      {/* Increased max-width and gap between sidebar and products */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", display: "flex", gap: "32px", alignItems: "flex-start" }}>
        
        {/* SIDEBAR */}
        <aside 
          style={{ 
            width: "280px", 
            flexShrink: 0, 
            backgroundColor: "#fff", 
            borderRadius: "12px", 
            border: "1px solid #e5e7eb", 
            padding: "24px",
            position: "sticky",
            top: "24px",
            maxHeight: "calc(100vh - 48px)",
            overflowY: "auto"
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
              onChange={(e) => setSidebarSearch(e.target.value)}
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

        {/* PRODUCTS GRID */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* Back Arrow + Title Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <button 
              onClick={() => navigate(-1)}
              style={{ 
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "40px", height: "40px", borderRadius: "50%", 
                border: "1px solid #e2e8f0", 
                backgroundColor: "#f8fafc", 
                cursor: "pointer", 
                color: "#0f172a", 
                fontSize: "18px", 
                fontWeight: "bold",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
            >
              &lt;
            </button>

            <div style={{ display: "inline-block", borderBottom: "2px solid #2563eb", paddingBottom: "4px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#2563eb", margin: 0 }}>Products</h2>
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : displayProducts.length === 0 ? (
            <p>No products match your filters.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
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