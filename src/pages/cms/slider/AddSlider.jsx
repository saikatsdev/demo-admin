import { ArrowLeftOutlined, CloudUploadOutlined, InfoCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, message, Row, Col, Typography } from "antd";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postData, getDatas } from "../../../api/common/common";
import ProductImagePicker from "../../../components/image/ProductImagePicker";
import useTitle from "../../../hooks/useTitle";
import "./Slider.css";

const { Text, Title } = Typography;

const DEVICE_SIZES = {
    desktop: { width: 4360, height: 1826 },
    tablet:  { width: 1040, height: 540 },
    mobile:  { width: 480, height: 220 },
};

export default function AddSlider() {
    // Hooks
    useTitle("Add Home Slider | Admin");

    // Variable
    const navigate = useNavigate();

    // State
    const [loading, setLoading]       = useState(false);
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    
    // Gallery states
    const [gallery, setGallery]         = useState([]);
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        fetchMedia();
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

    const onFinish = async (values) => {
        try {
            const formData = new FormData();
            formData.append("title", values.title || "");
            formData.append("status", values.status);
            formData.append("type", values.type);
            formData.append("width", values.width);
            formData.append("height", values.height);

            const imageValue = values.image;
            if (imageValue && imageValue.length > 0) {
                const imgObj = imageValue[0];
                if (imgObj.isFromGallery) {
                    formData.append("image", imgObj.galleryPath);
                } else if (imgObj.originFileObj) {
                    formData.append("image", imgObj.originFileObj);
                }
            }

            setLoading(true);
            try {
                const res = await postData("/admin/sliders", formData, { 
                    headers: { "Content-Type": "multipart/form-data" }
                });

                if(res && res.success){
                    messageApi.success({
                        content: res.msg || "Slider created successfully",
                        duration: 3
                    });
                    navigate("/sliders")
                }
            } catch (error) {
                messageApi.error("Failed to create slider. Please try again.");
            } finally {
                setLoading(false);
            }
        } catch (error) {
            console.error("Error adding slider:", error);
        }
    };

    return (
        <div className="slider-container">
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Add Home Slider</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/sliders">Home Sliders</Link> },
                            { title: "New Slider" },
                        ]}
                    />
                </div>
                <Button className="premium-back-btn" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                    Back to List
                </Button>
            </div>

            <div className="premium-card">
                <div className="card-content">
                    <Form form={form} layout="vertical" onFinish={onFinish} className="premium-form"
                        initialValues={{ width: 4360, height: 1826, type: "desktop", status: "active" }}
                        onValuesChange={(changed) => {
                            if (changed.type && DEVICE_SIZES[changed.type]) {
                                const size = DEVICE_SIZES[changed.type];
                                form.setFieldsValue(size);
                            }
                        }}
                    >
                        <div className="form-grid">
                            <div className="upload-section">
                                <Form.Item name="image" rules={[{ required: true, message: "Please select an image" }]}>
                                    <ProductImagePicker 
                                        gallery={gallery}
                                        hasMore={hasMore}
                                        loadingMore={loadingMore}
                                        fetchMore={() => fetchMedia(page + 1)}
                                        onUploadSuccess={(newItems) => setGallery(prev => [...newItems, ...prev])}
                                    />
                                </Form.Item>
                                <div className="size-info-badge">
                                    <div className="badge-dot" />
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        Supports JPG, PNG, WEBP (Max 2MB)
                                    </Text>
                                </div>
                            </div>

                            <div className="form-details-section">
                                <Form.Item label="Home Slider Title" name="title" rules={[{ required: true, message: "Please enter a slider title" }]}>
                                    <AntInput className="premium-input" placeholder="e.g. Summer Collection 2024" />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="status" label="Visibility" rules={[{ required: true }]}>
                                            <Select className="premium-select" options={[{ value: 'active', label: 'Visible' }, { value: 'inactive', label: 'Hidden' }]} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="type" label="Display Device" rules={[{ required: true }]}>
                                            <Select 
                                                className="premium-select" 
                                                options={[
                                                    { value: 'desktop', label: 'Desktop View' }, 
                                                    { value: 'tablet', label: 'Tablet View' },
                                                    { value: 'mobile', label: 'Mobile View' }
                                                ]} 
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <Space style={{ marginBottom: 16 }}>
                                        <InfoCircleOutlined style={{ color: '#6366f1' }} />
                                        <Text strong>Dimension Configuration</Text>
                                    </Space>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label="Width (px)" name="width" rules={[{ required: true }]}>
                                                <AntInput className="premium-input" placeholder="Width" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Height (px)" name="height" rules={[{ required: true }]}>
                                                <AntInput className="premium-input" placeholder="Height" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        Dimensions are automatically suggested based on the selected device type.
                                    </Text>
                                </div>

                                <div className="submit-section">
                                    <Button type="primary" htmlType="submit" loading={loading} className="premium-submit-btn" block>
                                        {loading ? "PROCESSING..." : "CREATE HOME SLIDER"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    )
}
