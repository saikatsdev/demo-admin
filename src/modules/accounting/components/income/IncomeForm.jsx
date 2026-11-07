import { FileTextOutlined, TagsOutlined, WalletOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

const statuses = [
    { 
        value: "posted", 
        label: "Posted" 
    },
    { 
        value: "draft", 
        label: "Draft" 
    },
    { 
        value: "cancelled", 
        label: "Cancelled" 
    },
];

export default function IncomeForm({ income, accounts, categories, saving, serverError, fieldErrors, onSave, onCancel, onChange }) {
    const [form] = Form.useForm();
    const status = Form.useWatch("status", form);

    useEffect(() => {
        form.resetFields();
        form.setFieldsValue(income ? {
            ...income,
            income_category_id: income.income_category_id || income.category?.id,
            income_date: income.income_date ? dayjs(income.income_date) : dayjs(),
        } : {
            income_date: dayjs(),
            status: "posted",
        });
    }, [income, form]);

    useEffect(() => {
        if (!fieldErrors) return;
        form.setFields(Object.entries(fieldErrors).map(([name, errors]) => ({ name, errors: Array.isArray(errors) ? errors : [errors] })));
    }, [fieldErrors, form]);

    return (
        <Card className="income-editor-card" styles={{ body: { padding: 0 } }}>
            {serverError && <Alert type="error" showIcon message={serverError} className="income-form-error" />}
            <Form form={form} layout="vertical" onFinish={onSave} onValuesChange={onChange} disabled={saving} requiredMark="optional">
                <section className="income-form-section">
                    <div className="income-section-heading">
                        <span className="income-section-icon"><WalletOutlined /></span>
                        <div>
                            <h2>Income information</h2>
                            <p>Record non-order income and the account that received the money.</p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="title" label="Income title" rules={[{ required: true, whitespace: true, message: "Income title is required" }]}>
                                <Input size="large" maxLength={255} placeholder="e.g. Website maintenance service" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="income_category_id" label="Category" rules={[{ required: true, message: "Income category is required" }]}>
                                <Select size="large" showSearch optionFilterProp="label" placeholder="Select category" options={(categories || []).map((category) => ({ value: category.id, label: category.name }))} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="income_date" label="Income date" rules={[{ required: true, message: "Income date is required" }]}>
                                <DatePicker size="large" style={{ width: "100%" }} format="DD MMM YYYY" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item name="account_id" label="Received in account" rules={[{ required: true, message: "Select an account" }]}>
                                <Select size="large" showSearch optionFilterProp="label" placeholder="Select account" options={(accounts || []).map((account) => ({ value: account.id, label: `${account.name}${account.code ? ` (${account.code})` : ""}` }))} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item name="amount" label="Amount" rules={[{ required: true, message: "Income amount is required" }]}>
                                <InputNumber size="large" min={0.01} precision={2} controls={false} prefix="৳" placeholder="0.00" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select a status" }]}>
                                <Select size="large" options={statuses} />
                            </Form.Item>
                            <div className={`income-status-note income-status-${status || "posted"}`}>
                                {status === "draft" ? "Draft income does not affect account balance." : status === "cancelled" ? "Cancelled income does not affect account balance." : "Posted income increases the selected account balance."}
                            </div>
                        </Col>
                    </Row>
                </section>

                <section className="income-form-section">
                    <div className="income-section-heading">
                        <span className="income-section-icon income-meta-icon"><TagsOutlined /></span>
                        <div>
                            <h2>Source & reference</h2>
                            <p>Optional details about who paid and how to identify the receipt.</p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="payer" label="Payer / source">
                                <Input size="large" maxLength={255} placeholder="Client, company or income source" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="transaction_reference" label="Transaction reference">
                                <Input size="large" maxLength={255} placeholder="Bank reference, cheque no., MFS trx id..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </section>

                <section className="income-form-section">
                    <div className="income-section-heading">
                        <span className="income-section-icon income-note-icon"><FileTextOutlined /></span>
                        <div>
                            <h2>Internal note</h2>
                            <p>Add any context your finance team may need later.</p>
                        </div>
                    </div>

                    <Form.Item name="note" label="Note">
                        <Input.TextArea rows={4} maxLength={5000} showCount placeholder="Optional income note" />
                    </Form.Item>
                </section>

                <div className="income-form-actions">
                    <Space>
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            {income ? "Save Changes" : "Create Income"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Card>
    );
}
