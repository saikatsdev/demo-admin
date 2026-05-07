import { Input as AntInput, Breadcrumb, Button, Form, message, Popconfirm, Card, Typography, Space, Divider, Alert, Row, Col, List } from "antd";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import { useEffect, useState } from "react";
import { GoogleOutlined, InfoCircleOutlined, SettingOutlined, WarningOutlined, PlayCircleOutlined, CheckCircleFilled } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function GtmSetting() {
    // Hook
    useTitle("GTM Setting");

    //Variable
    const [form] = Form.useForm();

    // State
    const [messageApi, contextHolder]   = message.useMessage();
    const [showGtmForm, setShowGtmForm] = useState(false);
    const [loading, setLoading]         = useState(false);

    useEffect(() => {
        const getAllTolls = async () => {
            const res = await getDatas("/admin/marketing-tools");

            if(res?.success && Array.isArray(res.result)){
                const tool = res.result[0];
                form.setFieldsValue({
                    gtm_id: tool.gtm_id
                });
            }
        }

        getAllTolls();
    }, []);

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('gtm_id', values.gtm_id);

        formData.append('_method', 'PUT');

        try {
            setLoading(true);

            const res = await postData("/admin/marketing-tools/gtm", formData);

            if(res?.success){
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
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    const benefits = [
        { title: 'Centralized Tag Management', description: 'Manage all your tracking pixels in one place.' },
        { title: 'No Code Required', description: 'Deploy tags without manual code changes.' },
        { title: 'Faster Website Performance', description: 'Tags load asynchronously for better speed.' },
        { title: 'Version Control', description: 'Easily rollback to previous container versions.' }
    ];

    return (
        <>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24 }}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0 }}>GTM Setting</Title>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "GTM Setting" },
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
                                <PlayCircleOutlined style={{ color: '#4285F4', fontSize: 20 }} />
                                <span>Learn about Google Tag Manager</span>
                            </Space>
                        }
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, marginBottom: 24, background: '#000' }}>
                            <iframe 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src="https://www.youtube.com/embed/hXpD-2kK41s" 
                                title="Google Tag Manager Introduction" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        </div>

                        <Title level={4}>Why use Google Tag Manager?</Title>
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
                                <GoogleOutlined style={{ color: '#4285F4', fontSize: 20 }} />
                                <span>GTM Configuration</span>
                            </Space>
                        }
                    >
                        <Paragraph type="secondary">
                            Configure your GTM container to enable advanced tracking and analytics integrations.
                        </Paragraph>
                        
                        <Divider />

                        {!showGtmForm ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Alert
                                    message="Important Security Warning"
                                    description="Modifying GTM settings is a critical administrative action. Ensure you have the correct Container ID."
                                    type="warning"
                                    showIcon
                                    icon={<WarningOutlined />}
                                    style={{ marginBottom: 24, textAlign: 'left', borderRadius: 8 }}
                                />
                                <Popconfirm title="Are you sure you want to update?" description="This will allow you to edit the GTM Container ID." okText="Yes, Proceed" cancelText="Cancel" onConfirm={() => setShowGtmForm(true)}>
                                    <Button type="primary" danger size="large" icon={<SettingOutlined />} style={{ borderRadius: 6 }}>
                                        Unlock Settings
                                    </Button>
                                </Popconfirm>
                            </div>
                        ) : (
                            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 8, marginBottom: 24 }}>
                                    <Form.Item name="gtm_id" label={<Text strong>GTM Container ID</Text>}
                                        tooltip="Example: GTM-XXXXXXX"
                                        rules={[{ required: true, message: 'Please enter a valid GTM ID' }]}>
                                        <AntInput 
                                            placeholder="Enter GTM ID (e.g. GTM-W7P2ZX)" 
                                            size="large" 
                                            prefix={<SettingOutlined style={{ color: '#bfbfbf' }} />}
                                        />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        <InfoCircleOutlined style={{ marginRight: 6 }} />
                                        The Container ID can be found at the top of your GTM workspace.
                                    </Text>
                                </div>

                                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                                    <Space>
                                        <Button onClick={() => setShowGtmForm(false)} size="large">
                                            Cancel
                                        </Button>
                                        <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SettingOutlined />}>
                                            Save Changes
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
                    Need help? <Link to="#" style={{ textDecoration: 'underline' }}>View GTM Documentation</Link>
                </Text>
            </div>
        </>
    )
}


