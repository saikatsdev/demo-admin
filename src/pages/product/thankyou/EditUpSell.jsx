import { ArrowLeftOutlined, DeleteOutlined, InboxOutlined, PlusOutlined, SettingOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Divider, Form, Input, message, Row, Select, Space, Spin, Tag, Input as AntInput } from "antd";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./upsell.css";

export default function EditUpSell() {
    // Hook
    useTitle("Edit Upsell Products");

    // Variable
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [product, setProduct]                                 = useState([]);
    const [searchQuery, setSearchQuery]                         = useState("");
    const [triggerQuery, setTriggerQuery]                       = useState("");
    const [loading, setLoading]                                 = useState(false);
    const [formLoading, setFormLoading]                         = useState(false);
    const [trigger, setTrigger]                                 = useState("on_order");
    const [categories, setCategories]                           = useState([]);
    const [selectedCategories, setSelectedCategories]           = useState([]);
    const [selectedProducts, setSelectedProducts]               = useState([]);
    const [messageApi, contextHolder]                           = message.useMessage();
    const [triggerProducts, setTriggerProducts]                 = useState([]);
    const [selectedTriggerProducts, setSelectedTriggerProducts] = useState([]);
    const [triggerCategoryIds, setTriggerCategoryIds]           = useState([]);
    const [offerInfo, setOfferInfo]                             = useState({ title: "", status: "active", started_at: "", ended_at: "", trigger_rules: "on_order" });

    // Search Product Logic
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
                p.id === id ? { ...p, [field]: field === "discount_amount" ? Number(value) : value } : p
            )
        );
    };

    const handleRemoveProduct = (id, type) => {
        const state    = type === "main" ? selectedProducts : selectedTriggerProducts;
        const setState = type === "main" ? setSelectedProducts : setSelectedTriggerProducts;
        const updated  = state.filter((p) => p.id !== id);
        setState(updated);
    };

    // Get Offer Info
    useEffect(() => {
        let isMounted = true;
        const getOfferInfo = async () => {
            setLoading(true);
            try {
                const res = await getDatas(`/admin/up-sells/${id}`);
                if (res && res?.success && isMounted) {
                    const data = res.result || {};
                    const formatDate = (dateTime) => dateTime ? dateTime.split(" ")[0] : "";
                    
                    const getTriggerRule = (data) => {
                        if (data.is_all == 1) return "on_order";
                        if (Array.isArray(data.trigger_category_ids) && data.trigger_category_ids.length > 0) return "on_category";
                        return "on_product";
                    };

                    const triggerRule = getTriggerRule(data);

                    setOfferInfo({
                        title: data.title || "",
                        status: data.status || "active",
                        started_at: formatDate(data.started_at),
                        ended_at: formatDate(data.ended_at),
                        trigger_rules: triggerRule
                    });

                    setTrigger(triggerRule);

                    setSelectedProducts(
                        (data.offer_products || []).map((item) => ({
                            id             : item.id,
                            name           : item.name,
                            slug           : item.slug,
                            img_path       : item.img_path,
                            sell_price     : item.sell_price,
                            discount_type  : item?.pivot?.discount_type || "percentage",
                            discount_amount: item?.pivot?.discount_amount || 0,
                            category_name  : item?.category?.name || "N/A"
                        }))
                    );

                    if (triggerRule === "on_product") {
                        setSelectedTriggerProducts(data.trigger_products || []);
                    } else if (triggerRule === "on_category") {
                        setTriggerCategoryIds(data.trigger_category_ids || []);
                    }
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        getOfferInfo();
        return () => { isMounted = false; };
    }, [id]);

    // Get Categories
    useEffect(() => {
        const getCategories = async () => {
            try {
                const res = await getDatas("/admin/categories/list");
                if (res && res?.success) {
                    setCategories(res?.result || []);
                }
            } catch (error) {
                console.log(error);
            }
        };
        getCategories();
    }, []);

    useEffect(() => {
        if (trigger === "on_category" && triggerCategoryIds.length > 0 && categories.length > 0) {
            const selected = categories.filter(cat => triggerCategoryIds.includes(cat.id));
            setSelectedCategories(selected);
        }
    }, [trigger, triggerCategoryIds, categories]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setOfferInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleTrigger = (value) => {
        setTrigger(value);
        if (value === "on_product") setSelectedCategories([]);
        else if (value === "on_category") setSelectedTriggerProducts([]);
    };

    const handleCategorySelect = (e) => {
        const catId = Number(e.target.value);
        if (!catId) return;
        const category = categories.find(cat => cat.id === catId);
        if (category) {
            setSelectedCategories(prev => prev.some(c => c.id === catId) ? prev : [...prev, category]);
        }
        e.target.value = "";
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const data = {
            title         : offerInfo.title,
            status        : offerInfo.status,
            started_at    : offerInfo.started_at,
            ended_at      : offerInfo.ended_at,
            is_all        : trigger === "on_order" ? 1: 0,
            up_sell_offers: selectedProducts.map(p => ({
                product_id     : p.id,
                discount_type  : p.discount_type,
                discount_amount: p.discount_amount,
            })),
            _method: "PUT"
        };

        if (trigger === "on_product") data.trigger_product_ids = selectedTriggerProducts.map(p => p.id);
        if (trigger === "on_category") data.trigger_category_ids = selectedCategories.map(cat => cat.id);

        try {
            setFormLoading(true);
            const res = await postData(`/admin/up-sells/${id}`, data);
            if (res && res?.success) {
                messageApi.success(res.msg || "Upsell offer updated successfully");
                setTimeout(() => navigate("/upsell"), 1000);
            }
        } catch (error) {
            console.log(error);
            messageApi.error("Failed to update upsell offer");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div style={{ padding: 16 }}>
            {contextHolder}
            
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Edit Upsell Offer</h1>
                    <p className="subtitle">Modify your upsell campaign rules and products</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/upsell">Upsells</Link> },
                            { title: "Edit Offer" },
                        ]}
                    />
                </div>
            </div>

            <Spin spinning={loading && !selectedProducts.length}>
                <Form layout="vertical" onSubmitCapture={handleSubmit}>
                    <Row gutter={[20, 20]}>
                        <Col xs={24} lg={16}>
                            <Card title={<Space><SettingOutlined /> General Information</Space>} className="modern-antd-card" extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/upsell")}>Back</Button>}>
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item label="Offer Title" required>
                                            <Input size="large" name="title" value={offerInfo.title} onChange={handleFormChange} placeholder="e.g. Summer Sale Special Upsell" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Status" required>
                                            <Select size="large" value={offerInfo.status} onChange={(val) => setOfferInfo(p => ({ ...p, status: val }))}>
                                                <Select.Option value="active">Active</Select.Option>
                                                <Select.Option value="inactive">Inactive</Select.Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Start Date">
                                            <Input size="large" type="date" name="started_at" value={offerInfo.started_at} onChange={handleFormChange} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="End Date">
                                            <Input size="large" type="date" name="ended_at" value={offerInfo.ended_at} onChange={handleFormChange} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card title={<Space><ThunderboltOutlined /> Upsell Products Selection</Space>} style={{ marginTop: 20 }} className="modern-antd-card">
                                <div className="search-box-wrapper">
                                    <AntInput.Search size="large" placeholder="Search products to add as upsell..." value={searchQuery} loading={loading && searchQuery} onChange={(e) => setSearchQuery(e.target.value)} enterButton />
                                    
                                    {searchQuery && !loading && (
                                        <div className="antd-search-dropdown">
                                            {product?.length > 0 ? product.map((p) => (
                                                <div key={p.id} className="search-item-row" onClick={() => handleSelectProduct(p, "main")}>
                                                    <img src={p.img_path} alt="" />
                                                    <div className="info">
                                                        <div className="name">{p.name}</div>
                                                        <div className="meta">{p?.category_name || 'N/A'} | ৳{p.sell_price}</div>
                                                    </div>
                                                    <Button type="primary" size="small" icon={<PlusOutlined />}>Add</Button>
                                                </div>
                                            )) : <div className="placeholder-empty"><p>No products found</p></div>}
                                        </div>
                                    )}
                                </div>

                                <div className="modern-upsell-grid">
                                    {selectedProducts.map((p) => (
                                        <div key={p.id} className="upsell-product-card-lite">
                                            <div className="card-top">
                                                <img src={p.img_path} alt="" />
                                                <div className="details">
                                                    <h4>{p.name}</h4>
                                                    <p>৳{p.sell_price} | {p.category_name || 'N/A'}</p>
                                                </div>
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveProduct(p.id, "main")} />
                                            </div>
                                            <div className="card-controls">
                                                <Row gutter={8}>
                                                    <Col span={12}>
                                                        <Select size="small" style={{ width: '100%' }} value={p.discount_type} onChange={(value) => handleDiscountChange(p.id, "discount_type", value)}>
                                                            <Select.Option value="percentage">Percentage (%)</Select.Option>
                                                            <Select.Option value="fixed">Fixed</Select.Option>
                                                        </Select>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Input size="small" type="number" value={p.discount_amount} onChange={(e) => handleDiscountChange(p.id, "discount_amount", e.target.value)} placeholder="Amt" />
                                                    </Col>
                                                </Row>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedProducts.length === 0 && (
                                        <Col span={24}>
                                            <div className="placeholder-empty">
                                                <InboxOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
                                                <p>No upsell products selected yet. Search above to add some!</p>
                                            </div>
                                        </Col>
                                    )}
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card title={<Space><ThunderboltOutlined /> Trigger Rules</Space>} className="modern-antd-card sticky-card">
                                <Form.Item label="When should this offer show?">
                                    <Select size="large" value={trigger} onChange={handleTrigger} style={{ width: '100%' }}>
                                        <Select.Option value="on_order">For all orders</Select.Option>
                                        <Select.Option value="on_product">For specific products</Select.Option>
                                        <Select.Option value="on_category">For specific categories</Select.Option>
                                    </Select>
                                </Form.Item>

                                {trigger === "on_product" && (
                                    <div style={{ marginTop: 16 }}>
                                        <Form.Item label="Search Products">
                                            <AntInput.Search placeholder="Add trigger products..." value={triggerQuery} onChange={(e) => setTriggerQuery(e.target.value)} />
                                        </Form.Item>
                                        
                                        {triggerQuery && !loading && (
                                            <div className="antd-search-dropdown relative">
                                                {triggerProducts?.map((p) => (
                                                    <div key={p.id} className="search-item-row" onClick={() => handleSelectProduct(p, "trigger")}>
                                                        <img src={p.img_path} alt="" />
                                                        <div className="info"><div className="name">{p.name}</div></div>
                                                        <Button type="primary" size="small" icon={<PlusOutlined />} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="trigger-tags-list">
                                            {selectedTriggerProducts.map((p) => (
                                                <Tag key={p.id} closable onClose={() => handleRemoveProduct(p.id, "trigger")} className="modern-trigger-tag">
                                                    {p.name}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {trigger === "on_category" && (
                                    <div style={{ marginTop: 16 }}>
                                        <Form.Item label="Select Category">
                                            <Select placeholder="Choose category" onChange={(val) => handleCategorySelect({ target: { value: val } })} value="">
                                                {categories?.map((item) => (
                                                    <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <div className="trigger-tags-list">
                                            {selectedCategories.map((cat) => (
                                                <Tag key={cat.id} color="blue" closable onClose={() => setSelectedCategories(selectedCategories.filter(c => c.id !== cat.id))} className="modern-trigger-tag">
                                                    {cat.name}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {trigger === "on_order" && (
                                    <div className="placeholder-empty" style={{ padding: '20px 10px' }}>
                                        <p>This offer will trigger for every order placed on the store.</p>
                                    </div>
                                )}

                                <Divider />

                                <Button type="primary" size="large" block loading={formLoading} onClick={handleSubmit} className="submit-upsell-btn">
                                    {formLoading ? "Updating..." : "Update Upsell Offer"}
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </div>
    );
}
