import { ArrowLeftOutlined, UploadOutlined, SearchOutlined, CheckCircleOutlined, StarFilled,ShoppingOutlined,GlobalOutlined,UserOutlined,MailOutlined,MessageOutlined,DeleteOutlined,LoadingOutlined
} from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, message, Upload, Card, Row, Col, Typography, Divider, Tag, Rate, Empty, Avatar } from "antd";
import { Link, useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";

const { Title, Text } = Typography;

export default function AddReview() {
    // Hook
    useTitle("Add Review");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // State
    const [formLoading, setFormLoading] = useState(false);
    const [searching, setSearching]     = useState(false);
    const [query, setQuery]             = useState("");
    const [results, setResults]         = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [messageApi, contextHolder]   = message.useMessage();

    // Debounced Search Logic
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
                setResults(res?.result || []);
            }
        } finally {
            setSearching(false);
        }
    }

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setResults([]);
        setQuery("");
        form.setFieldValue("product_id", product.id);
    };

    const handleRemoveProduct = () => {
        setSelectedProduct(null);
        form.setFieldValue("product_id", undefined);
    };

    const handleSubmit = async (values) => {
        if (!selectedProduct) {
            messageApi.error("Please select a product!");
            return;
        }

        const formData = new FormData();

        formData.append("name", values.name);
        formData.append("email", values.email || "");
        formData.append("title", values.title || "");
        formData.append("product_id", selectedProduct.id);
        formData.append("rating", values.rating || 5);
        formData.append("review", values.review || "");
        formData.append("status", values.status);

        if (values.image && values.image.length > 0) {
            formData.append("image", values.image[0].originFileObj);
            formData.append('width', 450);
            formData.append('height', 450);
        }

        try {
            setFormLoading(true);
            const res = await postData("/admin/product/reviews", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/review");
                }, 400);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFormLoading(false);
        }
    }

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            {contextHolder}
            
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/review">Reviews</Link> },
                            { title: "Add Review" },
                        ]}
                        style={{ marginBottom: '8px' }}
                    />
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                        <StarFilled style={{ marginRight: '12px', color: '#faad14' }} />
                        Create Product Review
                    </Title>
                </div>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ borderRadius: '8px' }}>
                    Back to List
                </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'pending', rating: 5 }}>
                <Row gutter={24}>
                    <Col xs={24} lg={14}>
                        <Card title={<span><UserOutlined style={{ marginRight: 8 }} />Reviewer & Feedback Details</span>} className="shadow-sm" style={{ borderRadius: '12px', marginBottom: '24px' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="name" label="Reviewer Name" rules={[{ required: true, message: "Please provide a name!" }]}>
                                        <AntInput prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} size="large" placeholder="John Doe" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="email" label="Email Address">
                                        <AntInput prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} size="large" placeholder="john@example.com" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={16}>
                                    <Form.Item name="title" label="Review Title">
                                        <AntInput size="large" placeholder="e.g. Amazing Quality, Highly Recommended" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="rating" label="Overall Rating" rules={[{ required: true }]}>
                                        <Rate />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="review" label="Review Content">
                                <AntInput.TextArea rows={5} placeholder="Share the customer's detailed experience with this product..." prefix={<MessageOutlined />} />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Upload Photo" name="image" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                                        <Upload beforeUpload={() => false} listType="picture" maxCount={1} accept="image/*">
                                            <Button size="large" icon={<UploadOutlined />} block>Click to Upload</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="status" label="Display Status" rules={[{ required: true }]}>
                                        <Select size="large">
                                            <Select.Option value="pending">Pending Review</Select.Option>
                                            <Select.Option value="approved">Approved / Live</Select.Option>
                                            <Select.Option value="cancelled">Cancelled</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider />
                            
                            <div style={{ textAlign: 'right' }}>
                                <Button type="primary" htmlType="submit" loading={formLoading}>
                                    {formLoading ? "Saving Review..." : "Submit Review"}
                                </Button>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card 
                            title={<span><ShoppingOutlined style={{ marginRight: 8 }} />Assign Product</span>}
                            className="shadow-sm"
                            style={{ borderRadius: '12px' }}
                        >
                            {selectedProduct ? (
                                <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '12px', padding: '20px', position: 'relative' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <Avatar shape="square" size={80} src={selectedProduct.img_path || selectedProduct.image} style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0' }} />
                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ fontSize: '16px', display: 'block' }}>{selectedProduct.name}</Text>
                                            <Text type="secondary" style={{ fontSize: '13px' }}>SKU: {selectedProduct.sku}</Text>
                                            <div style={{ marginTop: '8px' }}>
                                                <Tag color="success" icon={<CheckCircleOutlined />}>Selected</Tag>
                                            </div>
                                        </div>
                                    </div>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={handleRemoveProduct} style={{ position: 'absolute', top: 12, right: 12 }}>
                                        Remove
                                    </Button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '8px', border: '1px solid #91d5ff' }}>
                                        <Text type="secondary" style={{ fontSize: '13px' }}>
                                            Search and select the product that this review belongs to.
                                        </Text>
                                    </div>
                                    <AntInput prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                        size="large"
                                        placeholder="Type to search products..." 
                                        value={query} 
                                        onChange={(e) => setQuery(e.target.value)}
                                        suffix={searching ? <LoadingOutlined /> : null}
                                        allowClear
                                    />

                                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                                        {results.length > 0 ? (
                                            results.map((item) => (
                                                <div 
                                                    key={item.id}
                                                    onClick={() => handleSelectProduct(item)}
                                                    style={{ 
                                                        padding: '12px', 
                                                        borderBottom: '1px solid #f0f0f0', 
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        gap: '12px',
                                                        alignItems: 'center',
                                                        transition: 'background 0.3s'
                                                    }}
                                                    className="search-result-item"
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Avatar shape="square" src={item.img_path || item.image} size="large" />
                                                    <div style={{ overflow: 'hidden' }}>
                                                        <Text strong style={{ fontSize: '14px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {item.name}
                                                        </Text>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>SKU: {item.sku}</Text>
                                                    </div>
                                                </div>
                                            ))
                                        ) : query && !searching ? (
                                            <Empty description="No products found" style={{ padding: '20px' }} />
                                        ) : (
                                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                                <ShoppingOutlined style={{ fontSize: '32px', color: '#f0f0f0', marginBottom: '12px' }} />
                                                <Text type="secondary" style={{ display: 'block' }}>Start typing to find products</Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>

                        <Card 
                            title={<span><GlobalOutlined style={{ marginRight: 8 }} />Review Guidelines</span>}
                            className="shadow-sm"
                            style={{ borderRadius: '12px', marginTop: '24px' }}
                        >
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                <ul>
                                    <li>Ensure the reviewer name is accurate.</li>
                                    <li>Upload a real-life photo if available for higher trust.</li>
                                    <li>Select "Approved" to make the review visible on the website immediately.</li>
                                </ul>
                            </Text>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    )
}
