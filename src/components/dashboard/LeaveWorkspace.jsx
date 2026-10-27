import {CalendarOutlined,CheckCircleOutlined,EyeOutlined,FileTextOutlined,HourglassOutlined,PlusOutlined,ReloadOutlined,StopOutlined,UploadOutlined} from "@ant-design/icons";
import {Alert,Button,Card,Col,DatePicker,Descriptions,Empty,Form,Input,message,Modal,Popconfirm,Row,Select,Space,Spin,Table,Tag,Typography,Upload} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDatas, postData, putData } from "../../api/common/common";
import "./css/LeaveWorkspace.css";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { TextArea }    = Input;

const dayTypes = [
    { 
        value: "full_day",
        label: "Full Day"
    },
    { 
        value: "first_half",
        label: "First Half"
    },
    { 
        value: "second_half",
        label: "Second Half"
    },
];

const statusColors = {
    pending  : "gold",
    approved : "green",
    rejected : "red",
    cancelled: "default",
};

const responseMessage = (response, fallback) => {
    const validationMessage = Object.values(response?.errors || {})?.[0]?.[0];

    return validationMessage || response?.message || response?.msg || fallback;
};

const displayDays = (value) => `${Number(value || 0)} day${Number(value) === 1 ? "" : "s"}`;

