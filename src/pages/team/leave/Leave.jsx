import {ArrowLeftOutlined,CheckCircleOutlined,CloseCircleOutlined,DeleteOutlined,EditOutlined,EyeOutlined,FileTextOutlined,PlusOutlined,ReloadOutlined,TeamOutlined} from "@ant-design/icons";
import {Avatar,Breadcrumb,Button,Card,Col,DatePicker,Descriptions,Empty,Form,Input,InputNumber,message,Modal,Popconfirm,Row,Select,Space,Statistic,Switch,Table,Tabs,Tag,Tooltip,Typography} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {deleteData,getDatas,postData,putData} from "../../../api/common/common";
import { usePermission } from "../../../hooks/usePermission";
import useTitle from "../../../hooks/useTitle";
import "./Leave.css";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { TextArea } = Input;
const activeStatuses = [
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "inactive", label: "Inactive" },
];

const requestStatuses = ["pending", "approved", "rejected", "cancelled"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

const colors = {
    pending  : "gold",
    approved : "green",
    rejected : "red",
    cancelled: "default",
    active   : "green",
    draft    : "gold",
    inactive : "default",
};

const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.[0]?.[0] || response?.msg || response?.message || fallback;

const days = (value) => `${Number(value || 0)} day${Number(value) === 1 ? "" : "s"}`;

export default function Leave() {
    useTitle("Leave Management");

    const { can }                     = usePermission();
    const [messageApi, contextHolder] = message.useMessage();
    const [form]                      = Form.useForm();
    const [tab, setTab]               = useState("requests");
    const [items, setItems]           = useState([]);
    const [types, setTypes]           = useState([]);
    const [options, setOptions]       = useState({departments: [],designations: [],employmentTypes: []});
    const [loading, setLoading]       = useState(false);
    const [saving, setSaving]         = useState(false);
    const [status, setStatus]         = useState();
    const [typeId, setTypeId]         = useState();
    const [range, setRange]           = useState();
    const [pagination, setPagination] = useState({current: 1,pageSize: 10,total: 0});
    const [stats, setStats]           = useState({total: 0,pending: 0,approved: 0,rejected: 0});
    const [modal, setModal]           = useState(false);
    const [editing, setEditing]       = useState(null);
    const [details, setDetails]       = useState(null);
    const [decision, setDecision]     = useState(null);
    const [comment, setComment]       = useState("");

    const rights = useMemo(
        () => ({
            requestRead : can("leave-requests-read"),
            approve     : can("leave-approvals-update"),
            typeRead    : can("leave-types-read"),
            typeCreate  : can("leave-types-create"),
            typeUpdate  : can("leave-types-update"),
            typeDelete  : can("leave-types-delete"),
            policyRead  : can("leave-policies-read"),
            policyCreate: can("leave-policies-create"),
            policyUpdate: can("leave-policies-update"),
            policyDelete: can("leave-policies-delete"),
        }),
        [can],
    );

    const tabs = useMemo(
        () =>
        [
            rights.requestRead && { key: "requests", label: "Leave Requests" },
            rights.typeRead && { key: "types", label: "Leave Types" },
            rights.policyRead && { key: "policies", label: "Leave Policies" },
        ].filter(Boolean),
        [rights],
    );

    const endpoint = tab === "requests" ? "/admin/leave-requests" : tab === "types" ? "/admin/leave-types" : "/admin/leave-policies";
    
    const selectedDepartment = Form.useWatch("department_id", form);

    const loadOptions = useCallback(async () => {
        const needsPolicyLookups = rights.policyCreate || rights.policyUpdate;
        const [typeResponse,departmentResponse,designationResponse,employmentResponse] = await Promise.all([
            getDatas("/admin/leave-types", { paginate_size: 100, status: "active" }),

            needsPolicyLookups ? getDatas("/admin/departments", {paginate_size: 100,status: "active"}) : Promise.resolve(null),

            needsPolicyLookups ? getDatas("/admin/designations", {paginate_size: 100, status: "active"}) : Promise.resolve(null),

            needsPolicyLookups ? getDatas("/admin/employment-types", {paginate_size: 100, status: "active"}) : Promise.resolve(null),
        ]);

        setTypes(typeResponse?.result?.data || []);

        setOptions({
            departments    : departmentResponse?.result?.data || [],
            designations   : designationResponse?.result?.data || [],
            employmentTypes: employmentResponse?.result?.data || [],
        });
    }, [rights.policyCreate, rights.policyUpdate]);

    const loadStats = useCallback(async () => {
        if (!rights.requestRead) return;
        const responses = await Promise.all([
            getDatas("/admin/leave-requests", { paginate_size: 1 }),
            ...["pending", "approved", "rejected"].map((item) =>
                getDatas("/admin/leave-requests", { paginate_size: 1, status: item }),
            ),
        ]);
        setStats({
            total   : responses[0]?.result?.total || 0,
            pending : responses[1]?.result?.total || 0,
            approved: responses[2]?.result?.total || 0,
            rejected: responses[3]?.result?.total || 0,
        });
    }, [rights.requestRead]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const params = {
            page: pagination.current,
            paginate_size: pagination.pageSize,
            ...(status && { status }),
        };

        if (tab === "requests") {
            if (typeId) params.leave_type_id = typeId;
            if (range?.length) {
                params.start_date = range[0].format("YYYY-MM-DD");
                params.end_date = range[1].format("YYYY-MM-DD");
            }
        }
        const response = await getDatas(endpoint, params);

        setLoading(false);

        if (!response?.success) {
            setItems([]);
            return messageApi.error(
                errorMessage(response, "Unable to load leave data"),
            );
        }

        setItems(response?.result?.data || []);
        setPagination((current) => ({
            ...current,
            current : response?.result?.current_page || current.current,
            pageSize: Number(response?.result?.per_page || current.pageSize),
            total   : response?.result?.total || 0,
        }));
    }, [endpoint,messageApi,pagination.current,pagination.pageSize,range,status,tab,typeId]);

    useEffect(() => {
        loadOptions();
    }, [loadOptions]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);
    
    useEffect(() => {
        if (tabs.length && !tabs.some((item) => item.key === tab))
        setTab(tabs[0].key);
    }, [tab, tabs]);

    const changeTab = (key) => {
        setTab(key);
        setStatus(undefined);
        setTypeId(undefined);
        setRange(undefined);
        setPagination({ current: 1, pageSize: 10, total: 0 });
    };

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        form.setFieldsValue(
        tab === "types"
            ? {
                is_paid            : true,
                requires_attachment: false,
                allow_half_day     : true,
                min_notice_days    : 0,
                status             : "active",
            }
            : {
                annual_entitlement    : 0,
                carry_forward_allowed : false,
                max_carry_forward_days: 0,
                probation_allowed     : false,
                status                : "active",
            },
        );
        setModal(true);
    };

    const openEdit = (record) => {
        setEditing(record);
        form.resetFields();
        form.setFieldsValue(
        tab === "types" ? record : {
                ...record,
                effective_range: [
                    dayjs(record.effective_from),
                    record.effective_to ? dayjs(record.effective_to) : null,
                ],
            },
        );
        setModal(true);
    };

    const save = async () => {
        const values = await form.validateFields();
        const payload =
        tab === "types"
        ? {
            ...values,
            code: values.code.trim().toUpperCase(),
            name: values.name.trim(),
        }
        : {
            ...values,
            name: values.name.trim(),
            effective_from: values.effective_range[0].format("YYYY-MM-DD"),
            effective_to:
            values.effective_range[1]?.format("YYYY-MM-DD") || null,
        };

        delete payload.effective_range;

        setSaving(true);

        const response = editing ? await putData(`${endpoint}/${editing.id}`, payload) : await postData(endpoint, payload);

        setSaving(false);

        if (!response?.success)

        return messageApi.error(errorMessage(response, "Unable to save"));

        messageApi.success(response.msg);

        setModal(false);

        setEditing(null);

        await Promise.all([fetchItems(), loadOptions()]);
    };

    const remove = async (id) => {
        const response = await deleteData(`${endpoint}/${id}`);
        if (!response?.success)
        return messageApi.error(errorMessage(response, "Unable to delete"));
        messageApi.success(response.msg);
        await Promise.all([fetchItems(), loadOptions()]);
    };

    const decide = async () => {
        setSaving(true);
        const response = await putData(`/admin/leave-requests/${decision.record.id}/${decision.action}`, { comment: comment || null });

        setSaving(false);

        if (!response?.success)

        return messageApi.error(errorMessage(response, "Unable to update request"),);

        messageApi.success(response.msg);

        setDecision(null);

        setComment("");

        setDetails(null);

        await Promise.all([fetchItems(), loadStats()]);
    };

    const requestColumns = [
        {
            title: "Employee",
            width: 220,
            render: (_, row) => (
                <Space>
                    <Avatar icon={<TeamOutlined />} />
                    <div>
                        <Text strong>{row.employee_profile?.user?.username || "—"}</Text>
                        <div>
                            <Text type="secondary">
                                {row.employee_profile?.employee_code ||
                                row.employee_profile?.user?.phone_number}
                            </Text>
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Leave",
            width: 170,
            render: (_, row) => (
                <>
                    <Text strong>{row.leave_type?.name}</Text>
                    <div>
                        <Text type="secondary">{days(row.requested_days)}</Text>
                    </div>
                </>
            ),
        },
        {
            title: "Period",
            width: 215,
            render: (_, row) => (
                <>
                    <Text>
                        {dayjs(row.start_date).format("DD MMM YYYY")} —{" "}
                        {dayjs(row.end_date).format("DD MMM YYYY")}
                    </Text>
                    <div>
                        <Text type="secondary" className="leave-capitalize">
                        {row.start_day_type?.replaceAll("_", " ")}
                        </Text>
                    </div>
                </>
            ),
        },
        {
            title: "Department",
            width: 150,
            render: (_, row) => row.employee_profile?.department?.name || "—",
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 110,
            render: (value) => (
                <Tag color={colors[value]} className="leave-capitalize">
                {value}
                </Tag>
            ),
        },
        {
            title: "Action",
            width: 140,
            fixed: "right",
            render: (_, row) => (
                <Space>
                    <Tooltip title="Details">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => setDetails(row)}/>
                    </Tooltip>

                    {rights.approve && row.status === "pending" && (
                        <>
                            <Tooltip title="Approve">
                                <Button type="text" className="leave-approve" icon={<CheckCircleOutlined />} onClick={() => setDecision({ action: "approve", record: row })}/>
                            </Tooltip>

                            <Tooltip title="Reject">
                                <Button type="text" danger icon={<CloseCircleOutlined />} onClick={() => setDecision({ action: "reject", record: row })}/>
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const actions = (row, update, destroy) => (
        <Space>
            {update && (
                <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(row)}/>
            )}

            {destroy && (
                <Popconfirm title="Delete this item?" onConfirm={() => remove(row.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            )}
        </Space>
    );

    const typeColumns = [
        {
            title: "Leave Type",
            width: 220,
            render: (_, row) => (
                <Space>
                    <Avatar shape="square" className="leave-type-icon" icon={<FileTextOutlined />}/>
                    <div>
                        <Text strong>{row.name}</Text>
                        <div>
                            <Text type="secondary">{row.code}</Text>
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Payment",
            width: 110,
            render: (_, row) => (
                <Tag color={row.is_paid ? "green" : "orange"}>
                    {row.is_paid ? "Paid" : "Unpaid"}
                </Tag>
            ),
        },
        {
            title: "Rules",
            render: (_, row) => (
                <Space wrap>
                    <Tag>
                        {row.allow_half_day ? "Half-day allowed" : "Full day only"}
                    </Tag>

                    {row.requires_attachment && (
                        <Tag color="purple">Attachment required</Tag>
                    )}

                    <Tag>
                        {row.min_notice_days || 0} day notice
                    </Tag>
                    {row.max_consecutive_days && (
                        <Tag>
                            Max {row.max_consecutive_days} days
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 100,
            render: (value) => <Tag style={{textTransform: "capitalize"}} color={colors[value]}>{value}</Tag>,
        },
        {
            title: "Action",
            width: 100,
            render: (_, row) => actions(row, rights.typeUpdate, rights.typeDelete),
        },
    ];

    const policyColumns = [
        {
            title: "Policy",
            width: 220,
            render: (_, row) => (
                <>
                    <Text strong>{row.name}</Text>
                    <div>
                        <Text type="secondary">{row.leave_type?.name}</Text>
                    </div>
                </>
            ),
        },
        {
            title: "Entitlement",
            width: 120,
            render: (_, row) => <Text strong>{days(row.annual_entitlement)}</Text>,
        },
        {
            title: "Applies To",
            width: 250,
            render: (_, row) => (
                <Space wrap>
                    {row.department && <Tag>{row.department.name}</Tag>}
                    {row.designation && <Tag>{row.designation.name}</Tag>}
                    {row.employment_type && <Tag>{row.employment_type.name}</Tag>}
                    {row.gender && <Tag>{row.gender}</Tag>}
                    {!row.department && !row.designation && !row.employment_type && !row.gender && <Tag color="blue">All employees</Tag>}
                </Space>
            ),
        },
        {
            title: "Effective",
            width: 210,
            render: (_, row) => `${dayjs(row.effective_from).format("DD MMM YYYY")} — ${row.effective_to ? dayjs(row.effective_to).format("DD MMM YYYY") : "Ongoing"}`,
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 100,
            render: (value) => <Tag style={{textTransform: "capitalize"}} color={colors[value]}>{value}</Tag>,
        },
        {
            title: "Action",
            width: 100,
            render: (_, row) => actions(row, rights.policyUpdate, rights.policyDelete),
        },
    ];

    const canCreate = tab === "types" ? rights.typeCreate : tab === "policies" ? rights.policyCreate : false;

    const designationOptions = options.designations.filter((item) => !selectedDepartment || Number(item.department_id) === Number(selectedDepartment),).map((item) => ({ value: item.id, label: item.name }));

    return (
        <div className="leave-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Leave Management</h1>
                </div>

                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "HRM" },
                            { title: "Leave Management" },
                        ]}
                    />
                </div>
            </div>

            {tab === "requests" && (
                <Row gutter={[14, 14]} className="leave-stats">
                    {[
                        ["Total Requests", stats.total],
                        ["Pending Review", stats.pending],
                        ["Approved", stats.approved],
                        ["Rejected", stats.rejected],
                    ].map(([label, value], index) => (
                        <Col xs={24} sm={12} xl={6} key={label}>
                            <Card className={`leave-stat leave-stat--${index}`}>
                                <Statistic title={label} value={value} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Card className="leave-main">
                <Tabs activeKey={tab} items={tabs} onChange={changeTab} />
                <div className="leave-toolbar">
                    <Space wrap>
                        {tab === "requests" && (
                            <>
                                <Select
                                allowClear
                                placeholder="All leave types"
                                value={typeId}
                                onChange={setTypeId}
                                style={{ width: 190 }}
                                options={types.map((item) => ({
                                    value: item.id,
                                    label: item.name,
                                }))}
                                />
                                <RangePicker value={range} onChange={setRange} />
                            </>
                        )}

                        <Select
                        allowClear
                        placeholder="All statuses"
                        value={status}
                        onChange={setStatus}
                        style={{ width: 145 }}
                        options={tab === "requests" ? requestStatuses : activeStatuses}
                        />

                        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => Promise.all([fetchItems(), loadStats()])}/>
                    </Space>

                    <Space>
                        {canCreate && (
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                                Add {tab === "types" ? "Leave Type" : "Policy"}
                            </Button>
                        )}

                        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                            Back
                        </Button>
                    </Space>
                </div>

                <Table
                rowKey="id"
                bordered
                loading={loading}
                dataSource={items}
                columns={tab === "requests" ? requestColumns : tab === "types" ? typeColumns : policyColumns}
                scroll={{ x: 1050 }}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: (total, currentRange) =>
                    `${currentRange[0]}-${currentRange[1]} of ${total}`,
                    onChange: (current, pageSize) =>
                    setPagination((previous) => ({ ...previous, current, pageSize })),
                }}
                locale={{ emptyText: <Empty /> }}
                />
            </Card>

            <Modal
                destroyOnHidden
                open={modal}
                title={`${editing ? "Edit" : "Create"} ${tab === "types" ? "Leave Type" : "Leave Policy"}`}
                width={820}
                confirmLoading={saving}
                onOk={save}
                onCancel={() => setModal(false)}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 18 }}>
                {tab === "types" ? (
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="code" label="Code" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>

                        <Col span={16}>
                            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item name="description" label="Description">
                                <TextArea rows={3} />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item name="is_paid" label="Paid" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item name="requires_attachment" label="Attachment" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item name="allow_half_day" label="Half-day" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item name="status" label="Status">
                                <Select options={activeStatuses} />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="min_notice_days" label="Minimum Notice">
                                <InputNumber min={0} addonAfter="days" style={{ width: "100%" }}/>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="max_consecutive_days" label="Maximum Consecutive">
                                <InputNumber min={1} addonAfter="days" style={{ width: "100%" }}/>
                            </Form.Item>
                        </Col>
                    </Row>
                ) : (
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Policy Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="leave_type_id" label="Leave Type" rules={[{ required: true }]}>
                                <Select options={types.map((item) => ({value: item.id,label: item.name}))}/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="employment_type_id" label="Employment Type">
                            <Select allowClear
                                options={options.employmentTypes.map((item) => ({
                                    value: item.id,
                                    label: item.name,
                                }))}
                            />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="department_id" label="Department">
                                <Select allowClear onChange={() => form.setFieldValue("designation_id", undefined)}
                                    options={options.departments.map((item) => ({
                                        value: item.id,
                                        label: item.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="designation_id" label="Designation">
                                <Select allowClear options={designationOptions} />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="annual_entitlement" label="Annual Entitlement" rules={[{ required: true }]}>
                                <InputNumber min={0} step={0.5} addonAfter="days" style={{ width: "100%" }}/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="gender" label="Gender">
                                <Select
                                    allowClear
                                    options={[
                                        { value: "male", label: "Male" },
                                        { value: "female", label: "Female" },
                                        { value: "other", label: "Other" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="status" label="Status">
                                <Select options={activeStatuses} />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item name="effective_range" label="Effective Period" rules={[{ required: true }]}>
                                <RangePicker allowEmpty={[false, true]} style={{ width: "100%" }}/>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="carry_forward_allowed" label="Carry Forward" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="max_carry_forward_days" label="Maximum Carry">
                                <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item name="probation_allowed" label="During Probation" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>
                )}
                </Form>
            </Modal>

            <Modal
                open={Boolean(details)}
                title="Leave Request Details"
                footer={<Button onClick={() => setDetails(null)}>Close</Button>}
                onCancel={() => setDetails(null)}
                width={760}
            >
                {details && (
                <>
                    <div className="leave-person">
                        <Avatar size={52} icon={<TeamOutlined />} />
                        <div>
                            <Title level={4}>
                                {details.employee_profile?.user?.username}
                            </Title>
                            
                            <Text>
                                {details.employee_profile?.designation?.name || "Employee"}
                            </Text>

                        </div>
                        <Tag color={colors[details.status]}>
                            {details.status}
                        </Tag>
                    </div>

                    <Descriptions
                    bordered
                    column={2}
                    items={[
                        {
                            key     : 1,
                            label   : "Leave Type",
                            children: details.leave_type?.name,
                        },
                        {
                            key     : 2,
                            label   : "Days",
                            children: days(details.requested_days),
                        },
                        {
                            key     : 3,
                            label   : "Start",
                            children: dayjs(details.start_date).format("DD MMM YYYY"),
                        },
                        {
                            key     : 4,
                            label   : "End",
                            children: dayjs(details.end_date).format("DD MMM YYYY"),
                        },
                        { 
                            key     : 5,
                            label   : "Reason",
                            span    : 2,
                            children: details.reason
                        },
                        {
                            key     : 6,
                            label   : "Handover",
                            span    : 2,
                            children: details.handover_note || "—",
                        },
                        {
                            key     : 7,
                            label   : "Rejection",
                            span    : 2,
                            children: details.rejection_reason || "—",
                        },
                    ]}
                    />
                    {rights.approve && details.status === "pending" && (
                        <Space className="leave-detail-actions">
                            <Button type="primary" onClick={() => setDecision({ action: "approve", record: details })}>
                                Approve
                            </Button>

                            <Button danger onClick={() => setDecision({ action: "reject", record: details })}>
                                Reject
                            </Button>
                        </Space>
                    )}
                </>
                )}
            </Modal>

            <Modal open={Boolean(decision)} title={`${decision?.action === "approve" ? "Approve" : "Reject"} Leave`} okText={decision?.action === "approve" ? "Approve" : "Reject"}
                okButtonProps={{ danger: decision?.action === "reject" }} confirmLoading={saving} onOk={decide} onCancel={() => setDecision(null)}
            >
                <Text>
                    Confirm {decision?.action} for{" "}
                    <strong>
                        {decision?.record?.employee_profile?.user?.username}
                    </strong>?
                </Text>

                <TextArea
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Comment or rejection reason"
                style={{ marginTop: 16 }}
                />
            </Modal>
        </div>
    );
}
