import { Input as AntInput, Breadcrumb, Button, Form, message, Popconfirm, Card, Typography, Space, Divider, Alert, Row, Col, List } from "antd";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect, useState } from "react";
import { FacebookOutlined, SettingOutlined, PlayCircleOutlined, CheckCircleFilled, ApiOutlined, ThunderboltOutlined, EyeOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { ArrowLeft } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function FacebookMeta() {
    // Hook
    useTitle("Facebook Meta Settings");

    // Variables
    const [pixelForm]      = Form.useForm();
    const [conversionForm] = Form.useForm();
    const [eventForm]      = Form.useForm();

    // State
    const [messageApi, contextHolder]     = message.useMessage();
    const [showForm, setShowForm]         = useState(false);
    const [loading, setLoading]           = useState(false);
    const [apiLoading, setApiLoading]     = useState(false);
    const [eventLoading, setEventLoading] = useState(false);

    useEffect(() => {
        const getAllTolls = async () => {
            const res = await getDatas("/admin/marketing-tools");

            if(res?.success && Array.isArray(res.result)){
                const tool = res.result[0];

                pixelForm.setFieldsValue({
                    pixel_id: tool.pixel_id
                });

                conversionForm.setFieldsValue({
                    pixel_api_token: tool.pixel_api_token
                });

                eventForm.setFieldsValue({
                    test_event_code: tool.test_event_code
                });
            }
        }

        getAllTolls();
    }, []);

    const handlePixelSubmit = async (values) => {
        const formData = new FormData();
        formData.append("pixel_id", values.pixel_id);
        formData.append("_method", "PUT");

        try {
            setLoading(true);

            const res = await postData("/admin/marketing-tools/pixel", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }else{
                messageApi.open({
                    type: "error",
                    content: "Something Went Wrong",
                });
            }
        } catch (error) {
            console.error(error);
        }finally{
            setLoading(false);
        }
    };

    const handleConversionSubmit = async (values) => {
        const formData = new FormData();
        formData.append("pixel_api_token", values.pixel_api_token);
        formData.append("_method", "PUT");

        try {
            setApiLoading(true);

            const res = await postData("/admin/marketing-tools/conversion", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }else{
                messageApi.open({
                    type: "error",
                    content: "Something Went Wrong",
                });
            }
        } catch (error) {
            console.error(error);
        }finally{
            setApiLoading(false);
        }
    };

    const handleEventSubmit = async (values) => {
        const formData = new FormData();
        formData.append("test_event_code", values.test_event_code);
        formData.append("_method", "PUT");

        try {
            setEventLoading(true);

            const res = await postData("/admin/marketing-tools/event", formData);

            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }else{
                messageApi.open({
                    type: "error",
                    content: "Something Went Wrong",
                });
            }
        } catch (error) {
            console.error(error);
        }finally{
            setEventLoading(false);
        }
    };

    const benefits = [
        { title: 'Accurate Conversion Tracking', description: 'Track purchases and other actions with high precision.' },
        { title: 'Advanced Audience Targeting', description: 'Create lookalike audiences based on your best customers.' },
        { title: 'Dynamic Product Ads', description: 'Automatically show products to people who viewed them.' },
        { title: 'Server-Side Attribution', description: 'Bypass ad-blockers and iOS privacy restrictions with CAPI.' }
    ];

    return (
        <div style={{ padding: "24px" }}>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0 }}>Facebook Meta Pixel & CAPI</Title>
                    <Breadcrumb 
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Meta Settings" }
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
                                <PlayCircleOutlined style={{ color: '#1877F2', fontSize: 20 }} />
                                <span>Learn about Meta Pixel & Conversion API</span>
                            </Space>
                        }
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, marginBottom: 24, background: '#000' }}>
                            <iframe 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src="https://www.youtube.com/embed/NEFJEfJc2PM" 
                                title="Facebook Pixel & Conversion API Setup" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        </div>

                        <Title level={4}>Why use Meta Marketing Tools?</Title>
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
                                <FacebookOutlined style={{ color: '#1877F2', fontSize: 20 }} />
                                <span>Meta Configuration</span>
                            </Space>
                        }
                    >
                        <Paragraph type="secondary">
                            Configure your Meta Pixel and Conversion API to track events and optimize ad performance.
                        </Paragraph>
                        
                        <Divider />

                        {!showForm ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Alert
                                    message="Administrative Lock"
                                    description="Modifying Meta settings is a critical action that affects your ad attribution and tracking."
                                    type="info"
                                    showIcon
                                    icon={<SafetyCertificateOutlined />}
                                    style={{ marginBottom: 24, textAlign: 'left', borderRadius: 8 }}
                                />
                                <Popconfirm 
                                    title="Unlock Meta Settings?" 
                                    description="This will allow you to modify Pixel IDs and API tokens. Proceed with caution." 
                                    okText="Yes, Unlock" 
                                    cancelText="Cancel" 
                                    onConfirm={() => setShowForm(true)}
                                >
                                    <Button type="primary" size="large" icon={<SettingOutlined />} style={{ borderRadius: 6, backgroundColor: '#1877F2' }}>
                                        Configure Meta Tools
                                    </Button>
                                </Popconfirm>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* Pixel Form */}
                                <div style={{ background: '#f0f2f5', padding: 20, borderRadius: 12 }}>
                                    <Title level={5} style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <EyeOutlined style={{ color: '#1877F2' }} /> Meta Pixel
                                    </Title>
                                    <Form form={pixelForm} layout="vertical" onFinish={handlePixelSubmit}>
                                        <Form.Item 
                                            name="pixel_id" 
                                            label={<Text strong>Pixel ID</Text>}
                                            tooltip="Your unique Meta Pixel identifier"
                                            rules={[{ required: true, message: 'Pixel ID is required' }]}
                                        >
                                            <AntInput placeholder="Enter Pixel ID" size="large" />
                                        </Form.Item>
                                        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                                            <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: '#1877F2' }}>
                                                Update Pixel
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </div>

                                {/* Conversion API Form */}
                                <div style={{ background: '#f0f2f5', padding: 20, borderRadius: 12 }}>
                                    <Title level={5} style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ApiOutlined style={{ color: '#1877F2' }} /> Conversion API
                                    </Title>
                                    <Form form={conversionForm} layout="vertical" onFinish={handleConversionSubmit}>
                                        <Form.Item 
                                            name="pixel_api_token" 
                                            label={<Text strong>Access Token</Text>}
                                            tooltip="Generated in Meta Events Manager"
                                            rules={[{ required: true, message: 'API Token is required' }]}
                                        >
                                            <AntInput.TextArea placeholder="Enter CAPI Access Token" autoSize={{ minRows: 2, maxRows: 4 }} />
                                        </Form.Item>
                                        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                                            <Button type="primary" htmlType="submit" loading={apiLoading} style={{ backgroundColor: '#1877F2' }}>
                                                Update Token
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </div>

                                {/* Test Event Form */}
                                <div style={{ background: '#f0f2f5', padding: 20, borderRadius: 12 }}>
                                    <Title level={5} style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ThunderboltOutlined style={{ color: '#1877F2' }} /> Debugging
                                    </Title>
                                    <Form form={eventForm} layout="vertical" onFinish={handleEventSubmit}>
                                        <Form.Item 
                                            name="test_event_code" 
                                            label={<Text strong>Test Event Code</Text>}
                                            tooltip="Use this to verify server-side events in real-time"
                                            rules={[{ required: true, message: 'Test code is required' }]}
                                        >
                                            <AntInput placeholder="e.g. TEST12345" size="large" />
                                        </Form.Item>
                                        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                                            <Space>
                                                <Button onClick={() => setShowForm(false)}>Done</Button>
                                                <Button type="primary" htmlType="submit" loading={eventLoading} style={{ backgroundColor: '#1877F2' }}>
                                                    Save Code
                                                </Button>
                                            </Space>
                                        </Form.Item>
                                    </Form>
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary">
                    Need help? <Link to="#" style={{ textDecoration: 'underline' }}>Meta Business Help Center</Link>
                </Text>
            </div>
        </div>
    );
}
