import { ArrowLeftOutlined, DeleteOutlined, LoadingOutlined, PlusOutlined, SearchOutlined, ShoppingOutlined,CheckCircleOutlined,EyeOutlined,GlobalOutlined} from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, message, Card, Row, Col, Typography, Divider, Tag, Badge, Empty, Segmented, Alert} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { Title, Text } = Typography;

export default function AddSection() {
    // Hook
    useTitle("Add Section");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // State
    const [selectionType, setSelectionType]           = useState('none');
    const [categories, setCategories]                 = useState([]);
    const [query, setQuery]                           = useState("");
    const [results, setResults]                       = useState([]);
    const [loadingIndex, setLoadingIndex]             = useState(null);
    const [loadingRemoveIndex, setLoadingRemoveIndex] = useState(null);
    const [productIds, setProductIds]                 = useState([]);
    const [messageApi, contextHolder]                 = message.useMessage();
    const [addProducts, setAddProducts]               = useState([]);
    const [searching, setSearching]                   = useState(false);
    const [submitting, setSubmitting]                 = useState(false);

    const isCategory = selectionType === 'category';
    const isCustom = selectionType === 'custom';

    // Method
    useEffect(() => {
        const fetchCategories = async () => {
            const res = await getDatas("/admin/categories/list");
            const list = res?.result || [];
            setCategories(
                list.map((cat) => ({
                    label: cat.name,
                    value: cat.id
                }))
            );
        }
        fetchCategories();
    }, []);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            fetchSearchProduct(query);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const fetchSearchProduct = async (searchText) => {
        setSearching(true);
        try {
            const res = await getDatas(`/admin/products/search?search_key=${searchText}`);
            if (res?.success) {
                const filteredResults = (res?.result || []).filter(
                    item => !productIds.includes(item.id)
                );
                setResults(filteredResults);
            }
        } finally {
            setSearching(false);
        }
    }

    const handleAdd = (item, index) => {
        setLoadingIndex(index);
        setProductIds((prev) => [...prev, item.id]);
        setAddProducts((prev) => [...prev, item]);
        setResults((prev) => prev.filter(p => p.id !== item.id));
        setTimeout(() => setLoadingIndex(null), 500);
    };

    const handleRemove = (item, index) => {
        setLoadingRemoveIndex(index);
        setProductIds((prev) => prev.filter((id) => id !== item.id));
        setAddProducts((prev) => prev.filter((p) => p.id !== item.id));
        setTimeout(() => setLoadingRemoveIndex(null), 500);
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                position: 5,
                product_ids: productIds
            }

            const res = await postData("/admin/sections", payload);

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/section-list");
                }, 400);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const ProductCard = ({ item, index, isAdded, onAction, loading }) => (
        <Card hoverable className="product-card"
            cover={
                <div style={{ position: 'relative', height: 180, overflow: 'hidden', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    <img alt={item.name} src={item.img_path} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}/>
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Tag style={{textTransform:"capitalize"}} color={item.status === 'active' ? 'green' : 'red'}>
                            {item.status}
                        </Tag>
                    </div>
                </div>
            }
            styles={{ body: { padding: '12px' } }}
        >
            <div style={{ height: '40px', overflow: 'hidden', marginBottom: '8px' }}>
                <Text strong style={{ fontSize: '14px', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.name}
                </Text>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
                <Text type="secondary" size="small" style={{ fontSize: '12px', display: 'block' }}>
                    SKU: {item.sku}
                </Text>
                <Text type="secondary" size="small" style={{ fontSize: '12px', display: 'block' }}>
                    Cat: {item?.category_name ||  'N/A'}
                </Text>
            </div>

            <Button type={isAdded ? "default" : "primary"} danger={isAdded} icon={loading ? <LoadingOutlined /> : (isAdded ? <DeleteOutlined /> : <PlusOutlined />)} block onClick={() => onAction(item, index)}>
                {isAdded ? "Remove" : "Add Product"}
            </Button>
        </Card>
    );

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/section-list">Sections</Link> },
                            { title: "Add Section" },
                        ]}
                        style={{ marginBottom: '8px' }}
                    />
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                        <ShoppingOutlined style={{ marginRight: '12px' }} />
                        Create New Section
                    </Title>
                </div>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ borderRadius: '8px' }}>
                    Back to List
                </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'active', is_slider: 0 }}>
                <Row gutter={24}>
                    <Col xs={24} lg={10}>
                        <Card title={<span><GlobalOutlined style={{ marginRight: 8 }} />Section Details</span>} className="shadow-sm" style={{ borderRadius: '12px', marginBottom: '24px' }}>
                            <Form.Item name="title" label="Section Title" rules={[{ required: true, message: 'Please enter section title' }]}>
                                <AntInput size="large" placeholder="e.g. Featured Products, New Arrivals" />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                        <Select size="large" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item name="is_slider" label="Slider Mode" rules={[{ required: true }]}>
                                        <Select size="large" options={[{ value: 1, label: 'Yes' }, { value: 0, label: 'No' }]} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="link" label="Section Link (View All)" rules={[{ required: true, message: 'Please enter link' }]}>
                                <AntInput size="large" placeholder="/products?category=featured" />
                            </Form.Item>

                            <Divider orientation="left">Product Selection Mode</Divider>
                            
                            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                                <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                                    How would you like to populate this section?
                                </Text>
                                <Segmented block size="large" value={selectionType}
                                    onChange={(val) => {
                                        setSelectionType(val);
                                        if (val === 'category') {
                                            setResults([]);
                                            setAddProducts([]);
                                            setProductIds([]);
                                        } else if (val === 'custom') {
                                        } else {
                                            setResults([]);
                                            setAddProducts([]);
                                            setProductIds([]);
                                        }
                                    }}
                                    options={[
                                        { label: 'Manual', value: 'none' },
                                        { label: 'By Category', value: 'category' },
                                        { label: 'Custom List', value: 'custom' },
                                    ]}
                                />
                            </div>

                            {isCategory && (
                                <div style={{ marginTop: '20px' }}>
                                    <Form.Item name="category_id" label="Select Category" rules={[{ required: true, message: 'Please select a category' }]}>
                                        <Select size="large" placeholder="Choose a category..." options={categories} />
                                    </Form.Item>
                                    <Alert type="info" showIcon message="This section will automatically display products from the selected category." style={{ marginTop: '8px' }}/>
                                </div>
                            )}

                            <div style={{ marginTop: '32px', textAlign: 'right' }}>
                                <Button type="primary" size="large" htmlType="submit" loading={submitting} style={{ height: '48px', padding: '0 40px', borderRadius: '8px', fontWeight: 600 }}>
                                    {submitting ? "Creating..." : "Create Section"}
                                </Button>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={14}>
                        {isCustom ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <Card 
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span><CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />Selected Products</span>
                                            <Badge count={addProducts.length} showZero color="#52c41a" />
                                        </div>
                                    }
                                    className="shadow-sm"
                                    style={{ borderRadius: '12px' }}
                                >
                                    {addProducts.length > 0 ? (
                                        <Row gutter={[16, 16]}>
                                            {addProducts.map((item, index) => (
                                                <Col xs={24} sm={12} md={8} key={item.id}>
                                                    <ProductCard item={item} index={index} isAdded={true} onAction={handleRemove} loading={loadingRemoveIndex === index}/>
                                                </Col>
                                            ))}
                                        </Row>
                                    ) : (
                                        <Empty description="No products selected yet. Use the search below to find products." />
                                    )}
                                </Card>

                                <Card title={<span><SearchOutlined style={{ marginRight: 8 }} />Search & Add Products</span>}
                                className="shadow-sm"
                                style={{ borderRadius: '12px' }}>
                                    <AntInput prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                    size="large"
                                    placeholder="Search by product name, SKU or keyword..." 
                                    value={query} 
                                        onChange={(e) => setQuery(e.target.value)}
                                        allowClear
                                        style={{ marginBottom: '20px', borderRadius: '8px' }}
                                        suffix={searching ? <LoadingOutlined /> : null}
                                    />

                                    {results.length > 0 ? (
                                        <Row gutter={[16, 16]}>
                                            {results.map((item, index) => (
                                                <Col xs={24} sm={12} md={8} key={item.id}>
                                                    <ProductCard item={item} index={index} isAdded={false} onAction={handleAdd} loading={loadingIndex === index}/>
                                                </Col>
                                            ))}
                                        </Row>
                                    ) : query && !searching ? (
                                        <Empty description={`No products found for "${query}"`} />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                            <SearchOutlined style={{ fontSize: '48px', color: '#f0f0f0', marginBottom: '16px' }} />
                                            <Text type="secondary" style={{ display: 'block' }}>Enter a search term to find products for this section</Text>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        ) : selectionType === 'none' ? (
                            <Card style={{ borderRadius: '12px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center', padding: '60px' }}>
                                    <ShoppingOutlined style={{ fontSize: '64px', color: '#e6f7ff', marginBottom: '24px' }} />
                                    <Title level={4} style={{ color: '#8c8c8c' }}>Select a populate mode</Title>
                                    <Text type="secondary">Choose "By Category" for automatic collection or "Custom List" to hand-pick products.</Text>
                                </div>
                            </Card>
                        ) : (
                            <Card style={{ borderRadius: '12px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center', padding: '60px' }}>
                                    <EyeOutlined style={{ fontSize: '64px', color: '#f6ffed', marginBottom: '24px' }} />
                                    <Title level={4} style={{ color: '#8c8c8c' }}>Category Mode Active</Title>
                                    <Text type="secondary">In Category mode, products are managed via the selected category automatically.</Text>
                                </div>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Form>
        </div>
    )
}