export default function LeaveWorkspace() {
    const [form]                              = Form.useForm();
    const [summary, setSummary]               = useState(null);
    const [types, setTypes]                   = useState([]);
    const [requests, setRequests]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [modalOpen, setModalOpen]           = useState(false);
    const [submitting, setSubmitting]         = useState(false);
    const [calculating, setCalculating]       = useState(false);
    const [calculation, setCalculation]       = useState(null);
    const [calculationError, setCalculationError] = useState("");
    const [submissionError, setSubmissionError]   = useState("");
    const [details, setDetails]               = useState(null);
    const [status, setStatus]                 = useState();
    const [pagination, setPagination]         = useState({current: 1,pageSize: 5,total: 0});

    const fetchSummary = useCallback(async () => {
        const response = await getDatas("/admin/employee-self/leaves/summary");
        if (response?.success) setSummary(response.result || null);
        else
        message.error(responseMessage(response, "Unable to load leave balance"));
    }, []);

    const fetchTypes = useCallback(async () => {
        const response = await getDatas("/admin/leave-types", {status: "active",paginate_size: 100});

        if (response?.success) setTypes(response?.result?.data || []);
    }, []);

    const fetchRequests = useCallback(async () => {
        setHistoryLoading(true);
        const response = await getDatas("/admin/employee-self/leaves", {
            page: pagination.current,
            paginate_size: pagination.pageSize,
            ...(status && { status }),
        });

        setHistoryLoading(false);

        if (!response?.success) {
            setRequests([]);
            return message.error(
                responseMessage(response, "Unable to load leave requests"),
            );
        }

        setRequests(response?.result?.data || []);
        setPagination((current) => ({
            ...current,
            current: response?.result?.current_page || current.current,
            pageSize: Number(response?.result?.per_page || current.pageSize),
            total: response?.result?.total || 0,
        }));
    }, [pagination.current, pagination.pageSize, status]);

    const loadWorkspace = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchSummary(), fetchTypes()]);
        setLoading(false);
    }, [fetchSummary, fetchTypes]);

    useEffect(() => {
        loadWorkspace();
    }, [loadWorkspace]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const balances = summary?.balances || [];
    const selectedTypeId = Form.useWatch("leave_type_id", form);
    const selectedType = types.find(
        (item) => Number(item.id) === Number(selectedTypeId),
    );

    const selectedBalance = balances.find((item) => Number(item.leave_type?.id) === Number(selectedTypeId));

    const balanceAfter = calculation ? Number(calculation.available_balance || 0) - Number(calculation.requested_days || 0) : null;

    const openApply = () => {
        form.resetFields();
        form.setFieldsValue({
            start_day_type: "full_day",
            end_day_type  : "full_day",
            attachment    : [],
        });

        setCalculation(null);
        setCalculationError("");
        setSubmissionError("");
        setModalOpen(true);
    };

    const calculateLeave = async () => {
        setCalculationError("");
        setSubmissionError("");
        const values = await form.validateFields(["leave_type_id","date_range","start_day_type","end_day_type"]);

        setCalculating(true);

        const response = await postData("/admin/employee-self/leaves/calculate", {
            leave_type_id : values.leave_type_id,
            start_date    : values.date_range[0].format("YYYY-MM-DD"),
            end_date      : values.date_range[1].format("YYYY-MM-DD"),
            start_day_type: values.start_day_type,
            end_day_type  : values.end_day_type,
        });

        setCalculating(false);

        if (!response?.success) {
            setCalculation(null);
            const error = responseMessage(response, "Unable to calculate leave days");
            setCalculationError(error);
            return message.error(error);
        }

        setCalculation(response.result);
    };

    const submitLeave = async () => {
        const values = await form.validateFields();
        if (!calculation)
        return message.warning("Calculate the requested working days before submitting");

        if (!calculation.has_sufficient_balance)
        return message.error("Insufficient paid leave balance");

        const data = new FormData();
        data.append("leave_type_id", values.leave_type_id);
        data.append("start_date", values.date_range[0].format("YYYY-MM-DD"));
        data.append("end_date", values.date_range[1].format("YYYY-MM-DD"));
        data.append("start_day_type", values.start_day_type);
        data.append("end_day_type", values.end_day_type);
        data.append("reason", values.reason.trim());
        data.append("emergency_contact", values.emergency_contact || "");
        data.append("handover_note", values.handover_note || "");
        if (values.attachment?.[0]?.originFileObj)
        data.append("attachment", values.attachment[0].originFileObj);

        setSubmitting(true);

        const response = await postData("/admin/employee-self/leaves", data);

        setSubmitting(false);

        if (!response?.success) {
            const error = responseMessage(response, "Unable to submit leave request");
            setSubmissionError(error);

            return message.error(error);
        }

        message.success(response.msg || "Leave request submitted successfully");

        setModalOpen(false);

        setCalculation(null);

        await Promise.all([fetchSummary(), fetchRequests()]);
    };

    const cancelRequest = async (id) => {
        const response = await putData(`/admin/employee-self/leaves/${id}/cancel`,{});

        if (!response?.success)

        return message.error(responseMessage(response, "Unable to cancel leave request"));
        message.success(response.msg || "Leave request cancelled");
        setDetails(null);
        await Promise.all([fetchSummary(), fetchRequests()]);
    };

    const metrics = useMemo(
        () => [
            {
                label: "Leave Types",
                value: balances.length,
                hint : `Balance year ${summary?.year || dayjs().year()}`,
                icon : <CalendarOutlined />,
                tone : "blue",
            },
            {
                label: "Available Leave",
                value: balances.reduce((sum, item) => sum + Math.max(0, Number(item.available_days || 0)),0),
                hint : "Across paid policies",
                icon : <CheckCircleOutlined />,
                tone : "green",
            },
            {
                label: "Pending Requests",
                value: Number(summary?.pending_requests || 0),
                hint: "Awaiting review",
                icon: <HourglassOutlined />,
                tone: "gold",
            },
            {
                label: "Approved This Year",
                value: Number(summary?.approved_this_year || 0),
                hint: "Used leave days",
                icon: <FileTextOutlined />,
                tone: "purple",
            },
        ],
        [balances, summary],
    );

    const columns = 
    [
        {
            title: "Leave Type",
            render: (_, row) => (
                <>
                    <Text strong>{row.leave_type?.name || "—"}</Text>
                    <div>
                        <Text type="secondary">{displayDays(row.requested_days)}</Text>
                    </div>
                </>
            ),
        },
        {
            title: "Period",
            render: (_, row) => (
                <>
                    <Text>
                        {dayjs(row.start_date).format("DD MMM")} —{" "}
                        {dayjs(row.end_date).format("DD MMM YYYY")}
                    </Text>
                    <div>
                        <Text type="secondary" className="leave-workspace-capitalize">
                        {row.start_day_type?.replaceAll("_", " ")}
                        </Text>
                    </div>
                </>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 105,
            render: (value) => (
                <Tag color={statusColors[value]} className="leave-workspace-capitalize">
                    {value}
                </Tag>
            ),
        },
        {
            title: "Submitted",
            dataIndex: "created_at",
            width: 120,
            render: (value) => dayjs(value).format("DD MMM YYYY"),
        },
        {
            title: "Action",
            width: 110,
            render: (_, row) => (
                <Space size={2}>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => setDetails(row)}/>
                    {row.status === "pending" && (
                        <Popconfirm title="Cancel this request?" onConfirm={() => cancelRequest(row.id)}>
                            <Button type="text" danger icon={<StopOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <section className="leave-workspace">
            <div className="leave-workspace__header">
                <div>
                    <span>Leave self-service</span>
                    <h2>Plan time away with confidence</h2>
                    <p>
                        Check balances, request leave, and follow every approval from one
                        place.
                    </p>
                </div>

                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => Promise.all([loadWorkspace(), fetchRequests()])}>
                        Refresh
                    </Button>

                    <Button type="primary" icon={<PlusOutlined />} onClick={openApply}>
                        Apply for Leave
                    </Button>
                </Space>
            </div>

            <Spin spinning={loading}>
                <div className="leave-workspace__metrics">
                    {metrics.map((item) => (
                        <article className={`leave-workspace-metric leave-workspace-metric--${item.tone}`} key={item.label}>
                            <span className="leave-workspace-metric__icon">{item.icon}</span>
                            <div>
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                                <small>{item.hint}</small>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="leave-balance-grid">
                {balances.map((balance) => {
                    const total = Number(balance.entitled_days || 0) + Number(balance.carried_days || 0) + Number(balance.adjustment_days || 0);

                    const available = Number(balance.available_days || 0);

                    const percentage = total > 0 ? Math.max(0, Math.min(100, (available / total) * 100)) : 0;

                    return (
                        <article className="leave-balance-card" key={balance.id}>
                            <div className="leave-balance-card__top">
                                <div>
                                    <strong>{balance.leave_type?.name}</strong>
                                    <span>{balance.leave_type?.code}</span>
                                </div>
                                <b>{available}</b>
                            </div>

                            <div className="leave-balance-card__bar">
                                <i style={{ width: `${percentage}%` }} />
                            </div>

                            <div className="leave-balance-card__footer">
                                <span>Entitled {Number(balance.entitled_days || 0)}</span>
                                <span>Used {Number(balance.used_days || 0)}</span>
                                <span>Pending {Number(balance.pending_days || 0)}</span>
                            </div>
                        </article>
                    );
                })}
                {!loading && !balances.length && (
                    <Empty description="No leave policy is assigned to your employee profile" />
                )}
                </div>
            </Spin>

            <Card
                className="leave-history-card"
                title="My Leave Requests"
                extra={
                <Select
                    allowClear
                    placeholder="All statuses"
                    value={status}
                    onChange={(value) => {
                        setStatus(value);
                        setPagination((current) => ({ ...current, current: 1 }));
                    }}
                    style={{ width: 145 }}
                    options={Object.keys(statusColors).map((value) => ({value,label: value[0].toUpperCase() + value.slice(1)}))}
                />
                }
            >
                <Table
                rowKey="id"
                loading={historyLoading}
                columns={columns}
                dataSource={requests}
                scroll={{ x: 760 }}
                pagination={{
                    ...pagination,
                    showSizeChanger: false,
                    onChange: (current, pageSize) =>
                    setPagination((previous) => ({ ...previous, current, pageSize })),
                }}
                locale={{ emptyText: <Empty description="No leave requests yet" /> }}
                />
            </Card>

            <Modal
                destroyOnHidden
                open={modalOpen}
                title="Apply for Leave"
                width={780}
                okText="Submit Request"
                confirmLoading={submitting}
                onOk={submitLeave}
                onCancel={() => !submitting && setModalOpen(false)}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 18 }}
                onValuesChange={(changed) => {
                    if (["leave_type_id","date_range","start_day_type","end_day_type"].some((key) => key in changed)) {
                        setCalculation(null);
                    }
                    setCalculationError("");
                    setSubmissionError("");
                }}
                >
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item name="leave_type_id" label="Leave Type" rules={[{ required: true }]}>
                            <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Select leave type"
                            onChange={(value) => {
                                const type = types.find((item) => Number(item.id) === Number(value),);
                                if (type && !type.allow_half_day)
                                form.setFieldsValue({start_day_type: "full_day",end_day_type: "full_day"});
                            }}
                            options={types.map((item) => ({value: item.id,label: item.name}))}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item name="date_range" label="Leave Period" rules={[{ required: true }]}>
                            <RangePicker format="DD MMM YYYY" style={{ width: "100%" }} disabledDate={(date) => date && date.isBefore(dayjs().startOf("day"))}/>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item name="start_day_type" label="Start Day" rules={[{ required: true }]}>
                            <Select options={dayTypes} disabled={selectedType && !selectedType.allow_half_day}/>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item name="end_day_type" label="End Day" rules={[{ required: true }]}>
                            <Select options={dayTypes} disabled={selectedType && !selectedType.allow_half_day}/>
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.Item name="reason" label="Reason" rules={[{ required: true, whitespace: true }]}>
                            <TextArea rows={3} maxLength={3000} showCount placeholder="Explain why you need this leave"/>
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item name="emergency_contact" label="Emergency Contact">
                            <Input placeholder="Phone number" maxLength={100} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="attachment"
                            label={selectedType?.requires_attachment ? "Supporting Document (required)" : "Supporting Document"} valuePropName="fileList"
                            getValueFromEvent={(event) => Array.isArray(event) ? event : event?.fileList}
                            rules={
                            selectedType?.requires_attachment
                                ? [
                                    {
                                    required: true,
                                    message: "Please attach a supporting document",
                                    },
                                ]
                                : []
                            }
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept=".jpg,.jpeg,.png,.webp">
                                <Button icon={<UploadOutlined />}>Choose image</Button>
                            </Upload>
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.Item name="handover_note" label="Work Handover Note">
                            <TextArea rows={2} maxLength={3000} placeholder="Who will handle your responsibilities?"/>
                        </Form.Item>
                    </Col>
                </Row>

                <div className="leave-calculation-row">
                    <Button icon={<CalendarOutlined />} loading={calculating} onClick={calculateLeave}>
                        Calculate Working Days
                    </Button>

                    {selectedBalance && (
                        <Text type="secondary">
                            Current available balance:{" "}
                            <strong>{selectedBalance.available_days}</strong>
                        </Text>
                    )}
                </div>

                {calculationError && (
                    <Alert
                        type="error"
                        showIcon
                        closable
                        message="Unable to calculate leave"
                        description={calculationError}
                        onClose={() => setCalculationError("")}
                        style={{ marginTop: 14 }}
                    />
                )}

                {submissionError && (
                    <Alert
                        type="error"
                        showIcon
                        closable
                        message="Leave request could not be submitted"
                        description={submissionError}
                        onClose={() => setSubmissionError("")}
                        style={{ marginTop: 14 }}
                    />
                )}

                {calculation && (
                    <div className={`leave-calculation ${calculation.has_sufficient_balance ? "is-valid" : "is-invalid"}`}>
                        <div>
                            <span>Requested</span>
                            <strong>{displayDays(calculation.requested_days)}</strong>
                        </div>
                        <div>
                            <span>Available</span>
                            <strong>
                                {calculation.leave_type?.is_paid ? displayDays(calculation.available_balance) : "No paid balance needed"}
                            </strong>
                        </div>

                        <div>
                            <span>After Request</span>
                            <strong>
                                {calculation.leave_type?.is_paid ? displayDays(balanceAfter) : "Not limited"}
                            </strong>
                        </div>

                        <Tag color={calculation.has_sufficient_balance ? "green" : "red"}>
                            {calculation.leave_type?.is_paid ? calculation.has_sufficient_balance ? "Balance available" : "Insufficient balance" : "Unpaid leave"}
                        </Tag>
                    </div>
                )}
                </Form>
            </Modal>

            <Modal
                open={Boolean(details)}
                title="Leave Request Details"
                footer={<Button onClick={() => setDetails(null)}>Close</Button>}
                onCancel={() => setDetails(null)}
                width={700}
            >
                {details && (
                <>
                    <div className="leave-request-hero">
                        <FileTextOutlined />
                        <div>
                            <Title level={4}>{details.leave_type?.name}</Title>
                            <Text>
                                {displayDays(details.requested_days)} ·{" "}
                                {dayjs(details.start_date).format("DD MMM")} —{" "}
                                {dayjs(details.end_date).format("DD MMM YYYY")}
                            </Text>
                        </div>
                        <Tag color={statusColors[details.status]}>{details.status}</Tag>
                    </div>

                    <Descriptions
                    bordered
                    size="small"
                    column={{ xs: 1, sm: 2 }}
                    items={[
                        {
                            key: 1,
                            label: "Start Day",
                            children: details.start_day_type?.replaceAll("_", " "),
                        },
                        {
                            key: 2,
                            label: "End Day",
                            children: details.end_day_type?.replaceAll("_", " "),
                        },
                        { 
                            key: 3, 
                            label: "Reason", 
                            span: 2, 
                            children: details.reason 
                        },
                        {
                            key: 4,
                            label: "Emergency Contact",
                            children: details.emergency_contact || "—",
                        },
                        {
                            key: 5,
                            label: "Submitted",
                            children: dayjs(details.created_at).format("DD MMM YYYY, hh:mm A"),
                        },
                        {
                            key: 6,
                            label: "Handover Note",
                            span: 2,
                            children: details.handover_note || "—",
                        },
                        {
                            key: 7,
                            label: "Rejection Reason",
                            span: 2,
                            children: details.rejection_reason || "—",
                        },
                    ]}
                    />

                    {details.attachment_url && (
                        <Button type="link" href={details.attachment_url} target="_blank" icon={<FileTextOutlined />}>
                            View attachment
                        </Button>
                    )}
                    
                    {details.status === "pending" && (
                        <Popconfirm title="Cancel this leave request?" onConfirm={() => cancelRequest(details.id)}>
                            <Button danger icon={<StopOutlined />} style={{ float: "right", marginTop: 16 }}>
                                Cancel Request
                            </Button>
                        </Popconfirm>
                    )}
                </>
                )}
            </Modal>
        </section>
    );
}
