import { ArrowLeftOutlined, LockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Form, Input, Row, Space, Typography, message } from "antd";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

const { Title, Text } = Typography;

export default function UpdatePassword() {
    // Hook
    useTitle("Update Employee Password");

    const { id }                = useParams();
    const navigate              = useNavigate();
    const [form]                = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("password", values.new_password);
            formData.append("_method", "PUT");

            const res = await postData(`/admin/users/password/${id}`, formData);

            if (res && res?.success) {
                message.success(res.msg || "Password updated successfully");
                form.resetFields();
                setTimeout(() => {
                    navigate("/employee");
                }, 1000);
            } else {
                message.error(res?.msg || "Failed to update password");
            }
        } catch (error) {
            console.error("Update Password Error:", error);
            message.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="update-password-container">
            <div className="pagehead">
                <div className="head-left">
                    <Title level={3} style={{ margin: 0, fontWeight: 600 }}>Update Password</Title>
                </div>
                <div className="head-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/employee")} style={{ borderRadius: 6 }}>
                        Back
                    </Button>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/employee">Employees</Link> },
                            { title: "Update Password" },
                        ]}
                    />
                </div>
            </div>

            <Row justify="center" style={{ marginTop: 40 }}>
                <Col xs={24} sm={20} md={12} lg={8}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: 16, 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                            borderTop: '4px solid #1890ff'
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: 30 }}>
                            <div style={{ 
                                display: 'inline-flex', 
                                backgroundColor: '#e6f7ff', 
                                padding: 15, 
                                borderRadius: '50%', 
                                marginBottom: 15 
                            }}>
                                <SafetyCertificateOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                            </div>
                            <Title level={4} style={{ marginBottom: 8 }}>Secure Update</Title>
                            <Text type="secondary">Ensure the new password is strong and unique.</Text>
                        </div>

                        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
                            <Form.Item name="new_password" label="New Password" rules={[
                                { required: true, message: 'Please input your new password!' },
                                { min: 6, message: 'Password must be at least 6 characters!' }
                            ]} hasFeedback>
                                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Enter new password" />
                            </Form.Item>

                            <Form.Item name="new_password_confirmation" label="Confirm New Password" dependencies={['new_password']} hasFeedback rules={[
                                { required: true, message: 'Please confirm your new password!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('new_password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('The two passwords do not match!'));
                                    },
                                }),
                            ]}>
                                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Confirm new password" />
                            </Form.Item>

                            <Form.Item style={{ marginTop: 30, marginBottom: 0 }}>
                                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                    <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 45, borderRadius: 8, fontWeight: 600 }}>
                                        Update Password
                                    </Button>
                                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/employee")} block style={{ height: 45, borderRadius: 8 }}>
                                        Cancel & Go Back
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>
                    
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            <LockOutlined style={{ marginRight: 4 }} /> 
                            Password updates are logged for security purposes.
                        </Text>
                    </div>
                </Col>
            </Row>
        </div>
    );
}