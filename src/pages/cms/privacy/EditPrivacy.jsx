import React, { useState, useEffect } from "react";
import useTitle from "../../../hooks/useTitle";
import { ArrowLeftOutlined, ProfileOutlined, SettingOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Select, Row, Col, Space, Typography, Spin } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import "./Privacy.css";

const { Text, Title } = Typography;

export default function EditPrivacy() {
    // Hook
    useTitle("Edit Privacy Policy");

    const navigate = useNavigate();
    const { id } = useParams();

    // Form Instance & Messages
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // States
    const [loading, setLoading]       = useState(false);
    const [fetching, setFetching]     = useState(true);

    // Fetch Privacy Data
    useEffect(() => {
        let isAlive = true;

        const getPrivacy = async () => {
            try {
                setFetching(true);
                const res = await getDatas(`/admin/privacy-policies/${id}`);

                if (isAlive && res && res?.success) {
                    const data = res?.result || {};
                    form.setFieldsValue({
                        title: data.title,
                        description: data.description,
                        status: data.status,
                    });
                }
            } catch (error) {
                console.error("Error fetching privacy policy:", error);
                message.error("Failed to load privacy policy details");
            } finally {
                if (isAlive) setFetching(false);
            }
        };

        getPrivacy();

        return () => {
            isAlive = false;
        };
    }, [id, form]);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();

            formData.append('title', values.title || "");
            formData.append('description', values.description || "");
            formData.append('status', values.status || "active");
            formData.append('_method', 'PUT');

            const res = await postData(`/admin/privacy-policies/${id}`, formData);

            if (res && res.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg || "Privacy policy updated successfully",
                    duration: 3
                });

                setTimeout(() => {
                    navigate("/privacy-policy");
                }, 400);
            } else {
                messageApi.open({
                    type: "error",
                    content: res?.message || "Failed to update privacy policy",
                });
            }
        } catch (error) {
            console.error("Error updating privacy policy:", error);
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

    if (fetching) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" tip="Loading privacy policy..." />
            </div>
        );
    }

    return (
        <div className="privacy-container">
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Edit Privacy Policy</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/privacy-policy">Privacy Policies</Link> },
                            { title: "Edit Policy" },
                        ]}
                    />
                </div>
                <Button className="premium-back-btn" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                    Back to List
                </Button>
            </div>

            <div className="premium-card">
                <div className="card-content">
                    <Form form={form} layout="vertical" onFinish={handleSubmit} className="premium-form">
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
                                    <Select
                                        className="premium-select"
                                        options={[
                                            { value: "active", label: "Active" },
                                            { value: "inactive", label: "Inactive" }
                                        ]}
                                    />
                                </Form.Item>
                            </div>

                            <div className="form-details-section">
                                <Form.Item label="Detailed Policy Content" name="description" rules={[{ required: true, message: "Please write policy description" }]}>
                                    <ReactQuill className="premium-quill" theme="snow" placeholder="Write detailed privacy policy content here..." modules={modules} />
                                </Form.Item>

                                <div className="submit-section">
                                    <Button type="primary" htmlType="submit" loading={loading} className="premium-submit-btn" block>
                                        {loading ? "SAVING CHANGES..." : "UPDATE POLICY ENTRY"}
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
