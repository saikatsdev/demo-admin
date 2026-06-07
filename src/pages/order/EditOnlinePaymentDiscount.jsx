
import { ArrowLeftOutlined, SaveOutlined, InfoCircleOutlined, PercentageOutlined, SettingOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Form, Input, message, Row, Select, Space, Typography, Divider } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { Title, Text } = Typography;

export default function EditOnlinePaymentDiscount() {
    // Hook
    useTitle("Edit Payment Discount");

    const navigate = useNavigate();
    const { id }     = useParams();
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading]       = useState(false);
    const [gateways, setGateways]     = useState([]);

    // Fetch Initial Data
    useEffect(() => {
        const fetchGateways = async () => {
            const res = await getDatas("/admin/payment-gateways/list");
            if (res && res?.success) setGateways(res?.result || []);
        };

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const res = await getDatas(`/admin/online-payment/discounts/${id}`);
                if (res && res?.success) {
                    const data = res.result;
                    form.setFieldsValue({
                        payment_gateway_id     : data.payment_gateway_id,
                        discount_type          : data.discount_type,
                        discount_amount        : data.discount_amount,
                        minimum_cart_amount    : data.minimum_cart_amount,
                        maximum_discount_amount: data.maximum_discount_amount,
                        custom_message         : data.custom_message,
                        status                 : data.status,
                    });
                }
            } catch (error) {
                message.error("Failed to fetch discount details");
            } finally {
                setLoading(false);
            }
        };

        fetchGateways();
        fetchDetail();
    }, [id, form]);

    // Form Submission
    const onFinish = async (values) => {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            formData.append(key, value);
        });
        formData.append('_method', 'PUT');

        try {
            setLoading(true);
            const res = await postData(`/admin/online-payment/discounts/${id}`, formData);

            if (res?.success) {
                messageApi.success(res.msg);
                setTimeout(() => navigate("/online-payment/discounts"), 1000);
            } else {
                message.error(res?.msg || "Something went wrong");
            }
        } catch (error) {
            message.error("Failed to update discount rule");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
            {contextHolder}
            <div className="pagehead" style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #e9ecef', marginBottom: '24px' }}>
                <div className="head-left">
                    <Title level={4} style={{ margin: 0 }}>Update Payment Discount</Title>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/online-payment/discounts">Discounts</Link> },
                            { title: "Edit Rule" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading}>
                            Update Rule
                        </Button>
                    </Space>
                </div>
            </div>

            <div style={{ padding: '0 24px' }}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <Card 
                                title={<Space><PercentageOutlined style={{ color: '#2563eb' }} />Edit Discount Rules</Space>}
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}
                            >
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="payment_gateway_id" label="Payment Gateway" rules={[{ required: true }]}>
                                            <Select 
                                                size="large"
                                                placeholder="Select Gateway"
                                                options={gateways.map(g => ({ label: g.name, value: g.id }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="discount_type" label="Discount Type" rules={[{ required: true }]}>
                                            <Select 
                                                size="large"
                                                options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed Amount' }]}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="discount_amount" label="Discount Value" rules={[{ required: true }]}>
                                            <Input size="large" type="number" placeholder="Enter Value" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '16px 0' }} />

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="minimum_cart_amount" label="Min. Cart Amount" rules={[{ required: true }]}>
                                            <Input size="large" type="number" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="maximum_discount_amount" label="Max. Discount Limit" rules={[{ required: true }]}>
                                            <Input size="large" type="number" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card 
                                title={<Space><InfoCircleOutlined style={{ color: '#2563eb' }} />Display Settings</Space>}
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            >
                                <Form.Item name="custom_message" label="Promotional Message" rules={[{ required: true }]}>
                                    <Input.TextArea rows={4} />
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card 
                                title={<Space><SettingOutlined style={{ color: '#2563eb' }} />Update Status</Space>}
                                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            >
                                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                    <Select 
                                        size="large"
                                        options={[
                                            { value: 'active', label: 'Active' }, 
                                            { value: 'inactive', label: 'Inactive' }
                                        ]} 
                                    />
                                </Form.Item>
                                <Divider />
                                <Button type="primary" size="large" block onClick={() => form.submit()} loading={loading}>
                                    Save Changes
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    );
}
