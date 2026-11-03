import { BankOutlined, FileTextOutlined, WalletOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";
import { useEffect } from "react";
import { accountTypes } from "../../constants";

const statuses = 
[
    { 
        value: "active", 
        label: "Active" 
    },
    { 
        value: "inactive", 
        label: "Inactive" 
    },
    { 
        value: "draft", 
        label: "Draft" 
    },
];

export default function AccountForm({ account, saving, serverError, fieldErrors, onSave, onCancel, onChange }) {
    const [form] = Form.useForm();
    const type   = Form.useWatch("type", form);

    useEffect(() => {
        form.resetFields();
        form.setFieldsValue(account || { type: "cash", opening_balance: 0, status: "active" });
    }, [account, form]);

    useEffect(() => {
        if (!fieldErrors) return;
        form.setFields(Object.entries(fieldErrors).map(([name, errors]) => ({ name, errors: Array.isArray(errors) ? errors : [errors] })));
    }, [fieldErrors, form]);

    const financialAccount = ["bank", "mobile_banking", "courier"].includes(type);

    return (
        <Card className="account-editor-card" styles={{ body: { padding: 0 } }}>
            {serverError && <Alert type="error" showIcon message={serverError} className="account-form-error" />}
            <Form form={form} layout="vertical" onFinish={onSave} onValuesChange={onChange} disabled={saving} requiredMark="optional">
                <section className="account-form-section">
                    <div className="account-section-heading">
                        <span className="account-section-icon"><WalletOutlined /></span>
                        <div>
                            <h2>Account information</h2>
                            <p>Set the account identity, category and starting balance.</p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="name" label="Account name" rules={[{ required: true, whitespace: true, message: "Account name is required" }]}>
                                <Input size="large" maxLength={255} placeholder="e.g. Main Cash Account" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="type" label="Account type" rules={[{ required: true, message: "Select an account type" }]}>
                                <Select size="large" options={accountTypes} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select a status" }]}>
                                <Select size="large" options={statuses} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="opening_balance" label="Opening balance" extra={account ? "Changing this adjusts the current balance by the same difference." : "The balance available when this account is created."} rules={[{ required: true, message: "Opening balance is required" }]}>
                                <InputNumber size="large" min={0} precision={2} controls={false} prefix="৳" placeholder="0.00" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        {account && 
                            <Col xs={24} md={12}>
                                <div className="account-current-balance">
                                    <span>Current balance</span>
                                    <strong>৳{Number(account.current_balance || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}</strong>
                                    <small>Managed automatically from account activity.</small>
                                </div>
                            </Col>
                        }
                    </Row>
                </section>

                <section className="account-form-section account-details-section">
                    <div className="account-section-heading">
                        <span className="account-section-icon account-bank-icon">
                            <BankOutlined />
                        </span>

                        <div>
                            <h2>Financial details</h2>
                            <p>{financialAccount ? "Add the provider and account ownership details." : "Optional details for identifying this account."}</p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="account_number" label={type === "mobile_banking" ? "Mobile account number" : "Account number"}>
                                <Input size="large" maxLength={255} placeholder={type === "mobile_banking" ? "e.g. 01XXXXXXXXX" : "Enter account number"} />
                            </Form.Item>
                        </Col>
                        
                        <Col xs={24} md={12}>
                            <Form.Item name="account_holder_name" label="Account holder name">
                                <Input size="large" maxLength={255} placeholder="Enter account holder name" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="bank_name" label={type === "mobile_banking" ? "Provider name" : "Bank / provider name"}>
                                <Input size="large" maxLength={255} placeholder={type === "mobile_banking" ? "e.g. bKash, Nagad" : "Enter bank or provider name"} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="branch_name" label="Branch name">
                                <Input size="large" maxLength={255} placeholder="Enter branch name" />
                            </Form.Item>
                        </Col>
                    </Row>
                </section>

                <section className="account-form-section">
                    <div className="account-section-heading">
                        <span className="account-section-icon account-note-icon">
                            <FileTextOutlined />
                        </span>

                        <div>
                            <h2>Internal note</h2>
                            <p>Add context that will help your accounting team.</p>
                        </div>
                    </div>

                    <Form.Item name="note" label="Note">
                        <Input.TextArea rows={4} maxLength={5000} showCount placeholder="Add an optional note" />
                    </Form.Item>
                </section>

                <div className="account-form-actions">
                    <Space>
                        <Button onClick={onCancel}>
                            Cancel
                        </Button>

                        <Button type="primary" htmlType="submit" loading={saving}>
                            {account ? "Save changes" : "Create account"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Card>
    );
}
