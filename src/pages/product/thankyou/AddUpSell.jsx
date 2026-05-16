import { ArrowLeftOutlined, DeleteOutlined, InboxOutlined, PlusOutlined, SettingOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Divider, Form, Input, message, Row, Select, Space, Tag, Input as AntInput } from "antd";
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./upsell.css";

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
    const [formLoading, setFormLoading]           = useState(false);
    const [messageApi, contextHolder]             = message.useMessage();
    const [trigger, setTrigger]                   = useState("on_order");
    const [categories, setCategories]             = useState([]);
    const [triggerProducts, setTriggerProducts]   = useState([]);
    const [selectedTriggerProducts, setSelectedTriggerProducts]   = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const filteredProducts = products?.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

            console.log(res);
            return;

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

    const handleSubmit = async (values) => {
        const data = { ...values };

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
            setFormLoading(true);
            const res = await postData("/admin/up-sells", data);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/upsell");
                }, 400);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setFormLoading(false);
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
        <div style={{ padding: 16 }}>
            {contextHolder}
            
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Create Upsell Product</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/upsell">Upsells</Link> },
                            { title: "Create" },
                        ]}
                    />
                </div>
            </div>

            <Form layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'active' }}>
                <Row gutter={[20, 20]}>
                    <Col xs={24} lg={16}>
                        <Card title={<Space><SettingOutlined /> General Information</Space>} className="modern-antd-card" extra={<Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>}>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item label="Offer Title" name="title" rules={[{ required: true, message: 'Please enter offer title' }]}>
                                        <Input size="large" placeholder="Enter offer title" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Status" name="status">
                                        <Select size="large">
                                            <Select.Option value="active">Active</Select.Option>
                                            <Select.Option value="inactive">Inactive</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Start Date" name="started_at" rules={[{ required: true, message: 'Select start date' }]}>
                                        <Input size="large" type="date" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="End Date" name="ended_at" rules={[{ required: true, message: 'Select end date' }]}>
                                        <Input size="large" type="date" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        <Card title={<Space><ThunderboltOutlined /> Upsell Products Selection</Space>} style={{ marginTop: 20 }} className="modern-antd-card">
                            <div className="search-box-wrapper">
                                <AntInput.Search size="large" placeholder="Search products to add as upsell..." value={searchQuery} loading={loading && searchQuery} onChange={(e) => setSearchQuery(e.target.value)} enterButton/>
                                
                                {searchQuery && !loading && (
                                    <div className="antd-search-dropdown">
                                        {filteredProducts?.length > 0 ? (
                                            filteredProducts?.map((product) => (
                                                <div key={product.id} className="search-item-row" onClick={() => handleSelectProduct(product, "main")}>
                                                    <img src={product.img_path} alt="" />
                                                    <div className="info">
                                                        <div className="name">{product.name}</div>
                                                        <div className="meta">{product?.category_name || 'N/A'} | ৳{product.sell_price}</div>
                                                    </div>
                                                    <Button type="primary" size="small" icon={<PlusOutlined />}>Add</Button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-search">No products found.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Divider orientation="left">Selected Products ({selectedProducts.length})</Divider>

                            {selectedProducts.length > 0 ? (
                                <div className="modern-upsell-grid">
                                    {selectedProducts.map((product) => (
                                        <div key={product.id} className="upsell-product-card-lite">
                                            <div className="card-top">
                                                <img src={product.img_path} alt="" />
                                                <div className="details">
                                                    <h4>{product.name}</h4>
                                                    <p>৳{product.sell_price} | {product.category_name || 'N/A'}</p>
                                                </div>
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveProduct(product.id, "main")}/>
                                            </div>
                                            <div className="card-controls">
                                                <Row gutter={8}>
                                                    <Col span={12}>
                                                        <Select size="small" style={{ width: '100%' }} value={product.discount_type} onChange={(value) => handleDiscountChange(product.id, "discount_type", value)}>
                                                            <Select.Option value="percentage">Percentage (%)</Select.Option>
                                                            <Select.Option value="fixed">Fixed</Select.Option>
                                                        </Select>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Input size="small" type="number" value={product.discount_amount} onChange={(e) => handleDiscountChange(product.id, "discount_amount", e.target.value)} placeholder="Amt"/>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="placeholder-empty">
                                    <InboxOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
                                    <p>Search and select products to show as upsell offers.</p>
                                </div>
                            )}
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
                                        <AntInput.Search placeholder="Add trigger products..." value={triggerQuery} onChange={(e) => setTriggerQuery(e.target.value)}/>
                                    </Form.Item>
                                    
                                    {triggerQuery && !loading && (
                                        <div className="antd-search-dropdown relative">
                                            {triggerProducts?.length > 0 ? (
                                                triggerProducts?.map((product) => (
                                                    <div key={product.id} className="search-item-row" onClick={() => handleSelectProduct(product, "trigger")}>
                                                        <img src={product.img_path} alt="" />
                                                        <div className="info">
                                                            <div className="name">{product.name}</div>
                                                        </div>
                                                        <Button type="primary" size="small" icon={<PlusOutlined />} />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-search">No products found.</div>
                                            )}
                                        </div>
                                    )}

                                    <div className="trigger-tags-list">
                                        {selectedTriggerProducts.map((product) => (
                                            <Tag key={product.id} closable onClose={() => handleRemoveProduct(product.id, "trigger")} className="modern-trigger-tag">
                                                {product.name}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {trigger === "on_category" && (
                                <div style={{ marginTop: 16 }}>
                                    <Form.Item label="Select Category">
                                        <Select placeholder="Choose category" onChange={(val) => handleCategorySelect({ target: { value: val } })}
                                            value="">
                                            {categories?.map((item) => (
                                                <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <div className="trigger-tags-list">
                                        {selectedCategories.map((cat) => (
                                            <Tag key={cat.id} closable onClose={() => setSelectedCategories(selectedCategories.filter(c => c.id !== cat.id))}
                                                color="blue" className="modern-trigger-tag">
                                                {cat.name}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Divider />

                            <Button type="primary" size="large" block loading={formLoading} htmlType="submit" className="submit-upsell-btn">
                                {formLoading ? "Creating..." : "Create Upsell Offer"}
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
