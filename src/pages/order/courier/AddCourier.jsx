
import { ArrowLeftOutlined, SaveOutlined, InfoCircleOutlined, PictureOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Divider, Form, Input as AntInput, message, Row, Select, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import ImagePicker from "../../../components/image/ImagePicker";

const { Title, Text } = Typography;

export default function AddCourier() {
    // Hook
    useTitle("Add Courier");

    const navigate = useNavigate();

    // State
    const [form]                              = Form.useForm();
    const [messageApi, contextHolder]         = message.useMessage();
    const [page, setPage]                     = useState(1);
    const [hasMore, setHasMore]               = useState(true);
    const [loadingMore, setLoadingMore]       = useState(false);
    const [loading, setLoading]               = useState(false);
    const [gallery, setGallery]               = useState([]);

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

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('name', values.name);
        formData.append('status', values.status);
        formData.append('width', values.width || 450);
        formData.append('height', values.height || 450);

        // Image Handling
        if (values.image && values.image.length > 0) {
            const imgData = values.image[0];
            if (imgData.originFileObj) {
                formData.append("image", imgData.originFileObj);
            } else if (imgData.galleryPath) {
                formData.append("image", imgData.galleryPath);
            }
        }

        try {
            setLoading(true);
            const res = await postData("/admin/couriers", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res && res?.success) {
                messageApi.success(res.msg);
                setTimeout(() => navigate("/couriers"), 1000);
            } else {
                message.error(res?.msg || "Something went wrong");
            }
        } catch (error) {
            console.error(error);
            message.error("Failed to add courier");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
            {contextHolder}
            
            <div className="pagehead" style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #e9ecef', marginBottom: '24px' }}>
                <div className="head-left">
                    <Title level={4} style={{ margin: 0 }}>Add New Courier</Title>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/couriers">Couriers</Link> },
                            { title: "Add New" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
                        <Button 
                            type="primary" 
                            icon={<SaveOutlined />} 
                            onClick={() => form.submit()} 
                            loading={loading}
                        >
                            Save Courier
                        </Button>
                    </Space>
                </div>
            </div>

            <div style={{ padding: '0 24px' }}>
                <Form 
                    layout="vertical" 
                    form={form} 
                    onFinish={handleSubmit} 
                    initialValues={{ width: 450, height: 450, status: 'active' }}
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <Card 
                                title={<Space><UserOutlined style={{ color: '#1890ff' }} />Courier Information</Space>} 
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}
                            >
                                <Form.Item 
                                    label="Courier Full Name" 
                                    name="name" 
                                    rules={[{ required: true, message: 'Please enter name' }]}
                                >
                                    <AntInput size="large" placeholder="e.g. John Doe, Pathao, RedX" />
                                </Form.Item>

                                <Divider style={{ margin: '24px 0' }} />

                                <Space align="start" style={{ marginBottom: '16px' }}>
                                    <InfoCircleOutlined style={{ color: '#64748b', marginTop: '4px' }} />
                                    <div>
                                        <Text strong>Display Dimensions</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Define how the courier logo should be rendered</Text>
                                    </div>
                                </Space>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="Width" name="width">
                                            <AntInput type="number" placeholder="450" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Height" name="height">
                                            <AntInput type="number" placeholder="450" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card 
                                title={<Space><PictureOutlined style={{ color: '#1890ff' }} />Courier Logo</Space>} 
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}
                            >
                                <Form.Item 
                                    name="image" 
                                    label="Logo / Avatar" 
                                    rules={[{ required: true, message: 'Image is required' }]}
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
                                    SVG or PNG with transparent background is recommended.
                                </Text>
                            </Card>

                            <Card 
                                title={<Space><SettingOutlined style={{ color: '#1890ff' }} />Settings</Space>} 
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            >
                                <Form.Item 
                                    name="status" 
                                    label="Account Status" 
                                    rules={[{ required: true }]}
                                >
                                    <Select 
                                        size="large"
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
                                    Publish Courier
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    )
}
