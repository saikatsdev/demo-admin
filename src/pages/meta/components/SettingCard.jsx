import React, { useState } from 'react';
import { Card, Button, Typography, Switch, Row, Col, Divider, Modal, Form, Input, Space } from 'antd';
import { PlusOutlined, MoreOutlined, CheckCircleOutlined, WifiOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SettingCard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const showModal = () => setIsModalOpen(true);
    const handleCancel = () => setIsModalOpen(false);

    const onFinish = (values) => {
        console.log('Success:', values);
        setIsModalOpen(false);
    };
    return (
        <div className="setting-card-container">
            <div className="header-section">
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={4} className="main-title">Meta Ads API Accounts</Title>
                        <Text className="sub-title">Manage your Meta Ads API accounts for expense tracking</Text>
                    </Col>

                    <Col>
                        <Button 
                            type="primary" 
                            className="add-account-btn" 
                            icon={<PlusOutlined />}
                            onClick={showModal}
                        >
                            Add New Account
                        </Button>
                    </Col>
                </Row>
            </div>

            <Divider className="header-divider" />

            <Modal title={null} open={isModalOpen} onCancel={handleCancel} footer={null} width={700} className="add-meta-modal">
                <div className="modal-inner">
                    <div className="modal-header">
                        <Title level={3}>Add Meta Ads Account</Title>
                        <p className="modal-subtitle">Enter your Meta Ads API credentials to track ad expenses</p>
                    </div>

                    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ activeStatus: true, usdRate: 110 }} className="meta-form">
                        <Form.Item label="Account Name" name="accountName" extra="A friendly name to identify this account">
                            <Input placeholder="Account Name" />
                        </Form.Item>

                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item label="App ID" name="appId" extra="Your Meta App ID">
                                    <Input placeholder="Meta App ID" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="App Secret" name="appSecret" extra="Your Meta App Secret">
                                    <Input placeholder="Meta App Secret" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Access Token" name="accessToken" extra="Long-lived System User Access Token">
                            <Input placeholder="System User Access Token" />
                        </Form.Item>

                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item label="Ad Account ID" name="adAccountId" extra="Without the 'act_' prefix">
                                    <Input placeholder="ID without act_" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="USD to BDT Rate" name="usdRate" extra="Current conversion rate">
                                    <Input placeholder="110" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="form-action-section">
                            <div className="action-row">
                                <div className="action-info">
                                    <Text strong>Active Status</Text>
                                    <p className="action-desc">Enable or disable this account</p>
                                </div>
                                <Form.Item name="activeStatus" valuePropName="checked" noStyle>
                                    <Switch />
                                </Form.Item>
                            </div>

                            <div className="action-row connection-row">
                                <div className="action-info">
                                    <Text strong>Connection Status</Text>
                                    <p className="action-desc">Test your credentials before saving</p>
                                </div>
                                <Button icon={<WifiOutlined />} className="test-btn">Test Connection</Button>
                            </div>
                        </div>

                        <div className="form-footer">
                            <Button onClick={handleCancel} className="cancel-btn">Cancel</Button>
                            <Button type="primary" htmlType="submit" className="create-btn">Create</Button>
                        </div>
                    </Form>
                </div>
            </Modal>

            <div className="card-wrapper">
                <Card className="account-setting-card" styles={{ body: { padding: 0 } }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="card-inner-body">
                            <Row justify="space-between" align="middle">
                                <Col>
                                    <Title level={5} className="account-name">niyat hub</Title>
                                    <p className="account-id">1924834515106423</p>
                                </Col>
                                <Col>
                                    <Button type="text" icon={<MoreOutlined className="more-icon" />} className="action-btn" />
                                </Col>
                            </Row>
                            
                            <Divider className="inner-divider" />

                            <div className="info-row">
                                <Text className="info-label">USD Rate:</Text>
                                <Text strong className="info-value">130 BDT</Text>
                            </div>

                            <div className="info-row status-row">
                                <Text className="info-label">Status:</Text>
                                <div className="status-badge-premium">Active</div>
                            </div>

                            <div className="custom-connection-status">
                                <CheckCircleOutlined className="status-icon" />
                                <div className="status-text-content">
                                    <p className="status-title">Connected</p>
                                    <p className="status-desc">Connected successfully! Account status: ACTIVE</p>
                                </div>
                            </div>
                        </div>

                            <div className="setting-card-footer">
                            <div className="toggle-section">
                                <Text className="toggle-label">Toggle account status</Text>
                                <Switch defaultChecked className="account-switch" />
                            </div>
                            <Button className="test-connection-btn" icon={<WifiOutlined />}>
                                Test Connection
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingCard;