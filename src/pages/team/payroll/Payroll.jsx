import {CheckOutlined,DeleteOutlined,EditOutlined,PlusOutlined,ReloadOutlined,StopOutlined} from "@ant-design/icons";
import {Button,Card,Col,DatePicker,Form,Input,InputNumber,Modal,Popconfirm,Row,Select,Space,Table,Tabs,Tag,message} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { deleteData, getDatas, postData, putData } from "../../../api/common/common";
import { usePermission } from "../../../hooks/usePermission";
import useTitle from "../../../hooks/useTitle";
import "./Payroll.css";
import PayrollRuns from "./PayrollRuns";

const statusColor = {
    approved: "green",
    pending : "gold",
    rejected: "red",
    active  : "green",
    inactive: "default",
};

export default function Payroll() {
    useTitle("Payroll & Incentives");
    const { can }                     = usePermission();
    const [messageApi, contextHolder] = message.useMessage();
    const [form]                      = Form.useForm();
    const [activeTab, setActiveTab]   = useState("payroll");
    const [loading, setLoading]       = useState(false);
    const [rows, setRows]             = useState([]);
    const [employees, setEmployees]   = useState([]);
    const [modalOpen, setModalOpen]   = useState(false);
    const [editing, setEditing]       = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const loadEmployees = useCallback(async () => {
        const response = await getDatas("/admin/employee-profiles", { paginate_size: 1000 });
        setEmployees(response?.result?.data || []);
    }, []);

    const loadRows = useCallback(async () => {
        if (activeTab === "payroll") return;
        setLoading(true);
        const endpoint = activeTab === "rules" ? "/admin/incentives/rules" : activeTab === "commissions" ? "/admin/incentives/commissions" : "/admin/incentives/packaging";
        const response = await getDatas(endpoint, { paginate_size: 100 });
        setRows(response?.result?.data || []);
        if (!response?.success) messageApi.error(response?.message || "Unable to load data.");
        setLoading(false);
    }, [activeTab, messageApi]);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);
    useEffect(() => {
        loadRows();
    }, [loadRows]);

    const openRule = (record = null) => {
        setEditing(record);
        form.setFieldsValue(
            record
                ? {
                        ...record,
                        effective_from: record.effective_from ? dayjs(record.effective_from) : null,
                        effective_to: record.effective_to ? dayjs(record.effective_to) : null,
                    }
                : {
                        earning_type: "sales_commission",
                        scope: "global",
                        calculation_type: "percentage",
                        status: "active",
                        effective_from: dayjs(),
                  },
        );
        setModalOpen(true);
    };

    const saveRule = async (values) => {
        setSubmitting(true);
        const payload = {
            ...values,
            employee_profile_id: values.scope === "employee" ? values.employee_profile_id : null,
            effective_from: values.effective_from.format("YYYY-MM-DD"),
            effective_to: values.effective_to?.format("YYYY-MM-DD") || null,
        };
        const response = editing
            ? await putData(`/admin/incentives/rules/${editing.id}`, payload)
            : await postData("/admin/incentives/rules", payload);
        setSubmitting(false);
        if (!response?.success)
            return messageApi.error(response?.message || "Unable to save rule.");
        messageApi.success(response.msg);
        setModalOpen(false);
        loadRows();
    };

    const removeRule = async (id) => {
        const response = await deleteData(`/admin/incentives/rules/${id}`);
        if (response?.success) {
            messageApi.success(response.msg);
            loadRows();
        } else messageApi.error(response?.message || "Unable to delete rule.");
    };

    const decide = async (type, id, decision) => {
        const response = await putData(`/admin/incentives/${type}/${id}/decision`, { decision });
        if (response?.success) {
            messageApi.success(response.msg);
            loadRows();
        } else messageApi.error(response?.message || "Unable to update entry.");
    };

    const ruleColumns = [
        {
            title: "Rule",
            dataIndex: "name",
            render: (value, record) => (
                <>
                    <strong>{value}</strong>
                    <div className="payroll-muted">
                        {record.earning_type === "sales_commission"
                            ? "Sales commission"
                            : "Packaging incentive"}
                    </div>
                </>
            ),
        },
        {
            title: "Scope",
            dataIndex: "scope",
            render: (value, record) => (
                <Tag color={value === "global" ? "blue" : "purple"}>
                    {value === "global"
                        ? "All employees"
                        : record.employee_profile?.user?.username || "Employee"}
                </Tag>
            ),
        },
        {
            title: "Calculation",
            render: (_, record) => (
                <span>
                    {record.calculation_type.replace("_", " ")} ·{" "}
                    {record.calculation_type === "percentage"
                        ? `${record.rate}%`
                        : `৳${record.rate}`}
                </span>
            ),
        },
        {
            title: "Effective",
            render: (_, record) => (
                <span>
                    {record.effective_from?.slice(0, 10)} →{" "}
                    {record.effective_to?.slice(0, 10) || "Ongoing"}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (value) => <Tag color={statusColor[value]}>{value}</Tag>,
        },
        {
            title: "Action",
            width: 120,
            render: (_, record) => (
                <Space>
                    {can("incentive-rules-update") && (
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openRule(record)}
                        />
                    )}
                    {can("incentive-rules-delete") && (
                        <Popconfirm
                            title="Delete this rule?"
                            onConfirm={() => removeRule(record.id)}
                        >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const earningColumns = [
        {
            title: "Employee",
            render: (_, record) => (
                <>
                    <strong>{record.employee_profile?.user?.username || "—"}</strong>
                    <div className="payroll-muted">{record.employee_profile?.employee_code}</div>
                </>
            ),
        },
        {
            title: activeTab === "commissions" ? "Order" : "Work",
            render: (_, record) => (
                <>
                    {record.order?.invoice_number || "Manual entry"}
                    {activeTab === "packaging" && (
                        <div className="payroll-muted">Quantity: {record.quantity}</div>
                    )}
                </>
            ),
        },
        {
            title: "Rate",
            render: (_, record) =>
                record.calculation_type === "percentage" ? `${record.rate}%` : `৳${record.rate}`,
        },
        {
            title: "Amount",
            render: (_, record) => (
                <strong>
                    ৳
                    {Number(
                        record.commission_amount ?? record.incentive_amount ?? 0,
                    ).toLocaleString()}
                </strong>
            ),
        },
        {
            title: "Date",
            render: (_, record) => (record.earned_on || record.completed_on)?.slice(0, 10),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (value) => <Tag color={statusColor[value]}>{value}</Tag>,
        },
        {
            title: "Action",
            width: 150,
            render: (_, record) =>
                record.status === "pending" &&
                can(
                    activeTab === "commissions"
                        ? "sales-commissions-update"
                        : "packaging-work-update",
                ) ? (
                    <Space>
                        <Button
                            size="small"
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={() =>
                                decide(
                                    activeTab === "commissions" ? "commission" : "packaging",
                                    record.id,
                                    "approved",
                                )
                            }
                        >
                            Approve
                        </Button>
                        <Button
                            size="small"
                            danger
                            icon={<StopOutlined />}
                            onClick={() =>
                                decide(
                                    activeTab === "commissions" ? "commission" : "packaging",
                                    record.id,
                                    "rejected",
                                )
                            }
                        />
                    </Space>
                ) : (
                    "—"
                ),
        },
    ];

    return (
        <div className="payroll-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Payroll & Incentives</h1>
                    <p className="subtitle">
                        Manage global or employee-specific earning rules and approve generated work
                        entries.
                    </p>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={loadRows}>
                        Refresh
                    </Button>
                    {activeTab === "rules" && can("incentive-rules-create") && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openRule()}>
                            Add incentive rule
                        </Button>
                    )}
                </Space>
            </div>
            <Card bordered={false} className="payroll-card">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        { key: "payroll", label: "Payroll Runs" },
                        { key: "rules", label: "Incentive Rules" },
                        { key: "commissions", label: "Sales Commissions" },
                        { key: "packaging", label: "Packaging Work" },
                    ]}
                />
                {activeTab === "payroll" ? (
                    <PayrollRuns />
                ) : (
                    <Table
                        rowKey="id"
                        loading={loading}
                        dataSource={rows}
                        columns={activeTab === "rules" ? ruleColumns : earningColumns}
                        scroll={{ x: 900 }}
                        pagination={{ pageSize: 20 }}
                    />
                )}
            </Card>

            <Modal
                title={editing ? "Edit incentive rule" : "Add incentive rule"}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                destroyOnClose
                width={720}
            >
                <Form form={form} layout="vertical" onFinish={saveRule} preserve={false}>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="name" label="Rule name" rules={[{ required: true }]}>
                                <Input placeholder="e.g. Global sales commission" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="earning_type"
                                label="Earning type"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    options={[
                                        { value: "sales_commission", label: "Sales commission" },
                                        {
                                            value: "packaging_incentive",
                                            label: "Packaging incentive",
                                        },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="scope" label="Apply to" rules={[{ required: true }]}>
                                <Select
                                    options={[
                                        { value: "global", label: "All employees" },
                                        { value: "employee", label: "Individual employee" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prev, current) => prev.scope !== current.scope}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue("scope") === "employee" && (
                                    <Col span={24}>
                                        <Form.Item
                                            name="employee_profile_id"
                                            label="Employee"
                                            rules={[{ required: true }]}
                                        >
                                            <Select
                                                showSearch
                                                optionFilterProp="label"
                                                options={employees.map((employee) => ({
                                                    value: employee.id,
                                                    label: `${employee.user?.username || "Employee"} (${employee.employee_code || "—"})`,
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                )
                            }
                        </Form.Item>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="calculation_type"
                                label="Calculation type"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    options={[
                                        { value: "fixed", label: "Fixed amount" },
                                        { value: "percentage", label: "Percentage" },
                                        { value: "per_unit", label: "Per package / unit" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="rate" label="Rate" rules={[{ required: true }]}>
                                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="effective_from"
                                label="Effective from"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="effective_to" label="Effective to">
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                <Select
                                    options={[
                                        { value: "active", label: "Active" },
                                        { value: "inactive", label: "Inactive" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="payroll-modal-actions">
                        <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Save rule
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
