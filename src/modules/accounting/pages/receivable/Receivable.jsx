import {
    EyeOutlined, PhoneOutlined, ReloadOutlined, SearchOutlined,
    UserOutlined, WalletOutlined
} from "@ant-design/icons";
import {
    Alert, Breadcrumb, Button, Card, Col, DatePicker, Drawer, Empty,
    Input, Result, Row, Statistic, Table, Tag, Tooltip, Typography
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getReceivables, getReceivableStatement } from "../../api/receivableApi";
import "../../styles/payable.css";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const money = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Receivable() {
    useTitle("Customer Receivables | Accounting");
    const { can } = usePermission();
    const allowed = can("receivables-read");
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [meta, setMeta] = useState({ current_page: 1, per_page: 20, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [filters, setFilters] = useState({ page: 1, paginate_size: 20, search_key: "", date_from: undefined, date_to: undefined });
    const [statement, setStatement] = useState(null);
    const [statementLoading, setStatementLoading] = useState(false);
    const requestId = useRef(0);

    const load = useCallback(async () => {
        if (!allowed) return;
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const response = await getReceivables(filters);
            if (id !== requestId.current) return;
            if (!response?.success) throw new Error(response?.message || response?.msg || "Unable to load customer receivables");
            setRows(response.result?.data || []);
            setSummary(response.result?.summary || {});
            setMeta(response.result?.meta || {});
        } catch (e) {
            if (id === requestId.current) setError(e.message || "Unable to load customer receivables");
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [allowed, filters]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== filters.search_key) {
                setFilters((current) => ({ ...current, page: 1, search_key: query }));
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query]);

    const openStatement = async (customer) => {
        setStatementLoading(true);
        try {
            const response = await getReceivableStatement(customer.phone_number, {
                date_from: filters.date_from,
                date_to: filters.date_to,
                paginate_size: 100,
            });
            if (response?.success) setStatement(response.result);
        } finally {
            setStatementLoading(false);
        }
    };

    if (!allowed) {
        return <Result status="403" title="Receivables access required" subTitle="You do not have permission to view customer receivables." />;
    }

    const columns = [
        { title: "Customer", key: "customer", render: (_, r) => <div><strong>{r.customer_name || "Unknown Customer"}</strong><div><Text type="secondary"><PhoneOutlined /> {r.phone_number}</Text></div></div> },
        { title: "Orders", dataIndex: "total_orders", align: "center", width: 90 },
        { title: "Sales", dataIndex: "total_sales", align: "right", render: money },
        { title: "Received", dataIndex: "total_received", align: "right", render: (v) => <span className="phase9-received">{money(v)}</span> },
        { title: "Receivable", dataIndex: "total_due", align: "right", render: (v) => <strong className="phase9-receivable">{money(v)}</strong> },
        { title: "Last Order", dataIndex: "last_order_date", render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "-" },
        { title: "Status", render: () => <Tag color="red">Due</Tag>, width: 80 },
        { title: "Action", align: "center", width: 80, render: (_, r) => <Tooltip title="View orders"><Button type="text" icon={<EyeOutlined />} onClick={() => openStatement(r)} /></Tooltip> },
    ];

    const dateValue = filters.date_from && filters.date_to ? [dayjs(filters.date_from), dayjs(filters.date_to)] : null;

    return (
        <div className="phase9-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Customer Receivables</h1>
                    <p className="phase9-subtitle">Current outstanding delivered-order dues grouped by customer phone number.</p>
                </div>
                <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Accounting" }, { title: "Receivables" }]} />
            </div>

            <Row gutter={[16,16]}>
                <Col xs={24} sm={12} lg={6}><Card className="phase9-stat phase9-stat-red"><Statistic title="Total Receivable" value={Number(summary.total_receivable || 0)} precision={2} prefix="৳" /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card className="phase9-stat"><Statistic title="Customers with Due" value={summary.customer_count || 0} prefix={<UserOutlined />} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card className="phase9-stat"><Statistic title="Related Sales" value={Number(summary.total_sales || 0)} precision={2} prefix="৳" /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card className="phase9-stat"><Statistic title="Already Received" value={Number(summary.total_received || 0)} precision={2} prefix="৳" /></Card></Col>
            </Row>

            <Card className="phase9-card" styles={{ body: { padding: 0 } }}>
                <div className="phase9-toolbar">
                    <Input prefix={<SearchOutlined />} allowClear value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, phone or invoice" className="phase9-search" />
                    <RangePicker value={dateValue} format="DD MMM YYYY" onChange={(dates) => setFilters((c) => ({ ...c, page: 1, date_from: dates?.[0]?.format("YYYY-MM-DD"), date_to: dates?.[1]?.format("YYYY-MM-DD") }))} />
                    <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>Refresh</Button>
                </div>
                <Alert
                    type="info"
                    showIcon
                    message="Receivable is calculated from Delivered and Partial Returned orders only."
                    description="This is a current outstanding view based on each order's present due amount."
                    style={{ margin: 16 }}
                />
                {error && <Alert type="error" showIcon message={error} style={{ margin: 16 }} />}
                <Table
                    rowKey="phone_number"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No customer receivable found" /> }}
                    pagination={{
                        current: meta.current_page || filters.page,
                        pageSize: meta.per_page || filters.paginate_size,
                        total: meta.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: [10,20,50,100],
                        onChange: (page, pageSize) => setFilters((c) => ({ ...c, page: pageSize !== c.paginate_size ? 1 : page, paginate_size: pageSize })),
                    }}
                    scroll={{ x: 1100 }}
                />
            </Card>

            <Drawer
                open={Boolean(statement) || statementLoading}
                onClose={() => setStatement(null)}
                width={800}
                title="Customer Receivable Statement"
                loading={statementLoading}
                destroyOnHidden
            >
                {statement && <>
                    <div className="phase9-statement-hero phase9-receivable-hero">
                        <div>
                            <Text type="secondary">{statement.customer?.phone_number}</Text>
                            <Title level={3}>{statement.customer?.customer_name}</Title>
                        </div>
                        <div className="phase9-statement-balance">
                            <span>Closing Receivable</span>
                            <strong>{money(statement.summary?.closing_receivable)}</strong>
                        </div>
                    </div>
                    <Row gutter={[10,10]} style={{ marginBottom: 16 }}>
                        <Col xs={12} md={6}><Card size="small"><Statistic title="Opening" value={Number(statement.summary?.opening_receivable || 0)} precision={2} prefix="৳" /></Card></Col>
                        <Col xs={12} md={6}><Card size="small"><Statistic title="Period Sales" value={Number(statement.summary?.period_sales || 0)} precision={2} prefix="৳" /></Card></Col>
                        <Col xs={12} md={6}><Card size="small"><Statistic title="Received" value={Number(statement.summary?.period_received || 0)} precision={2} prefix="৳" /></Card></Col>
                        <Col xs={12} md={6}><Card size="small"><Statistic title="Period Due" value={Number(statement.summary?.period_due || 0)} precision={2} prefix="৳" /></Card></Col>
                    </Row>
                    <Table
                        size="small"
                        rowKey="order_id"
                        pagination={false}
                        dataSource={statement.data || []}
                        columns={[
                            { title: "Date", dataIndex: "order_date", render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "-" },
                            { title: "Invoice", dataIndex: "invoice_number", render: (v, r) => v || `#${r.order_id}` },
                            { title: "Status", dataIndex: "status" },
                            { title: "Sale", dataIndex: "payable_price", align: "right", render: money },
                            { title: "Received", dataIndex: "received_amount", align: "right", render: money },
                            { title: "Due", dataIndex: "due", align: "right", render: money },
                            { title: "Running Due", dataIndex: "running_due", align: "right", render: money },
                        ]}
                        scroll={{ x: 780 }}
                    />
                </>}
            </Drawer>
        </div>
    );
}
