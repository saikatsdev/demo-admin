import { Input as AntInput, Breadcrumb, Button, Form, message, Popconfirm, Card, Typography, Space, Divider, Alert, Row, Col, List } from "antd";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";
import { useEffect, useState } from "react";
import { DashboardOutlined, EyeOutlined, InfoCircleOutlined, SettingOutlined, CheckCircleFilled, PlayCircleOutlined } from "@ant-design/icons";
import { ArrowLeft } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export default function Clarity() {
    // Hook
    useTitle("Clarity Settings");

    //Variable
    const [form] = Form.useForm();

    // State
    const [messageApi, contextHolder] = message.useMessage();
    const [showForm, setShowForm]     = useState(false);
    const [loading, setLoading]         = useState(false);

    useEffect(() => {
        const getAllTolls = async () => {
            const res = await getDatas("/admin/marketing-tools");

            if(res?.success && Array.isArray(res.result)){
                const tool = res.result[0];
                form.setFieldsValue({
                    clarity_id: tool.clarity_id
                });
            }
        }

        getAllTolls();
    }, []);

    // Method
    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('clarity_id', values.clarity_id);

        formData.append('_method', 'PUT');

        try {
            setLoading(true);

            const res = await postData("/admin/marketing-tools/clarity", formData);

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
        { title: 'Session Recordings', description: 'See exactly what users do on your site.' },
        { title: 'Instant Heatmaps', description: 'Visualize where people click and scroll.' },
        { title: 'Powerful Insights', description: 'Detect rage clicks and dead clicks automatically.' },
        { title: 'Completely Free', description: 'No traffic limits, forever free to use.' }
    ];

    return (
        <>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0 }}>Microsoft Clarity Settings</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Clarity Setting" },
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
                                <PlayCircleOutlined style={{ color: '#0078d4', fontSize: 20 }} />
                                <span>Learn about Microsoft Clarity</span>
                            </Space>
                        }
                    >
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, marginBottom: 24, background: '#000' }}>
                            <iframe 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src="https://www.youtube.com/embed/axUFm0Kl_6Y" 
                                title="Microsoft Clarity Introduction" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        </div>

                        <Title level={4}>Why use Microsoft Clarity?</Title>
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
                                <SettingOutlined style={{ color: '#0078d4', fontSize: 20 }} />
                                <span>Clarity Configuration</span>
                            </Space>
                        }
                    >
                        <Paragraph type="secondary">
                            Connect your platform with Microsoft Clarity by entering your Project ID.
                        </Paragraph>
                        
                        <Divider />

                        {!showForm ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Alert message="Warning"
                                    description="Changing the Clarity ID will affect tracking and user behavior data collection."
                                    type="info"
                                    showIcon
                                    icon={<InfoCircleOutlined />}
                                    style={{ marginBottom: 24, textAlign: 'left', borderRadius: 8 }}
                                />
                                <Popconfirm 
                                    title="Unlock Clarity Settings?" 
                                    description="Do you want to proceed with updating the Clarity ID?" 
                                    okText="Yes, Unlock" 
                                    cancelText="Cancel" 
                                    onConfirm={() => setShowForm(true)}
                                >
                                    <Button type="primary" size="large" icon={<DashboardOutlined />} style={{ borderRadius: 6, backgroundColor: '#0078d4' }}>
                                        Configure Clarity
                                    </Button>
                                </Popconfirm>
                            </div>
                        ) : (
                            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 8, marginBottom: 24 }}>
                                    <Form.Item 
                                        name="clarity_id" 
                                        label={<Text strong>Project ID</Text>}
                                        tooltip="Your unique Clarity project identifier"
                                        rules={[{ required: true, message: 'Project ID is required' }]}
                                    >
                                        <AntInput 
                                            placeholder="e.g. f0x1y2z3" 
                                            size="large" 
                                            prefix={<EyeOutlined style={{ color: '#bfbfbf' }} />}
                                        />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        <InfoCircleOutlined style={{ marginRight: 6 }} />
                                        Find this in your Clarity project settings.
                                    </Text>
                                </div>

                                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                                    <Space>
                                        <Button onClick={() => setShowForm(false)} size="large">
                                            Cancel
                                        </Button>
                                        <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SettingOutlined />} style={{ backgroundColor: '#0078d4' }}>
                                            Save Changes
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        )}
                    </Card>
                </Col>
            </Row>
        </>
    )
}

