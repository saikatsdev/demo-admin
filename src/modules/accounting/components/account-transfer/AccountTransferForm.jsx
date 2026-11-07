import {ArrowRightOutlined,BankOutlined,FileTextOutlined,SwapOutlined} from "@ant-design/icons";
import {Alert,Button,Card,Col,DatePicker,Form,Input,InputNumber,Row,Select,Space,Typography} from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

const { Text } = Typography;

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

export default function AccountTransferForm({transfer,accounts,saving,serverError,fieldErrors,onSave,onCancel,onChange}) {
    const [form]        = Form.useForm();
    const status        = Form.useWatch("status", form);
    const fromAccountId = Form.useWatch("from_account_id", form);
    const toAccountId   = Form.useWatch("to_account_id", form);

    useEffect(() => {
        form.setFieldsValue({
            from_account_id      : transfer?.from_account_id,
            to_account_id        : transfer?.to_account_id,
            amount               : transfer ? Number(transfer.amount)                     : undefined,
            transfer_date        : transfer?.transfer_date ? dayjs(transfer.transfer_date): dayjs(),
            status               : transfer?.status || "posted",
            transaction_reference: transfer?.transaction_reference || "",
            note                 : transfer?.note || "",
        });
    }, [form, transfer]);

    useEffect(() => {
        if (!fieldErrors) return;

        form.setFields(
            Object.entries(fieldErrors).map(([name, errors]) => ({
                name,
                errors: Array.isArray(errors) ? errors : [errors],
            }))
        );
    }, [fieldErrors, form]);

    const accountOptions = (accounts || []).map((account) => ({
        value: account.id,
        label: `${account.name}${account.code ? ` (${account.code})` : ""} · ৳${Number(account.current_balance || 0).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`,
    }));

    const submit = (values) =>
        onSave({
            ...values,
            amount               : Number(values.amount),
            transfer_date        : values.transfer_date?.format("YYYY-MM-DD HH:mm:ss"),
            transaction_reference: values.transaction_reference?.trim() || null,
            note                 : values.note?.trim() || null,
        });

    return (
        <Card className="transfer-editor-card">
            {serverError && (
                <Alert type="error" showIcon message={serverError} className="transfer-form-alert"/>
            )}

            <Form form={form} layout="vertical" onFinish={submit} onValuesChange={onChange} disabled={saving} requiredMark="optional">
                <section className="transfer-form-section">
                    <div className="transfer-section-heading">
                        <span className="transfer-section-icon">
                            <SwapOutlined />
                        </span>

                        <div>
                            <h2>Transfer details</h2>
                            <p>
                                Move money between internal accounts without
                                affecting income, expense or profit.
                            </p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]} align="middle">
                        <Col xs={24} md={10}>
                            <Form.Item name="from_account_id" label="From account"
                                rules={[
                                    {
                                        required: true,
                                        message: "Select source account",
                                    },
                                ]}
                            >
                                <Select size="large" showSearch optionFilterProp="label" placeholder="Select source account"
                                    options={accountOptions.map((option) => ({
                                        ...option,
                                        disabled: option.value === toAccountId,
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={4} className="transfer-arrow-col">
                            <ArrowRightOutlined className="transfer-arrow" />
                        </Col>

                        <Col xs={24} md={10}>
                            <Form.Item
                                name="to_account_id"
                                label="To account"
                                rules={[
                                    {
                                        required: true,
                                        message: "Select destination account",
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            return !value || value !== getFieldValue("from_account_id") ? Promise.resolve() : Promise.reject(new Error("Destination account must be different"));
                                        },
                                    }),
                                ]}
                            >
                                <Select
                                    size="large"
                                    showSearch
                                    optionFilterProp="label"
                                    placeholder="Select destination account"
                                    options={accountOptions.map((option) => ({
                                        ...option,
                                        disabled: option.value === fromAccountId,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[20, 0]}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="amount"
                                label="Transfer amount"
                                rules={[
                                    {
                                        required: true,
                                        message: "Transfer amount is required",
                                    },
                                ]}
                            >
                                <InputNumber
                                    size="large"
                                    min={0.01}
                                    precision={2}
                                    controls={false}
                                    prefix="৳"
                                    style={{ width: "100%" }}
                                    placeholder="0.00"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                name="transfer_date"
                                label="Transfer date"
                                rules={[
                                    {
                                        required: true,
                                        message: "Transfer date is required",
                                    },
                                ]}
                            >
                                <DatePicker size="large" showTime style={{ width: "100%" }} format="DD MMM YYYY hh:mm A"/>
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
                        </Col>
                    </Row>

                    <div className={`transfer-status-note transfer-status-${status || "posted"}`}>
                        {status === "draft" ? "Draft transfer does not change account balances." : status === "cancelled" ? "Cancelled transfer has no active balance impact." : "Posted transfer immediately moves the amount from source to destination account."}
                    </div>
                </section>

                <section className="transfer-form-section">
                    <div className="transfer-section-heading">
                        <span className="transfer-section-icon transfer-reference-icon">
                            <BankOutlined />
                        </span>

                        <div>
                            <h2>Reference</h2>
                            <p>
                                Optional bank, cash or mobile banking reference
                                for audit and reconciliation.
                            </p>
                        </div>
                    </div>

                    <Form.Item name="transaction_reference" label="Transaction reference">
                        <Input size="large" maxLength={255} placeholder="Bank reference, cheque no., MFS trx id..."/>
                    </Form.Item>
                </section>

                <section className="transfer-form-section">
                    <div className="transfer-section-heading">
                        <span className="transfer-section-icon transfer-note-icon">
                            <FileTextOutlined />
                        </span>

                        <div>
                            <h2>Internal note</h2>
                            <p>Add context for your finance team.</p>
                        </div>
                    </div>

                    <Form.Item name="note" label="Note">
                        <Input.TextArea rows={4} maxLength={5000} showCount placeholder="Optional transfer note"/>
                    </Form.Item>
                </section>

                <Alert
                    type="info"
                    showIcon
                    message="Account transfer is internal money movement"
                    description="Posted transfers create equal outflow and inflow entries. They are excluded from expense, income and profit calculations."
                    className="transfer-accounting-note"
                />

                <div className="transfer-form-actions">
                    <Space>
                        <Button onClick={onCancel}>
                            Cancel
                        </Button>

                        <Button type="primary" htmlType="submit" loading={saving}>
                            {transfer ? "Save Changes" : "Create Transfer"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Card>
    );
}