import useTitle from "../../hooks/useTitle";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Select, Tag, ColorPicker, Card, Row, Col } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { postData } from "../../api/common/common";
import { useState } from "react";

export default function AddStatus() {
    // Hook
    useTitle("Add Order Status");
    const navigate = useNavigate();

    // State
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);

    const name = Form.useWatch("name", form);
    const bgColor = Form.useWatch("bg_color", form) || "#e6f7ff";
    const textColor = Form.useWatch("text_color", form) || "#1890ff";

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append("name", values.name);
        formData.append("bg_color", values.bg_color || "#e6f7ff");
        formData.append("text_color", values.text_color || "#1890ff");
        formData.append("statuses", values.statuses || "active");
        formData.append("position", values.position || 0);

        try {
            setLoading(true);
            const res = await postData("/admin/statuses", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg || "Order status created successfully!",
                });

                setTimeout(() => {
                    navigate("/statuses");
                }, 800);
            } else {
                messageApi.open({
                    type: "error",
                    content: res?.message || "Something went wrong",
                });
            }
        } catch (error) {
            console.error(error);
            messageApi.open({
                type: "error",
                content: "An error occurred while creating status",
            });
        } finally {
            setLoading(false);
        }
    };

    const colorPresets = [
        { label: "Blue Info", bg: "#e6f7ff", text: "#1890ff" },
        { label: "Green Success", bg: "#f6ffed", text: "#52c41a" },
        { label: "Orange Warning", bg: "#fff7e6", text: "#fa8c16" },
        { label: "Red Danger", bg: "#fff1f0", text: "#f5222d" },
        { label: "Purple Processing", bg: "#f9f0ff", text: "#722ed1" },
        { label: "Grey Neutral", bg: "#fafafa", text: "#666666" },
    ];

    const applyPreset = (preset) => {
        form.setFieldsValue({
            bg_color: preset.bg,
            text_color: preset.text,
        });
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Add Order Status</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/statuses">Order Statuses</Link> },
                            { title: "Add Order Status" },
                        ]}
                    />
                </div>
            </div>

            <div className="blog-form">
                <div className="form-head-wrapper">
                    <h2 className="form-head-title">Create Order Status</h2>

                    <button className="form-head-btn" type="button" onClick={() => window.history.back()}>
                        <ArrowLeftOutlined className="form-head-btn-icon" />
                        <span>Back</span>
                    </button>
                </div>

                <div className="blog-form-layout" style={{ padding: "24px" }}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={16}>
                            <Form
                                layout="vertical"
                                form={form}
                                onFinish={handleSubmit}
                                initialValues={{
                                    bg_color: "#e6f7ff",
                                    text_color: "#1890ff",
                                    statuses: "active",
                                    position: 0,
                                }}
                            >
                                <Form.Item
                                    label="Status Name"
                                    name="name"
                                    rules={[{ required: true, message: "Please enter status name" }]}
                                >
                                    <AntInput placeholder="Enter status name (e.g. Processing, Shipped)" />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Background Color"
                                            name="bg_color"
                                            rules={[{ required: true, message: "Background color is required" }]}
                                        >
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <AntInput 
                                                    placeholder="#ffffff" 
                                                    style={{ flex: 1 }} 
                                                    value={bgColor}
                                                    onChange={(e) => form.setFieldValue("bg_color", e.target.value)}
                                                />
                                                <ColorPicker
                                                    value={bgColor}
                                                    format="hex"
                                                    onChangeComplete={(color) => {
                                                        form.setFieldValue("bg_color", color.toHexString());
                                                    }}
                                                />
                                            </div>
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            label="Text Color"
                                            name="text_color"
                                            rules={[{ required: true, message: "Text color is required" }]}
                                        >
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <AntInput 
                                                    placeholder="#000000" 
                                                    style={{ flex: 1 }} 
                                                    value={textColor}
                                                    onChange={(e) => form.setFieldValue("text_color", e.target.value)}
                                                />
                                                <ColorPicker
                                                    value={textColor}
                                                    format="hex"
                                                    onChangeComplete={(color) => {
                                                        form.setFieldValue("text_color", color.toHexString());
                                                    }}
                                                />
                                            </div>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div style={{ marginBottom: "24px" }}>
                                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>Quick Presets</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {colorPresets.map((preset, idx) => (
                                            <Button
                                                key={idx}
                                                size="small"
                                                onClick={() => applyPreset(preset)}
                                                style={{
                                                    backgroundColor: preset.bg,
                                                    color: preset.text,
                                                    border: `1px solid ${preset.text}40`,
                                                    fontWeight: "500",
                                                }}
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="statuses"
                                            label="Status"
                                            rules={[{ required: true }]}
                                        >
                                            <Select
                                                options={[
                                                    { value: "active", label: "Active" },
                                                    { value: "inactive", label: "Inactive" },
                                                ]}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="position"
                                            label="Position"
                                            rules={[{ required: true, message: "Please enter position" }]}
                                        >
                                            <AntInput type="number" placeholder="Enter position number" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item style={{ marginTop: "16px" }}>
                                    <Button type="primary" htmlType="submit" block loading={loading} size="large">
                                        {loading ? "Submitting..." : "Create Order Status"}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Col>

                        <Col xs={24} md={8}>
                            <Card 
                                title="Live Preview" 
                                style={{ 
                                    height: "100%", 
                                    minHeight: "220px", 
                                    display: "flex", 
                                    flexDirection: "column",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                                    borderRadius: "8px",
                                }}
                                headStyle={{ fontWeight: "600", borderBottom: "1px solid #f0f0f0" }}
                            >
                                <div style={{ 
                                    flex: 1, 
                                    display: "flex", 
                                    flexDirection: "column",
                                    justifyContent: "center", 
                                    alignItems: "center",
                                    padding: "24px 0"
                                }}>
                                    <div style={{ marginBottom: "16px", color: "#888", fontSize: "13px" }}>
                                        How the status tag will look:
                                    </div>
                                    <Tag
                                        style={{
                                            backgroundColor: bgColor,
                                            color: textColor,
                                            border: "none",
                                            fontWeight: 500,
                                            padding: "6px 20px",
                                            borderRadius: "6px",
                                            fontSize: "15px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        {name || "Preview Tag"}
                                    </Tag>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </>
    );
}
