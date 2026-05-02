
import { ArrowLeftOutlined, SaveOutlined, SettingOutlined, MessageOutlined, ControlOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Space, Select, message, Card, Row, Col, Typography, Divider, Switch, InputNumber } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./css/block-list.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = AntInput;

export default function BlockSettings() {
    // Hook
    useTitle("Block Settings");

    // State
    const [form]                      = Form.useForm();
    const [loading, setLoading]       = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // Inline Professional Styles
    const styles = {
        container: {
            padding: '24px',
            background: '#f8fafc',
            minHeight: '100vh',
        },
        header: {
            background: '#ffffff',
            padding: '24px 30px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            border: '1px solid #e2e8f0',
        },
        card: {
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.02)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
        },
        input: {
            borderRadius: '10px',
            padding: '10px 14px',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
        },
        label: {
            fontWeight: '600',
            color: '#475569',
            fontSize: '14px',
            marginBottom: '8px',
        },
        submitBtn: {
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
            fontSize: '16px',
            fontWeight: '600',
            marginTop: '12px',
        },
        icon: {
            color: '#6366f1',
            marginRight: '12px',
        }
    };

    const id = 1;

    useEffect(() => {
        let isMounted = true;

        const fetchedOrderGuard = async () => {
            const res = await getDatas(`/admin/order-guards/${id}`);

            if(res && res?.success){
                const list = res?.result;

                if(isMounted){
                    form.setFieldsValue({
                        quantity               : list.quantity,
                        duration               : list.duration,
                        allow_percentage       : list.allow_percentage,
                        duration_type          : list.duration_type,
                        block_message          : list.block_message,
                        permanent_block_message: list.permanent_block_message,
                        courier_block_message  : list.courier_block_message,
                        status                 : list.status,
                    });
                }
            }
        }

        fetchedOrderGuard();

        return () => {
            isMounted = false;
        }
    }, [id]);

    const handleSubmit = async (values) => {
        const formData = new FormData();

        formData.append('quantity', values.quantity);
        formData.append('duration', values.duration);
        formData.append('allow_percentage', values.allow_percentage);
        formData.append('duration_type', values.duration_type);
        formData.append('block_message', values.block_message);
        formData.append('permanent_block_message', values.permanent_block_message);
        formData.append('courier_block_message', values.courier_block_message);
        if(values.status) formData.append("status", values.status);

        formData.append('_method', 'PUT');

        try {
            setLoading(true);

            const res = await postData(`/admin/order-guards/${id}`, formData);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            {contextHolder}
            
            <div style={styles.header}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                        <SettingOutlined style={styles.icon} />
                        Block Settings
                    </Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/block-users" style={{ color: '#64748b' }}>Block List</Link> },
                            { title: <span style={{ color: '#64748b' }}>Settings</span> },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Button 
                        style={{ borderRadius: '10px', height: '40px', fontWeight: 500 }}
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                </div>
            </div>

            <Form 
                form={form} 
                onFinish={handleSubmit} 
                layout="vertical" 
                autoComplete="off"
                requiredMark={false}
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={10}>
                        <Card 
                            style={styles.card}
                            bodyStyle={{ padding: '24px' }}
                            title={
                                <Space>
                                    <ControlOutlined style={{ color: '#6366f1' }} />
                                    <span style={{ fontWeight: 700 }}>Block Thresholds</span>
                                </Space>
                            }
                        >
                            <Paragraph style={{ color: '#64748b', marginBottom: 24 }}>
                                Define the rules that trigger automatic blocking of customers based on their order behavior.
                            </Paragraph>

                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item 
                                        name="quantity" 
                                        label={<span style={styles.label}>Maximum Orders Allowed</span>} 
                                        tooltip="The number of orders a customer can place before threshold check."
                                        rules={[{ required: true, message: 'Please enter quantity' }]}
                                    >
                                        <InputNumber style={{ ...styles.input, width: '100%' }} size="large" placeholder="e.g. 5" min={1} />
                                    </Form.Item>
                                </Col>
                                
                                <Col span={14}>
                                    <Form.Item 
                                        name="duration" 
                                        label={<span style={styles.label}>Blocking Duration</span>} 
                                        rules={[{ required: true, message: 'Please enter duration' }]}
                                    >
                                        <InputNumber style={{ ...styles.input, width: '100%' }} size="large" placeholder="e.g. 30" min={1} />
                                    </Form.Item>
                                </Col>
                                
                                <Col span={10}>
                                    <Form.Item name="duration_type" label={<span style={styles.label}>Unit</span>}>
                                        <Select
                                            size="large"
                                            style={{ height: '46px' }}
                                            dropdownStyle={{ borderRadius: '8px' }}
                                            options={[
                                                { value: "minutes", label: "Minutes" },
                                                { value: "hours", label: "Hours" },
                                                { value: "days", label: "Days" }
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item 
                                        name="allow_percentage" 
                                        label={<span style={styles.label}>Blocking Percentage (%)</span>} 
                                        tooltip="Threshold percentage of failed/cancelled orders to trigger a block."
                                        rules={[{ required: true, message: 'Please enter percentage' }]}
                                    >
                                        <InputNumber 
                                            style={{ ...styles.input, width: '100%' }} 
                                            size="large" 
                                            placeholder="e.g. 20" 
                                            min={0} 
                                            max={100} 
                                            formatter={value => `${value}%`}
                                            parser={value => value.replace('%', '')}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '24px 0' }} />

                            <Form.Item name="status" label={<span style={styles.label}>System Status</span>} rules={[{ required: true }]}>
                                <Select 
                                    size="large"
                                    style={{ height: '46px' }}
                                    options={[
                                        { value: 'active', label: <span style={{color: '#16a34a'}}>● Active (System Monitoring)</span> },
                                        { value: 'inactive', label: <span style={{color: '#dc2626'}}>○ Inactive (Bypassed)</span> }
                                    ]} 
                                />
                            </Form.Item>
                        </Card>

                        <div style={{ marginTop: 16 }}>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading} 
                                size="large" 
                                block
                                icon={<SaveOutlined />}
                                style={styles.submitBtn}
                            >
                                {loading ? "Updating System..." : "Save System Settings"}
                            </Button>
                        </div>
                    </Col>

                    <Col xs={24} lg={14}>
                        <Card 
                            style={styles.card}
                            bodyStyle={{ padding: '24px' }}
                            title={
                                <Space>
                                    <MessageOutlined style={{ color: '#6366f1' }} />
                                    <span style={{ fontWeight: 700 }}>Automated Responses</span>
                                </Space>
                            }
                        >
                            <Paragraph style={{ color: '#64748b', marginBottom: 24 }}>
                                Customize the messages displayed to users when their actions are restricted by the system.
                            </Paragraph>

                            <Form.Item 
                                name="block_message" 
                                label={<span style={styles.label}>Standard Block Message</span>} 
                                extra={<span style={{ fontSize: '12px', color: '#94a3b8' }}>Shown to customers who are temporarily blocked.</span>}
                                rules={[{ required: true, message: "Please enter a message" }]}
                            >
                                <TextArea 
                                    rows={4} 
                                    placeholder="Enter the message for temporary blocks..." 
                                    style={styles.input}
                                />
                            </Form.Item>

                            <Form.Item 
                                name="permanent_block_message" 
                                label={<span style={styles.label}>Permanent Block Notification</span>} 
                                extra={<span style={{ fontSize: '12px', color: '#94a3b8' }}>Shown to customers who have been blacklisted permanently.</span>}
                                rules={[{ required: true, message: "Please enter a message" }]}
                            >
                                <TextArea 
                                    rows={4} 
                                    placeholder="Enter the message for permanent bans..." 
                                    style={styles.input}
                                />
                            </Form.Item>

                            <Form.Item 
                                name="courier_block_message" 
                                label={<span style={styles.label}>Courier Integration Message</span>} 
                                extra={<span style={{ fontSize: '12px', color: '#94a3b8' }}>Message shown when a block is triggered via third-party courier data.</span>}
                                rules={[{ required: true, message: "Please enter a message" }]}
                            >
                                <TextArea 
                                    rows={4} 
                                    placeholder="Enter the message for courier-based restrictions..." 
                                    style={styles.input}
                                />
                            </Form.Item>
                        </Card>
                        
                        <Card style={{ ...styles.card, marginTop: 24, borderLeft: '5px solid #6366f1' }}>
                            <Space align="start" style={{ padding: '12px' }}>
                                <SafetyCertificateOutlined style={{ fontSize: 24, color: '#6366f1', marginTop: 4 }} />
                                <div>
                                    <Text strong style={{ fontSize: 16, color: '#1e293b' }}>Security Information</Text>
                                    <Paragraph style={{ marginBottom: 0, color: '#64748b', marginTop: 4 }}>
                                        These settings directly affect order validation. Ensure thresholds are set reasonably to avoid blocking legitimate customers. Changes are logged for audit purposes.
                                    </Paragraph>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
