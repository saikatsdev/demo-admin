import {CheckOutlined,DollarOutlined,EyeOutlined,PlusOutlined,SyncOutlined} from "@ant-design/icons";
import {Button,DatePicker,Descriptions,Drawer,Form,Input,InputNumber,Modal,Select,Space,Table,Tag,message} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { getDatas, postData, putData } from "../../../../api/common/common";
import { usePermission } from "../../../../hooks/usePermission";

const colors = { draft: "default", approved: "blue", partially_paid: "gold", paid: "green" };

export default function PayrollRuns() {
    const { can }                             = usePermission();
    const [messageApi, holder]                = message.useMessage();
    const [periodForm]                        = Form.useForm();
    const [paymentForm]                       = Form.useForm();
    const [rows, setRows]                     = useState([]);
    const [loading, setLoading]               = useState(false);
    const [createOpen, setCreateOpen]         = useState(false);
    const [details, setDetails]               = useState(null);
    const [paymentPayroll, setPaymentPayroll] = useState(null);
    const [actionLoading, setActionLoading]   = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const response = await getDatas("/admin/payroll", { paginate_size: 100 });
        setRows(response?.result?.data || []);
        setLoading(false);
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const createPeriod = async (values) => {
        const response = await postData("/admin/payroll", {
            name: values.name,
            start_date: values.dates[0].format("YYYY-MM-DD"),
            end_date: values.dates[1].format("YYYY-MM-DD"),
            payment_date: values.payment_date?.format("YYYY-MM-DD") || null,
        });
        if (!response?.success)
            return messageApi.error(response?.message || "Unable to create period.");
        messageApi.success(response.msg);
        setCreateOpen(false);
        periodForm.resetFields();
        load();
    };

    const openDetails = async (id) => {
        setActionLoading(true);
        const r = await getDatas(`/admin/payroll/${id}`);
        setActionLoading(false);
        if (r?.success) setDetails(r.result);
        else messageApi.error(r?.message || "Unable to load payroll.");
    };

    const action = async (id, name) => {
        setActionLoading(true);
        const r =
            name === "generate"
                ? await postData(`/admin/payroll/${id}/generate`, {})
                : await putData(`/admin/payroll/${id}/approve`, {});
        setActionLoading(false);
        if (!r?.success) return messageApi.error(r?.message || "Payroll action failed.");
        messageApi.success(r.msg);
        setDetails(r.result);
        load();
    };

    const recordPayment = async (values) => {
        const r = await postData(`/admin/payroll/employee-payrolls/${paymentPayroll.id}/pay`, {
            ...values,
            payment_date: values.payment_date.format("YYYY-MM-DD"),
        });
        if (!r?.success) return messageApi.error(r?.message || "Payment failed.");
        messageApi.success(r.msg);
        setPaymentPayroll(null);
        paymentForm.resetFields();
        if (details) openDetails(details.id);
        load();
    };

    return (
        <>
            {holder}
            <div className="payroll-run-actions">
                {can("payroll-create") && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateOpen(true)}
                    >
                        Create payroll period
                    </Button>
                )}
            </div>
            <Table
                rowKey="id"
                loading={loading}
                dataSource={rows}
                pagination={{ pageSize: 20 }}
                columns={[
                    {
                        title: "Period",
                        render: (_, r) => (
                            <>
                                <strong>{r.name}</strong>
                                <div className="payroll-muted">
                                    {r.start_date?.slice(0, 10)} — {r.end_date?.slice(0, 10)}
                                </div>
                            </>
                        ),
                    },
                    { title: "Employees", dataIndex: "payrolls_count" },
                    {
                        title: "Payment date",
                        render: (_, r) => r.payment_date?.slice(0, 10) || "—",
                    },
                    {
                        title: "Status",
                        dataIndex: "status",
                        render: (v) => <Tag style={{textTransform:"capitalize"}} color={colors[v]}>{v}</Tag>,
                    },
                    {
                        title: "Action",
                        render: (_, r) => (
                            <Space>
                                <Button icon={<EyeOutlined />} onClick={() => openDetails(r.id)}>
                                    View
                                </Button>

                                {r.status === "draft" && can("payroll-update") && (
                                    <Button icon={<SyncOutlined />} loading={actionLoading} onClick={() => action(r.id, "generate")}>
                                        Generate
                                    </Button>
                                )}

                                {r.status === "draft" &&
                                    r.payrolls_count > 0 &&
                                    can("payroll-approvals-update") && (
                                        <Button type="primary" icon={<CheckOutlined />} onClick={() => action(r.id, "approve")}>
                                            Approve
                                        </Button>
                                    )}
                            </Space>
                        ),
                    },
                ]}
            />

            <Modal
                title="Create payroll period"
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                footer={null}
            >
                <Form form={periodForm} layout="vertical" onFinish={createPeriod}>
                    <Form.Item name="name" label="Period name" rules={[{ required: true }]}>
                        <Input placeholder="October 2026 Payroll" />
                    </Form.Item>
                    <Form.Item name="dates" label="Salary period" rules={[{ required: true }]}>
                        <DatePicker.RangePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="payment_date" label="Planned payment date">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <div className="payroll-modal-actions">
                        <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">
                            Create
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Drawer
                title={details?.name || "Payroll details"}
                width={1050}
                open={Boolean(details)}
                onClose={() => setDetails(null)}
                extra={
                    details?.status === "draft" && (
                        <Space>
                            {can("payroll-update") && (
                                <Button
                                    icon={<SyncOutlined />}
                                    onClick={() => action(details.id, "generate")}
                                >
                                    Recalculate
                                </Button>
                            )}
                            {details?.payrolls?.length > 0 && can("payroll-approvals-update") && (
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={() => action(details.id, "approve")}
                                >
                                    Approve payroll
                                </Button>
                            )}
                        </Space>
                    )
                }
            >
                {details && (
                    <>
                        <Descriptions
                            bordered
                            size="small"
                            column={3}
                            items={[
                                {
                                    key: "period",
                                    label: "Period",
                                    children: `${details.start_date?.slice(0, 10)} — ${details.end_date?.slice(0, 10)}`,
                                },
                                {
                                    key: "status",
                                    label: "Status",
                                    children: (
                                        <Tag color={colors[details.status]} style={{textTransform: "capitalize"}}>
                                            {details.status}
                                        </Tag>
                                    ),
                                },
                                {
                                    key: "employees",
                                    label: "Employees",
                                    children: details.payrolls?.length || 0,
                                },
                            ]}
                        />
                        <Table
                            className="payroll-detail-table"
                            rowKey="id"
                            dataSource={details.payrolls || []}
                            scroll={{ x: 950 }}
                            pagination={false}
                            expandable={{
                                expandedRowRender: (r) => (
                                    <Table
                                        size="small"
                                        pagination={false}
                                        rowKey="id"
                                        dataSource={r.items || []}
                                        columns={[
                                            { title: "Type", dataIndex: "type" },
                                            { title: "Item", dataIndex: "label" },
                                            {
                                                title: "Amount",
                                                render: (_, i) => `৳${Number(i.amount).toLocaleString()}`,
                                            },
                                        ]}
                                    />
                                ),
                            }}
                            columns={[
                                {
                                    title: "Employee",
                                    render: (_, r) => r.employee_profile?.user?.username || "—",
                                },
                                {
                                    title: "Basic",
                                    render: (_, r) => `৳${Number(r.basic_salary).toLocaleString()}`,
                                },
                                {
                                    title: "Gross",
                                    render: (_, r) => `৳${Number(r.gross_earnings).toLocaleString()}`,
                                },
                                {
                                    title: "Deduction",
                                    render: (_, r) => `৳${Number(r.total_deductions).toLocaleString()}`,
                                },
                                {
                                    title: "Net Salary",
                                    render: (_, r) => (<strong>৳{Number(r.net_salary).toLocaleString()}</strong>
                                    ),
                                },
                                {
                                    title: "Status",
                                    dataIndex: "status",
                                    render: (v) => <Tag style={{textTransform:"capitalize"}} color={colors[v]}>{v}</Tag>,
                                },
                                {
                                    title: "Payment",
                                    render: (_, r) =>
                                        ["approved", "partially_paid"].includes(r.status) &&
                                        can("payroll-payments-update") ? (
                                            <Button
                                                size="small"
                                                icon={<DollarOutlined />}
                                                onClick={() => {
                                                    setPaymentPayroll(r);
                                                    paymentForm.setFieldsValue({
                                                        amount:
                                                            Number(r.payable_amount) -
                                                            (r.payments || []).reduce(
                                                                (s, p) => s + Number(p.amount),
                                                                0,
                                                            ),
                                                        payment_date: dayjs(),
                                                        payment_method: "bank_transfer",
                                                    });
                                                }}
                                            >
                                                Pay
                                            </Button>
                                        ) : (
                                            "—"
                                        ),
                                },
                            ]}
                        />
                    </>
                )}
            </Drawer>

            <Modal
                title="Record salary payment"
                open={Boolean(paymentPayroll)}
                onCancel={() => setPaymentPayroll(null)}
                footer={null}
            >
                <Form form={paymentForm} layout="vertical" onFinish={recordPayment}>
                    <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                        <InputNumber min={0.01} precision={2} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="payment_date"
                        label="Payment date"
                        rules={[{ required: true }]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="payment_method"
                        label="Payment method"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={[
                                { value: "cash", label: "Cash" },
                                { value: "bank_transfer", label: "Bank transfer" },
                                { value: "mobile_banking", label: "Mobile banking" },
                                { value: "cheque", label: "Cheque" },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="reference" label="Reference">
                        <Input />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <div className="payroll-modal-actions">
                        <Button onClick={() => setPaymentPayroll(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">
                            Record payment
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
}
