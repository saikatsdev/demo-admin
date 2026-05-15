import { Input as AntInput, Breadcrumb, Button, Form, Space, Typography, message, Card, Row, Col, List, Divider, Alert, Popconfirm } from "antd";
import { SettingOutlined, CheckCircleFilled, PlayCircleOutlined, InfoCircleOutlined, DashboardOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle";
import { useAppSettings } from "../../contexts/useAppSettings";
import WebhookDisplay from "../../components/courier/WebhookDisplay";
import { ArrowLeft } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function RedX() {
    // Hook
    useTitle("RedX Credentials");
    const { settings } = useAppSettings();

    // State
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const getRedx = async () => {
            const res = await getDatas("/admin/redx/show");

            if (res && res?.success) {
                const data = res?.result || [];

                form.setFieldsValue({
                    redx_endpoint: data?.endpoint,
                    redx_token: data?.token,
                });
            }
        };

        getRedx();
    }, []);

    // Method
    const handleSubmit = async () => {
        const values = await form.validateFields();

        try {
            setLoading(true);
            const res = await postData("/admin/redx/update/env-credential", values);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res?.msg,
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        { title: 'Reliable Logistics', description: 'Experience one of the most trusted logistics networks in the country.' },
        { title: 'Next-Day Delivery', description: 'Faster delivery options for your urgent customer orders.' },
        { title: 'Real-time Tracking', description: 'Full visibility on parcel status from pickup to delivery.' },
        { title: 'Seamless Integration', description: 'Connect your store effortlessly with the RedX delivery API.' }
    ];

    return (
        <>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0 }}>RedX Courier Settings</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "RedX Credentials" },
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
                                <PlayCircleOutlined style={{ color: '#eb2f96', fontSize: 20 }} />
                                <span>Learn about RedX Integration</span>
                            </Space>
                        }
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, marginBottom: 24, background: '#000' }}>
                            <iframe
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src="https://www.youtube.com/embed/9X8F6_v-g5Q"
                                title="RedX Courier Integration Guide"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>

                        <Title level={4}>Why use RedX Courier?</Title>
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
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
                        title={
                            <Space>
                                <SettingOutlined style={{ color: '#eb2f96', fontSize: 20 }} />
                                <span>Credentials Configuration</span>
                            </Space>
                        }
                    >
                        <Paragraph type="secondary">
                            Configure your RedX API credentials to enable automated delivery and parcel management.
                        </Paragraph>

                        <Divider />

                        {!showForm ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Alert message="Important"
                                    description="Ensure you have a valid RedX merchant token to authenticate your requests."
                                    type="info"
                                    showIcon
                                    icon={<InfoCircleOutlined />}
                                    style={{ marginBottom: 24, textAlign: 'left', borderRadius: 8 }}
                                />
                                <Popconfirm
                                    title="Unlock RedX Settings?"
                                    description="Updating these credentials will change how your shop connects to RedX."
                                    okText="Yes, Unlock"
                                    cancelText="Cancel"
                                    onConfirm={() => setShowForm(true)}
                                >
                                    <Button type="primary" size="large" icon={<DashboardOutlined />} style={{ borderRadius: 6, backgroundColor: '#eb2f96', border: 'none' }}>
                                        Configure RedX
                                    </Button>
                                </Popconfirm>
                            </div>
                        ) : (
                            <Form form={form} layout="vertical">
                                <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 8, marginBottom: 24 }}>
                                    <Form.Item
                                        label={<Text strong>RedX EndPoint</Text>}
                                        name="redx_endpoint"
                                        rules={[{ required: true, message: "Endpoint is required" }]}
                                    >
                                        <AntInput placeholder="Enter End Point" size="large" />
                                    </Form.Item>

                                    <Form.Item
                                        label={<Text strong>Access Token</Text>}
                                        name="redx_token"
                                        rules={[{ required: true, message: "Token ID is required" }]}
                                    >
                                        <AntInput.Password placeholder="Enter Access Token" size="large" />
                                    </Form.Item>
                                </div>

                                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                                    <Space>
                                        <Button onClick={() => setShowForm(false)} size="large">
                                            Cancel
                                        </Button>
                                        <Button type="primary" onClick={handleSubmit} loading={loading} size="large" icon={<SettingOutlined />} style={{ backgroundColor: '#eb2f96', border: 'none' }}>
                                            Save Changes
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        )}

                        <Divider />

                        <div style={{ marginTop: 24 }}>
                            <Title level={5}>Webhook Management</Title>
                            <WebhookDisplay settings={settings} service="redx" />
                            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
                                <InfoCircleOutlined style={{ marginRight: 6 }} />
                                Use this URL in your RedX merchant panel to receive parcel updates.
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </>
    );
}
