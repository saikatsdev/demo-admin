import useTitle from "../../hooks/useTitle"
import { Input as AntInput, Breadcrumb, Button, Form, message, Popconfirm, Card, Typography, Space, Divider, Alert, Row, Col, List } from "antd";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { NotificationOutlined, SettingOutlined, PlayCircleOutlined, CheckCircleFilled, KeyOutlined, LockOutlined, CloudServerOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { ArrowLeft } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function Pusher() {
    // Hook
    useTitle("Pusher Settings");

    //Variable
    const [form] = Form.useForm();

    // State
    const [loading, setLoading]           = useState(false);
    const [messageApi, contextHolder]     = message.useMessage();
    const [showForm, setShowForm]         = useState(false);
    const [pusherConfig, setPusherConfig] = useState({key: import.meta.env.VITE_PUSHER_APP_KEY,});

    // Method
    useEffect(() => {
        const fetchPusher = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/admin/pusher`,
                    {
                        credentials: 'include',
                        headers: {
                            Accept: 'application/json',
                        },
                    }
                );

                const contentType = res.headers.get('content-type');

                if (!contentType || !contentType.includes('application/json')) {
                    const text = await res.text();
                    console.warn('Non-JSON response:', text);
                    return;
                }

                const data = await res.json();
                
                form.setFieldsValue({
                    app_id: data?.app_id ?? '',
                    app_key: data?.app_key ?? '',
                    app_secret: data?.app_secret ?? '',
                });
            } catch (err) {
                console.error('Fetch error:', err);
            }
        };

        fetchPusher();
    }, [form]);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('app_id', values.app_id);
            formData.append('app_key', values.app_key);
            formData.append('app_secret', values.app_secret);
            formData.append('_method', 'PUT');

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/admin/pusher`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                    body: formData,
                }
            );

            const contentType = res.headers.get('content-type');

            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                console.error('Non-JSON response:', text);
                return;
            }

            const data = await res.json();

            if (data.success) {
                setPusherConfig(prev => ({...prev,key: values.app_key}));
                messageApi.open({
                    type: 'success',
                    content: data.message || 'Updated successfully',
                });
            }
        } catch (error) {
            console.error('Submit error:', error);
            messageApi.open({
                type: 'error',
                content: 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        { title: 'Real-time Notifications', description: 'Deliver instant alerts to users without page refreshes.' },
        { title: 'Live Activity Feeds', description: 'Show user actions and system updates in real-time.' },
        { title: 'Bi-directional Chat', description: 'Enable seamless live communication between users.' },
        { title: 'Live Data Sync', description: 'Keep dashboards and lists synchronized across all clients.' }
    ];

    return (
        <div style={{ padding: "24px" }}>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0 }}>Pusher Real-time Settings</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Pusher Setting" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Button 
                        icon={<ArrowLeft size={18} />} 
                        onClick={() => window.history.back()}
                        style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px",
                            height: "40px",
                            borderRadius: "10px",
                            fontWeight: "600",
                            border: "1px solid #e0e0e0",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                        }}
                    >
                        Back
                    </Button>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} xl={14}>
                    <Card 
                        bordered={false} 
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
                        title={
                            <Space>
                                <PlayCircleOutlined style={{ color: '#300d4f', fontSize: 20 }} />
                                <span>Learn about Pusher Channels</span>
                            </Space>
                        }
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, marginBottom: 24, background: '#000' }}>
                            <iframe 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src="https://www.youtube.com/embed/rs5su69wB18" 
                                title="Pusher Channels Introduction" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        </div>

                        <Title level={4}>Why use Pusher for Real-time?</Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={benefits}
                            renderItem={(item) => (
                                <List.Item style={{ border: 'none', padding: '8px 0' }}>
                                    <List.Item.Meta
                                        avatar={<CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />}
                                        title={<Text strong>{item.title}</Text>}
                                        description={item.description}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                <Col xs={24} xl={10}>
                    <Card 
                        bordered={false} 
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        title={
                            <Space>
                                <NotificationOutlined style={{ color: '#300d4f', fontSize: 20 }} />
                                <span>Pusher Configuration</span>
                            </Space>
                        }
                    >
                        <Paragraph type="secondary">
                            Configure your Pusher application credentials to enable real-time features across your platform.
                        </Paragraph>
                        
                        <Divider />

                        {!showForm ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Alert
                                    message="Administrative Security Lock"
                                    description="Modifying Pusher settings will affect all real-time communications. Incorrect credentials will break live features."
                                    type="info"
                                    showIcon
                                    icon={<SafetyCertificateOutlined />}
                                    style={{ marginBottom: 24, textAlign: 'left', borderRadius: 8 }}
                                />
                                <Popconfirm 
                                    title="Unlock Pusher Settings?" 
                                    description="Changing these credentials may cause temporary loss of real-time connectivity. Continue?" 
                                    okText="Yes, Unlock" 
                                    cancelText="Cancel" 
                                    onConfirm={() => setShowForm(true)}
                                >
                                    <Button type="primary" size="large" icon={<SettingOutlined />} style={{ borderRadius: 6, backgroundColor: '#300d4f' }}>
                                        Configure Pusher
                                    </Button>
                                </Popconfirm>
                            </div>
                        ) : (
                            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <Form.Item 
                                        name="app_id" 
                                        label={<Text strong>App ID</Text>}
                                        rules={[{ required: true, message: 'App ID is required' }]}
                                    >
                                        <AntInput 
                                            placeholder="Enter Pusher App ID" 
                                            size="large" 
                                            prefix={<CloudServerOutlined style={{ color: '#bfbfbf' }} />}
                                        />
                                    </Form.Item>

                                    <Form.Item 
                                        name="app_key" 
                                        label={<Text strong>App Key</Text>}
                                        rules={[{ required: true, message: 'App Key is required' }]}
                                    >
                                        <AntInput 
                                            placeholder="Enter Pusher App Key" 
                                            size="large" 
                                            prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />}
                                        />
                                    </Form.Item>

                                    <Form.Item 
                                        name="app_secret" 
                                        label={<Text strong>App Secret</Text>}
                                        rules={[{ required: true, message: 'App Secret is required' }]}
                                    >
                                        <AntInput.Password 
                                            placeholder="Enter Pusher App Secret" 
                                            size="large" 
                                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                        />
                                    </Form.Item>

                                    <Form.Item style={{ textAlign: "right", marginTop: 16, marginBottom: 0 }}>
                                        <Space>
                                            <Button onClick={() => setShowForm(false)} size="large">
                                                Cancel
                                            </Button>
                                            <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SettingOutlined />} style={{ backgroundColor: '#300d4f' }}>
                                                Save Settings
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </div>
                            </Form>
                        )}
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary">
                    Need help? <Link to="#" style={{ textDecoration: 'underline' }}>Pusher Documentation</Link>
                </Text>
            </div>
        </div>
    );
}
