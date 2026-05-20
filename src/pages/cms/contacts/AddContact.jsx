import React, { useState } from "react";
import useTitle from "../../../hooks/useTitle";
import { ArrowLeftOutlined, UserOutlined, PhoneOutlined, MailOutlined, ContactsOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Row, Col, Space, Typography } from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Link, useNavigate } from "react-router-dom";
import { postData } from "../../../api/common/common";
import "./Contacts.css";

const { Text, Title } = Typography;

export default function AddContact() {
    // Hook
    useTitle("Add Contact");

    const navigate = useNavigate();

    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // States
    const [loading, setLoading]       = useState(false);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();

            formData.append('name', values.name || "");
            formData.append('phone', values.phone_number || "");
            formData.append('email', values.email || "");
            formData.append('description', values.description || "");

            const res = await postData("/admin/contacts", formData);

            if (res && res.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg || "Contact details created successfully",
                    duration: 3
                });

                setTimeout(() => {
                    navigate("/contacts");
                }, 400);
            } else {
                messageApi.open({
                    type: "error",
                    content: res?.message || "Failed to create contact entry",
                });
            }
        } catch (error) {
            console.error("Error creating contact entry:", error);
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
        <div className="contacts-container">
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Add Contact</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/contacts">Contacts List</Link> },
                            { title: "New Contact" },
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
                            <div className="info-section">
                                <div className="info-title-badge">
                                    <ContactsOutlined style={{ color: '#6366f1' }} />
                                    <span>Contact Information</span>
                                </div>

                                <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Please enter contact's full name" }]}>
                                    <AntInput className="premium-input" prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. John Doe" />
                                </Form.Item>

                                <Form.Item label="Phone Number" name="phone_number" rules={[{ required: true, message: "Please enter phone number" }]}>
                                    <AntInput className="premium-input" prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. +880 1700000000" />
                                </Form.Item>

                                <Form.Item label="Email Address" name="email" rules={[{ required: true, message: "Please enter email address" },{ type: "email", message: "Please enter a valid email address" }]}>
                                    <AntInput className="premium-input" prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. john.doe@example.com" />
                                </Form.Item>
                            </div>
                            <div className="form-details-section">
                                <Form.Item label="Detailed Description" name="description" rules={[{ required: true, message: "Please write a description" }]}>
                                    <ReactQuill className="premium-quill" theme="snow" placeholder="Write detailed description or notes here..." modules={modules} />
                                </Form.Item>

                                <div className="submit-section">
                                    <Button type="primary" htmlType="submit" loading={loading} className="premium-submit-btn" block>
                                        {loading ? "CREATING CONTACT..." : "CREATE CONTACT ENTRY"}
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
