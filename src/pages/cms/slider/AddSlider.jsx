import { ArrowLeftOutlined, CloudUploadOutlined, InfoCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Select, Space, message, Row, Col, Typography } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postData } from "../../../api/common/common";
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
    const [image, setImage]           = useState(null);
    const [loading, setLoading]       = useState(false);
    const [imageFile, setImageFile]   = useState(null);
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => setImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setImage(null);
        setImageFile(null);
    };

    const onFinish = async (values) => {
        try {
            const formData = new FormData();
            formData.append("title", values.title || "");
            formData.append("status", values.status);
            formData.append("type", values.type);
            formData.append("width", values.width);
            formData.append("height", values.height);

            if (imageFile) {
                formData.append("image", imageFile);
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
                                <Text strong style={{ fontSize: '16px' }}>Slider Artwork</Text>
                                <label className="premium-upload-area">
                                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
                                    {image ? (
                                        <div className="preview-container">
                                            <img src={image} alt="Preview" className="preview-image" />
                                            <button className="remove-img-btn" onClick={handleRemoveImage}>
                                                <DeleteOutlined />
                                            </button>
                                            <div className="upload-overlay">
                                                <CloudUploadOutlined /> Change Image
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <div className="upload-icon">
                                                <CloudUploadOutlined />
                                            </div>
                                            <Text strong style={{ fontSize: '18px', color: '#1e293b' }}>Click to upload image</Text>
                                            <Text type="secondary">Optimal size depends on slider type</Text>
                                        </div>
                                    )}
                                </label>
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
