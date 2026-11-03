import { BankOutlined, DollarOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Skeleton, Tag } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { getAccountList } from "../../../accounting/api/accountApi";
import { getSupplierFinancialSummary, recordSupplierPayment } from "../../api";

const money      = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const firstError = (response, fallback) => Object.values(response?.errors || {}).flat()[0] || response?.message || response?.msg || fallback;

export default function SupplierTransaction({ supplier, onClose, onSuccess }) {
    const [form]                  = Form.useForm();
    const [summary, setSummary]   = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState(null);
    const paymentAmount           = Number(Form.useWatch("amount", form) || 0);
    const currentSignedBalance    = Number(summary?.signed_balance || 0);
    const balanceAfterPayment     = currentSignedBalance - paymentAmount;
    const balanceAfterType        = balanceAfterPayment > 0 ? "payable" : balanceAfterPayment < 0 ? "receivable" : "settled";

    useEffect(() => {
        if (!supplier) return;
        let active = true;
        setLoading(true); setError(null); setSummary(null);
        form.resetFields();
        form.setFieldsValue({ payment_date: dayjs() });
        Promise.all([getSupplierFinancialSummary(supplier.id), getAccountList()])
            .then(([summaryResponse, accountResponse]) => {
                if (!active) return;

                if (!summaryResponse?.success) {
                    throw new Error(firstError(summaryResponse, "Unable to load supplier balance"));
                }

                setSummary(summaryResponse.result);

                setAccounts(accountResponse?.result?.data || accountResponse?.result || []);
            }).catch((loadError) => { 
                if (active) {
                    setError(loadError.message);
                } 
            }).finally(() => { 
                if (active) {
                    setLoading(false); 
                }
            });
        return () => { active = false; };
    }, [form, supplier]);

    const submit = async (values) => {
        if (!supplier || saving) return;

        setSaving(true); setError(null);

        const response = await recordSupplierPayment(supplier.id, {
            ...values,
            amount: Number(values.amount),
            payment_date: values.payment_date.format("YYYY-MM-DD HH:mm:ss"),
            transaction_reference: values.transaction_reference?.trim() || null,
            note: values.note?.trim() || null,
        });

        setSaving(false);

        if (!response?.success) { 
            setError(firstError(response, "Unable to record supplier payment")); return; 
        }

        onSuccess(response);
    };

    return (
        <Modal open={Boolean(supplier)} title={null} onCancel={saving ? undefined : onClose} footer={null} width={620} className="supplier-transaction-modal" destroyOnHidden>
            <div className="supplier-transaction-hero">
                <span className="supplier-transaction-icon">
                    <DollarOutlined />
                </span>

                <div>
                    <h2>Supplier transaction</h2>
                    <p>{supplier?.code} · {supplier?.name}</p>
                </div>
            </div>

            {loading ? 
                <div className="supplier-transaction-loading">
                    <Skeleton active paragraph={{ rows: 5 }} />
                </div> : 
                <Form form={form} layout="vertical" onFinish={submit} disabled={saving} requiredMark="optional" className="supplier-transaction-form">
                    {error && 
                        <Alert type="error" showIcon message={error} />
                    }

                    {summary && 
                        <div className="supplier-transaction-balance">
                            <div>
                                <span>Current balance</span>
                                <strong>৳ {money(summary.current_balance)}</strong>
                            </div>

                            <Tag bordered={false} color={summary.balance_type === "receivable" ? "green" : summary.balance_type === "payable" ? "orange" : "default"}>
                                {summary.balance_type}
                            </Tag>
                        </div>
                    }

                    <Alert type="info" showIcon message="Payment reduces supplier payable. Paying more than the payable balance creates a supplier receivable." />

                    <Form.Item name="amount" label="Payment amount" rules={[{ required: true, message: "Enter payment amount" }, { type: "number", min: 0.01, message: "Amount must be greater than zero" }]}>
                        <InputNumber size="large" min={0.01} precision={2} controls={false} prefix="৳" placeholder="0" style={{ width: "100%" }} />
                    </Form.Item>

                    {summary && paymentAmount > 0 &&
                        <div className={`supplier-transaction-projection ${balanceAfterType}`}>
                            <div className="supplier-transaction-equation">
                                <div>
                                    <span>Current balance</span>
                                    <strong>৳ {money(summary.current_balance)}</strong>
                                    <small>{summary.balance_type}</small>
                                </div>

                                <b>−</b>

                                <div>
                                    <span>This payment</span>
                                    <strong>৳ {money(paymentAmount)}</strong>
                                    <small>payment</small>
                                </div>

                                <b>=</b>

                                <div className="result">
                                    <span>Balance after payment</span>
                                    <strong>৳ {money(Math.abs(balanceAfterPayment))}</strong>
                                    <Tag bordered={false} color={balanceAfterType === "receivable" ? "green" : balanceAfterType === "payable" ? "orange" : "default"}>
                                        {balanceAfterType}
                                    </Tag>
                                </div>
                            </div>

                            <p>
                                {balanceAfterType === "payable" && "This amount will remain payable to the supplier."}
                                {balanceAfterType === "receivable" && "The extra payment will become receivable from the supplier."}
                                {balanceAfterType === "settled" && "The supplier balance will be fully settled."}
                            </p>
                        </div>
                    }

                    <Form.Item name="account_id" label="Payment account" rules={[{ required: true, message: "Select a payment account" }]}>
                        <Select size="large" showSearch optionFilterProp="label" prefix={<BankOutlined />} placeholder="Select cash, bank or mobile account" options={accounts.map((account) => ({ value: account.id, label: `${account.code} — ${account.name} · ৳${money(account.current_balance)}` }))} />
                    </Form.Item>

                    <Form.Item name="payment_date" label="Payment date" rules={[{ required: true, message: "Select payment date" }]}>
                        <DatePicker size="large" showTime format="DD MMM YYYY, hh:mm A" style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item name="transaction_reference" label="Transaction reference">
                        <Input size="large" maxLength={255} placeholder="Cheque, bank or MFS reference" />
                    </Form.Item>

                    <Form.Item name="note" label="Note">
                        <Input.TextArea rows={3} maxLength={5000} placeholder="Optional payment note" />
                    </Form.Item>

                    <div className="supplier-transaction-actions">
                        <Button onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        
                        <Button type="primary" htmlType="submit" loading={saving}>
                            Record payment
                        </Button>
                    </div>
                </Form>
            }
        </Modal>
    );
}
