import { ArrowLeftOutlined, DeleteOutlined, InboxOutlined, PlusOutlined, SaveOutlined, SettingOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Divider, Form, Input, InputNumber, message, Radio, Row, Select, Space, Spin, Tag, Typography, Upload } from "antd";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import ProductImagePicker from "../../../components/image/ProductImagePicker";
import useTitle from "../../../hooks/useTitle";
import "./downsell.css";

const { Title, Text } = Typography;

export default function EditDownSell() {
    // Hook
    useTitle("Edit Down Sell");

    // State
    const [query, setQuery]                           = useState("");
    const [results, setResults]                       = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [formLoading, setFormLoading]               = useState(false);
    const [selectedProducts, setSelectedProducts]     = useState([]);
    const [image, setImage]                           = useState(null);
    const [categories, setCategories]                 = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [imageFile, setImageFile]                   = useState(null);
    const [mode, setMode]                             = useState("all");
    const [messageApi, contextHolder]                 = message.useMessage();
    const [downSellData, setDownSellData]             = useState(null);

    // Gallery states
    const [gallery, setGallery]         = useState([]);
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Variable
    const { id } = useParams();
    const debounceTimeout = useRef(null);
    const cancelToken = useRef(null);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // Get Category
    useEffect(() => {
        let isMounted = true;
        const getCategories = async () => {
            const res = await getDatas("/admin/categories/list");
            if (res && res.success && isMounted) {
                setCategories(res?.result || []);
            }
        };
        getCategories();
        fetchMedia();
        return () => { isMounted = false; };
    }, []);

    const fetchMedia = async (pageNum = 1) => {
        setLoadingMore(true);
        try {
            const res = await getDatas(`/admin/gallary?page=${pageNum}`);
            if (res && res.success) {
                const newItems = res.result?.data || [];
                setGallery(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
                setHasMore(res.result?.current_page < res.result?.last_page);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Media fetch error:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Get DownSell
    useEffect(() => {
        let isMounted = true;
        const getDownSell = async () => {
            setLoading(true);
            try {
                const res = await getDatas(`/admin/down-sells/${id}`);
                if (res && res?.success && isMounted) {
                    const data = res.result;
                    setDownSellData(data);
                    setImage(data.image);
                    
                    // Populate form
                    form.setFieldsValue({
                        title: data.title,
                        amount: data.amount,
                        coupon_type: data.type,
                        started_at: data.started_at?.slice(0, 10),
                        ended_at: data.ended_at?.slice(0, 10),
                        status: data.status,
                        description: data.description,
                        width: data.width || 450,
                        height: data.height || 450,
                        image: data.image ? [{ uid: "-1", name: "existing-image", status: "done", url: data.image }] : []
                    });

                    if (Array.isArray(data.products) && data.products.length > 0) {
                        setMode("product");
                        const formattedProducts = data.products.map(item => ({
                            id: item.id,
                            name: item.name,
                            img_path: item.img_path,
                            offer_price: item.offer_price,
                            category: item.category ?? { name: "N/A" }
                        }));
                        setSelectedProducts(formattedProducts);
                    } else if (data.category_id) {
                        setMode("category");
                    } else {
                        setMode("all");
                    }
                }
            } catch (error) {
                console.log(error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        getDownSell();
        return () => { isMounted = false; };
    }, [id, form]);

    useEffect(() => {
        if (downSellData && downSellData.category_id !== null && categories.length > 0) {
            const foundCat = categories.find((cat) => cat.id === downSellData.category_id);
            if (foundCat) {
                setSelectedCategories([foundCat]);
            }
        }
    }, [downSellData, categories]);

    const fetchedProducts = async (searchTerm) => {
        if (!searchTerm) {
            setResults([]);
            return;
        }
        if (cancelToken.current) cancelToken.current.cancel();
        cancelToken.current = axios.CancelToken.source();
        setLoading(true);
        try {
            const res = await getDatas("/admin/products/search", {
                params: { search_key: searchTerm },
                cancelToken: cancelToken.current.token,
            });
            if (res && res?.success) setResults(res?.result);
        } catch (error) {
            if (!axios.isCancel(error)) console.log(error);
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
            selectedProducts.forEach(p => formData.append("product_ids[]", p.id));
            if (selectedProducts.length === 0) return messageApi.error("Select at least one product");
        }

        if (mode === "category") {
            selectedCategories.forEach(c => {
                formData.append("category_ids[]", c.id);
                formData.append("trigger_category_ids[]", c.id);
            });
            if (selectedCategories.length === 0) return messageApi.error("Select at least one category");
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
        
        formData.append("_method", "PUT");

        try {
            setFormLoading(true);
            const res = await postData(`/admin/down-sells/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            if (res && res?.success) {
                messageApi.success(res.msg);
                setTimeout(() => navigate("/downsell-coupon"), 1000);
            }
        } catch (error) {
            console.log(error);
            messageApi.error("Failed to update downsell offer");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div style={{ padding: 16 }}>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Edit Downsell Products</h1>
                    <p className="subtitle">Update your promotional offer settings and triggers</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/downsell-coupon">Downsells</Link> },
                            { title: "Edit Offer" },
                        ]}
                    />
                </div>
            </div>

            <Spin spinning={loading && !downSellData}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <Card title={<Space><SettingOutlined /> Campaign Details</Space>} className="modern-antd-card" extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/downsell-coupon")}>Back</Button>}>
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item label="Campaign Name" name="title" rules={[{ required: true, message: 'Name is required' }]}>
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Coupon Amount" name="amount" rules={[{ required: true, message: 'Amount is required' }]}>
                                            <InputNumber size="large" style={{ width: '100%' }} min={0} />
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
                                        <Form.Item label="Description" name="description">
                                            <Input.TextArea rows={4} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card title={<Space><ThunderboltOutlined /> Trigger Logic</Space>} className="modern-antd-card" style={{ marginTop: 24 }}>
                                <Form.Item label="Active Trigger Mode">
                                    <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} buttonStyle="solid" className="modern-radio-group">
                                        <Radio.Button value="all">Storewide</Radio.Button>
                                        <Radio.Button value="product">Specific Products</Radio.Button>
                                        <Radio.Button value="category">Specific Categories</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>

                                {mode === "product" && (
                                    <div style={{ marginTop: 20 }}>
                                        <Form.Item label="Search & Add Products">
                                            <div style={{ position: 'relative' }}>
                                                <Input.Search size="large" placeholder="Search product name..." value={query} onChange={(e) => setQuery(e.target.value)} loading={loading}/>
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
                                                        <img src={p.img_path} alt="" />
                                                        <div className="details">
                                                            <h4>{p.name}</h4>
                                                            <p>{p.category?.name || p.category_name}</p>
                                                        </div>
                                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setSelectedProducts(selectedProducts.filter(item => item.id !== p.id))} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {selectedProducts.length === 0 && <div className="placeholder-empty">No products linked to this offer</div>}
                                    </div>
                                )}

                                {mode === "category" && (
                                    <div style={{ marginTop: 20 }}>
                                        <Form.Item label="Target Categories">
                                            <Select size="large" placeholder="Add category" onChange={handleCategory} value={null}>
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
                                        {selectedCategories.length === 0 && <div className="placeholder-empty">No categories linked yet</div>}
                                    </div>
                                )}
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card title={<Space><InboxOutlined /> Banner Media</Space>} className="modern-antd-card sticky-card">
                                <Form.Item name="image">
                                    <ProductImagePicker 
                                        gallery={gallery}
                                        hasMore={hasMore}
                                        loadingMore={loadingMore}
                                        fetchMore={() => fetchMedia(page + 1)}
                                        onUploadSuccess={(newItems) => setGallery(prev => [...newItems, ...prev])}
                                    />
                                </Form.Item>

                                <Row gutter={12}>
                                    <Col span={12}>
                                        <Form.Item label="Width" name="width">
                                            <InputNumber style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Height" name="height">
                                            <InputNumber style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item label="Visibility" name="status">
                                    <Select size="large">
                                        <Select.Option value="active">Active</Select.Option>
                                        <Select.Option value="inactive">Inactive</Select.Option>
                                    </Select>
                                </Form.Item>

                                <Divider />

                                <Button type="primary" htmlType="submit" size="large" block loading={formLoading} icon={<SaveOutlined />} style={{ height: 48, borderRadius: 8, fontWeight: 600 }}>
                                    Update Down Sell
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </div>
    );
}
