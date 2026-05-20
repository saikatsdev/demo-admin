import { ArrowLeftOutlined, CloudUploadOutlined, InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, message, Space, Card, Row, Col, Typography, Divider, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

import "./css/section-banner.css";
import ImagePicker from "../../../components/image/ImagePicker";

const { Title, Text } = Typography;

const DEVICE_SIZES = {
    desktop: { width: 4360, height: 1826 },
    tablet:  { width: 1040, height: 540 },
    mobile:  { width: 480, height: 220 },
};

export default function SectionBanner() {
    // Hook
    useTitle("Add Section Banner");

    // Variable
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // State
    const [messageApi, contextHolder]   = message.useMessage();
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loading, setLoading]         = useState(false);
    const [gallery, setGallery]         = useState([]);
    const [sections, setSections]       = useState([]);

    // Method
    useEffect(() => {
        fetchMedia(page);
        fetchSections();
    }, []);

    const fetchSections = async () => {
        const res = await getDatas("/admin/sections/list");
        if(res && res?.success){
            const mapped = (res.result || []).map(item => ({value: item.id, label: item.title}));
            setSections(mapped);
        }
    }

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

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('section_id', values.section_id);
        formData.append('title', values.title);
        formData.append('device_type', values.device_type);
        formData.append('type', values.type);
        formData.append('link', values.link);
        formData.append("status", values.status);
        formData.append("description", values.description);

        formData.append('width', values.width);
        formData.append('height', values.height);

        const image = values.image?.[0];
        if (image) {
            if (image.originFileObj) {
                formData.append('image', image.originFileObj);
            } else if (image.isFromGallery) {
                formData.append('image', image.galleryPath);
            }
        }

        try {
            setLoading(true);
            const res = await postData("/admin/banners", formData);

            if(res?.success){
                form.resetFields();
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                navigate("/section-list", {
                    state: {viewType: "banner"},
                });
            }
        } catch (error) {
            console.log(error);
            message.error("Failed to create banner");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="section-banner-container">
            {contextHolder}
            <div className="section-banner-header">
                <div className="section-banner-title">
                    <h1>Add Section Banner</h1>
                    <p>Create and configure promotional banners for your shop sections.</p>
                </div>
                <Space>
                    <Link to="/section-list" state={{viewType: "banner"}}>
                      <Button icon={<ArrowLeftOutlined />} className="btn-secondary">Back to List</Button>
                    </Link>
                </Space>
            </div>

            <Breadcrumb
                style={{ marginBottom: 24 }}
                items={[
                    { title: <Link to="/dashboard">Dashboard</Link> },
                    { title: "Banners" },
                    { title: "Add Section Banner" },
                ]}
            />

            <Form 
                form={form} 
                layout="vertical" 
                onFinish={handleSubmit} 
                initialValues={{width: 4360, height: 1826, device_type: "desktop", status: "active", type: 1}} 
                onValuesChange={(changed) => {
                    if (changed.device_type) {
                        const size = DEVICE_SIZES[changed.device_type];
                        if (size) form.setFieldsValue(size);
                    }
                }}
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Card className="banner-card" title="Banner Information">
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="title" label="Banner Title" rules={[{ required: true, message: 'Please enter banner title' }]}>
                                        <AntInput size="large" placeholder="e.g. Summer Collection 2024" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="section_id" label="Target Section" rules={[{ required: true, message: 'Select a section' }]}>
                                        <Select size="large" options={sections} placeholder="Select Section"/>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="type" label="Banner Type" rules={[{ required: true }]}>
                                        <Select size="large" options={[{ value: 1, label: 'Feature Banner' }, { value: 0, label: 'Standard Banner' }]} placeholder="Select Type"/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="link" label="Redirect Link" rules={[{ required: true, message: 'Redirect link is required' }]}>
                                        <AntInput size="large" placeholder="https://example.com/collection" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="description" label="Short Description" rules={[{ required: true, message: "Description is required" }]}>
                                        <AntInput.TextArea rows={4} placeholder="Describe the banner purpose or content..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card className="banner-card" title="Display Media" style={{ marginBottom: 24 }}>
                            <div className="media-upload-section">
                                <Form.Item name="image" rules={[{ required: true, message: 'Banner image is required' }]}>
                                    <ImagePicker 
                                        gallery={gallery} 
                                        hasMore={hasMore} 
                                        loadingMore={loadingMore} 
                                        fetchMore={() => fetchMedia(page + 1)}
                                    />
                                </Form.Item>
                                <Text type="secondary" size="small">
                                    <InfoCircleOutlined /> Recommended size for current device: 
                                    <b> {form.getFieldValue('width')}x{form.getFieldValue('height')}px</b>
                                </Text>
                            </div>
                        </Card>

                        <Card className="banner-card" title="Settings">
                            <Form.Item name="device_type" label="Target Device">
                                <Select 
                                    size="large"
                                    options={[
                                        {value: "desktop", label: 'Desktop (4K/HD)'},
                                        {value: "tablet", label: 'Tablet (iPad/Mobile Landscape)'},
                                        {value: "mobile", label: 'Mobile (Handheld)'}
                                    ]} 
                                />
                            </Form.Item>

                            <div className="form-field-group">
                                <span className="form-field-group-title">Custom Dimensions (px)</span>
                                <Row gutter={10}>
                                    <Col span={12}>
                                        <Form.Item name="width" label="Width" rules={[{ required: true }]}>
                                            <AntInput placeholder="W" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="height" label="Height" rules={[{ required: true }]}>
                                            <AntInput placeholder="H" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            <Form.Item name="status" label="Visibility Status">
                                <Select size="large" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                            </Form.Item>

                            <Divider />

                            <Form.Item style={{margin: 0}}>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    block 
                                    size="large" 
                                    loading={loading}
                                    icon={<PlusOutlined />}
                                    style={{height: '50px', borderRadius: '8px', fontWeight: '600'}}
                                >
                                    {loading ? "Creating..." : "Save Banner"}
                                </Button>
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    )
}
