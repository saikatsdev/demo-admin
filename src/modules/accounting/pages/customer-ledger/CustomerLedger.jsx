import {
    EyeOutlined,
    PhoneOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    WalletOutlined
} from "@ant-design/icons";
import {
    Alert,
    Breadcrumb,
    Button,
    Card,
    Col,
    DatePicker,
    Drawer,
    Empty,
    Input,
    Result,
    Row,
    Statistic,
    Table,
    Tag,
    Tooltip,
    Typography
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getCustomerLedgerStatement, getCustomerLedgers } from "../../api/customerLedgerApi";
import "../../styles/customer-ledger.css";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function CustomerLedger() {
    useTitle("Customer Ledger | Accounting");

    const { can } = usePermission();
    const allowed = can("customer-ledgers-read");

    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [meta, setMeta] = useState({
        current_page: 1,
        per_page: 20,
        total: 0,
    });

    const [filters, setFilters] = useState({
        page: 1,
        paginate_size: 20,
        search_key: "",
        date_from: undefined,
        date_to: undefined,
    });

    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [statement, setStatement] = useState(null);
    const [statementLoading, setStatementLoading] = useState(false);

    const requestId = useRef(0);

    const load = useCallback(async () => {
        if (!allowed) return;

        const currentRequest = ++requestId.current;

        setLoading(true);
        setError(null);

        try {
            const response = await getCustomerLedgers(filters);

            if (currentRequest !== requestId.current) return;

            if (!response?.success) {
                throw new Error(
                    response?.message ||
                    response?.msg ||
                    "Unable to load customer ledger"
                );
            }

            setRows(response.result?.data || []);
            setSummary(response.result?.summary || {});
            setMeta(response.result?.meta || {});
        } catch (loadError) {
            if (currentRequest === requestId.current) {
                setRows([]);
                setError(loadError.message || "Unable to load customer ledger");
            }
        } finally {
            if (currentRequest === requestId.current) {
                setLoading(false);
            }
        }
    }, [allowed, filters]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== filters.search_key) {
                setFilters((current) => ({
                    ...current,
                    page: 1,
                    search_key: query,
                }));
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    const openStatement = async (record) => {
        setStatementLoading(true);

        try {
            const response = await getCustomerLedgerStatement(
                record.phone_number,
                {
                    date_from: filters.date_from,
                    date_to: filters.date_to,
                    paginate_size: 100,
                }
            );

            if (response?.success) {
                setStatement(response.result);
            }
        } finally {
            setStatementLoading(false);
        }
    };

    if (!allowed) {
        return (
            <Result
                status="403"
                title="Customer Ledger access required"
                subTitle="You do not have permission to view customer ledgers."
            />
        );
    }

    const dateValue =
        filters.date_from && filters.date_to
            ? [dayjs(filters.date_from), dayjs(filters.date_to)]
            : null;

    const columns = [
        {
            title: "Customer",
            key: "customer",
            width: 240,
            render: (_, record) => (
                <div className="cl-customer">
                    <strong>{record.customer_name || "Unknown Customer"}</strong>
                    <Text type="secondary">
                        <PhoneOutlined /> {record.phone_number}
                    </Text>
                </div>
            ),
        },
        {
            title: "Orders",
            dataIndex: "order_count",
            width: 90,
            align: "center",
        },
        {
            title: "Gross Sales",
            dataIndex: "gross_sales",
            width: 140,
            align: "right",
            render: money,
        },
        {
            title: "Returns",
            dataIndex: "return_adjustment",
            width: 125,
            align: "right",
            render: (value) => (
                <span className="cl-return">-{money(value)}</span>
            ),
        },
        {
            title: "Net Sales",
            dataIndex: "net_sales",
            width: 140,
            align: "right",
            render: money,
        },
        {
            title: "Received",
            dataIndex: "total_received",
            width: 140,
            align: "right",
            render: (value) => (
                <span className="cl-received">{money(value)}</span>
            ),
        },
        {
            title: "Balance",
            dataIndex: "current_balance",
            width: 140,
            align: "right",
            render: (value) => (
                <strong className={Number(value) > 0 ? "cl-due" : "cl-settled"}>
                    {money(value)}
                </strong>
            ),
        },
        {
            title: "Status",
            dataIndex: "balance_status",
            width: 95,
            align: "center",
            render: (value) =>
                value === "due"
                    ? <Tag color="red">Due</Tag>
                    : <Tag color="green">Settled</Tag>,
        },
        {
            title: "Last Order",
            dataIndex: "last_order_date",
            width: 130,
            render: (value) =>
                value ? dayjs(value).format("DD MMM YYYY") : "-",
        },
        {
            title: "Action",
            width: 80,
            fixed: "right",
            align: "center",
            render: (_, record) => (
                <Tooltip title="View ledger statement">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => openStatement(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="customer-ledger-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Customer Ledger</h1>
                    <p className="cl-subtitle">
                        Phone-based customer financial history from delivered orders,
                        payments, dues and partial returns.
                    </p>
                </div>

                <Breadcrumb
                    items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "Accounting" },
                        { title: "Customer Ledger" },
                    ]}
                />
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="cl-stat">
                        <Statistic
                            title="Customers"
                            value={summary.customer_count || 0}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="cl-stat">
                        <Statistic
                            title="Financial Orders"
                            value={summary.order_count || 0}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="cl-stat cl-stat-green">
                        <Statistic
                            title="Net Sales"
                            value={Number(summary.net_sales || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="cl-stat cl-stat-red">
                        <Statistic
                            title="Customer Balance Due"
                            value={Number(summary.current_balance || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card size="small" className="cl-mini-stat">
                        <Statistic
                            title="Gross Sales"
                            value={Number(summary.gross_sales || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card size="small" className="cl-mini-stat">
                        <Statistic
                            title="Partial Return Adjustment"
                            value={Number(summary.return_adjustment || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card size="small" className="cl-mini-stat">
                        <Statistic
                            title="Received"
                            value={Number(summary.total_received || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="cl-card" styles={{ body: { padding: 0 } }}>
                <div className="cl-toolbar">
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search customer, phone or invoice"
                        className="cl-search"
                    />

                    <RangePicker
                        value={dateValue}
                        format="DD MMM YYYY"
                        onChange={(dates) =>
                            setFilters((current) => ({
                                ...current,
                                page: 1,
                                date_from: dates?.[0]?.format("YYYY-MM-DD"),
                                date_to: dates?.[1]?.format("YYYY-MM-DD"),
                            }))
                        }
                    />

                    <Button
                        icon={<ReloadOutlined />}
                        loading={loading}
                        onClick={load}
                    >
                        Refresh
                    </Button>
                </div>

                <Alert
                    type="info"
                    showIcon
                    className="cl-info"
                    message="Customer identity is grouped by normalized phone number."
                    description="Financial balance includes Delivered and Partial Returned orders. Partial return value is deducted before calculating customer outstanding balance."
                />

                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={error}
                        style={{ margin: 16 }}
                    />
                )}

                <Table
                    rowKey="phone_number"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    scroll={{ x: 1450 }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No customer ledger found"
                            />
                        ),
                    }}
                    pagination={{
                        current: meta.current_page || filters.page,
                        pageSize: meta.per_page || filters.paginate_size,
                        total: meta.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        showTotal: (total, range) =>
                            `${range[0]}–${range[1]} of ${total}`,
                        onChange: (page, pageSize) =>
                            setFilters((current) => ({
                                ...current,
                                page:
                                    pageSize !== current.paginate_size
                                        ? 1
                                        : page,
                                paginate_size: pageSize,
                            })),
                    }}
                />
            </Card>

            <Drawer
                open={Boolean(statement) || statementLoading}
                onClose={() => setStatement(null)}
                width={920}
                title="Customer Ledger Statement"
                loading={statementLoading}
                destroyOnHidden
            >
                {statement && (
                    <>
                        <div className="cl-statement-hero">
                            <div>
                                <Text type="secondary">
                                    {statement.customer?.phone_number}
                                </Text>

                                <Title level={3}>
                                    {statement.customer?.customer_name}
                                </Title>

                                <Text type="secondary">
                                    {statement.customer?.address_details || ""}
                                </Text>
                            </div>

                            <div className="cl-statement-balance">
                                <span>Closing Balance</span>
                                <strong>
                                    {money(statement.summary?.closing_balance)}
                                </strong>
                            </div>
                        </div>

                        <Row gutter={[10, 10]} className="cl-statement-stats">
                            <Col xs={12} lg={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Opening"
                                        value={Number(
                                            statement.summary?.opening_balance || 0
                                        )}
                                        precision={2}
                                        prefix="৳"
                                    />
                                </Card>
                            </Col>

                            <Col xs={12} lg={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Net Sales"
                                        value={Number(
                                            statement.summary?.net_sales || 0
                                        )}
                                        precision={2}
                                        prefix="৳"
                                    />
                                </Card>
                            </Col>

                            <Col xs={12} lg={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Received"
                                        value={Number(
                                            statement.summary?.total_received || 0
                                        )}
                                        precision={2}
                                        prefix="৳"
                                    />
                                </Card>
                            </Col>

                            <Col xs={12} lg={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Period Due"
                                        value={Number(
                                            statement.summary?.period_outstanding || 0
                                        )}
                                        precision={2}
                                        prefix="৳"
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <div className="cl-statement-summary-line">
                            <span>
                                Orders: <strong>{statement.summary?.order_count || 0}</strong>
                            </span>
                            <span>
                                Gross Sales: <strong>{money(statement.summary?.gross_sales)}</strong>
                            </span>
                            <span>
                                Returns: <strong>-{money(statement.summary?.return_adjustment)}</strong>
                            </span>
                        </div>

                        <Table
                            rowKey="order_id"
                            size="small"
                            pagination={false}
                            dataSource={statement.data || []}
                            scroll={{ x: 1050 }}
                            columns={[
                                {
                                    title: "Date",
                                    dataIndex: "order_date",
                                    width: 115,
                                    render: (value) =>
                                        value
                                            ? dayjs(value).format("DD MMM YYYY")
                                            : "-",
                                },
                                {
                                    title: "Invoice",
                                    dataIndex: "invoice_number",
                                    width: 130,
                                    render: (value, record) =>
                                        value || `#${record.order_id}`,
                                },
                                {
                                    title: "Status",
                                    dataIndex: "status",
                                    width: 120,
                                },
                                {
                                    title: "Gross Sale",
                                    dataIndex: "gross_sale",
                                    align: "right",
                                    render: money,
                                },
                                {
                                    title: "Return",
                                    dataIndex: "return_adjustment",
                                    align: "right",
                                    render: (value) =>
                                        Number(value) > 0
                                            ? <span className="cl-return">-{money(value)}</span>
                                            : money(0),
                                },
                                {
                                    title: "Net Sale",
                                    dataIndex: "net_sale",
                                    align: "right",
                                    render: money,
                                },
                                {
                                    title: "Received",
                                    dataIndex: "received_amount",
                                    align: "right",
                                    render: (value) =>
                                        <span className="cl-received">{money(value)}</span>,
                                },
                                {
                                    title: "Outstanding",
                                    dataIndex: "outstanding",
                                    align: "right",
                                    render: (value) =>
                                        <span className="cl-due">{money(value)}</span>,
                                },
                                {
                                    title: "Running Balance",
                                    dataIndex: "running_balance",
                                    align: "right",
                                    render: (value) => <strong>{money(value)}</strong>,
                                },
                            ]}
                        />
                    </>
                )}
            </Drawer>
        </div>
    );
}
