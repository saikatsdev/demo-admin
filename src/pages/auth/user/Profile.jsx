import { message, Card, Form, Input, Button, Row, Col, Avatar, Typography, Tabs, Divider, Space, Tag } from "antd";
import { useEffect, useState } from "react";
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";
import { useAuth } from "../../../hooks/useAuth";

const { Title, Text } = Typography;

export default function Profile() {
    // Hooks
    useTitle("Profile Management");

    const { user: authUser } = useAuth();
    const userId = authUser?.id;

    const [form]                                = Form.useForm();
    const [passwordForm]                        = Form.useForm();
    const [user, setUser]                       = useState(null);
    const [loading, setLoading]                 = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [messageApi, contextHolder]           = message.useMessage();

    useEffect(() => {
        if (!userId) return;

        let active = true;
        const load = async () => {
            try {
                const res = await getDatas(`/admin/users/${userId}`);

                if (!active) return;

                const userData = res?.result || null;

                setUser(userData);
                
                if (userData) {
                    form.setFieldsValue({
                        username    : userData.username,
                        email       : userData.email,
                        phone_number: userData.phone_number,
                        image       : userData.image ? [{ uid: "-1", url: userData.image, status: "done" }]: []
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };

        load();
        return () => { active = false; };
    }, [userId, form]);

    const handleSubmit = async (values) => {
        if (!userId) return;
        setLoading(true);

        const fd = new FormData();
        fd.append("username", values.username);
        fd.append("email", values.email);
        fd.append("phone_number", values.phone_number || "");
        fd.append("status", 'active');
        
        if (values.image && values.image.length > 0) {
            const imgObj = values.image[0];
            if (imgObj.originFileObj) {
                fd.append("image", imgObj.originFileObj);
                fd.append("width", 450);
                fd.append("height", 450);
            }
        }
        
        fd.append("_method", "PUT");

        try {
            const res = await postData(`/admin/users/update/${userId}`, fd);
            if (res && res.success) {
                messageApi.open({ type: 'success', content: res.msg });

                const updated = await getDatas(`/admin/users/${userId}`);

                const newUser = updated?.result || user;

                setUser(newUser);

                form.setFieldsValue({
                    username    : newUser.username,
                    email       : newUser.email,
                    phone_number: newUser.phone_number,
                    image       : newUser.image ? [{ uid: "-1", url: newUser.image, status: "done" }]: []
                });
            }
        } catch (err) {
            console.error(err);
            messageApi.open({ type: 'error', content: err?.response?.data?.msg || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (values) => {
        if (!userId) return;

        if (values.new_password !== values.confirm_password) {
            return messageApi.open({ type: 'error', content: 'Passwords do not match' });
        }

        setPasswordLoading(true);

        const fd = new FormData();

        fd.append('password', values.new_password);

        fd.append('_method', 'PUT');

        try {
            const res = await postData(`/admin/users/password/${userId}`, fd);

            if (res && res.success) {
                messageApi.open({ type: 'success', content: 'Password updated successfully' });
                passwordForm.resetFields();
            }
        } catch (err) {
            console.error(err);
            messageApi.open({ type: 'error', content: err?.response?.data?.msg || 'Password update failed' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const tabItems = [
        {
            key: '1',
            label: 'Personal Information',
            children: (
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="profile-form">
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Full Name" name="username" rules={[{ required: true, message: 'Please enter your name' }]}>
                                <Input prefix={<UserOutlined />} placeholder="Enter your full name" size="large" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Email Address" name="email" rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Enter a valid email' }]}>
                                <Input prefix={<MailOutlined />} placeholder="Enter your email" size="large" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Phone Number" name="phone_number">
                                <Input prefix={<PhoneOutlined />} placeholder="Enter your phone number" size="large" />
                            </Form.Item>
                        </Col>
                        
                        <Col xs={24}>
                            <Divider orientation="left">Profile Picture</Divider>
                            <div style={{ marginBottom: 24 }}>
                                <Form.Item name="image" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                                    <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} showUploadList={{ showPreviewIcon: false }}>
                                        <div>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                        </div>
                                    </Upload>
                                </Form.Item>
                            </div>
                        </Col>
                    </Row>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={loading} style={{ borderRadius: '8px', minWidth: '150px' }}>
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: '2',
            label: 'Security & Password',
            children: (
                <div style={{ maxWidth: '500px' }}>
                    <Title level={4}>Change Password</Title>

                    <Text type="secondary">Ensure your account is using a long, random password to stay secure.</Text>

                    <Divider />

                    <Form form={passwordForm} layout="vertical" onFinish={handlePasswordUpdate} requiredMark={false}>
                        <Form.Item label="New Password" name="new_password" rules={[{ required: true, message: 'Please enter new password' }, { min: 6, message: 'Password must be at least 6 characters' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" size="large" />
                        </Form.Item>

                        <Form.Item label="Confirm New Password" name="confirm_password" rules={[{ required: true, message: 'Please confirm your password' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" size="large" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" size="large" loading={passwordLoading} style={{ borderRadius: '8px' }}>
                                Update Password
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
            {contextHolder}
            
            <Row gutter={[24, 24]}>
                <Col xs={24}>
                    <div style={{ 
                        background  : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        height      : '180px',
                        borderRadius: '16px',
                        marginBottom: '-60px',
                        position    : 'relative',
                        boxShadow   : '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ position: 'absolute', bottom: '70px', left: '40px', color: '#fff' }}>
                            <Title level={2} style={{ color: '#fff', margin: 0 }}>My Profile</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Manage your account settings and preferences</Text>
                        </div>
                    </div>
                </Col>

                <Col xs={24} lg={8}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: '16px', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            textAlign: 'center',
                            paddingTop: '20px'
                        }}
                    >
                        <div style={{ position: 'relative', display: 'inline-block', marginTop: '20px' }}>
                            <Avatar size={120} src={user?.image} icon={<UserOutlined />} style={{ border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backgroundColor: '#1890ff' }} />
                            <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#52c41a', width: '20px', height: '20px', borderRadius: '50%', border: '3px solid #fff' }}></div>
                        </div>

                        <Title level={3} style={{ marginTop: '16px', marginBottom: '4px', textTransform: 'capitalize' }}>
                            {user?.username || 'User'}
                        </Title>

                        <Tag color="processing" style={{ borderRadius: '10px', padding: '2px 12px' }}>
                            {user?.roles?.[0]?.display_name || 'Staff'}
                        </Tag>

                        <Divider />
                        <div style={{ textAlign: 'left' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <div>
                                    <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Email Address</Text>
                                    <Text strong>{user?.email || 'N/A'}</Text>
                                </div>

                                <div>
                                    <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Phone Number</Text>
                                    <Text strong>{user?.phone_number || 'N/A'}</Text>
                                </div>

                                <Row gutter={12}>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Salary</Text>
                                        <Text strong>{user?.salary || '0.00'} BDT</Text>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Account Status</Text>
                                        <Tag color={user?.status === 'active' ? 'green' : 'red'} style={{ border: 'none', background: user?.status === 'active' ? '#f6ffed' : '#fff1f0', color: user?.status === 'active' ? '#52c41a' : '#ff4d4f', fontWeight: 600, margin: 0, fontSize: '12px' }}>
                                            {user?.status ? (user.status.charAt(0).toUpperCase() + user.status.slice(1)) : 'Inactive'}
                                        </Tag>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '8px 0' }} />

                                <div>
                                    <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Last Active</Text>
                                    <Text strong>{user?.login_at || 'Never'}</Text>
                                </div>
                            </Space>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: '16px', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            minHeight: '520px'
                        }}
                    >
                        <Tabs defaultActiveKey="1" items={tabItems} size="large" indicatorSize={(origin) => origin - 16}/>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}