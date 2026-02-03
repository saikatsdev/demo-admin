import useTitle from "../../../hooks/useTitle";
import {Breadcrumb,message} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./upsell.css";
import { getDatas, postData } from "../../../api/common/common";
import { useCallback } from "react";

export default function AddUpSell() {
    // Hook
    useTitle("Create Upsell Products");

    // Variable
    const navigate = useNavigate();

    // State
    const [searchQuery, setSearchQuery]           = useState("");
    const [triggerQuery, setTriggerQuery]         = useState("");
    const [products, setProducts]                 = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [loading, setLoading]                   = useState(false);
    const [messageApi, contextHolder]             = message.useMessage();
    const [trigger, setTrigger]                   = useState("on_order");
    const [categories, setCategories]             = useState([]);
    const [triggerProducts, setTriggerProducts]   = useState([]);
    const [selectedTriggerProducts, setSelectedTriggerProducts]   = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const debounce = (func, delay = 400) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => func(...args), delay);
        };
    };

    const fetchProducts = async (query, setStateFn) => {
        if (!query.trim()) return setStateFn([]);

        setLoading(true);
        try {
            const res = await getDatas("/admin/products/search", { search_key: query });

            if (res && res?.success) {
                setStateFn(res?.result || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetch = useCallback(
            debounce((query, setStateFn) => {
            fetchProducts(query, setStateFn);
        }, 500),
        []
    );

    useEffect(() => {
        if (searchQuery) debouncedFetch(searchQuery, setProducts);
        if (triggerQuery) debouncedFetch(triggerQuery, setTriggerProducts);
    }, [searchQuery, triggerQuery, debouncedFetch]);

    const filteredProducts = products?.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleSelectProduct = (product, type) => {
        const state      = type === "main" ? selectedProducts : selectedTriggerProducts;
        const setState   = type === "main" ? setSelectedProducts : setSelectedTriggerProducts;
        const clearQuery = type === "main" ? setSearchQuery : setTriggerQuery;

        if (state.find((p) => p.id === product.id)) return;

        const newProduct = type === "main" ? { ...product, discount_type: "percentage", discount_amount: 0 } : { ...product };

        setState([...state, newProduct]);

        clearQuery("");
    };

    const handleDiscountChange = (id, field, value) => {
        setSelectedProducts((prev) =>
            prev.map((p) =>
                p.id === id ? {...p,[field]: field === "discount_amount" ? Number(value) : value,} : p
            )
        );
    };

    const handleRemoveProduct = (id, type) => {
        const state    = type === "main" ? selectedProducts : selectedTriggerProducts;
        const setState = type === "main" ? setSelectedProducts : setSelectedTriggerProducts;

        const updated = state.filter((p) => p.id !== id);
        setState(updated);
    };

    useEffect(() => {
        const getCategories = async () => {
            const res = await getDatas("/admin/categories/list");

            if(res && res?.success){
                setCategories(res?.result || []);
            }
        }

        getCategories();
    }, []);

    const handleCategorySelect = (e) => {
        const value = e.target.value;
        if (!value) return;

        if (!selectedCategories.find((cat) => cat.id == value)) {
            const category = categories.find((cat) => cat.id == value);
            if (category) setSelectedCategories([...selectedCategories, category]);
        }

        e.target.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        data.discount_type = "fixed";
        data.discount_amount = 0;

        data.up_sell_offers = selectedProducts.map((p) => ({
            product_id     : p.id,
            custom_name    : p.name,
            discount_type  : p.discount_type,
            discount_amount: p.discount_amount,
        }));

        data.is_all = trigger === "on_order" ? 1 : 0;

        if (trigger === "on_product") {
            data.trigger_product_ids = selectedTriggerProducts.map((p) => p.id);
        }

        if (trigger === "on_category") {
            data.trigger_category_ids = selectedCategories.map((cat) => cat.id);
        }

        try {
            setLoading(true);
            const res = await postData("/admin/up-sells", data);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/upsell");
                }, 500);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    const handleTrigger = (value) => {
        setTrigger(value);

        if(value === "on_product"){
            setSelectedCategories([]);
        }else if(value === "on_category"){
            setSelectedTriggerProducts([]);
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Upsell Products</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Add Upsell Products" },
                        ]}
                    />
                </div>
            </div>

            <div className="raw-sell-container">
                <form onSubmit={handleSubmit} className="raw-sell-form">
                    <div className="raw-up-sell-form-header" style={{marginBottom:"10px"}}>
                        <h2 className="page-title">Add Upsell Products</h2>

                        <button type="button" className="back-btn" onClick={() => window.history.back()} aria-label="Go back" title="Go back">
                            <svg className="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                                <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="label">Back</span>
                        </button>
                    </div>

                    <div className="row">
                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Title:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter offer title" name="title"/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Status:</label>
                                <select className="raw-sell-select" name="status">
                                    <option value="">Select Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Start Date:</label>
                                <input type="date" className="raw-sell-input" name="started_at"/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">End Date:</label>
                                <input type="date" className="raw-sell-input" name="ended_at" />
                            </div>
                        </div>

                        {/* Search Product */}
                        <div className="col-12">
                            <div className="raw-sell-block">
                                <label className="raw-sell-block-title">Search Product</label>
                                <div className="raw-sell-search-row">
                                   <input type="text" className="raw-sell-input" placeholder="Search product & add here..." name="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                                </div>

                                {/* Product search results */}
                                {searchQuery && !loading && (
                                    <div className="raw-sell-product-results">
                                        {filteredProducts?.length > 0 ? (
                                            filteredProducts?.map((product) => (
                                                <div key={product.id} className="raw-sell-product-card" onClick={() => handleSelectProduct(product, "main")}>
                                                    <div className="raw-sell-product-left">
                                                        <img src={product.img_path} alt={product.name} />
                                                        <div>
                                                            <h4 style={{ color: "#000" }}>{product.name}</h4>
                                                            <div className="category" style={{ color: "#000" }}>
                                                                {product.categories?.map((c, index) => (
                                                                    <span key={c.id} className="category-badge">
                                                                        {c.name}
                                                                        {index < product.categories.length - 1 && ", "}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="raw-sell-product-right">
                                                        <span className="price">{product.sell_price}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                        <p className="no-results">No products found.</p>
                                        )}
                                    </div>
                                )}

                                {selectedProducts.length > 0 && (
                                <div className="raw-selected-wrapper">
                                    <h4 className="selected-title">Selected Products</h4>
                                    <div className="raw-selected-products">
                                        {selectedProducts.map((product) => (
                                            <div key={product.id} className="selected-product-card">
                                                <button className="remove-btn" onClick={() => handleRemoveProduct(product.id, "main")} title="Remove Product">
                                                    ✕
                                                </button>

                                                <div className="raw-product-info">
                                                    <div className="raw-product-gallary">
                                                        <img src={product.img_path} alt={product.name} />
                                                        <div className="product-details">
                                                            <h4>{product.name}</h4>
                                                            <div className="category" style={{ color: "#000" }}>
                                                                {product.categories?.map((c, index) => (
                                                                    <span key={c.id} className="category-badge">
                                                                        {c.name}
                                                                        {index < product.categories.length - 1 && ", "}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="raw-product-price">
                                                        <span className="price-label">Price:</span>
                                                        <span className="price-value">
                                                            {product.sell_price}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="discount-inputs">
                                                    <select value={product.discount_type} onChange={(e) =>handleDiscountChange(product.id,"discount_type",e.target.value)}>
                                                        <option value="percentage">Percentage (%)</option>
                                                        <option value="fixed">Fixed</option>
                                                    </select>
                                                    <input type="number" value={product.discount_amount} onChange={(e) =>handleDiscountChange(product.id,"discount_amount",e.target.value)} placeholder="Discount amount"/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>

                        {/* Trigger Rules */}
                        <div className="col-12 mb-4">
                            <div className="raw-sell-block">
                                <label className="raw-sell-block-title">Trigger Rules</label>
                                <div className="raw-sell-radio-group">
                                    <label>
                                        <input type="radio" name="trigger_rules" value="on_order" checked={trigger === "on_order"} onChange={(e) => handleTrigger(e.target.value)}/> 
                                        For all orders
                                    </label>
                                    <label>
                                        <input type="radio" name="trigger_rules" value="on_product" checked={trigger === "on_product"} onChange={(e) => handleTrigger(e.target.value)}/> For specific products
                                    </label>
                                    <label>
                                        <input type="radio" name="trigger_rules" value="on_category" checked={trigger === "on_category"} onChange={(e) => handleTrigger(e.target.value)}/>
                                        For specific category
                                    </label>
                                </div>
                            </div>

                            {trigger === "on_product" && (
                                <div>
                                    <label className="raw-sell-block-title">Select Products</label>
                                    <input type="text" className="raw-sell-input" placeholder="Search products..." value={triggerQuery} onChange={(e) => setTriggerQuery(e.target.value)}/>
                                </div>
                            )}

                            {triggerQuery && !loading && (
                                <div className="raw-sell-product-results">
                                    {triggerProducts?.length > 0 ? (
                                        triggerProducts?.map((product) => (
                                        <div key={product.id} className="raw-sell-product-card" onClick={() => handleSelectProduct(product, "trigger")}>
                                            <div className="raw-sell-product-left">
                                                <img src={product.img_path} alt={product.name} />
                                                <div>
                                                    <h4 style={{ color: "#000" }}>{product.name}</h4>
                                                    <div className="category" style={{ color: "#000" }}>
                                                        {product.categories?.map((c, index) => (
                                                            <span key={c.id} className="category-badge">
                                                                {c.name}
                                                                {index < product.categories.length - 1 && ", "}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="raw-sell-product-right">
                                                <span className="price">{product.sell_price}</span>
                                            </div>
                                        </div>
                                        ))
                                    ) : (
                                        <p className="no-results">No products found.</p>
                                    )}
                                </div>
                            )}

                            {selectedTriggerProducts.length > 0 && (
                                <div className="raw-selected-wrapper">
                                    <h4 className="selected-title">Selected Products</h4>
                                    <div className="raw-selected-products">
                                        {selectedTriggerProducts.map((product) => (
                                        <div key={product.id} className="selected-product-card">
                                            <button className="remove-btn" onClick={() => handleRemoveProduct(product.id, "trigger")} title="Remove Product">
                                            ✕
                                            </button>

                                            <div className="raw-product-info">
                                                <div className="raw-product-gallary">
                                                    <img src={product.img_path} alt={product.name} />
                                                    <div className="product-details">
                                                        <h4>{product.name}</h4>
                                                        <div className="category" style={{ color: "#000" }}>
                                                            {product.categories?.map((c, index) => (
                                                                <span key={c.id} className="category-badge">
                                                                    {c.name}
                                                                    {index < product.categories.length - 1 && ", "}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="raw-product-price">
                                                    <span className="price-label">Price:</span>
                                                    <span className="price-value">
                                                        {product.sell_price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {trigger === "on_category" && (
                                <div>
                                    <label className="raw-sell-block-title">Select Category</label>
                                    <select name="" className="raw-sell-input" onChange={handleCategorySelect}>
                                        <option value="">Select</option>
                                            {categories?.map((item) => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {/* Display selected categories */}
                            {selectedCategories.length > 0 && (
                                <div className="selected-categories">
                                    {selectedCategories.map((cat) => (
                                        <span key={cat.id} className="selected-category" style={{color:"#000"}}>
                                            {cat.name} 
                                            <button onClick={() => setSelectedCategories(selectedCategories.filter(c => c.id !== cat.id))}>
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="col-12">
                            <div className="raw-sell-submit">
                                <button type="submit" className="raw-sell-btn">
                                    {loading ? "Submiting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}
