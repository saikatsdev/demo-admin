import {ArrowLeftOutlined,CalendarOutlined,CheckCircleOutlined,ClockCircleOutlined,CloseCircleOutlined,DeleteOutlined,EditOutlined,FieldTimeOutlined,FilterOutlined,ReloadOutlined,SearchOutlined,TeamOutlined} from "@ant-design/icons";
import {Avatar,Breadcrumb,Button,Card,Col,DatePicker,Empty,Input,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,Typography,message} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import { usePermission } from "../../../hooks/usePermission";
import useTitle from "../../../hooks/useTitle";
import "./AttendancePro.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const EMPTY_FILTERS = { search: "", status: null, dateRange: null };
const STATUS_META = {
    present   : { label: "Present", color: "success" },
    late      : { label: "Late", color: "warning" },
    absent    : { label: "Absent", color: "error" },
    half_day  : { label: "Half Day", color: "processing" },
    on_leave  : { label: "On Leave", color: "purple" },
    holiday   : { label: "Holiday", color: "cyan" },
    weekly_off: { label: "Weekly Off", color: "default" },
};

const formatMinutes = (value) => {
    const minutes = Number(value || 0);
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
};

const time = (value) => (value ? dayjs(value).format("hh:mm A") : "—");

export default function AttendancePro() {
    useTitle("Attendance Management");
    const navigate                            = useNavigate();
    const { can }                             = usePermission();
    const [messageApi, contextHolder]         = message.useMessage();
    const [loading, setLoading]               = useState(false);
    const [data, setData]                     = useState([]);
    const [filters, setFilters]               = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
    const [summary, setSummary]               = useState({ present: 0, late: 0, absent: 0, half_day: 0 });
    const [pagination, setPagination]         = useState({ current: 1, pageSize: 20, total: 0 });

    const requestParams = (filterState, extra = {}) => ({
        search: filterState.search || undefined,
        start_date: filterState.dateRange?.[0]?.format("YYYY-MM-DD"),
        end_date: filterState.dateRange?.[1]?.format("YYYY-MM-DD"),
        ...extra,
    });

    const fetchAttendance = useCallback(async (page = 1, pageSize = 20, filterState = EMPTY_FILTERS) => {
        setLoading(true);
        const statuses = ["present", "late", "absent", "half_day"];
        const [response, ...counts] = await Promise.all([
            getDatas("/admin/attendance", requestParams(filterState, {
                page,
                paginate_size: pageSize,
                status: filterState.status || undefined,
            })),
            ...statuses.map((status) => getDatas("/admin/attendance", requestParams(filterState, {
                page: 1,
                paginate_size: 1,
                status,
            }))),
        ]);

        if (response?.success) {
            setData(response.result?.data || []);
            setPagination({
                current: Number(response.result?.current_page || page),
                pageSize: Number(response.result?.per_page || pageSize),
                total: Number(response.result?.total || 0),
            });
            setSummary(Object.fromEntries(statuses.map((status, index) => [
                status,
                Number(counts[index]?.result?.total || 0),
            ])));
        } else {
            messageApi.error(response?.message || "Unable to load attendance records.");
        }
        setLoading(false);
    }, [messageApi]);

    useEffect(() => {
        fetchAttendance(1, 20, EMPTY_FILTERS);
    }, [fetchAttendance]);

    const applyFilters = () => {
        setAppliedFilters(filters);
        fetchAttendance(1, pagination.pageSize, filters);
    };

    const resetFilters = () => {
        setFilters(EMPTY_FILTERS);
        setAppliedFilters(EMPTY_FILTERS);
        fetchAttendance(1, 20, EMPTY_FILTERS);
    };

    const remove = async (id) => {
        const response = await deleteData(`/admin/attendance/${id}`);
        if (!response?.success) return messageApi.error(response?.message || "Unable to delete attendance.");
        messageApi.success(response.msg || "Attendance record deleted.");
        fetchAttendance(pagination.current, pagination.pageSize, appliedFilters);
    };

    const summaryCards = [
        { key: "present", label: "Present", hint: "On-time attendance", icon: <CheckCircleOutlined />, tone: "green" },
        { key: "late", label: "Late", hint: "After shift grace", icon: <ClockCircleOutlined />, tone: "orange" },
        { key: "absent", label: "Absent", hint: "No attendance record", icon: <CloseCircleOutlined />, tone: "red" },
        { key: "half_day", label: "Half Day", hint: "Below half shift hours", icon: <FieldTimeOutlined />, tone: "blue" },
    ];

    const columns = [
        {
            title: "Employee",
            key: "employee",
            fixed: "left",
            width: 245,
            render: (_, record) => (
                <div className="attendance-employee">
                    <Avatar size={38} icon={<TeamOutlined />} />
                    <div>
                        <strong>{record.user?.username || "Unknown employee"}</strong>
                        <span>{record.user?.email || record.user?.phone_number || "—"}</span>
                    </div>
                </div>
            ),
        },
        {
            title: "Date & Shift",
            width: 190,
            render: (_, record) => (
                <div className="attendance-date-cell">
                    <strong><CalendarOutlined /> {dayjs(record.attendance_date).format("DD MMM YYYY")}</strong>
                    <span>{record.work_shift?.name || "No shift"}</span>
                </div>
            ),
        },
        {
            title: "Scheduled",
            width: 150,
            render: (_, record) => <span className="attendance-time-range">{time(record.scheduled_start_at)}<small>to</small>{time(record.scheduled_end_at)}</span>,
        },
        {
            title: "Actual Time",
            width: 170,
            render: (_, record) => (
                <div className="attendance-actual-time">
                    <span><i className="attendance-dot attendance-dot--in" />{time(record.check_in_at)}</span>
                    <span><i className="attendance-dot attendance-dot--out" />{time(record.check_out_at)}</span>
                </div>
            ),
        },
        {
            title: "Work Duration",
            width: 135,
            render: (_, record) => <strong className="attendance-duration"><ClockCircleOutlined /> {formatMinutes(record.working_minutes)}</strong>,
        },
        {
            title: "Exceptions",
            width: 180,
            render: (_, record) => (
                <div className="attendance-exceptions">
                    {Number(record.late_minutes) > 0 && <Tag color="orange">Late {formatMinutes(record.late_minutes)}</Tag>}
                    {Number(record.early_leave_minutes) > 0 && <Tag color="volcano">Early {formatMinutes(record.early_leave_minutes)}</Tag>}
                    {!Number(record.late_minutes) && !Number(record.early_leave_minutes) && <Text type="secondary">No exceptions</Text>}
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 120,
            align: "center",
            render: (status) => {
                const meta = STATUS_META[status] || { label: status || "Unknown", color: "default" };
                return <Tag className="attendance-status" color={meta.color}>{meta.label}</Tag>;
            },
        },
        {
            title: "Action",
            width: 100,
            align: "center",
            fixed: "right",
            render: (_, record) => (
                <Space size={4}>
                    {can("attendance-update") && <Tooltip title="Edit attendance"><Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/team/attendance/edit/${record.id}`)} /></Tooltip>}
                    {can("attendance-delete") && <Popconfirm title="Delete attendance record?" description="This action cannot be undone." onConfirm={() => remove(record.id)}><Tooltip title="Delete attendance"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
                </Space>
            ),
        },
    ];

    return (
        <div className="attendance-page">
            {contextHolder}
            <div className="pagehead attendance-pagehead">
                <div className="head-left attendance-heading">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                    <div>
                        <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "HRM" }, { title: "Attendance" }]} />
                        <h1 className="title">Attendance Management</h1>
                        <p className="subtitle">Monitor daily presence, working time and attendance exceptions.</p>
                    </div>
                </div>
                <Button icon={<ReloadOutlined />} loading={loading} onClick={() => fetchAttendance(pagination.current, pagination.pageSize, appliedFilters)}>Refresh</Button>
            </div>

            <Row gutter={[14, 14]} className="attendance-summary">
                {summaryCards.map((card) => <Col xs={24} sm={12} xl={6} key={card.key}><Card bordered={false} className={`attendance-stat attendance-stat--${card.tone}`}><span className="attendance-stat__icon">{card.icon}</span><div><span>{card.label}</span><strong>{Number(summary[card.key] || 0).toLocaleString()}</strong><small>{card.hint}</small></div></Card></Col>)}
            </Row>

            <Card bordered={false} className="attendance-filter-card">
                <div className="attendance-filters">
                    <div className="attendance-filter attendance-filter--search"><label>Search employee</label><Input allowClear value={filters.search} prefix={<SearchOutlined />} placeholder="Name, email or phone" onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onPressEnter={applyFilters} /></div>
                    <div className="attendance-filter"><label>Status</label><Select allowClear value={filters.status} placeholder="All statuses" onChange={(status) => setFilters((current) => ({ ...current, status }))} options={Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))} /></div>
                    <div className="attendance-filter attendance-filter--date"><label>Date range</label><RangePicker value={filters.dateRange} onChange={(dateRange) => setFilters((current) => ({ ...current, dateRange }))} /></div>
                    <div className="attendance-filter-actions"><Button type="primary" icon={<FilterOutlined />} onClick={applyFilters}>Apply</Button><Button onClick={resetFilters}>Reset</Button></div>
                </div>
            </Card>

            <Card bordered={false} className="attendance-table-card">
                <div className="attendance-table-title"><div><h3>Attendance Records</h3><p>{pagination.total.toLocaleString()} records match the current filters</p></div></div>
                <Table rowKey="id" columns={columns} dataSource={data} loading={loading} locale={{ emptyText: <Empty description="No attendance records found" /> }} scroll={{ x: 1350 }} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}` }} onChange={(page) => fetchAttendance(page.current, page.pageSize, appliedFilters)} />
            </Card>
        </div>
    );
}
