import {FileTextOutlined,TagsOutlined,WalletOutlined} from "@ant-design/icons";
import {Alert,Button,Card,Col,DatePicker,Form,Input,InputNumber,Row,Select,Space} from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

const statuses = 
[
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

export default function ExpenseForm({expense,accounts,categories,saving,serverError,fieldErrors,onSave,onCancel,onChange}) {
    const [form] = Form.useForm();
    const status = Form.useWatch("status", form);

    useEffect(() => {
        form.resetFields();

        form.setFieldsValue(
            expense
                ? {
                    ...expense,
                    expense_category_id: expense.expense_category_id || expense.category?.id,expense_date: expense.expense_date ? dayjs(expense.expense_date) : dayjs(),
                }
                : {
                    expense_date: dayjs(),
                    status: "posted",
                }
        );
    }, [expense, form]);

    useEffect(() => {
        if (!fieldErrors) return;

        form.setFields(
            Object.entries(fieldErrors).map(([name, errors]) => ({
                name,
                errors: Array.isArray(errors) ? errors : [errors],
            }))
        );
    }, [fieldErrors, form]);

    return (
        <Card className="expense-editor-card" styles={{ body: { padding: 0 } }}>
            {serverError && (
                <Alert type="error" showIcon message={serverError} className="expense-form-error"/>
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={onSave}
                onValuesChange={onChange}
                disabled={saving}
                requiredMark="optional"
            >
                <section className="expense-form-section">
                    <div className="expense-section-heading">
                        <span className="expense-section-icon">
                            <WalletOutlined />
                        </span>

                        <div>
                            <h2>Expense information</h2>
                            <p>
                                Record what was spent, when it happened and
                                which account paid for it.
                            </p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="title"
                                label="Expense title"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        message: "Expense title is required",
                                    },
                                ]}
                            >
                                <Input size="large" maxLength={255} placeholder="e.g. Office rent - November"/>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item
                                name="expense_category_id"
                                label="Category"
                                rules={[
                                    {
                                        required: true,
                                        message: "Expense category is required",
                                    },
                                ]}
                            >
                                <Select
                                    size="large"
                                    showSearch
                                    optionFilterProp="label"
                                    placeholder="Select category"
                                    options={(categories || []).map(
                                        (category) => ({
                                            value: category.id,
                                            label: category.name,
                                        })
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item
                                name="expense_date"
                                label="Expense date"
                                rules={[
                                    {
                                        required: true,
                                        message: "Expense date is required",
                                    },
                                ]}
                            >
                                <DatePicker size="large" style={{ width: "100%" }} format="DD MMM YYYY"/>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="account_id"
                                label="Paid from account"
                                rules={[
                                    {
                                        required: true,
                                        message: "Select an account",
                                    },
                                ]}
                            >
                                <Select
                                    size="large"
                                    showSearch
                                    optionFilterProp="label"
                                    placeholder="Select account"
                                    options={(accounts || []).map(
                                        (account) => ({
                                            value: account.id,
                                            label: `${account.name}${account.code ? ` (${account.code})` : ""}`,
                                        })
                                    )}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="amount"
                                label="Amount"
                                rules={[
                                    {
                                        required: true,
                                        message: "Expense amount is required",
                                    },
                                ]}
                            >
                                <InputNumber
                                    size="large"
                                    min={0.01}
                                    precision={2}
                                    controls={false}
                                    prefix="৳"
                                    placeholder="0.00"
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="status"
                                label="Status"
                                rules={[
                                    {
                                        required: true,
                                        message: "Select a status",
                                    },
                                ]}
                            >
                                <Select size="large" options={statuses}/>
                            </Form.Item>

                            <div className={`expense-status-note expense-status-${status || "posted"}`}>
                                {status === "draft" ? "Draft expenses do not affect account balance." : status === "cancelled" ? "Cancelled expenses do not affect account balance." : "Posted expenses deduct the amount from the selected account."}
                            </div>
                        </Col>
                    </Row>
                </section>

                <section className="expense-form-section">
                    <div className="expense-section-heading">
                        <span className="expense-section-icon expense-meta-icon">
                            <TagsOutlined />
                        </span>

                        <div>
                            <h2>Payment reference</h2>
                            <p>
                                Optional information for identifying who was
                                paid and the payment reference.
                            </p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="payee" label="Pay To">
                                <Input size="large" maxLength={255} placeholder="Person, vendor or service provider"/>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="transaction_reference" label="Transaction reference">
                                <Input size="large" maxLength={255} placeholder="Bank reference, cheque no., MFS trx id..."/>
                            </Form.Item>
                        </Col>
                    </Row>
                </section>

                <section className="expense-form-section">
                    <div className="expense-section-heading">
                        <span className="expense-section-icon expense-note-icon">
                            <FileTextOutlined />
                        </span>

                        <div>
                            <h2>Internal note</h2>
                            <p>
                                Add any context your finance team may need later.
                            </p>
                        </div>
                    </div>

                    <Form.Item name="note" label="Note">
                        <Input.TextArea rows={4} maxLength={5000} showCount placeholder="Optional expense note"/>
                    </Form.Item>
                </section>

                <div className="expense-form-actions">
                    <Space>
                        <Button onClick={onCancel}>
                            Cancel
                        </Button>

                        <Button type="primary" htmlType="submit" loading={saving}>
                            {expense ? "Save Changes" : "Create Expense"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Card>
    );
}