import { useCallback, useEffect, useState } from "react";
import { Table, Typography, Divider, Row, Col, Card, Avatar, Tag, Space, Progress, Button, Tooltip, Badge, Select, Input, DatePicker, Statistic } from "antd";
import { 
    UserOutlined, 
    TeamOutlined, 
    DollarOutlined, 
    BarChartOutlined, 
    ReloadOutlined, 
    FireOutlined, 
    ThunderboltOutlined, 
    HistoryOutlined, 
    ClockCircleOutlined, 
    SearchOutlined, 
    ArrowLeftOutlined,
    MailOutlined,
    IdcardOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";
import "./team.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FILTER_OPTIONS = [
    { label: "All Time", value: "" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" },
    { label: "Custom Range", value: "custom" },
];

const formatMoney = (value) => {
    const num = Number(value || 0);
    return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatMinutes = (minutes) => {
    const m = Number(minutes || 0);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h}h ${rest}m` : `${h}h`;
};

export default function Team() {
    // Hook
    useTitle("Team Dashboard");

    // States
    const [loading, setLoading]     = useState(false);
    const [summary, setSummary]     = useState(null);
    const [employees, setEmployees] = useState([]);
    const [filter, setFilter]       = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [searchKey, setSearchKey] = useState("");
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25 });

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();

        if (filter) params.append("filter", filter);

        if (filter === "custom" && dateRange?.[0] && dateRange?.[1]) {
            params.append("from_date", dateRange[0].format("YYYY-MM-DD"));
            params.append("to_date", dateRange[1].format("YYYY-MM-DD"));
        }

        if (searchKey.trim()) params.append("search_key", searchKey.trim());

        const query = params.toString();
        return query ? `?${query}` : "";
    }, [filter, dateRange, searchKey]);

    const getTeamDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getDatas(`/admin/team/dashboard${buildQuery()}`);

            if (res?.success) {
                setSummary(res?.result?.summary || null);
                setEmployees(res?.result?.employees || []);
            }
        } finally {
            setLoading(false);
        }
    }, [buildQuery]);

    useEffect(() => {
        getTeamDashboard();
    }, [getTeamDashboard]);

    const columns = [
        {
            title: "#",
            key: "sl",
            width: 55,
            align: "center",
            fixed: "left",
            render: (_, __, index) => (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                    {(pagination.current - 1) * pagination.pageSize + index + 1}
                </span>
            ),
        },
        {
            title: "Employee Identity",
            key: "identity",
            fixed: "left",
            width: 240,
            render: (_, record) => (
                <div className="employee-cell">
                    <Badge dot status={record.attendance_today?.is_checked_in ? "success" : "default"} offset={[-4, 36]}>
                        <Avatar size={44} src={record.img_path || undefined} icon={<UserOutlined />} className="employee-avatar"/>
                    </Badge>
                    <div className="employee-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Text strong className="employee-name" style={{ textTransform: "capitalize" }}>
                                {record.username}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>
                                #{record.id}
                            </Text>
                        </div>
                        
                        <div className="employee-roles">
                            {record.roles?.map((role) => (
                                <Tag key={role.id} color="blue" className="role-tag">
                                    {role.display_name || role.name}
                                </Tag>
                            ))}
                        </div>

                        {record.email && (
                            <Text type="secondary" style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }} ellipsis={{ tooltip: record.email }}>
                                <MailOutlined style={{ fontSize: 10 }} /> {record.email}
                            </Text>
                        )}
                        <Text type="secondary" className="employee-phone">{record.phone_number || "—"}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Attendance & Shift",
            key: "attendance",
            width: 175,
            render: (_, record) => {
                const att = record.attendance_today || {};
                return (
                    <div className="attendance-cell">
                        <div className="attendance-status">
                            <Badge status={att.is_checked_in ? "processing" : "default"} />
                            <Tag color={att.is_checked_in ? "green" : "default"} style={{ margin: 0, fontSize: 11, fontWeight: 600, borderRadius: 4 }}>
                                {att.is_checked_in ? "Checked In" : "Not Checked In"}
                            </Tag>
                        </div>

                        {att.check_in_at && (
                            <Text type="secondary" className="attendance-time">
                                <ClockCircleOutlined /> In: {dayjs(att.check_in_at).format("hh:mm A")}
                                {att.is_checked_out && att.check_out_at
                                    ? ` · Out: ${dayjs(att.check_out_at).format("hh:mm A")}`
                                    : ""}
                            </Text>
                        )}
                        
                        <Text type="secondary" className="attendance-time">
                            Working: {att.is_checked_out
                                ? formatMinutes(att.working_minutes)
                                : att.check_in_at
                                    ? formatMinutes(dayjs().diff(dayjs(att.check_in_at), "minute"))
                                    : formatMinutes(att.working_minutes)}
                        </Text>
                    </div>
                );
            },
        },
        {
            title: "Assigned Orders",
            key: "assigned_total",
            width: 130,
            align: "center",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Statistic 
                        value={record.assigned_metrics?.total_orders || 0} 
                        valueStyle={{ fontSize: 18, fontWeight: 700, color: "#1e293b", lineHeight: 1 }}
                    />
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Tag color="green" style={{ margin: 0, fontSize: 10, padding: '0 4px', borderRadius: 4 }}>
                            {record.assigned_metrics?.prepared_orders || 0} Prep
                        </Tag>
                        <Tag color="volcano" style={{ margin: 0, fontSize: 10, padding: '0 4px', borderRadius: 4 }}>
                            {record.assigned_metrics?.unprepared_orders || 0} Unprep
                        </Tag>
                    </div>
                </div>
            ),
        },
        {
            title: "Assigned Order Statuses",
            key: "order_statuses",
            width: 240,
            render: (_, record) => {
                const statuses = record.assigned_metrics?.order_statuses || [];
                if (!statuses.length) {
                    return <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>No order status breakdown</Text>;
                }

                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 230 }}>
                        {statuses.map((s) => (
                            <Tag
                                key={s.id}
                                style={{
                                    margin: 0,
                                    padding: '1px 7px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: s.bg_color || '#e2e8f0',
                                    color: s.text_color || '#334155',
                                    border: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                <span>{s.name}:</span>
                                <span style={{ fontWeight: 800 }}>{s.orders_count}</span>
                            </Tag>
                        ))}
                    </div>
                );
            },
        },
        {
            title: "Preparation & Velocity",
            key: "preparation_velocity",
            width: 220,
            render: (_, record) => {
                const rate = Number(record.assigned_metrics?.preparation_rate || 0);
                const prep = record.prepared_metrics || {};

                return (
                    <div className="prep-cell" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="prep-head" style={{ marginBottom: 2 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Prepared Rate</Text>
                            <Text strong style={{ fontSize: 11, color: '#059669' }}>{rate}%</Text>
                        </div>

                        <Progress percent={rate} size="small" strokeColor={{ "0%": "#10b981", "100%": "#34d399" }} showInfo={false} trailColor="#f1f5f9"/>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                <Text strong className="velocity-today" style={{ fontSize: 11 }}>
                                    <FireOutlined /> {prep.prepared_today || 0} today
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    <HistoryOutlined /> {prep.prepared_this_month || 0} month
                                </Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
                                <span>Self Prepared: <b>{record.assigned_metrics?.self_prepared_orders || 0}</b></span>
                                <span>Total Prepared: <b>{prep.total_orders || 0}</b></span>
                            </div>
                            {prep.last_prepared_at && (
                                <Text type="secondary" style={{ fontSize: 10, fontStyle: 'italic', color: '#94a3b8' }}>
                                    Last prep: {dayjs(prep.last_prepared_at).format("DD MMM, hh:mm A")}
                                </Text>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Financial Summary",
            key: "financial",
            align: "right",
            width: 200,
            fixed: "right",
            render: (_, record) => {
                const assigned = record.assigned_metrics || {};
                const prepared = record.prepared_metrics || {};

                return (
                    <div className="value-cell" style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                                {formatMoney(assigned.total_payable_price)}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>
                                Assigned Net: {formatMoney(assigned.total_net_order_price)}
                            </Text>
                        </div>

                        <Divider style={{ margin: '4px 0', borderColor: '#e2e8f0' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Text strong style={{ fontSize: 12, color: '#059669' }}>
                                Prep: {formatMoney(prepared.total_payable_price)}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10, color: '#10b981' }}>
                                Prep Net: {formatMoney(prepared.total_net_order_price)}
                            </Text>
                        </div>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="teamWrapper">
            <div className="topBar no-print">
                <div className="team-page-title-block">
                    <span className="team-page-title-icon">
                        <TeamOutlined />
                    </span>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Team Dashboard</Title>
                        <Text type="secondary">Employee assigned & prepared order performance intelligence</Text>
                    </div>
                </div>
                <div className="team-page-actions">
                    <Button
                        className="team-btn-ghost"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                    <Button
                        className="team-btn-primary"
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={getTeamDashboard}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="filter-card no-print" bordered={false}>
                <div className="filter-card__head">Filters</div>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={12} md={6}>
                        <Text type="secondary" className="filter-label">Date Filter</Text>
                        <Select
                            style={{ width: "100%" }}
                            value={filter}
                            options={FILTER_OPTIONS}
                            onChange={(val) => {
                                setFilter(val);
                                if (val !== "custom") setDateRange(null);
                            }}
                        />
                    </Col>

                    {filter === "custom" && (
                        <Col xs={24} sm={12} md={8}>
                            <Text type="secondary" className="filter-label">Custom Range</Text>
                            <RangePicker
                                style={{ width: "100%" }}
                                value={dateRange}
                                onChange={setDateRange}
                                format="YYYY-MM-DD"
                            />
                        </Col>
                    )}

                    <Col xs={24} sm={12} md={filter === "custom" ? 6 : 10}>
                        <Text type="secondary" className="filter-label">Search Employee</Text>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Username, email, phone..."
                            value={searchKey}
                            onChange={(e) => setSearchKey(e.target.value)}
                            onPressEnter={getTeamDashboard}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={4}>
                        <Text type="secondary" className="filter-label">&nbsp;</Text>
                        <Button
                            className="team-btn-primary"
                            type="primary"
                            block
                            onClick={getTeamDashboard}
                            loading={loading}
                        >
                            Apply
                        </Button>
                    </Col>
                </Row>
            </Card>

            {summary && (
                <div className="summary-section">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} xl={6}>
                            <Card bordered={false} className="summary-card gold-indicator">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" className="summary-label">Team Members</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_team_members}</Title>
                                    <Text type="secondary" className="summary-sub">
                                        <Badge status="processing" text={`${summary.checked_in_today} checked in today`} />
                                    </Text>
                                </Space>
                                <TeamOutlined className="summary-icon" />
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} xl={6}>
                            <Card bordered={false} className="summary-card green-indicator">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" className="summary-label">Assigned Orders</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_assigned_orders}</Title>
                                    <Text type="secondary" className="summary-sub">
                                        {summary.total_unprepared_assigned} unprepared · {summary.total_prepared_assigned} prepared
                                    </Text>
                                </Space>
                                <ThunderboltOutlined className="summary-icon" />
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} xl={6}>
                            <Card bordered={false} className="summary-card indigo-indicator">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" className="summary-label">Prepared Orders</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_prepared_orders}</Title>
                                    <Text type="secondary" className="summary-sub">
                                        Assigned value: {formatMoney(summary.total_assigned_value)}
                                    </Text>
                                </Space>
                                <DollarOutlined className="summary-icon" />
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} xl={6}>
                            <Card bordered={false} className="summary-card cyan-indicator">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" className="summary-label">Preparation Rate</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.overall_preparation_rate}%</Title>
                                    <Text type="secondary" className="summary-sub">
                                        Prepared value: {formatMoney(summary.total_prepared_value)}
                                    </Text>
                                </Space>
                                <BarChartOutlined className="summary-icon" />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="tableSection">
                <div className="tableSection__head">
                    <span>Team Performance</span>
                    <Text type="secondary">{employees.length} employees</Text>
                </div>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={employees}
                    loading={loading}
                    scroll={{ x: 1300, y: "calc(100vh - 360px)" }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: employees.length,
                        onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
                        showSizeChanger: true,
                        pageSizeOptions: [10, 25, 50, 100],
                        showQuickJumper: true,
                        showTotal: (total) => `${total} employees`,
                        size: "small",
                        className: "custom-pagination",
                    }}
                />
            </div>
        </div>
    );
}