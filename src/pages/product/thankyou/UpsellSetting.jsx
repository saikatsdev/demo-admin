import { ArrowLeftOutlined, SaveOutlined, SettingOutlined, BgColorsOutlined, FontColorsOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Col, Form, Input, message, Row, Space, Spin, ColorPicker, Typography, Divider } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./upsell.css";

const { Text, Title } = Typography;

export default function UpsellSetting() {
    // Hook
    useTitle("Thank You Page Settings");

    const navigate = useNavigate();
    const [form] = Form.useForm();

    // State
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // getData
    useEffect(() => {
        let isMounted = true;
        const getSettings = async () => {
            setLoading(true);
            try {
                const res = await getDatas("/admin/up-sell-settings");
                if (res && res.success && isMounted) {
                    form.setFieldsValue(res.result || {});
                }
            } catch (error) {
                console.log(error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getSettings();
        return () => { isMounted = false; };
    }, [form]);

    const onFinish = async (values) => {
        const data = { 
            ...values, 
            button_text_color: typeof values.button_text_color === 'string' ? values.button_text_color : values.button_text_color?.toHexString?.() || values.button_text_color,
            button_bg_color: typeof values.button_bg_color === 'string' ? values.button_bg_color : values.button_bg_color?.toHexString?.() || values.button_bg_color,
            _method: "PUT" 
        };

        try {
            setFormLoading(true);
            const res = await postData("/admin/up-sell-settings", data);
            if (res && res?.success) {
                messageApi.success(res.msg || "Settings updated successfully");
                setTimeout(() => navigate("/upsell"), 1000);
            }
        } catch (error) {
            console.log(error);
            messageApi.error("Failed to update settings");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div style={{ padding: 16 }}>
            {contextHolder}
            
            <div className="pagehead" style={{ marginBottom: 24 }}>
                <div className="head-left">
                    <h1 className="title">Up Sell Settings</h1>
                    <p className="subtitle">Configure the appearance and content of your post-purchase upsell page</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/upsell">Upsells</Link> },
                            { title: "Page Settings" },
                        ]}
                    />
                </div>
            </div>

            <Spin spinning={loading}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={[24, 24]} justify="center">
                        <Col xs={24} lg={18}>
                            <Card 
                                title={<Space><SettingOutlined /> Content Configuration</Space>} 
                                className="modern-antd-card"
                                extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/upsell")}>Back</Button>}
                            >
                                <Row gutter={20}>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Greetings Text" name="greetings" rules={[{ required: true, message: 'Greetings text is required' }]}>
                                            <Input size="large" placeholder="e.g. Thank you for your order!" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Offer Title" name="title" rules={[{ required: true, message: 'Main title is required' }]}>
                                            <Input size="large" placeholder="e.g. Exclusive Offer for You" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item label="Sub-title / Description" name="sub_title">
                                            <Input.TextArea rows={4} placeholder="Add a catchy description to encourage upsell conversions..." />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card title={<Space><BgColorsOutlined /> Design & Call to Action</Space>} style={{ marginTop: 24 }} className="modern-antd-card">
                                <Row gutter={24} align="bottom">
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Button Label" name="button_text">
                                            <Input size="large" placeholder="e.g. Claim Offer Now" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Item label={<Space><FontColorsOutlined /> Text Color</Space>} name="button_text_color">
                                            <ColorPicker showText size="large" disabledAlpha />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={12} md={6}>
                                        <Form.Item label={<Space><BgColorsOutlined /> Button Color</Space>} name="button_bg_color">
                                            <ColorPicker showText size="large" disabledAlpha />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Divider dashed />

                                <div className="placeholder-empty" style={{ padding: '32px', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                                    <Text type="secondary" strong style={{ display: 'block', marginBottom: 16, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Visual Preview</Text>
                                    <div style={{ textAlign: 'center' }}>
                                        <Form.Item noStyle shouldUpdate>
                                            {() => {
                                                const text = form.getFieldValue('button_text') || 'Button Preview';
                                                const textColor = typeof form.getFieldValue('button_text_color') === 'string' ? form.getFieldValue('button_text_color') : form.getFieldValue('button_text_color')?.toHexString?.() || '#ffffff';
                                                const bgColor = typeof form.getFieldValue('button_bg_color') === 'string' ? form.getFieldValue('button_bg_color') : form.getFieldValue('button_bg_color')?.toHexString?.() || '#1c558b';
                                                
                                                return (
                                                    <button 
                                                        type="button"
                                                        style={{ 
                                                            backgroundColor: bgColor, 
                                                            color: textColor,
                                                            padding: '12px 36px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            fontWeight: 600,
                                                            fontSize: '16px',
                                                            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                                            cursor: 'default',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        {text}
                                                    </button>
                                                );
                                            }}
                                        </Form.Item>
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: 32, textAlign: 'right' }}>
                                    <Space size="middle">
                                        <Button size="medium" onClick={() => navigate("/upsell")}>Cancel</Button>
                                        <Button type="primary" size="medium" icon={<SaveOutlined />} loading={formLoading} htmlType="submit">
                                            {formLoading ? "Saving..." : "Save Settings"}
                                        </Button>
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </div>
    );
}
