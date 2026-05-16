import { CloudUploadOutlined, SaveOutlined, PictureOutlined } from "@ant-design/icons";
import { message, Card, Button, Typography, Row, Col } from "antd";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "./css/quill-overrides.css";

const { Title, Text } = Typography;

export default function ProductSetting({ formatText }) {
    // State
    const [productSetting, setProductSetting] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [files, setFiles]           = useState({});
    const [previews, setPreviews]     = useState({});
    const [loading, setLoading]       = useState(null);

    // Method
    useEffect(() => {
        let isMounted = true;

        const fetchedProductSetting = async () => {
            const res = await getDatas("/admin/settings", {setting_category_id:4});
            const data = res?.result?.data || [];

            if(isMounted){
                setProductSetting(data);
            }
        }

        fetchedProductSetting();

        return () => {
            isMounted = false;
        }
    }, []);

    const filteredProductdata = productSetting.filter((item) => item.category?.id == 4);

    const handleFileChange = (e, key) => {
        const file = e.target.files[0];

        if (file) {
            setFiles((prev) => ({ ...prev, [key]: file }));

            const reader = new FileReader();

            reader.onload = () => {
                setPreviews((prev) => ({ ...prev, [key]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleToggle = (id, checked) => {
        setProductSetting((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, value: checked ? "1" : "0" } : item
            )
        );
    };

    const handleInputChange = (id, newValue) => {
        setProductSetting((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, value: newValue } : item
            )
        );
    };

    const handleUpdateSingle = async (product) => {
        const formData = new FormData();
        formData.append(`items[0][key]`, product.key);
        formData.append(`items[0][type]`, product.type || "text");
        formData.append(`items[0][setting_category_id]`, product.category?.id || 4);
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
        } else {
            formData.append(`items[0][value]`, product.value ?? '');
        }

        try {
            setLoading(product.id);
            const res = await postData("/admin/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res && (res?.status === 200 || res?.success === true)) {
                messageApi.open({
                  type: "success",
                  content: res.msg || "Updated successfully",
                });
            } else {
                console.error("Update failed:", res);
                messageApi.open({
                    type: "error",
                    content: res?.msg || "Update failed",
                });
            }
        } catch (error) {
            console.error("Error submitting settings:", error);
            messageApi.open({
                type: "error",
                content: "An error occurred while updating",
            });
        } finally {
            setLoading(null);
        }
    }

    const modules = {
        toolbar: {
            container: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
            ],
            handlers: {
                image: function () {
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");
                    input.setAttribute("accept", "image/*");
                    input.click();

                    input.onchange = () => {
                        const file = input.files[0];
                        const reader = new FileReader();
                        reader.onload = () => {
                            const quill = this.quill;
                            const range = quill.getSelection();
                            quill.insertEmbed(range.index, "image", reader.result);
                        };
                        reader.readAsDataURL(file);
                    };
                },
            },
        },
    };

    return (
        <div style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
            {contextHolder}
            
            <div style={{ marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0, color: '#1f2937' }}>Product Settings</Title>
                <Text type="secondary" style={{ fontSize: '15px' }}>
                    Configure rules, displays, and default behaviors for products across your platform. Each setting can be updated individually.
                </Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredProductdata.map((product) => product.key && (
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
                                        {product.instruction || 'Configure this product setting.'}
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

                                        case "dropdown":
                                            return (
                                                <select className="custom-input" 
                                                    name={product.key} 
                                                    value={product.value || ""} 
                                                    onChange={(e) => handleInputChange(product.id, e.target.value)}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d9d9d9', outline: 'none', transition: 'border 0.3s', backgroundColor: '#fff', cursor: 'pointer' }}
                                                >
                                                    <option value="">Select an option</option>
                                                    <option value="price_low_to_high">Price Low To High</option>
                                                    <option value="price_high_to_low">Price High To Low</option>
                                                    <option value="stock_low_to_high">Stock Low To High</option>
                                                    <option value="stock_high_to_low">Stock High To Low</option>
                                                    <option value="oldest">Oldest</option>
                                                    <option value="latest">Latest</option>
                                                    <option value="sell_low_to_high">Sell Low To High</option>
                                                    <option value="sell_high_to_low">Sell High To Low</option>
                                                </select>
                                            );

                                        case "description":
                                            return (
                                                <ReactQuill 
                                                    theme="snow" 
                                                    value={product.value || ""} 
                                                    onChange={(value) => handleInputChange(product.id, value)} 
                                                    placeholder="Write your description..." 
                                                    modules={modules} 
                                                    className="quill-editor"
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

                                        case "input":
                                        case "text":
                                        default:
                                            return (
                                                <input 
                                                    className="custom-input" 
                                                    type="text" 
                                                    value={product.value || ""} 
                                                    onChange={(e) => handleInputChange(product.id, e.target.value)}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d9d9d9', outline: 'none', transition: 'border 0.3s' }}
                                                />
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
