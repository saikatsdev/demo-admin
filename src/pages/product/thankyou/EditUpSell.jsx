import useTitle from "../../../hooks/useTitle";
import {Breadcrumb,message, Spin} from "antd";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import "./upsell.css";

export default function EditUpSell() {
    // Hook
    useTitle("Edit Upsell Products");

    // State
    const [product, setProduct]                                 = useState(null);
    const [searchQuery, setSearchQuery]                         = useState("");
    const [triggerQuery, setTriggerQuery]                       = useState("");
    const [loading, setLoading]                                 = useState(false);
    const [trigger, setTrigger]                                 = useState("");
    const [categories, setCategories]                           = useState([]);
    const [selectedCategories, setSelectedCategories]           = useState([]);
    const [selectedProducts, setSelectedProducts]               = useState([]);
    const [messageApi, contextHolder]                           = message.useMessage();
    const [triggerProducts, setTriggerProducts]                 = useState([]);
    const [selectedTriggerProducts, setSelectedTriggerProducts] = useState([]);
    const [triggerCategoryIds, setTriggerCategoryIds] = useState([]);
    const [offerInfo, setOfferInfo]                             = useState({name:"", status:"", started_at:"", ended_at:"", trigger_rules:""});

    const {id} = useParams();
    const navigate = useNavigate();

    const filteredProducts = product;

    // Search Product
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
          const res = await getDatas("/admin/products/list", { search_key: query });
    
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
        if (searchQuery) debouncedFetch(searchQuery, setProduct);
        if (triggerQuery) debouncedFetch(triggerQuery, setTriggerProducts);
    }, [searchQuery, triggerQuery, debouncedFetch]);

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
            p.id === id
            ? {
                ...p,
                [field]: field === "discount_amount" ? Number(value) : value,
                }
            : p
        )
        );
    };

    const handleRemoveProduct = (id, type) => {
        const state    = type === "main" ? selectedProducts : selectedTriggerProducts;
        const setState = type === "main" ? setSelectedProducts : setSelectedTriggerProducts;

        const updated = state.filter((p) => p.id !== id);
        setState(updated);
    };
    // Search Product

    // Get Offer
    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const getOfferInfo = async () => {
            const res = await getDatas(`/admin/up-sells/${id}`);

            if (res && res?.success && isMounted) {
                const data = res.result || {};

                const formatDate = (dateTime) =>
                    dateTime ? dateTime.split(" ")[0] : "";

                const getTriggerRule = (data) => {
                    if (data.is_all == 1) return "on_order";
                    if (Array.isArray(data.trigger_category_ids) && data.trigger_category_ids.length > 0) {
                        return "on_category";
                    }
                    return "on_product";
                };

                const triggerRule = getTriggerRule(data);

                setOfferInfo({
                    title        : data.title,
                    status       : data.status,
                    started_at   : formatDate(data.started_at),
                    ended_at     : formatDate(data.ended_at),
                    trigger_rules: triggerRule
                });

                setTrigger(triggerRule);

                // Main offer products
                setSelectedProducts(
                    (data.offer_products || []).map((item) => ({
                        id              : item.id,
                        name            : item.name,
                        slug            : item.slug,
                        img_path        : item.img_path,
                        sell_price      : item.sell_price,
                        discount_type   : item?.pivot?.discount_type || "fixed",
                        discount_amount : item?.pivot?.discount_amount || 0,
                        custom_name     : item?.pivot?.custom_name || item.name,
                    }))
                );

                // Trigger products
                if (triggerRule === "on_product") {
                    setSelectedTriggerProducts(data.trigger_products || []);
                    setSelectedCategories([]);
                }

                // Trigger categories (STORE IDS ONLY)
                if (triggerRule === "on_category") {
                    setTriggerCategoryIds(data.trigger_category_ids || []);
                    setSelectedTriggerProducts([]);
                }

                if (triggerRule === "on_order") {
                    setSelectedTriggerProducts([]);
                    setSelectedCategories([]);
                }
            }

            setLoading(false);
        };

        getOfferInfo();

        return () => {
            isMounted = false;
        };
    }, [id]);

    // Get Categories
    useEffect(() => {
        const getCategories = async () => {
            const res = await getDatas("/admin/categories");

            if(res && res?.success){
                setCategories(res?.result?.data || []);
            }
        }

        getCategories();
    }, []);

    useEffect(() => {
        if (trigger === "on_category" && triggerCategoryIds.length > 0 && categories.length > 0) {
            const selected = categories.filter(cat =>
                triggerCategoryIds.includes(cat.id)
            );

            setSelectedCategories(selected);
        }
    }, [trigger, triggerCategoryIds, categories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOfferInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleTrigger = (value) => {
        setTrigger(value);

        if(value === "on_product"){
            setSelectedCategories([]);
        }else if(value === "on_category"){
            setSelectedTriggerProducts([]);
        }
    }

    const handleCategorySelect = (e) => {
        const id = Number(e.target.value);
        if (!id) return;

        const category = categories.find(cat => cat.id === id);
        if (!category) return;

        setSelectedCategories(prev =>
            prev.some(c => c.id === id) ? prev : [...prev, category]
        );

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

        data._method = "PUT";

        try {
            setLoading(true);
            const res = await postData(`/admin/up-sells/${id}`, data);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }

            setTimeout(() => {
                navigate("/upsell");
            }, 400);
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
            {contextHolder}
            <Spin spinning={loading}>
                <div className="pagehead">
                    <div className="head-left">
                        <h1 className="title">Edit Upsell Products</h1>
                    </div>
                    <div className="head-actions">
                        <Breadcrumb
                            items={[
                                { title: <Link to="/dashboard">Dashboard</Link> },
                                { title: "Edit Upsell Products" },
                            ]}
                        />
                    </div>
                </div>

                <div className="raw-sell-container">
                    <form onSubmit={handleSubmit} className="raw-sell-form">
                        <div className="raw-up-sell-form-header" style={{marginBottom:"10px"}}>
                            <h2 className="page-title">Edit Upsell Products</h2>

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
                                    <input type="text" className="raw-sell-input" placeholder="Enter offer title" name="title" value={offerInfo.title} onChange={handleChange}/>
                                </div>
                            </div>

                            <div className="col-lg-6 col-12">
                                <div className="raw-sell-row">
                                    <label className="raw-sell-label">Status:</label>
                                    <select className="raw-sell-select" name="status" value={offerInfo.status} onChange={handleChange}>
                                        <option value="">Select Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="col-lg-6 col-12">
                                <div className="raw-sell-row">
                                    <label className="raw-sell-label">Start Date:</label>
                                    <input type="date" className="raw-sell-input" name="started_at" value={offerInfo.started_at} onChange={handleChange}/>
                                </div>
                            </div>

                            <div className="col-lg-6 col-12">
                                <div className="raw-sell-row">
                                    <label className="raw-sell-label">End Date:</label>
                                    <input type="date" className="raw-sell-input" name="ended_at" value={offerInfo.ended_at} onChange={handleChange}/>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="raw-sell-block">
                                    <label className="raw-sell-block-title">Search Product</label>
                                    <div className="raw-sell-search-row">
                                        <input type="text" className="raw-sell-input" placeholder="Search product & add here..." name="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                                    </div>

                                    {searchQuery && !loading && (
                                        <div className="raw-sell-product-results">
                                            {filteredProducts?.length > 0 ? (
                                            filteredProducts?.map((product) => (
                                                <div key={product.id} className="raw-sell-product-card" onClick={() => handleSelectProduct(product, "main")}>
                                                    <div className="raw-sell-product-left">
                                                        <img src={product.img_path} alt={product.name} />
                                                        <div>
                                                            <h4 style={{color:"#000"}}>{product.name}</h4>
                                                            <p className="category">{product.category?.name}</p>
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

                                    {selectedProducts?.length > 0 && (
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
                                                                <p className="product-category">
                                                                    {product?.slug}
                                                                </p>
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
                                                            <option value="fixed">Fixed</option>
                                                            <option value="percentage">Percentage (%)</option>
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

                            <div className="col-12 mb-4">
                                <div className="raw-sell-block">
                                    <label className="raw-sell-block-title">Trigger Rules</label>
                                    <div className="raw-sell-radio-group">
                                        <label>
                                            <input type="radio" name="trigger_rules" value="on_order" checked={offerInfo.trigger_rules === "on_order"} onChange={(e) => {handleTrigger(e.target.value); handleChange(e)}}/> For all orders
                                        </label>
                                        <label>
                                            <input type="radio" name="trigger_rules" value="on_product" checked={offerInfo.trigger_rules === "on_product"} onChange={(e) => {handleTrigger(e.target.value); handleChange(e)}}/> For
                                            specific products
                                        </label>
                                        <label>
                                            <input type="radio" name="trigger_rules" value="on_category" checked={offerInfo.trigger_rules === "on_category"} onChange={(e) => {handleTrigger(e.target.value); handleChange(e)}}/> For
                                            specific category
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
                                                    <p className="category">
                                                        {product?.category?.name}
                                                    </p>
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

                                {selectedTriggerProducts?.length > 0 && (
                                    <div className="raw-selected-wrapper">
                                        <h4 className="selected-title">Trigger Products</h4>
                                        <div className="raw-selected-products">
                                            {selectedTriggerProducts?.map((product) => (
                                            <div key={product.id} className="selected-product-card">
                                                <button className="remove-btn" onClick={() => handleRemoveProduct(product.id, "trigger")} title="Remove Product">
                                                    ✕
                                                </button>

                                                <div className="raw-product-info">
                                                <div className="raw-product-gallary">
                                                    <img src={product.img_path} alt={product.name} />
                                                    <div className="product-details">
                                                        <h4>{product.name}</h4>
                                                        <p className="product-category">
                                                            {product?.category_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="raw-product-price">
                                                    <span className="price-label">Price:</span>
                                                    <span className="price-value">
                                                        {product?.offer_price}
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

                            <div className="col-12">
                                <div className="raw-sell-submit">
                                    <button type="submit" className="raw-sell-btn">
                                        {loading ? "Updating..." : "Update"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </Spin>
        </>
    )
}
