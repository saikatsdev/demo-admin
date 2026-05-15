import { Input as AntInput, Breadcrumb, Button, Form, Space, Typography, message, Card, Row, Col, List, Divider, Alert, Popconfirm } from "antd";
import { UnorderedListOutlined, PlusOutlined, SettingOutlined, CheckCircleFilled, PlayCircleOutlined, InfoCircleOutlined, DashboardOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle";
import { useAppSettings } from "../../contexts/useAppSettings";
import WebhookDisplay from "../../components/courier/WebhookDisplay";
import { ArrowLeft } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function Pathao() {
    // Hook
    useTitle("Pathao Credentials");
    const navigate = useNavigate();
    const { settings } = useAppSettings();

    // State
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const getPathao = async () => {
            const res = await getDatas("/admin/pathao/show");

            if (res && res?.success) {
                const data = res?.result || [];

                form.setFieldsValue({
                    pathao_endpoint: data.endpoint,
                    pathao_client_id: data.client_id,
                    pathao_client_secret: data.client_secret,
                    pathao_username: data.username,
                    pathao_password: data.password,
                    pathao_grant_type: data.grant_type,
                });
            }
        };

        getPathao();
    }, []);

    // Method
    const handleSubmit = async () => {
        const values = await form.validateFields();

        try {
            setLoading(true);
            const res = await postData("/admin/pathao/update/env-credential", values);

            if (res?.success) {
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
        { title: 'Nationwide Coverage', description: 'Reach customers across Bangladesh with Pathao\'s extensive network.' },
        { title: 'Automated Booking', description: 'Generate delivery requests directly from your order dashboard.' },
        { title: 'Dynamic Tracking', description: 'Real-time parcel tracking for both merchants and customers.' },
        { title: 'Merchant Support', description: 'Dedicated support and dashboard for managing bulk shipments.' }
    ];

    return (
        <>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0 }}>Pathao Courier Settings</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Pathao Credentials" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space size="middle">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate("/store/create")}
                            style={{ borderRadius: "8px", height: "40px", backgroundColor: "#ff4d4f", border: "none" }}
                        >
                            Create Store
                        </Button>
                        <Button
                            icon={<UnorderedListOutlined />}
                            onClick={() => navigate("/all/store")}
                            style={{ borderRadius: "8px", height: "40px" }}
                        >
                            Store List
                        </Button>
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
                    </Space>
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
                                <span>Integration Tutorial</span>
                            </Space>
                        }
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, marginBottom: 24, background: '#000' }}>
                            <iframe
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src="https://www.youtube.com/embed/5mD8R6_Kq-o"
                                title="Pathao Courier Integration Guide"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>

                        <Title level={4}>Why use Pathao Courier?</Title>
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
                                <span>Pathao API Configuration</span>
                            </Space>
                        }
                    >
                        <Paragraph type="secondary">
                            Connect your platform with Pathao by entering your API credentials below.
                        </Paragraph>

                        <Divider />

                        {!showForm ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Alert message="Action Required"
                                    description="You must have a registered Pathao merchant account to obtain these credentials."
                                    type="info"
                                    showIcon
                                    icon={<InfoCircleOutlined />}
                                    style={{ marginBottom: 24, textAlign: 'left', borderRadius: 8 }}
                                />
                                <Popconfirm
                                    title="Update Pathao Settings?"
                                    description="Modifying these credentials will affect your live shipping integration."
                                    okText="Yes, Proceed"
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
                                    <Form.Item label={<Text strong>Pathao EndPoint</Text>} name="pathao_endpoint" rules={[{ required: true, message: "Endpoint is required" }]}>
                                        <AntInput placeholder="https://api-hermes.pathao.com" size="large" />
                                    </Form.Item>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label={<Text strong>Client ID</Text>} name="pathao_client_id" rules={[{ required: true, message: "Client ID is required" }]}>
                                                <AntInput placeholder="Enter Client ID" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label={<Text strong>Grant Type</Text>} name="pathao_grant_type" rules={[{ required: true, message: "Grant Type is required" }]}>
                                                <AntInput placeholder="password" size="large" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item label={<Text strong>Client Secret</Text>} name="pathao_client_secret" rules={[{ required: true, message: "Client Secret is required" }]}>
                                        <AntInput.Password placeholder="Enter Client Secret" size="large" />
                                    </Form.Item>

                                    <Form.Item label={<Text strong>Username (Email)</Text>} name="pathao_username" rules={[{ required: true, message: "Username is required" }]}>
                                        <AntInput placeholder="merchant@email.com" size="large" />
                                    </Form.Item>

                                    <Form.Item label={<Text strong>Password</Text>} name="pathao_password" rules={[{ required: true, message: "Password is required" }]}>
                                        <AntInput.Password placeholder="Enter password" size="large" />
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
                            <Title level={5}>Webhook Configuration</Title>
                            <WebhookDisplay settings={settings} service="pathao" />
                            <Alert
                                message="Required for Real-time Updates"
                                description="Copy the webhook URL and paste it into your Pathao Developer settings to receive delivery status updates."
                                type="warning"
                                showIcon
                                style={{ marginTop: 16, borderRadius: 8 }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>
        </>
    );
}
