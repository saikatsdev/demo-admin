import { useCallback, useEffect, useState } from "react";
import { Table, Typography, Divider, Row, Col, Card, Avatar, Tag, Space, Progress, Button, Tooltip, Badge,Select, Input, DatePicker, Statistic,} from "antd";
import {UserOutlined,TeamOutlined,DollarOutlined,BarChartOutlined,ReloadOutlined,FireOutlined,ThunderboltOutlined,HistoryOutlined,ClockCircleOutlined,SearchOutlined,ArrowLeftOutlined,} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";
import "./team.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FILTER_OPTIONS = [
    { 
        label: "All Time", 
        value: "" 
    },
    { 
        label: "Today", 
        value: "today" 
    },
    { 
        label: "Yesterday", 
        value: "yesterday" 
    },
    { 
        label: "This Week", 
        value: "week" 
    },
    { 
        label: "This Month", 
        value: "month" 
    },
    { 
        label: "This Year", 
        value: "year" 
    },
    { 
        label: "Custom Range", 
        value: "custom" 
    },
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
            title: "Employee",
            key: "identity",
            fixed: "left",
            width: 240,
            render: (_, record) => (
                <div className="employee-cell">
                    <Badge dot status={record.status === "active" ? "success" : "default"} offset={[-4, 36]}>
                        <Avatar size={48} src={record.img_path || undefined} icon={<UserOutlined />} className="employee-avatar"/>
                    </Badge>
                    <div className="employee-info">
                        <Text strong className="employee-name" style={{textTransform:"capitalize"}}>
                            {record.username}
                        </Text>
                        <div className="employee-roles">
                            {record.roles?.map((role) => (
                                <Tag key={role.id} color="blue" className="role-tag">
                                    {role.display_name || role.name}
                                </Tag>
                            ))}
                        </div>
                        <Text type="secondary" className="employee-phone">{record.phone_number || "—"}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Assigned Orders",
            key: "assigned_total",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Statistic value={record.assigned_metrics?.total_orders || 0} valueStyle={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}/>
            ),
        },
        {
            title: "Preparation",
            key: "load",
            width: 180,
            render: (_, record) => {
                const rate = Number(record.assigned_metrics?.preparation_rate || 0);
                return (
                    <div className="prep-cell">
                        <div className="prep-head">
                            <Text type="secondary">Prepared rate</Text>
                            <Text strong>{rate}%</Text>
                        </div>
                        <Progress
                            percent={rate}
                            size="small"
                            strokeColor={{ "0%": "#10b981", "100%": "#34d399" }}
                            showInfo={false}
                            trailColor="#f1f5f9"
                        />
                        <div className="prep-tags">
                            <Tooltip title="Unprepared">
                                <Tag color="volcano">{record.assigned_metrics?.unprepared_orders || 0} Unprepared</Tag>
                            </Tooltip>

                            <Tooltip title="Prepared">
                                <Tag color="green">{record.assigned_metrics?.prepared_orders || 0} Prepared</Tag>
                            </Tooltip>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Attendance",
            key: "attendance",
            width: 180,
            render: (_, record) => {
                const att = record.attendance_today || {};
                return (
                    <div className="attendance-cell">
                        <div className="attendance-status">
                            <Badge status={att.is_checked_in ? "processing" : "default"} />
                            <Text strong className={att.is_checked_in ? "text-success" : "text-muted"}>
                                {att.is_checked_in ? "Checked In" : "Not Checked In"}
                            </Text>
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
            title: "Prepared Today / Month",
            key: "velocity",
            width: 170,
            render: (_, record) => (
                <div className="velocity-cell">
                    <Text strong className="velocity-today">
                        <FireOutlined /> {record.prepared_metrics?.prepared_today || 0}{" "}
                        <Text type="secondary">today</Text>
                    </Text>
                    <Text type="secondary">
                        <HistoryOutlined /> {record.prepared_metrics?.prepared_this_month || 0} this month
                    </Text>
                    <Text type="secondary">
                        Total prepared: {record.prepared_metrics?.total_orders || 0}
                    </Text>
                </div>
            ),
        },
        {
            title: "Assigned Value",
            key: "financial",
            align: "right",
            width: 150,
            render: (_, record) => (
                <div className="value-cell">
                    <Text strong className="value-main">
                        {formatMoney(record.assigned_metrics?.total_payable_price)}
                    </Text>
                    <Text type="secondary" className="value-sub">payable</Text>
                    <Text type="secondary" className="value-sub">
                        Net: {formatMoney(record.assigned_metrics?.total_net_order_price)}
                    </Text>
                </div>
            ),
        },
    ];

    const expandedRowRender = (record) => (
        <div className="expanded-panel">
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card size="small" bordered={false} title="Order Status (Assigned)">
                        <div className="metric-list">
                            {record.assigned_metrics?.order_statuses?.length ? (
                                record.assigned_metrics.order_statuses.map((s) => (
                                    <div className="metric-row" key={s.id}>
                                        <Text type="secondary">
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    backgroundColor: s.bg_color,
                                                    marginRight: 8,
                                                }}
                                            />
                                            {s.name}
                                        </Text>
                                        <Tag color={s.bg_color} style={{ color: s.text_color, border: "none" }}>
                                            {s.orders_count}
                                        </Tag>
                                    </div>
                                ))
                            ) : (
                                <Text type="secondary">No status data</Text>
                            )}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card size="small" bordered={false} title="Preparation Details">
                        <div className="metric-list">
                            <div className="metric-row">
                                <Text type="secondary">Self prepared</Text>
                                <Text strong>{record.assigned_metrics?.self_prepared_orders || 0}</Text>
                            </div>
                            <div className="metric-row">
                                <Text type="secondary">Total prepared (all)</Text>
                                <Text strong>{record.prepared_metrics?.total_orders || 0}</Text>
                            </div>
                            <div className="metric-row">
                                <Text type="secondary">Last prepared at</Text>
                                <Text strong>
                                    {record.prepared_metrics?.last_prepared_at
                                        ? dayjs(record.prepared_metrics.last_prepared_at).format("DD MMM YYYY, hh:mm A")
                                        : "N/A"}
                                </Text>
                            </div>
                            <Divider style={{ margin: "8px 0" }} />
                            <div className="metric-row">
                                <Text type="secondary">Prepared payable</Text>
                                <Text strong className="text-success">
                                    {formatMoney(record.prepared_metrics?.total_payable_price)}
                                </Text>
                            </div>
                            <div className="metric-row">
                                <Text type="secondary">Prepared net</Text>
                                <Text strong className="text-success">
                                    {formatMoney(record.prepared_metrics?.total_net_order_price)}
                                </Text>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card size="small" bordered={false} title="Account Info">
                        <div className="metric-list">
                            <div>
                                <Text type="secondary" className="label-xs">Email</Text>
                                <div><Text strong>{record.email || "—"}</Text></div>
                            </div>
                            <Divider style={{ margin: "8px 0" }} />
                            <div>
                                <Text type="secondary" className="label-xs">Employee ID</Text>
                                <div><Text strong>#{record.id}</Text></div>
                            </div>
                            <Divider style={{ margin: "8px 0" }} />
                            <div className="metric-row">
                                <Text type="secondary">Attendance status</Text>
                                <Tag color={record.attendance_today?.is_checked_in ? "green" : "default"}>
                                    {record.attendance_today?.status || "absent"}
                                </Tag>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    return (
        <div className="teamWrapper">
            <div className="topBar no-print">
                <div className="team-page-title-block">
                    <span className="team-page-title-icon">
                        <TeamOutlined />
                    </span>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Team Dashboard</Title>
                        <Text type="secondary">Employee assigned & prepared order performance</Text>
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
                    scroll={{ x: 1100, y: "calc(100vh - 360px)" }}
                    expandable={{
                        expandedRowRender,
                        rowExpandable: () => true,
                    }}
                    pagination={{
                        pageSize: 25,
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