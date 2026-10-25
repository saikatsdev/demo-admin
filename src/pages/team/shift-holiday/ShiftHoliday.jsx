import {ArrowLeftOutlined,CalendarOutlined,ClockCircleOutlined,DeleteOutlined,EditOutlined,PlusOutlined,ReloadOutlined,SearchOutlined} from "@ant-design/icons";
import {Avatar,Breadcrumb,Button,Card,Col,DatePicker,Form,Input,InputNumber,message,Modal,Popconfirm,Row,Select,Space,Table,Tabs,Tag,TimePicker,Tooltip,Typography} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData, putData } from "../../../api/common/common";
import { usePermission } from "../../../hooks/usePermission";
import useTitle from "../../../hooks/useTitle";

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text } = Typography;

const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "draft", label: "Draft" },
];

const getResponseMessage = (response, fallback) => {
    const validationMessage = Object.values(response?.errors || {})?.[0]?.[0];
    return validationMessage || response?.msg || response?.message || fallback;
};

const parseTime = (value) => dayjs(`2000-01-01T${value}`);
const formatTime = (value) => value ? parseTime(value).format("hh:mm A") : "—";

export default function ShiftHoliday() {
    useTitle("Shifts & Holidays");

    const { can }                     = usePermission();
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const canReadShifts   = can("shifts-read");
    const canReadHolidays = can("holidays-read");
    const availableTabs   = useMemo(() => [
        canReadShifts && { key: "shifts", label: "Work Shifts", icon: <ClockCircleOutlined /> },
        canReadHolidays && { key: "holidays", label: "Holidays", icon: <CalendarOutlined /> },
    ].filter(Boolean), [canReadHolidays, canReadShifts]);

    const [activeTab, setActiveTab] = useState(availableTabs[0]?.key || "shifts");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [status, setStatus] = useState();
    const [holidayType, setHolidayType] = useState();
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

    const isShift = activeTab === "shifts";
    const endpoint = isShift ? "/admin/work-shifts" : "/admin/holidays";
    const canCreate = can(isShift ? "shifts-create" : "holidays-create");
    const canUpdate = can(isShift ? "shifts-update" : "holidays-update");
    const canDelete = can(isShift ? "shifts-delete" : "holidays-delete");

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => window.clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        setPagination((current) => ({ ...current, current: 1 }));
    }, [activeTab, debouncedQuery, holidayType, status]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getDatas(endpoint, {
                page         : pagination.current,
                paginate_size: pagination.pageSize,
                search_key   : debouncedQuery || undefined,
                status       : status || undefined,
                type         : !isShift ? holidayType || undefined : undefined,
            });

            if (!response?.success) {
                messageApi.error(getResponseMessage(response, `Unable to load ${isShift ? "work shifts" : "holidays"}`));
                return;
            }

            const result = response?.result || {};
            const meta = result?.meta || {};
            setItems(result?.data || []);
            setPagination((current) => ({
                ...current,
                current : meta.current_page || current.current,
                pageSize: Number(meta.per_page) || current.pageSize,
                total   : Number(meta.total) || 0,
            }));
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, endpoint, holidayType, isShift, messageApi, pagination.current, pagination.pageSize, status]);

    useEffect(() => {
        if (availableTabs.length) fetchItems();
    }, [availableTabs.length, fetchItems]);

    const changeTab = (key) => {
        setActiveTab(key);
        setItems([]);
        setQuery("");
        setDebouncedQuery("");
        setStatus(undefined);
        setHolidayType(undefined);
        setEditingItem(null);
        form.resetFields();
    };

    const openCreate = () => {
        setEditingItem(null);
        form.resetFields();
        form.setFieldsValue(isShift
            ? { grace_minutes: 0, break_minutes: 0, status: "active" }
            : { type: "company", status: "active" });
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        form.resetFields();
        form.setFieldsValue(isShift ? {
            code         : item.code,
            name         : item.name,
            start_time   : parseTime(item.start_time),
            end_time     : parseTime(item.end_time),
            grace_minutes: item.grace_minutes,
            break_minutes: item.break_minutes,
            status       : item.status,
        } : {
            name       : item.name,
            date_range : [dayjs(item.start_date), dayjs(item.end_date)],
            type       : item.type,
            description: item.description,
            status     : item.status,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) return;
        setModalOpen(false);
        setEditingItem(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const payload = isShift ? {
            code         : values.code.trim(),
            name         : values.name.trim(),
            start_time   : values.start_time.format("HH:mm"),
            end_time     : values.end_time.format("HH:mm"),
            grace_minutes: values.grace_minutes ?? 0,
            break_minutes: values.break_minutes ?? 0,
            status       : values.status,
        } : {
            name       : values.name.trim(),
            start_date : values.date_range[0].format("YYYY-MM-DD"),
            end_date   : values.date_range[1].format("YYYY-MM-DD"),
            type       : values.type,
            description: values.description?.trim() || null,
            status     : values.status,
        };

        setSubmitting(true);
        try {
            const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
            const response = editingItem ? await putData(url, payload) : await postData(url, payload);

            if (!response?.success) {
                messageApi.error(getResponseMessage(response, `Unable to save ${isShift ? "work shift" : "holiday"}`));
                return;
            }

            messageApi.success(response?.msg || `${isShift ? "Work shift" : "Holiday"} saved successfully`);
            setModalOpen(false);
            setEditingItem(null);
            form.resetFields();
            await fetchItems();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const response = await deleteData(`${endpoint}/${id}`);
        if (!response?.success) {
            messageApi.error(getResponseMessage(response, `Unable to delete ${isShift ? "work shift" : "holiday"}`));
            return;
        }

        messageApi.success(response?.msg || `${isShift ? "Work shift" : "Holiday"} deleted successfully`);
        if (items.length === 1 && pagination.current > 1) {
            setPagination((current) => ({ ...current, current: current.current - 1 }));
        } else {
            await fetchItems();
        }
    };

    const actionColumn = (canUpdate || canDelete) && {
        title: "Action",
        key: "action",
        width: 115,
        fixed: "right",
        render: (_, record) => (
            <Space size={4}>
                {canUpdate && <Tooltip title="Edit"><Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} /></Tooltip>}
                {canDelete && (
                    <Popconfirm title={`Delete ${isShift ? "work shift" : "holiday"}?`} okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record.id)}>
                        <Tooltip title="Delete"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip>
                    </Popconfirm>
                )}
            </Space>
        ),
    };

    const shiftColumns = [
        { title: "SL", width: 65, render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1 },
        {
            title: "Work Shift", key: "shift", width: 240,
            render: (_, record) => <Space><Avatar shape="square" icon={<ClockCircleOutlined />} style={{ background: "#e6f4ff", color: "#1677ff" }} /><div><Text strong>{record.name}</Text><div><Text type="secondary">{record.code}</Text></div></div></Space>,
        },
        { title: "Start Time", dataIndex: "start_time", width: 135, render: formatTime },
        { title: "End Time", dataIndex: "end_time", width: 135, render: formatTime },
        { title: "Grace", dataIndex: "grace_minutes", width: 110, render: (value) => `${value || 0} min` },
        { title: "Break", dataIndex: "break_minutes", width: 110, render: (value) => `${value || 0} min` },
        { title: "Status", dataIndex: "status", width: 110, render: (value) => <Tag color={value === "active" ? "green" : value === "draft" ? "gold" : "default"}>{value}</Tag> },
        actionColumn,
    ].filter(Boolean);

    const holidayColumns = [
        { title: "SL", width: 65, render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1 },
        {
            title: "Holiday", key: "holiday", width: 250,
            render: (_, record) => <Space><Avatar shape="square" icon={<CalendarOutlined />} style={{ background: "#fff1f0", color: "#cf1322" }} /><div><Text strong>{record.name}</Text><div><Text type="secondary" style={{ textTransform: "capitalize" }}>{record.type}</Text></div></div></Space>,
        },
        { title: "Start Date", dataIndex: "start_date", width: 140, render: (value) => dayjs(value).format("DD MMM YYYY") },
        { title: "End Date", dataIndex: "end_date", width: 140, render: (value) => dayjs(value).format("DD MMM YYYY") },
        { title: "Description", dataIndex: "description", ellipsis: true, render: (value) => value || <Text type="secondary">—</Text> },
        { title: "Status", dataIndex: "status", width: 110, render: (value) => <Tag color={value === "active" ? "green" : value === "draft" ? "gold" : "default"}>{value}</Tag> },
        actionColumn,
    ].filter(Boolean);

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left"><h1 className="title">Shifts & Holidays</h1></div>
                <div className="head-actions"><Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "HRM" }, { title: "Shifts & Holidays" }]} /></div>
            </div>

            <Card styles={{ body: { padding: 18 } }}>
                <Tabs activeKey={activeTab} items={availableTabs} onChange={changeTab} />

                <Row gutter={[12, 12]} justify="space-between" align="middle" style={{ marginBottom: 18 }}>
                    <Col xs={24} xl={17}>
                        <Space wrap>
                            <Input allowClear prefix={<SearchOutlined />} placeholder={`Search ${isShift ? "work shifts" : "holidays"}`} value={query} onChange={(event) => setQuery(event.target.value)} style={{ width: 280 }} />
                            {!isShift && <Select allowClear placeholder="All holiday types" value={holidayType} onChange={setHolidayType} style={{ width: 170 }} options={[{ value: "public", label: "Public" }, { value: "company", label: "Company" }, { value: "optional", label: "Optional" }]} />}
                            <Select allowClear placeholder="All statuses" value={status} onChange={setStatus} style={{ width: 145 }} options={statusOptions} />
                            <Tooltip title="Refresh"><Button icon={<ReloadOutlined />} loading={loading} onClick={fetchItems} /></Tooltip>
                        </Space>
                    </Col>
                    <Col xs={24} xl={7} style={{ textAlign: "right" }}>
                        <Space>
                            {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add {isShift ? "Work Shift" : "Holiday"}</Button>}
                            <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                        </Space>
                    </Col>
                </Row>

                <Table rowKey="id" bordered loading={loading} columns={isShift ? shiftColumns : holidayColumns} dataSource={items} scroll={{ x: 1000 }} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`, onChange: (current, pageSize) => setPagination((previous) => ({ ...previous, current, pageSize })) }} />
            </Card>

            <Modal destroyOnHidden open={modalOpen} title={`${editingItem ? "Edit" : "Create"} ${isShift ? "Work Shift" : "Holiday"}`} okText={editingItem ? "Update" : "Create"} confirmLoading={submitting} onOk={handleSubmit} onCancel={closeModal} width={760}>
                <Form form={form} layout="vertical" requiredMark="optional" style={{ marginTop: 20 }}>
                    {isShift ? (
                        <Row gutter={16}>
                            <Col xs={24} md={12}><Form.Item name="code" label="Shift Code" rules={[{ required: true, whitespace: true }]}><Input placeholder="e.g. GENERAL" maxLength={100} /></Form.Item></Col>
                            <Col xs={24} md={12}><Form.Item name="name" label="Shift Name" rules={[{ required: true, whitespace: true }]}><Input placeholder="e.g. General Shift" maxLength={255} /></Form.Item></Col>
                            <Col xs={24} md={12}><Form.Item name="start_time" label="Start Time" rules={[{ required: true }]}><TimePicker format="hh:mm A" style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={24} md={12}><Form.Item name="end_time" label="End Time" rules={[{ required: true }]}><TimePicker format="hh:mm A" style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={24} md={8}><Form.Item name="grace_minutes" label="Grace Minutes" rules={[{ required: true }]}><InputNumber min={0} max={1440} style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={24} md={8}><Form.Item name="break_minutes" label="Break Minutes" rules={[{ required: true }]}><InputNumber min={0} max={1440} style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={24} md={8}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={statusOptions} /></Form.Item></Col>
                        </Row>
                    ) : (
                        <Row gutter={16}>
                            <Col xs={24} md={12}><Form.Item name="name" label="Holiday Name" rules={[{ required: true, whitespace: true }]}><Input placeholder="e.g. Eid Holiday" maxLength={255} /></Form.Item></Col>
                            <Col xs={24} md={12}><Form.Item name="type" label="Holiday Type" rules={[{ required: true }]}><Select options={[{ value: "public", label: "Public" }, { value: "company", label: "Company" }, { value: "optional", label: "Optional" }]} /></Form.Item></Col>
                            <Col xs={24}><Form.Item name="date_range" label="Holiday Date Range" rules={[{ required: true }]}><RangePicker format="DD MMM YYYY" style={{ width: "100%" }} /></Form.Item></Col>
                            <Col xs={24}><Form.Item name="description" label="Description"><TextArea rows={3} maxLength={1000} showCount /></Form.Item></Col>
                            <Col xs={24} md={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={statusOptions} /></Form.Item></Col>
                        </Row>
                    )}
                </Form>
            </Modal>
        </>
    );
}
