import {
    EyeOutlined, ReloadOutlined, SearchOutlined, ShopOutlined,
    WalletOutlined
} from "@ant-design/icons";
import {
    Alert, Breadcrumb, Button, Card, Col, DatePicker, Drawer, Empty,
    Input, Result, Row, Space, Statistic, Table, Tag, Tooltip, Typography
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getPayables, getPayableStatement } from "../../api/payableApi";
import "../../styles/payable.css";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const money = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Payable() {
    useTitle("Supplier Payables | Accounting");
    const { can } = usePermission();
    const allowed = can("payables-read") || can("supplier-ledgers-read") || can("suppliers-read");
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
            const response = await getPayables(filters);
            if (id !== requestId.current) return;
            if (!response?.success) throw new Error(response?.message || response?.msg || "Unable to load supplier payables");
            setRows(response.result?.data || []);
            setSummary(response.result?.summary || {});
            setMeta(response.result?.meta || {});
        } catch (e) {
            if (id === requestId.current) setError(e.message || "Unable to load supplier payables");
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

    const openStatement = async (supplier) => {
        setStatementLoading(true);
        try {
            const response = await getPayableStatement(supplier.id, {
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
        return <Result status="403" title="Payables access required" subTitle="You do not have permission to view supplier payables." />;
    }

    const columns = [
        { title: "Supplier", key: "supplier", render: (_, r) => <div><strong>{r.name}</strong><div><Text type="secondary">{r.code || r.phone_number || ""}</Text></div></div> },
        { title: "Contact", key: "contact", render: (_, r) => <div>{r.contact_person || "-"}<div><Text type="secondary">{r.phone_number || ""}</Text></div></div> },
        { title: "Opening", dataIndex: "opening_balance", align: "right", render: money },
        { title: "Current Payable", dataIndex: "current_balance", align: "right", render: (v) => <strong className="phase9-payable">{money(v)}</strong> },
        { title: "Status", render: () => <Tag color="orange">Payable</Tag>, width: 100 },
        { title: "Action", align: "center", width: 80, render: (_, r) => <Tooltip title="View statement"><Button type="text" icon={<EyeOutlined />} onClick={() => openStatement(r)} /></Tooltip> },
    ];

    const dateValue = filters.date_from && filters.date_to ? [dayjs(filters.date_from), dayjs(filters.date_to)] : null;

    return (
        <div className="phase9-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Supplier Payables</h1>
                    <p className="phase9-subtitle">Outstanding amounts currently payable to suppliers.</p>
                </div>
                <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Accounting" }, { title: "Payables" }]} />
            </div>

            <Row gutter={[16,16]}>
                <Col xs={24} md={12}><Card className="phase9-stat phase9-stat-orange"><Statistic title="Total Payable" value={Number(summary.total_payable || 0)} precision={2} prefix="৳" /></Card></Col>
                <Col xs={24} md={12}><Card className="phase9-stat"><Statistic title="Suppliers with Due" value={summary.payable_supplier_count || 0} prefix={<ShopOutlined />} /></Card></Col>
            </Row>

            <Card className="phase9-card" styles={{ body: { padding: 0 } }}>
                <div className="phase9-toolbar">
                    <Input prefix={<SearchOutlined />} allowClear value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search supplier, code or phone" className="phase9-search" />
                    <RangePicker value={dateValue} format="DD MMM YYYY" onChange={(dates) => setFilters((c) => ({ ...c, page: 1, date_from: dates?.[0]?.format("YYYY-MM-DD"), date_to: dates?.[1]?.format("YYYY-MM-DD") }))} />
                    <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>Refresh</Button>
                </div>
                {error && <Alert type="error" showIcon message={error} style={{ margin: 16 }} />}
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No supplier payable found" /> }}
                    pagination={{
                        current: meta.current_page || filters.page,
                        pageSize: meta.per_page || filters.paginate_size,
                        total: meta.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: [10,20,50,100],
                        onChange: (page, pageSize) => setFilters((c) => ({ ...c, page: pageSize !== c.paginate_size ? 1 : page, paginate_size: pageSize })),
                    }}
                    scroll={{ x: 900 }}
                />
            </Card>

            <Drawer
                open={Boolean(statement) || statementLoading}
                onClose={() => setStatement(null)}
                width={720}
                title="Supplier Payable Statement"
                loading={statementLoading}
                destroyOnHidden
            >
                {statement && <>
                    <div className="phase9-statement-hero">
                        <div>
                            <Text type="secondary">{statement.supplier?.code}</Text>
                            <Title level={3}>{statement.supplier?.name}</Title>
                            <Text>{statement.supplier?.phone_number || ""}</Text>
                        </div>
                        <div className="phase9-statement-balance">
                            <span>Closing Payable</span>
                            <strong>{money(statement.summary?.closing_balance)}</strong>
                        </div>
                    </div>
                    <Row gutter={[12,12]} style={{ marginBottom: 16 }}>
                        <Col span={8}><Card size="small"><Statistic title="Opening" value={Number(statement.summary?.opening_balance || 0)} precision={2} prefix="৳" /></Card></Col>
                        <Col span={8}><Card size="small"><Statistic title="Debit" value={Number(statement.summary?.total_debit || 0)} precision={2} prefix="৳" /></Card></Col>
                        <Col span={8}><Card size="small"><Statistic title="Credit" value={Number(statement.summary?.total_credit || 0)} precision={2} prefix="৳" /></Card></Col>
                    </Row>
                    <Table
                        size="small"
                        rowKey="id"
                        pagination={false}
                        dataSource={statement.data || []}
                        columns={[
                            { title: "Date", dataIndex: "transaction_date", render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "-" },
                            { title: "Type", dataIndex: "entry_type", render: (v) => String(v || "").replaceAll("_", " ") },
                            { title: "Ref.", dataIndex: "reference_no" },
                            { title: "Debit", dataIndex: "debit", align: "right", render: money },
                            { title: "Credit", dataIndex: "credit", align: "right", render: money },
                            { title: "Balance", dataIndex: "running_balance", align: "right", render: money },
                        ]}
                        scroll={{ x: 700 }}
                    />
                </>}
            </Drawer>
        </div>
    );
}
