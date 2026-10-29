import {CheckOutlined,DollarOutlined,PlusOutlined,SendOutlined,StopOutlined} from "@ant-design/icons";
import {Button,Card,Col,DatePicker,Form,Input,InputNumber,Modal,Row,Select,Space,Table,Tag,message} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { getDatas, postData, putData } from "../../../../api/common/common";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import "./SalaryAdvance.css";

const colors = {
    pending            : "gold",
    approved           : "blue",
    rejected           : "red",
    disbursed          : "cyan",
    partially_recovered: "purple",
    recovered          : "green",
};
export default function SalaryAdvance() {
    useTitle("Salary Advances");
    const { can }                     = usePermission();
    const [messageApi, holder]        = message.useMessage();
    const [createForm]                = Form.useForm();
    const [actionForm]                = Form.useForm();
    const [rows, setRows]             = useState([]);
    const [employees, setEmployees]   = useState([]);
    const [loading, setLoading]       = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [action, setAction]         = useState(null);
    const [selected, setSelected]     = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        const [a, e] = await Promise.all([
            getDatas("/admin/salary-advances", { paginate_size: 100 }),
            getDatas("/admin/employee-profiles", { paginate_size: 1000 }),
        ]);
        setRows(a?.result?.data || []);
        setEmployees(e?.result?.data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const create = async (v) => {
        const r = await postData("/admin/salary-advances", {
            ...v,
            request_date: v.request_date.format("YYYY-MM-DD"),
        });
        if (!r?.success) return messageApi.error(r?.message || "Unable to create advance.");
        messageApi.success(r.msg);
        setCreateOpen(false);
        createForm.resetFields();
        load();
    };

    const openAction = (type, row) => {
        setAction(type);
        setSelected(row);
        actionForm.resetFields();
        if (type === "approve")
            actionForm.setFieldsValue({
                approved_amount: Number(row.requested_amount),
                recovery_method: "full",
                recovery_start_date: dayjs().add(1, "month").startOf("month"),
            });
        if (type === "disburse") actionForm.setFieldsValue({ payment_method: "bank_transfer" });
        if (type === "repay") actionForm.setFieldsValue({ payment_date: dayjs() });
    };

    const submitAction = async (v) => {
        let r;
        if (action === "approve")
            r = await putData(`/admin/salary-advances/${selected.id}/decision`, {
                ...v,
                decision: "approved",
                recovery_start_date: v.recovery_start_date.format("YYYY-MM-DD"),
            });
        else if (action === "reject")
            r = await putData(`/admin/salary-advances/${selected.id}/decision`, {
                decision: "rejected",
                rejection_reason: v.rejection_reason,
            });
        else if (action === "disburse")
            r = await putData(`/admin/salary-advances/${selected.id}/disburse`, v);
        else
            r = await postData(`/admin/salary-advances/${selected.id}/repayments`, {
                ...v,
                payment_date: v.payment_date.format("YYYY-MM-DD"),
            });
        if (!r?.success) return messageApi.error(r?.message || "Action failed.");
        messageApi.success(r.msg);
        setAction(null);
        setSelected(null);
        load();
    };

    const columns = 
    [
        {
            title: "Employee",
            render: (_, r) => (
                <>
                    <strong>{r.employee_profile?.user?.username || "—"}</strong>
                    <div className="advance-muted">{r.employee_profile?.employee_code}</div>
                </>
            ),
        },
        {
            title: "Advance",
            render: (_, r) => (
                <>
                    <strong>
                        {r.type === "employee_loan" ? "Employee Loan" : "Salary Advance"}
                    </strong>
                    <div className="advance-muted">
                        Requested: ৳{Number(r.requested_amount).toLocaleString()}
                    </div>
                </>
            ),
        },
        {
            title: "Approved",
            render: (_, r) =>
                r.approved_amount ? `৳${Number(r.approved_amount).toLocaleString()}` : "—",
        },
        {
            title: "Outstanding",
            render: (_, r) => (
                <strong>৳{Number(r.outstanding_amount || 0).toLocaleString()}</strong>
            ),
        },
        {
            title: "Recovery",
            render: (_, r) =>
                r.recovery_method === "fixed_installment"
                    ? `৳${Number(r.installment_amount).toLocaleString()} / payroll`
                    : "Full next payroll",
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (v) => <Tag color={colors[v]}>{String(v).replaceAll("_", " ")}</Tag>,
        },
        {
            title: "Action",
            width: 230,
            render: (_, r) => (
                <Space wrap>
                    {r.status === "pending" && can("salary-advances-update") && (
                        <>
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => openAction("approve", r)}
                            >
                                Approve
                            </Button>
                            <Button
                                size="small"
                                danger
                                icon={<StopOutlined />}
                                onClick={() => openAction("reject", r)}
                            />
                        </>
                    )}
                    {r.status === "approved" && can("salary-advances-update") && (
                        <Button
                            size="small"
                            icon={<SendOutlined />}
                            onClick={() => openAction("disburse", r)}
                        >
                            Disburse
                        </Button>
                    )}
                    {["disbursed", "partially_recovered"].includes(r.status) &&
                        can("salary-advances-update") && (
                            <Button
                                size="small"
                                icon={<DollarOutlined />}
                                onClick={() => openAction("repay", r)}
                            >
                                Repayment
                            </Button>
                        )}
                </Space>
            ),
        },
    ];

    return (
        <div className="advance-page">
            {holder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Salary Advances</h1>
                    <p className="subtitle">
                        Approve, disburse and recover employee advances through payroll.
                    </p>
                </div>
                {can("salary-advances-create") && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            createForm.setFieldsValue({
                                type: "salary_advance",
                                request_date: dayjs(),
                            });
                            setCreateOpen(true);
                        }}
                    >
                        New Advance
                    </Button>
                )}
            </div>

            <Card className="advance-card" bordered={false}>
                <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={rows}
                    columns={columns}
                    scroll={{ x: 1050 }}
                    pagination={{ pageSize: 20 }}
                />
            </Card>

            <Modal
                title="Create employee advance"
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                footer={null}
            >
                <Form form={createForm} layout="vertical" onFinish={create}>
                    <Form.Item
                        name="employee_profile_id"
                        label="Employee"
                        rules={[{ required: true }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            options={employees.map((e) => ({
                                value: e.id,
                                label: `${e.user?.username || "Employee"} (${e.employee_code || "—"})`,
                            }))}
                        />
                    </Form.Item>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                                <Select
                                    options={[
                                        { value: "salary_advance", label: "Salary Advance" },
                                        { value: "employee_loan", label: "Employee Loan" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="request_date"
                                label="Request date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        name="requested_amount"
                        label="Requested amount"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={1} precision={2} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <div className="advance-actions">
                        <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">
                            Create
                        </Button>
                    </div>
                </Form>
            </Modal>
            
            <Modal
                title={
                    action === "approve"
                        ? "Approve advance"
                        : action === "reject"
                          ? "Reject advance"
                          : action === "disburse"
                            ? "Mark as disbursed"
                            : "Record repayment"
                }
                open={Boolean(action)}
                onCancel={() => setAction(null)}
                footer={null}
            >
                <Form form={actionForm} layout="vertical" onFinish={submitAction}>
                    {action === "approve" && (
                        <>
                            <Form.Item
                                name="approved_amount"
                                label="Approved amount"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} precision={2} style={{ width: "100%" }} />
                            </Form.Item>
                            <Form.Item
                                name="recovery_method"
                                label="Recovery method"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    options={[
                                        {
                                            value: "full",
                                            label: "Full deduction from next payroll",
                                        },
                                        { value: "fixed_installment", label: "Fixed installment" },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item
                                noStyle
                                shouldUpdate={(p, c) => p.recovery_method !== c.recovery_method}
                            >
                                {({ getFieldValue }) =>
                                    getFieldValue("recovery_method") === "fixed_installment" && (
                                        <Form.Item
                                            name="installment_amount"
                                            label="Installment per payroll"
                                            rules={[{ required: true }]}
                                        >
                                            <InputNumber
                                                min={1}
                                                precision={2}
                                                style={{ width: "100%" }}
                                            />
                                        </Form.Item>
                                    )
                                }
                            </Form.Item>
                            <Form.Item
                                name="recovery_start_date"
                                label="Recovery starts"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </>
                    )}
                    {action === "reject" && (
                        <Form.Item
                            name="rejection_reason"
                            label="Rejection reason"
                            rules={[{ required: true }]}
                        >
                            <Input.TextArea rows={3} />
                        </Form.Item>
                    )}
                    {action === "disburse" && (
                        <>
                            <Form.Item
                                name="payment_method"
                                label="Payment method"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    options={[
                                        { value: "cash", label: "Cash" },
                                        { value: "bank_transfer", label: "Bank Transfer" },
                                        { value: "mobile_banking", label: "Mobile Banking" },
                                        { value: "cheque", label: "Cheque" },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item name="payment_reference" label="Reference">
                                <Input />
                            </Form.Item>
                        </>
                    )}
                    {action === "repay" && (
                        <>
                            <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                                <InputNumber
                                    min={1}
                                    max={Number(selected?.outstanding_amount || 0)}
                                    precision={2}
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="payment_date"
                                label="Payment date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                            <Form.Item name="reference" label="Reference">
                                <Input />
                            </Form.Item>
                            <Form.Item name="notes" label="Notes">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        </>
                    )}
                    <div className="advance-actions">
                        <Button onClick={() => setAction(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">
                            Confirm
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
