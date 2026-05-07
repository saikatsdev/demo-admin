import { Input as AntInput, Breadcrumb, Button, Form, message, Card, Typography, Space, Divider, Alert, Row, Col, List, Popconfirm } from "antd";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import { useEffect, useState } from "react";
import { CloudServerOutlined, SafetyCertificateOutlined, InfoCircleOutlined, SettingOutlined, WarningOutlined, PlayCircleOutlined, CheckCircleFilled, KeyOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function ServerTracker() {
    // Hook
    useTitle("Server Tracker");

    //Variable
    const [form] = Form.useForm();

    // State
    const [messageApi, contextHolder] = message.useMessage();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getAllTolls = async () => {
            const res = await getDatas("/admin/marketing-tools");

            if(res?.success && Array.isArray(res.result)){
                const tool = res.result[0];
                form.setFieldsValue({
                    get_tracked_license_key: tool.get_tracked_license_key
                });
            }
        }

        getAllTolls();
    }, []);

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('get_tracked_license_key', values.get_tracked_license_key);

        formData.append('_method', 'PUT');

        try {
            setLoading(true);
            const res = await postData("/admin/marketing-tools/server-track", formData);

            if(res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            } else {
                messageApi.open({
                    type: "error",
                    content: "Failed to update license key",
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const benefits = [
        { title: 'Improved Data Accuracy', description: 'Bypass ad-blockers and browser restrictions.' },
        { title: 'Enhanced Security', description: 'Process sensitive data on your own secure server.' },
        { title: 'Better Page Performance', description: 'Offload heavy tracking scripts from the client browser.' },
        { title: 'Extended Cookie Life', description: 'Combat ITP/ETP and maintain longer user sessions.' }
    ];

    return (
        <>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24 }}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0 }}>Server Tracker Configuration</Title>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Server Tracker" },
                        ]}
                    />
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} xl={14}>
                    <Card 
                        bordered={false} 
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
                        title={
                            <Space>
                                <PlayCircleOutlined style={{ color: '#722ed1', fontSize: 20 }} />
                                <span>Understanding Server-Side Tracking</span>
                            </Space>
                        }
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, marginBottom: 24, background: '#000' }}>
                            <iframe 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src="https://www.youtube.com/embed/vN_rF_55Iao" 
                                title="Server-Side Tracking Explained" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        </div>

                        <Title level={4}>Why implement Server-Side Tracking?</Title>
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
                                <CloudServerOutlined style={{ color: '#722ed1', fontSize: 20 }} />
                                <span>License Settings</span>
                            </Space>
                        }
                    >
                        <Paragraph type="secondary">
                            Activate your server-side tracking capabilities by entering your license key below.
                        </Paragraph>
                        
                        <Divider />

                        {!showForm ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Alert
                                    message="License Management"
                                    description="Updating the license key may temporarily interrupt your server-side tracking services."
                                    type="info"
                                    showIcon
                                    icon={<InfoCircleOutlined />}
                                    style={{ marginBottom: 24, textAlign: 'left', borderRadius: 8 }}
                                />
                                <Popconfirm 
                                    title="Update License Key?" 
                                    description="This will allow you to edit the current server tracker license." 
                                    okText="Unlock" 
                                    cancelText="Cancel" 
                                    onConfirm={() => setShowForm(true)}
                                >
                                    <Button type="primary" size="large" icon={<SafetyCertificateOutlined />} style={{ borderRadius: 6, backgroundColor: '#722ed1' }}>
                                        Manage License Key
                                    </Button>
                                </Popconfirm>
                            </div>
                        ) : (
                            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                <div style={{ background: '#f9f0ff', padding: 20, borderRadius: 8, border: '1px solid #efdbff', marginBottom: 24 }}>
                                    <Form.Item 
                                        name="get_tracked_license_key" 
                                        label={<Text strong>License Key</Text>}
                                        tooltip="Your unique tracking license identifier"
                                        rules={[{ required: true, message: 'License key is required' }]}
                                    >
                                        <AntInput 
                                            placeholder="Enter your license key" 
                                            size="large" 
                                            prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />}
                                        />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        <InfoCircleOutlined style={{ marginRight: 6 }} />
                                        You can find this key in your GetTracked dashboard.
                                    </Text>
                                </div>

                                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                                    <Space>
                                        <Button onClick={() => setShowForm(false)} size="large">
                                            Cancel
                                        </Button>
                                        <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SettingOutlined />} style={{ backgroundColor: '#722ed1' }}>
                                            Update Key
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        )}
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary">
                    Having trouble? <Link to="#" style={{ textDecoration: 'underline' }}>Contact Support</Link>
                </Text>
            </div>
        </>
    )
}

