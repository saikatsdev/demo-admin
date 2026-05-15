import {ArrowLeftOutlined, UploadOutlined, SearchOutlined, CheckCircleOutlined,ShoppingOutlined, GlobalOutlined, UserOutlined, MailOutlined,
    DeleteOutlined, LoadingOutlined, EditOutlined} from "@ant-design/icons";
import {Input as AntInput, Breadcrumb, Button, Form, Select, message, Upload, Card, Row, Col, Typography, Divider, Tag, Rate, Empty, Avatar,Spin} from "antd";
import {Link, useNavigate, useParams} from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import {useEffect, useState} from "react";
import { getDatas, postData } from "../../../api/common/common";

const { Title, Text } = Typography;

export default function EditReview() {
    // Hook
    useTitle("Edit Review");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();

    // State
    const [fetching, setFetching]       = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [searching, setSearching]     = useState(false);
    const [query, setQuery]             = useState("");
    const [results, setResults]         = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [messageApi, contextHolder]   = message.useMessage();

    // Fetch Review Data
    useEffect(() => {
        const getSingleReview = async () => {
            try {
                setFetching(true);
                const res = await getDatas(`/admin/product/reviews/${id}`);

                if (res && res?.success) {
                    const data = res?.result || [];

                    form.setFieldsValue({
                        name      : data.name,
                        email     : data.email,
                        product_id: data.product_id,
                        title     : data.title,
                        rating    : Number(data.rating),
                        review    : data.review,
                        status    : data.status,
                        image     : data.img_path
                        ? [
                            {
                                uid: "-1",
                                name: "review-image",
                                status: "done",
                                url: data.img_path,
                            },
                        ]
                        : [],
                    });

                    if (data.product) {
                        setSelectedProduct(data.product);
                    } else if (data.product_id) {
                        const prodRes = await getDatas(`/admin/products/list?search_key=${data.product_id}`);
                        const products = prodRes?.result || [];
                        const exactProduct = products.find(p => String(p.id) === String(data.product_id));
                        
                        if (exactProduct) {
                            setSelectedProduct(exactProduct);
                        } else {
                            setSelectedProduct({
                                id: data.product_id,
                                name: `Product #${data.product_id}`,
                                sku: 'N/A'
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setFetching(false);
            }
        };

        getSingleReview();
    }, [id, form]);

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

        if (values.image?.length) {
            const file = values.image[0];
            if (file.originFileObj) {
                formData.append("image", file.originFileObj);
                formData.append('width', 450);
                formData.append('height', 450);
            }
        }

        formData.append("_method", "PUT");

        try {
            setFormLoading(true);
            const res = await postData(`/admin/product/reviews/${id}`, formData);

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

    if (fetching) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" tip="Loading review data..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/review">Reviews</Link> },
                            { title: "Edit Review" },
                        ]}
                        style={{ marginBottom: '8px' }}
                    />
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                        <EditOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                        Edit Product Review
                    </Title>
                </div>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ borderRadius: '8px' }}>
                    Back to List
                </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                                <AntInput.TextArea rows={5} placeholder="Update the customer's detailed experience..." />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Review Photo" name="image" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                                        <Upload beforeUpload={() => false} listType="picture" maxCount={1} accept="image/*">
                                            <Button size="large" icon={<UploadOutlined />} block>Update Photo</Button>
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
                                    {formLoading ? "Updating Review..." : "Update Review"}
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
                                        <Avatar shape="square" size={80} src={selectedProduct.img_path || selectedProduct.image} style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0' }}/>
                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ fontSize: '16px', display: 'block' }}>{selectedProduct.name}</Text>
                                            <Text type="secondary" style={{ fontSize: '13px' }}>SKU: {selectedProduct.sku}</Text>
                                            <div style={{ marginTop: '8px' }}>
                                                <Tag color="success" icon={<CheckCircleOutlined />}>Assigned</Tag>
                                            </div>
                                        </div>
                                    </div>
                                    <Button type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={handleRemoveProduct}
                                        style={{ position: 'absolute', top: 12, right: 12 }}
                                    >
                                        Change
                                    </Button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ background: '#fff7e6', padding: '12px', borderRadius: '8px', border: '1px solid #ffd591' }}>
                                        <Text type="warning" style={{ fontSize: '13px' }}>
                                            This review is currently not assigned to any product. Please search and select one.
                                        </Text>
                                    </div>
                                    <AntInput 
                                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
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
                                    <li>Changes will be live immediately after updating.</li>
                                    <li>You can reassign this review to a different product if needed.</li>
                                    <li>Rating must be between 1 and 5 stars.</li>
                                </ul>
                            </Text>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    )
}
