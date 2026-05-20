import React, { useState } from "react";
import useTitle from "../../../hooks/useTitle";
import { ArrowLeftOutlined, ProfileOutlined, SettingOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Select, Row, Col, Space, Typography } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Link, useNavigate } from "react-router-dom";
import { postData } from "../../../api/common/common";
import "./Privacy.css";

const { Text, Title } = Typography;

export default function AddPrivacy() {
    // Hook
    useTitle("Add Privacy & Policy");

    const navigate = useNavigate();

    // Form Instance & Messages
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // States
    const [loading, setLoading]       = useState(false);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();

            formData.append('title', values.title || "");
            formData.append('description', values.description || "");
            formData.append('status', values.status || "active");

            const res = await postData("/admin/privacy-policies", formData);

            if (res && res.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg || "Privacy policy created successfully",
                    duration: 3
                });

                setTimeout(() => {
                    navigate("/privacy-policy");
                }, 400);
            } else {
                messageApi.open({
                    type: "error",
                    content: res?.message || "Failed to create privacy policy",
                });
            }
        } catch (error) {
            console.error("Error creating privacy policy:", error);
            messageApi.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
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
        <div className="privacy-container">
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Add Privacy Policy</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/privacy-policy">Privacy Policies</Link> },
                            { title: "New Policy" },
                        ]}
                    />
                </div>
                <Button className="premium-back-btn" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                    Back to List
                </Button>
            </div>

            <div className="premium-card">
                <div className="card-content">
                    <Form form={form} layout="vertical" onFinish={handleSubmit} className="premium-form" initialValues={{ status: "active" }}>
                        <div className="form-grid">
                            <div className="config-section">
                                <div className="config-title-badge">
                                    <SettingOutlined style={{ color: '#6366f1' }} />
                                    <span>Policy Settings</span>
                                </div>

                                <Form.Item label="Policy Title" name="title" rules={[{ required: true, message: "Please enter the policy title" }]}>
                                    <AntInput className="premium-input" prefix={<ProfileOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. Terms of Service" />
                                </Form.Item>

                                <Form.Item name="status" label="Publication Status" rules={[{ required: true, message: "Please select status" }]}>
                                    <Select className="premium-select" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                                    />
                                </Form.Item>
                            </div>

                            <div className="form-details-section">
                                <Form.Item label="Detailed Policy Content" name="description" rules={[{ required: true, message: "Please write policy description" }]}>
                                    <ReactQuill className="premium-quill" theme="snow" placeholder="Write detailed privacy policy content here..." modules={modules} />
                                </Form.Item>

                                <div className="submit-section">
                                    <Button type="primary" htmlType="submit" loading={loading} className="premium-submit-btn" block>
                                        {loading ? "PUBLISHING POLICY..." : "CREATE POLICY ENTRY"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}
