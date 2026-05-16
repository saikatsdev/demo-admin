import { ArrowLeftOutlined, DeleteOutlined, InboxOutlined, PlusOutlined, SettingOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Divider, Form, Input, InputNumber, message, Radio, Row, Select, Space, Tag, Typography, Upload } from "antd";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import ProductImagePicker from "../../../components/image/ProductImagePicker";
import useTitle from "../../../hooks/useTitle";
import "./downsell.css";

const { Title, Text } = Typography;

export default function AddDownSell() {
    // Hook
    useTitle("Add Downsell Products");

    // State
    const [query, setQuery]                           = useState("");
    const [results, setResults]                       = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [formLoading, setFormLoading]               = useState(false);
    const [mode, setMode]                             = useState("all");
    const [categories, setCategories]                 = useState([]);
    const [selectedProducts, setSelectedProducts]     = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [messageApi, contextHolder]                 = message.useMessage();

    // Gallery states
    const [gallery, setGallery]         = useState([]);
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const debounceTimeout = useRef(null);
    const cancelToken = useRef(null);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    useEffect(() => {
        let isMounted = true;
        const getCategories = async () => {
            const res = await getDatas("/admin/categories/list");
            if (res && res.success && isMounted) {
                setCategories(res?.result || []);
            }
        };
        getCategories();
        fetchMedia(page);
        return () => { isMounted = false; };
    }, []);

    const fetchMedia = async (pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
            setLoadingMore(true);

            const res = await getDatas(`/admin/gallary?page=${pageNumber}`);

            if (res && res?.success) {
                const data = res.result.data;

                if (pageNumber > 1) {
                    setGallery(prev => [...prev, ...data]);
                } else {
                    setGallery(data);
                }

                const meta = res.result.meta;
                setPage(meta.current_page);
                setHasMore(meta.current_page < meta.last_page);
            }
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchedProducts = async (searchTerm) => {
        if (!searchTerm) {
            setResults([]);
            return;
        }

        if (cancelToken.current) {
            cancelToken.current.cancel("Operation canceled due to new request");
        }

        cancelToken.current = axios.CancelToken.source();
        setLoading(true);

        try {
            const res = await getDatas("/admin/products/search", {
                params: { search_key: searchTerm },
                cancelToken: cancelToken.current.token,
            });

            if (res && res?.success) {
                setResults(res?.result);
            }
        } catch (error) {
            if (!axios.isCancel(error)) {
                console.log("Something went wrong", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => { fetchedProducts(query); }, 400);
        return () => clearTimeout(debounceTimeout.current);
    }, [query]);

    const handleSelect = (product) => {
        if (!selectedProducts.find((p) => p.id === product.id)) {
            setSelectedProducts([...selectedProducts, product]);
            setQuery("");
            setResults([]);
        }
    };

    const handleCategory = (categoryId) => {
        if (!categoryId) return;
        const category = categories.find((cat) => cat.id === parseInt(categoryId));
        if (category && !selectedCategories.find((c) => c.id === category.id)) {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const onFinish = async (values) => {
        const formData = new FormData();

        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && key !== 'image' && key !== 'coupon_type') {
                formData.append(key, values[key]);
            }
        });

        formData.append("type", values.coupon_type);

        if (mode === "all") {
            formData.append("trigger_mode", "all");
        }

        if (mode === "product") {
            selectedProducts.forEach(p => {
                formData.append("product_ids[]", p.id);
            });
            if (selectedProducts.length === 0) {
                return messageApi.error("Please select at least one product");
            }
        }

        if (mode === "category") {
            selectedCategories.forEach(c => {
                formData.append("category_ids[]", c.id);
                formData.append("trigger_category_ids[]", c.id);
            });
            if (selectedCategories.length === 0) {
                return messageApi.error("Please select at least one category");
            }
        }

        const imageValue = values.image;

        if (imageValue && imageValue.length > 0) {
            const imgObj = imageValue[0];
            if (imgObj.isFromGallery) {
                formData.append("image", imgObj.galleryPath);
            } else if (imgObj.originFileObj) {
                formData.append("image", imgObj.originFileObj);
            }
        }

        try {
            setFormLoading(true);
            const res = await postData("/admin/down-sells", formData, { headers: { "Content-Type": "multipart/form-data" } });

            if (res && res?.success) {
                messageApi.success(res.msg);
                setTimeout(() => navigate("/downsell-coupon"), 1000);
            }
        } catch (error) {
            console.log(error);
            messageApi.error("Failed to create downsell offer");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div style={{ padding: 16 }}>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Downsell Products</h1>
                    <p className="subtitle">Create promotional offers for customers who decline initial upsells</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/downsell-coupon">Downsells</Link> },
                            { title: "Create Offer" },
                        ]}
                    />
                </div>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ coupon_type: 'fixed', status: 'active', width: 450, height: 220 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Card title={<Space><SettingOutlined /> Offer Information</Space>} 
                            className="modern-antd-card"
                            extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/downsell-coupon")}>Back</Button>}
                        >
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item label="Campaign Name" name="title" rules={[{ required: true, message: 'Offer name is required' }]}>
                                        <Input size="large" placeholder="e.g. 10% Discount for Second Chance" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Coupon Amount" name="amount" rules={[{ required: true, message: 'Amount is required' }]}>
                                        <InputNumber size="large" style={{ width: '100%' }} min={0} placeholder="0.00" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Coupon Type" name="coupon_type">
                                        <Select size="large">
                                            <Select.Option value="fixed">Fixed Amount</Select.Option>
                                            <Select.Option value="percent">Percentage (%)</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Start Date" name="started_at" rules={[{ required: true, message: 'Select start date' }]}>
                                        <Input size="large" type="date" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="End Date" name="ended_at" rules={[{ required: true, message: 'Select end date' }]}>
                                        <Input size="large" type="date" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Short Description" name="description">
                                        <Input.TextArea rows={4} placeholder="Describe the offer for your customers..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        <Card title={<Space><ThunderboltOutlined /> Trigger Settings</Space>} className="modern-antd-card" style={{ marginTop: 24 }}>
                            <Form.Item label="Show offer for:" required>
                                <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} buttonStyle="solid" className="modern-radio-group">
                                    <Radio.Button value="all">Storewide (All Products)</Radio.Button>
                                    <Radio.Button value="product">Specific Products</Radio.Button>
                                    <Radio.Button value="category">Specific Categories</Radio.Button>
                                </Radio.Group>
                            </Form.Item>

                            {mode === "product" && (
                                <div style={{ marginTop: 20 }}>
                                    <Form.Item label="Search Products">
                                        <div style={{ position: 'relative' }}>
                                            <Input.Search size="large" placeholder="Type product name to search..." value={query} onChange={(e) => setQuery(e.target.value)} loading={loading}/>
                                            {query && (
                                                <div className="antd-search-dropdown">
                                                    {results.length > 0 ? results.map((item) => (
                                                        <div className="search-item-row" key={item.id} onClick={() => handleSelect(item)}>
                                                            <img src={item.image} alt="" />
                                                            <div className="info">
                                                                <div className="name">{item.name}</div>
                                                                <div className="meta">
                                                                    {Array.isArray(item?.categories) && item.categories.length > 0
                                                                        ? item.categories.map(category => category?.name).join(", ") : "N/A"}{" "}
                                                                    | ৳{item.sell_price}
                                                                </div>
                                                            </div>
                                                            <PlusOutlined style={{ color: '#1890ff' }} />
                                                        </div>
                                                    )) : <div className="no-results">No products found</div>}
                                                </div>
                                            )}
                                        </div>
                                    </Form.Item>

                                    <div className="modern-upsell-grid">
                                        {selectedProducts.map((p) => (
                                            <div className="upsell-product-card-lite" key={p.id}>
                                                <div className="card-top">
                                                    <img src={p?.image} alt="" />
                                                    <div className="details">
                                                        <h4>{p?.name}</h4>
                                                        <p>
                                                            ৳{p.sell_price} |{" "}
                                                            {Array.isArray(p?.categories) && p.categories.length > 0
                                                                ? p.categories.map(category => category?.name).join(", ")
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setSelectedProducts(selectedProducts.filter(item => item.id !== p.id))} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedProducts.length === 0 && <div className="placeholder-empty">No products selected yet</div>}
                                </div>
                            )}

                            {mode === "category" && (
                                <div style={{ marginTop: 20 }}>
                                    <Form.Item label="Select Category">
                                        <Select size="large" placeholder="Choose categories" onChange={handleCategory} value={null}>
                                            {categories.map((cat) => (
                                                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <div className="trigger-tags-list">
                                        {selectedCategories.map((cat) => (
                                            <Tag key={cat.id} closable className="modern-trigger-tag" onClose={() => setSelectedCategories(selectedCategories.filter(c => c.id !== cat.id))} color="blue">
                                                {cat.name}
                                            </Tag>
                                        ))}
                                    </div>
                                    {selectedCategories.length === 0 && <div className="placeholder-empty">No categories selected yet</div>}
                                </div>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card title={<Space><InboxOutlined /> Banner Media</Space>} className="modern-antd-card sticky-card">
                            <Form.Item name="image" rules={[{ required: true, message: "Please select an image" }]}>
                                <ProductImagePicker gallery={gallery} hasMore={hasMore} loadingMore={loadingMore} fetchMore={() => fetchMedia(page + 1)} onUploadSuccess={(newItems) => setGallery(prev => [...newItems, ...prev])}/>
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item label="Banner Width" name="width">
                                        <InputNumber style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Banner Height" name="height">
                                        <InputNumber style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="Campaign Status" name="status">
                                <Select size="large">
                                    <Select.Option value="active">Active</Select.Option>
                                    <Select.Option value="inactive">Inactive</Select.Option>
                                </Select>
                            </Form.Item>

                            <Divider />

                            <Button type="primary" htmlType="submit" size="large" block loading={formLoading} icon={<PlusOutlined />} style={{ height: 48, borderRadius: 8, fontWeight: 600 }}>
                                Create Downsell Offer
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
