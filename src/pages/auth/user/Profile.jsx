import useTitle from '../../../hooks/useTitle';
import { Card, Form, Input, Button, Upload, message, Avatar, Row, Col } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

export default function Profile() {
    useTitle("Profile Update");

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);

    const handleUpload = (file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => setAvatarUrl(reader.result);
        return false;
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            console.log('Form values:', values);
            message.success("Profile updated successfully!");
            // TODO: send API request here
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row justify="center" style={{ padding: 24 }}>
            <Col xs={24} sm={20} md={16} lg={12}>
                <Card title="Update Profile" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        
                        <Form.Item label="Profile Picture">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Avatar size={64} src={avatarUrl} icon={<UserOutlined />} />
                                <Upload beforeUpload={handleUpload} showUploadList={false}>
                                    <Button icon={<UploadOutlined />}>Upload</Button>
                                </Upload>
                            </div>
                        </Form.Item>

                        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name' }]}>
                            <Input placeholder="Enter your name" />
                        </Form.Item>

                        <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                            <Input placeholder="Enter your email" />
                        </Form.Item>

                        <Form.Item label="Password" name="password" rules={[{ min: 6, message: 'Password must be at least 6 characters' }]}>
                            <Input.Password placeholder="Enter new password (optional)" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                Save Changes
                            </Button>
                        </Form.Item>

                    </Form>
                </Card>
            </Col>
        </Row>
    );
}