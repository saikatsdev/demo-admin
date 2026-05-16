import { CloudUploadOutlined, SaveOutlined, PictureOutlined } from "@ant-design/icons";
import { message, Card, Button, Typography, Row, Col } from "antd";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";

const { Title, Text } = Typography;

export default function Logo({ formatText }) {
    // State
    const [logoData, setLogoData]     = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [files, setFiles]           = useState({favicon: null,header: null,footer: null});
    const [previews, setPreviews]     = useState({favicon: null,header: null,footer: null});
    const [loading, setLoading]       = useState(null);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];

        if (file) {
            setFiles((prev) => ({ ...prev, [type]: file }));

            const reader = new FileReader();

            reader.onload = () => {
                setPreviews((prev) => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchLogoData = async () => {
            const res = await getDatas("/admin/settings", {setting_category_id:3});
            const data = res?.result?.data || [];

            if (isMounted) {
                setLogoData(data);
            }
        };

        fetchLogoData();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredLogoData = logoData.filter((item) => item.category?.id == 3);

    const handleUpdateSingle = async (product) => {
        const formData = new FormData();
        formData.append(`items[0][key]`, product.key);
        formData.append(`items[0][type]`, product.type);
        formData.append(`items[0][setting_category_id]`, product.category?.id ?? 3);
        formData.append(`items[0][instruction]`, product.instruction || '');

        if (product.type === "image") {
            const file = files[product.key];
            if (!file && !product.value) {
                messageApi.open({
                    type: "warning",
                    content: "Please select an image to update.",
                });
                return;
            }
            if (file) {
                formData.append(`items[0][value]`, file);
            } else {
                messageApi.open({
                    type: "info",
                    content: "No new image selected. Nothing to update.",
                });
                return;
            }
            formData.append(`items[0][width]`, product.width || 200);
            formData.append(`items[0][height]`, product.height || 200);
        } else {
            formData.append(`items[0][value]`, product.value ?? '');
        }

        try {
            setLoading(product.id);
            const res = await postData("/admin/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res && res?.success === true) {
                messageApi.open({
                    type: "success",
                    content: res.msg || "Updated successfully",
                });
            } else {
                console.error("Upload failed:", res);
                messageApi.open({
                    type: "error",
                    content: res?.msg || "Update failed",
                });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            messageApi.open({
                type: "error",
                content: "An error occurred while updating",
            });
        } finally {
            setLoading(null);
        }
    };

    const handleToggle = (id, checked) => {
        setLogoData((prev) =>
            prev.map((item) => item.id === id ? { ...item, value: checked ? "1" : "0" } : item)
        );
    };

    const handleInputChange = (id, newValue) => {
        setLogoData((prev) => prev.map((item) => (item.id === id ? { ...item, value: newValue } : item)));
    };

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
            {contextHolder}
            
            <div style={{ marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0, color: '#1f2937' }}>Logo & Branding Settings</Title>
                <Text type="secondary" style={{ fontSize: '15px' }}>
                    Manage your application logos, favicons, and other branding assets here. Each setting can be updated individually.
                </Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredLogoData.map((product) => product.key && (
                    <Card 
                        key={product.id} 
                        hoverable 
                        style={{ 
                            borderRadius: '16px', 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                            border: '1px solid #f0f0f0'
                        }}
                        bodyStyle={{ padding: '28px' }}
                    >
                        <Row gutter={[32, 24]} align="middle">
                            <Col xs={24} md={7}>
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Title level={5} style={{ margin: 0, color: '#2563eb', fontWeight: 600, textTransform: 'capitalize' }}>
                                        {formatText(product.key)}
                                    </Title>
                                    <Text type="secondary" style={{ marginTop: '8px', fontSize: '14px', lineHeight: '1.5' }}>
                                        {product.instruction || 'Configure this setting for your platform.'}
                                    </Text>
                                </div>
                            </Col>
                            
                            <Col xs={24} md={13}>
                                {(() => {
                                    switch (product.type) {
                                        case "switch-button":
                                        case "boolean":
                                            return (
                                                <label className="switch" style={{ transform: 'scale(1.1)' }}>
                                                    <input type="checkbox" checked={product.value === "1"} onChange={(e) => handleToggle(product.id, e.target.checked)}/>
                                                    <span className="slider" style={{ borderRadius: '34px' }}></span>
                                                </label>
                                            );

                                        case "input":
                                            return (
                                                <input 
                                                    className="custom-input" 
                                                    type="text" 
                                                    value={product.value || ""} 
                                                    onChange={(e) => handleInputChange(product.id, e.target.value)}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d9d9d9', outline: 'none', transition: 'border 0.3s' }}
                                                />
                                            );

                                        case "description":
                                            return (
                                                <textarea 
                                                    className="custom-input" 
                                                    value={product.value || ""} 
                                                    onChange={(e) => handleInputChange(product.id, e.target.value)}
                                                    style={{ width: '100%', minHeight: '100px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d9d9d9', resize: 'vertical', outline: 'none' }}
                                                />
                                            );

                                        case "image":
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                                    <div style={{ 
                                                        width: '140px', 
                                                        height: '140px', 
                                                        border: '2px dashed #e2e8f0', 
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        overflow: 'hidden',
                                                        backgroundColor: '#f8fafc',
                                                        position: 'relative'
                                                    }}>
                                                        {(previews[product.key] || product.value) ? (
                                                            <img 
                                                                src={previews[product.key] || product.value} 
                                                                alt={product.key} 
                                                                style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", transition: 'transform 0.3s ease' }}
                                                            />
                                                        ) : (
                                                            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                                <PictureOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                                                                <div style={{ fontSize: '12px' }}>No Image</div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ position: 'relative' }}>
                                                        <Button 
                                                            icon={<CloudUploadOutlined />} 
                                                            size="large"
                                                            style={{ 
                                                                borderRadius: '8px', 
                                                                borderColor: '#2563eb', 
                                                                color: '#2563eb',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            Choose New File
                                                        </Button>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={(e) => handleFileChange(e, product.key)} 
                                                            style={{ 
                                                                position: 'absolute', 
                                                                left: 0, 
                                                                top: 0, 
                                                                opacity: 0, 
                                                                cursor: 'pointer', 
                                                                width: '100%', 
                                                                height: '100%' 
                                                            }}
                                                        />
                                                        {files[product.key] && (
                                                            <Text type="success" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
                                                                File selected, ready to update!
                                                            </Text>
                                                        )}
                                                    </div>
                                                </div>
                                            );

                                        default:
                                            return (
                                                <Text type="secondary" style={{ fontStyle: 'italic' }}>
                                                    Unsupported Type: {product.type}
                                                </Text>
                                            );
                                    }
                                })()}
                            </Col>

                            <Col xs={24} md={4} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <Button 
                                    type="primary" 
                                    icon={<SaveOutlined />} 
                                    size="large"
                                    loading={loading === product.id}
                                    onClick={() => handleUpdateSingle(product)}
                                    style={{ 
                                        borderRadius: '8px', 
                                        padding: '0 32px',
                                        backgroundColor: '#2563eb',
                                        boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)',
                                        fontWeight: 600
                                    }}
                                >
                                    Update
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                ))}
            </div>
        </div>
    );
}
