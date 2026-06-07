
import { ArrowLeftOutlined, SaveOutlined, InfoCircleOutlined, PictureOutlined, PhoneOutlined, SafetyOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, message, Card, Row, Col, Typography, Space, Divider } from "antd";
import { Link, useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";
import { useState, useEffect } from "react";
import ImagePicker from "../../../components/image/ImagePicker";

const { Title, Text } = Typography;

export default function AddPaymentGateway() {
    // Hook
    useTitle("Add Payment Gateway");

    const navigate = useNavigate();
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading]       = useState(false);

    // Gallery States
    const [gallery, setGallery]         = useState([]);
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch Gallery
    const fetchMedia = async (pageNumber = 1) => {
        try {
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
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchMedia(1);
    }, []);

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('name', values.name);
        formData.append('phone_number', values.phone_number || "");
        formData.append('status', values.status);

        // Image Handling
        if (values.image && values.image.length > 0) {
            const imgData = values.image[0];
            if (imgData.originFileObj) {
                formData.append("image", imgData.originFileObj);
            } else if (imgData.galleryPath) {
                formData.append("image", imgData.galleryPath);
            }
        }

        formData.append("width", values.width || 1200);
        formData.append("height", values.height || 960);

        try {
            setLoading(true);
            const res = await postData("/admin/payment-gateways", formData);

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/payment-gateways");
                }, 400);
            } else {
                message.error(res?.msg || "Something went wrong");
            }
        } catch (error) {
            console.log(error);
            message.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
            {contextHolder}
            <div className="pagehead" style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #e9ecef', marginBottom: '24px' }}>
                <div className="head-left">
                    <Title level={4} style={{ margin: 0 }}>Add Payment Gateway</Title>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/payment-gateways">Payment Gateway</Link> },
                            { title: "Add New" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<SaveOutlined />} 
                            onClick={() => form.submit()} 
                            loading={loading}
                        >
                            Save Gateway
                        </Button>
                    </Space>
                </div>
            </div>

            <div style={{ padding: '0 24px' }}>
                <Form 
                    layout="vertical" 
                    form={form} 
                    onFinish={handleSubmit} 
                    initialValues={{ width: 1200, height: 960, status: 'active' }}
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <Card 
                                title={<Space><InfoCircleOutlined style={{ color: '#1890ff' }} />Gateway Information</Space>} 
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}
                            >
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item 
                                            name="name" 
                                            label="Gateway Name" 
                                            rules={[{ required: true, message: 'Please enter gateway name' }]}
                                        >
                                            <AntInput size="large" placeholder="e.g. Bkash Personal, Nagad, Rocket" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item 
                                            name="phone_number" 
                                            label="Account / Phone Number"
                                        >
                                            <AntInput size="large" prefix={<PhoneOutlined />} placeholder="e.g. 017XXXXXXXX" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '16px 0' }} />

                                <Text type="secondary">Dimensional metadata for responsive rendering</Text>
                                <Row gutter={16} style={{ marginTop: '16px' }}>
                                    <Col span={12}>
                                        <Form.Item 
                                            name="width" 
                                            label="Image Width" 
                                            rules={[{ required: true }]}
                                        >
                                            <AntInput type="number" placeholder="1200" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item 
                                            name="height" 
                                            label="Image Height" 
                                            rules={[{ required: true }]}
                                        >
                                            <AntInput type="number" placeholder="960" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card 
                                title={<Space><PictureOutlined style={{ color: '#1890ff' }} />Gateway Icon</Space>} 
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}
                            >
                                <Form.Item 
                                    name="image" 
                                    label="Upload / Select Icon" 
                                    rules={[{ required: true, message: 'Logo is required' }]}
                                >
                                    <ImagePicker 
                                        gallery={gallery}
                                        fetchMore={() => fetchMedia(page + 1)}
                                        hasMore={hasMore}
                                        loadingMore={loadingMore}
                                        onUploadSuccess={(newItems) => setGallery(prev => [...newItems, ...prev])}
                                    />
                                </Form.Item>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Tip: Use a high-quality PNG or SVG logo for best results.
                                </Text>
                            </Card>

                            <Card 
                                title={<Space><SafetyOutlined style={{ color: '#1890ff' }} />Settings</Space>} 
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            >
                                <Form.Item 
                                    name="status" 
                                    label="Status" 
                                    rules={[{ required: true }]}
                                >
                                    <Select 
                                        options={[
                                            { value: 'active', label: 'Active' }, 
                                            { value: 'inactive', label: 'Inactive' }
                                        ]} 
                                    />
                                </Form.Item>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    block 
                                    size="large" 
                                    loading={loading}
                                    style={{ marginTop: '16px' }}
                                >
                                    Submit
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    )
}

