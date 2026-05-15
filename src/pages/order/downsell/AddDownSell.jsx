import { ArrowLeftOutlined, CloudUploadOutlined, DeleteOutlined, InboxOutlined, PlusOutlined, SettingOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Divider, Form, Input, InputNumber, message, Radio, Row, Select, Space, Spin, Tag, Typography, Upload } from "antd";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
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
    const [image, setImage]                           = useState(null);
    const [imageFile, setImageFile]                   = useState(null);
    const [messageApi, contextHolder]                 = message.useMessage();

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
        return () => { isMounted = false; };
    }, []);

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

    const handleImageChange = (info) => {
        if (info.file.status === 'removed') {
            setImage(null);
            setImageFile(null);
            return;
        }
        const file = info.file.originFileObj || info.file;
        if (file) {
            setImage(URL.createObjectURL(file));
            setImageFile(file);
        }
    };

    const onFinish = async (values) => {
        const formData = new FormData();

        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && key !== 'image') {
                formData.append(key, values[key]);
            }
        });

        formData.append("mode", mode);

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
            });
            if (selectedCategories.length === 0) {
                return messageApi.error("Please select at least one category");
            }
        }

        if (imageFile) formData.append("image", imageFile);

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
                        <Card 
                            title={<Space><SettingOutlined /> Offer Information</Space>} 
                            className="modern-antd-card"
                            extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/downsell-coupon")}>Back</Button>}
                        >
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item label="Campaign Name" name="title" rules={[{ required: true, message: 'Offer name is required' }]}>
                                        <Input size="large" placeholder="e.g. 10% Discount for Second Chance" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Coupon Amount" name="amount" rules={[{ required: true, message: 'Amount is required' }]}>
                                        <InputNumber size="large" style={{ width: '100%' }} min={0} placeholder="0.00" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Coupon Type" name="coupon_type">
                                        <Select size="large">
                                            <Select.Option value="fixed">Fixed Amount</Select.Option>
                                            <Select.Option value="percent">Percentage (%)</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Duration (Days)" name="duration">
                                        <InputNumber size="large" style={{ width: '100%' }} min={1} placeholder="30" />
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
                                                            <img src={item.img_path} alt="" />
                                                            <div className="info">
                                                                <div className="name">{item.name}</div>
                                                                <div className="meta">{item.category?.name} • {item.offer_price} BDT</div>
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
                                                    <img src={p?.img_path} alt="" />
                                                    <div className="details">
                                                        <h4>{p?.name}</h4>
                                                        <p>{p?.category_name}</p>
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
                            <Form.Item label="Promotional Image">
                                <Upload.Dragger multiple={false} showUploadList={false} beforeUpload={() => false} onChange={handleImageChange} className="modern-uploader">
                                    {image ? (
                                        <div className="upload-preview-container">
                                            <img src={image} alt="preview" style={{ width: '100%', borderRadius: 8 }} />
                                            <div className="upload-overlay">
                                                <CloudUploadOutlined />
                                                <span>Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px 0' }}>
                                            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                            <p className="ant-upload-text">Click or drag image to upload</p>
                                        </div>
                                    )}
                                </Upload.Dragger>
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
