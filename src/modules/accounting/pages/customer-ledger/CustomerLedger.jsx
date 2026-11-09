import {ArrowLeftOutlined,EyeOutlined,PhoneOutlined,ReloadOutlined,SearchOutlined,ShoppingCartOutlined,TeamOutlined} from "@ant-design/icons";
import {Alert,Button,Card,Col,DatePicker,Drawer,Empty,Input,Result,Row,Statistic,Table,Tag,Tooltip,Typography} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getCustomerLedgerStatement, getCustomerLedgers } from "../../api/customerLedgerApi";
import "../../styles/customer-ledger.css";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function CustomerLedger() {
    useTitle("Customer Ledger | Accounting");

    const { can }                                 = usePermission();
    const allowed                                 = can("customer-ledgers-read");
    const [rows, setRows]                         = useState([]);
    const [summary, setSummary]                   = useState({});
    const [meta, setMeta]                         = useState({current_page: 1,per_page: 20,total: 0});
    const [filters, setFilters]                   = useState({page: 1,paginate_size: 20,search_key: "",date_from: undefined,date_to: undefined});
    const [query, setQuery]                       = useState("");
    const [loading, setLoading]                   = useState(false);
    const [error, setError]                       = useState(null);
    const [statement, setStatement]               = useState(null);
    const [statementLoading, setStatementLoading] = useState(false);
    const requestId                               = useRef(0);
    const statementRequest                        = useRef(0);
    const [statementPhone, setStatementPhone]     = useState(null);
    const [statementError, setStatementError]     = useState("");

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
                setSummary({});
                setMeta({});
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
            setFilters((current) => current.search_key === query.trim() ? current : { ...current, page: 1, search_key: query.trim() });
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    const openStatement = async (phone, page = 1, pageSize = 20) => {
        const id = ++statementRequest.current;
        setStatementPhone(phone);
        setStatementError("");
        setStatementLoading(true);

        if (phone !== statementPhone) {
            setStatement(null);
        }

        try {
            const response = await getCustomerLedgerStatement(
                phone,
                {
                    date_from: filters.date_from,
                    date_to: filters.date_to,
                    page,
                    paginate_size: pageSize,
                }
            );

            if (id !== statementRequest.current) return;

            if (!response?.success) {
                throw new Error(response?.message || response?.msg || "লেনদেনের বিবরণ লোড হয়নি।");
            }

            setStatement(response.result);
        } catch (statementError) {
            if (id === statementRequest.current) setStatementError(statementError.message);
        } finally {
            if (id === statementRequest.current) setStatementLoading(false);
        }
    };

    if (!allowed) {
        return (
            <Result status="403" title="Customer Ledger access required" subTitle="You do not have permission to view customer ledgers."/>
        );
    }

    const dateValue = filters.date_from && filters.date_to ? [dayjs(filters.date_from), dayjs(filters.date_to)] : null;

    const serialColumn = (pagination) => ({
        title : "SL",
        key   : "serial",
        width : 64,
        align : "center",
        render: (_, __, index) => ((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 20) + index + 1,
    });

    const columns = 
    [
        serialColumn(meta),
        {
            title: "গ্রাহক",
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
            title: "অর্ডার",
            dataIndex: "order_count",
            width: 90,
            align: "center",
        },
        {
            title: "মোট বিক্রি",
            dataIndex: "gross_sales",
            width: 140,
            align: "right",
            render: money,
        },
        {
            title: "ফেরত",
            dataIndex: "return_adjustment",
            width: 125,
            align: "right",
            render: (value) => (
                <span className="cl-return">-{money(value)}</span>
            ),
        },
        {
            title: "নিট বিক্রি",
            dataIndex: "net_sales",
            width: 140,
            align: "right",
            render: money,
        },
        {
            title: "জমা",
            dataIndex: "total_received",
            width: 140,
            align: "right",
            render: (value) => (
                <span className="cl-received">{money(value)}</span>
            ),
        },
        {
            title: "বাকি",
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
            title: "অবস্থা",
            dataIndex: "balance_status",
            width: 95,
            align: "center",
            render: (value) => value === "due" ? <Tag color="red">Due</Tag> : <Tag color="green">Settled</Tag>,
        },
        {
            title: "শেষ অর্ডার",
            dataIndex: "last_order_date",
            width: 130,
            render: (value) => value ? dayjs(value).format("DD MMM YYYY") : "-",
        },
        {
            title: "বিবরণ",
            width: 80,
            fixed: "right",
            align: "center",
            render: (_, record) => (
                <Tooltip title="View ledger statement">
                    <Button type="text" icon={<EyeOutlined />} aria-label="লেনদেনের বিবরণ দেখুন" onClick={() => openStatement(record.phone_number)}/>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="customer-ledger-page">
            <div className="pagehead cl-hero">
                <div className="head-left">
                    <span className="cl-eyebrow">ACCOUNTING · গ্রাহকের হিসাব</span>

                    <h1 className="title">গ্রাহক লেজার</h1>
                    
                    <p className="cl-subtitle">
                        মোবাইল নম্বর দিয়ে গ্রাহকের বিক্রি, জমা ও বাকি দেখুন।
                    </p>
                </div>

                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>ফিরে যান</Button>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="cl-stat">
                        <Statistic title="গ্রাহক" value={summary.customer_count || 0} prefix={<TeamOutlined />}/>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="cl-stat">
                        <Statistic title="হিসাবে থাকা অর্ডার" value={summary.order_count || 0} prefix={<ShoppingCartOutlined />}/>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="cl-stat cl-stat-green">
                        <Statistic title="নিট বিক্রি" value={Number(summary.net_sales || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="cl-stat cl-stat-red">
                        <Statistic title="মোট বাকি" value={Number(summary.current_balance || 0)} formatter={money}/>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card size="small" className="cl-mini-stat">
                        <Statistic title="মোট বিক্রি" value={Number(summary.gross_sales || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card size="small" className="cl-mini-stat">
                        <Statistic title="আংশিক ফেরত" value={Number(summary.return_adjustment || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card size="small" className="cl-mini-stat">
                        <Statistic title="জমা" value={Number(summary.total_received || 0)} formatter={money}/>
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
                        placeholder="নাম, মোবাইল বা ইনভয়েস খুঁজুন"
                        className="cl-search"
                    />

                    <RangePicker
                        value={dateValue}
                        format="DD MMM YYYY"
                        onChange={(dates) =>
                            setFilters((current) => ({
                                ...current,
                                page     : 1,
                                date_from: dates?.[0]?.format("YYYY-MM-DD"),
                                date_to  : dates?.[1]?.format("YYYY-MM-DD"),
                            }))
                        }
                    />

                    <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>
                        রিফ্রেশ
                    </Button>
                </div>

                <Alert type="info" showIcon className="cl-info" message="মোবাইল নম্বর অনুযায়ী গ্রাহকের হিসাব একত্র করা হয়েছে।" description="ডেলিভারি ও আংশিক ফেরত হওয়া অর্ডারগুলো এই হিসাবে অন্তর্ভুক্ত।"/>

                {error && (
                    <Alert type="error" showIcon message={error} style={{ margin: 16 }}/>
                )}

                <Table
                    rowKey="phone_number"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    scroll={{ x: 1514 }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="কোনো গ্রাহকের হিসাব পাওয়া যায়নি"
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
                open={Boolean(statementPhone)}
                onClose={() => {
                    statementRequest.current++;
                    setStatementPhone(null);
                    setStatement(null);
                    setStatementLoading(false);
                }}
                width="min(960px, 100vw)"
                title="গ্রাহকের লেনদেনের বিবরণ"
                loading={statementLoading}
                destroyOnHidden
            >
                {statementError && <Alert type="error" showIcon message={statementError} />}
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
                                        formatter={money}
                                    />
                                </Card>
                            </Col>

                            <Col xs={12} lg={6}>
                                <Card size="small">
                                    <Statistic
                                        title="নিট বিক্রি"
                                        value={Number(
                                            statement.summary?.net_sales || 0
                                        )}
                                        formatter={money}
                                    />
                                </Card>
                            </Col>

                            <Col xs={12} lg={6}>
                                <Card size="small">
                                    <Statistic
                                        title="জমা"
                                        value={Number(
                                            statement.summary?.total_received || 0
                                        )}
                                        formatter={money}
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
                                        formatter={money}
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
                            pagination={{
                                current: statement.meta?.current_page ?? 1,
                                pageSize: statement.meta?.per_page ?? 20,
                                total: statement.meta?.total ?? 0,
                                onChange: (page, size) => openStatement(statementPhone, page, size),
                            }}
                            dataSource={statement.data || []}
                            scroll={{ x: 1050 }}
                            columns={[
                                serialColumn(statement.meta),
                                {
                                    title: "তারিখ",
                                    dataIndex: "order_date",
                                    width: 115,
                                    render: (value) =>
                                        value
                                            ? dayjs(value).format("DD MMM YYYY")
                                            : "-",
                                },
                                {
                                    title: "ইনভয়েস",
                                    dataIndex: "invoice_number",
                                    width: 130,
                                    render: (value, record) =>
                                        value || `#${record.order_id}`,
                                },
                                {
                                    title: "অবস্থা",
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
                                    title: "জমা",
                                    dataIndex: "received_amount",
                                    align: "right",
                                    render: (value) =>
                                        <span className="cl-received">{money(value)}</span>,
                                },
                                {
                                    title: "বাকি",
                                    dataIndex: "outstanding",
                                    align: "right",
                                    render: (value) =>
                                        <span className="cl-due">{money(value)}</span>,
                                },
                                {
                                    title: "চলতি বাকি",
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
