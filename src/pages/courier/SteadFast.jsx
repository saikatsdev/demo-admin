import { Input as AntInput, Breadcrumb, Button, Form, Space, Typography, message, Card, Row, Col, List, Divider, Alert, Popconfirm } from "antd";
import { CopyOutlined, SettingOutlined, CheckCircleFilled, PlayCircleOutlined, InfoCircleOutlined, DashboardOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle";
import { useAppSettings } from "../../contexts/useAppSettings";
import WebhookDisplay from "../../components/courier/WebhookDisplay";
import { ArrowLeft } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function SteadFast() {
    // Hook
    useTitle("SteadFast Credentials");

    const { settings } = useAppSettings();

    // State
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const getSteadfast = async () => {
            const res = await getDatas("/admin/stead-fasts/show");

            if (res && res?.success) {
                const data = res?.result || [];

                form.setFieldsValue({
                    stead_fast_endpoint: data?.endpoint,
                    stead_fast_api_key: data?.api_key,
                    stead_fast_secret_key: data?.secret_key,
                });
            }
        };

        getSteadfast();
    }, []);

    // Form
    const handleSubmit = async () => {
        const values = await form.validateFields();

        try {
            setLoading(true);
            const res = await postData("/admin/stead-fasts/update/env-credential", values);

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
    }

    const copyBearer = () => {
        navigator.clipboard.writeText("Bearer");

        messageApi.open({
            type: "success",
            content: "Bearer copied!",
        });
    };

    const benefits = [
        { title: 'Automated Shipping', description: 'Synchronize your orders directly with SteadFast Courier.' },
        { title: 'Real-time Tracking', description: 'Get live updates on delivery status for your customers.' },
        { title: 'Bulk Booking', description: 'Create multiple delivery entries with a single click.' },
        { title: 'Cash on Delivery', description: 'Seamlessly manage COD payments and disbursements.' }
    ];

    return (
        <>
            {contextHolder}

            <div className="pagehead" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0 }}>SteadFast Courier Settings</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "SteadFast Credentials" },
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
                                <PlayCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                                <span>Instructional Video</span>
                            </Space>
                        }
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, marginBottom: 24, background: '#000' }}>
                            <iframe
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src="https://www.youtube.com/embed/v9i3mDizsX4" 
                                title="SteadFast Courier Integration Guide"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>

                        <Title level={4}>Why use SteadFast Courier?</Title>
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
                                <SettingOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                                <span>Credentials Configuration</span>
                            </Space>
                        }
                    >
                        <Paragraph type="secondary">
                            Configure your SteadFast API credentials to enable automated shipping and tracking.
                        </Paragraph>

                        <Divider />

                        {!showForm ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Alert message="Important"
                                    description="Ensure your API credentials are correct to avoid shipping delays."
                                    type="info"
                                    showIcon
                                    icon={<InfoCircleOutlined />}
                                    style={{ marginBottom: 24, textAlign: 'left', borderRadius: 8 }}
                                />
                                <Popconfirm
                                    title="Update Credentials?"
                                    description="Are you sure you want to update your SteadFast credentials?"
                                    okText="Yes, Update"
                                    cancelText="Cancel"
                                    onConfirm={() => setShowForm(true)}
                                >
                                    <Button type="primary" size="large" icon={<DashboardOutlined />} style={{ borderRadius: 6, backgroundColor: '#ff4d4f', border: 'none' }}>
                                        Configure Credentials
                                    </Button>
                                </Popconfirm>
                            </div>
                        ) : (
                            <Form form={form} layout="vertical">
                                <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 8, marginBottom: 24 }}>
                                    <Form.Item label={<Text strong>EndPoint</Text>} name="stead_fast_endpoint" rules={[{ required: true, message: "Endpoint is required" }]}>
                                        <AntInput placeholder="Enter End Point" size="large" />
                                    </Form.Item>

                                    <Form.Item label={<Text strong>API Key</Text>} name="stead_fast_api_key" rules={[{ required: true, message: "Api Key is required" }]}>
                                        <AntInput placeholder="Enter API Key" size="large" />
                                    </Form.Item>

                                    <Form.Item label={<Text strong>Secret Key</Text>} name="stead_fast_secret_key" rules={[{ required: true, message: "Secret key is required" }]}>
                                        <AntInput.Password placeholder="Enter Secret Key" size="large" />
                                    </Form.Item>
                                </div>

                                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                                    <Space>
                                        <Button onClick={() => setShowForm(false)} size="large">
                                            Cancel
                                        </Button>
                                        <Button type="primary" onClick={handleSubmit} loading={loading} size="large" icon={<SettingOutlined />} style={{ backgroundColor: '#ff4d4f', border: 'none' }}>
                                            Save Changes
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        )}

                        <Divider />

                        <div style={{ marginTop: 24 }}>
                            <Title level={5}>Webhook & Authentication</Title>
                            <WebhookDisplay settings={settings} service="stead-fast" />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fffbe6", borderRadius: 8, border: "1px solid #ffe58f", marginTop: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <InfoCircleOutlined style={{ color: '#faad14' }} />
                                    <Text>
                                        Auth Token Prefix:
                                        <Text code style={{ marginLeft: 8, fontWeight: 600 }}>
                                            Bearer
                                        </Text>
                                    </Text>
                                </div>

                                <Button
                                    icon={<CopyOutlined />}
                                    size="small"
                                    onClick={copyBearer}
                                    type="text"
                                />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </>
    )
}

