import {ArrowDownOutlined,ArrowUpOutlined,BookOutlined,EyeOutlined,ReloadOutlined,SearchOutlined,TeamOutlined,WalletOutlined} from "@ant-design/icons";
import {Alert,Breadcrumb,Button,Card,Col,DatePicker,Drawer,Empty,Input,Row,Select,Space,Statistic,Table,Tag,Typography} from "antd";
import dayjs from "dayjs";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import { Link } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import {getSupplierLedgerStatement,getSupplierLedgers} from "../../api/supplierLedgerApi";
import "../../styles/supplier-ledger.css";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const firstError = (response, fallback) =>
    Object.values(response?.errors || {}).flat()[0] ||
    response?.message ||
    response?.msg ||
    fallback;

const typeLabel = {
    purchase             : "Product Purchase",
    raw_material_purchase: "Raw Material Purchase",
    purchase_return      : "Purchase Return",
    payment              : "Payment",
};

function BalanceTag({ type }) {
    return (
        <Tag color={type === "payable" ? "orange" : type === "receivable" ? "green" : "default"} bordered={false} style={{textTransform: "capitalize"}}>
            {type || "settled"}
        </Tag>
    );
}

export default function SupplierLedger() {
    useTitle("Supplier Ledger | Accounting");

    const { can }                                 = usePermission();
    const canRead                                 = can("supplier-ledgers-read") || can("suppliers-read");
    const requestId                               = useRef(0);
    const [rows, setRows]                         = useState([]);
    const [summary, setSummary]                   = useState({});
    const [loading, setLoading]                   = useState(false);
    const [error, setError]                       = useState(null);
    const [query, setQuery]                       = useState("");
    const [filters, setFilters]                   = useState({page: 1,paginate_size: 10,search_key: "",balance_type: undefined});
    const [total, setTotal]                       = useState(0);
    const [selected, setSelected]                 = useState(null);
    const [statement, setStatement]               = useState(null);
    const [statementLoading, setStatementLoading] = useState(false);
    const [statementError, setStatementError]     = useState(null);
    const [statementFilters, setStatementFilters] = useState({
        page         : 1,
        paginate_size: 15,
        entry_type   : undefined,
        date_from    : undefined,
        date_to      : undefined,
    });

    const load = useCallback(
        async (next = filters) => {
            if (!canRead) return;

            const id = ++requestId.current;

            setLoading(true);
            setError(null);

            try {
                const response = await getSupplierLedgers(next);

                if (id !== requestId.current) return;

                if (!response?.success) {
                    throw new Error(firstError(response,"Unable to load supplier ledgers"));
                }

                setRows(response.result?.data || []);
                setSummary(response.result?.summary || {});
                setTotal(response.result?.meta?.total || 0);
            } catch (e) {
                if (id !== requestId.current) return;

                setRows([]);
                setTotal(0);
                setError(e.message || "Unable to load supplier ledgers");
            } finally {
                if (id === requestId.current) {
                    setLoading(false);
                }
            }
        },
        [canRead, filters]
    );

    useEffect(() => {
        load(filters);
    }, [filters]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const value = query.trim();

            if (value !== filters.search_key) {
                setFilters((x) => ({
                    ...x,
                    search_key: value,
                    page: 1,
                }));
            }
        }, 350);

        return () => window.clearTimeout(timer);
    }, [query, filters.search_key]);

    const loadStatement = useCallback(
        async (supplier = selected, next = statementFilters) => {
            if (!supplier) return;

            setStatementLoading(true);
            setStatementError(null);

            try {
                const response = await getSupplierLedgerStatement(
                    supplier.id,
                    next
                );

                if (!response?.success) {
                    throw new Error(firstError(response,"Unable to load supplier statement"));
                }

                setStatement(response.result);
            } catch (e) {
                setStatement(null);
                setStatementError(e.message || "Unable to load supplier statement");
            } finally {
                setStatementLoading(false);
            }
        },
        [selected, statementFilters]
    );

    useEffect(() => {
        if (selected) {
            loadStatement(selected, statementFilters);
        }
    }, [selected, statementFilters]);

    const openStatement = (supplier) => {
        setSelected(supplier);
        setStatement(null);

        setStatementFilters({
            page         : 1,
            paginate_size: 15,
            entry_type   : undefined,
            date_from    : undefined,
            date_to      : undefined,
        });
    };

    const columns = useMemo(
        () => [
            {
                title: "SL",
                width: 70,
                align: "center",
                render: (_, __, index) => (filters.page - 1) * filters.paginate_size + index + 1,
            },
            {
                title: "Supplier",
                key: "supplier",
                render: (_, record) => (
                    <div className="supplier-ledger-identity">
                        <strong>{record.name}</strong>
                        <span>
                            {record.code}{" "}
                            {record.phone_number ? `· ${record.phone_number}` : ""}
                        </span>
                    </div>
                ),
            },
            {
                title: "Opening Balance",
                dataIndex: "opening_balance",
                align: "right",
                width: 170,
                render: (value, record) => (
                    <>
                        <strong>{money(value)}</strong>
                        <br />
                        <BalanceTag type={record.opening_balance_type}/>
                    </>
                ),
            },
            {
                title: "Current Balance",
                dataIndex: "current_balance",
                align: "right",
                width: 180,
                render: (value, record) => (
                    <>
                        <strong className="supplier-ledger-current">
                            {money(value)}
                        </strong>
                        <br />
                        <BalanceTag type={record.balance_type} />
                    </>
                ),
            },
            {
                title: "Action",
                width: 110,
                align: "center",
                render: (_, record) => (
                    <Button icon={<EyeOutlined />} onClick={() => openStatement(record)}>
                        Statement
                    </Button>
                ),
            },
        ],
        [filters.page, filters.paginate_size]
    );

    const statementColumns = 
    [
        {
            title: "Date",
            dataIndex: "transaction_date",
            width: 170,
            render: (value) => value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "-",
        },
        {
            title: "Transaction",
            key: "transaction",
            width: 190,
            render: (_, record) => (
                <div className="supplier-ledger-transaction">
                    <strong>
                        {typeLabel[record.entry_type] || record.entry_type}
                    </strong>

                    <span>
                        {record.reference_no || record.note || "-"}
                    </span>
                </div>
            ),
        },
        {
            title: "Debit",
            dataIndex: "debit",
            align: "right",
            width: 130,
            render: (value) =>
                Number(value) ? (
                    <span className="ledger-debit">
                        {money(value)}
                    </span>
                ) : (
                    "-"
                ),
        },
        {
            title: "Credit",
            dataIndex: "credit",
            align: "right",
            width: 130,
            render: (value) =>
                Number(value) ? (
                    <span className="ledger-credit">
                        {money(value)}
                    </span>
                ) : (
                    "-"
                ),
        },
        {
            title: "Balance",
            dataIndex: "running_balance",
            align: "right",
            width: 160,
            render: (value, record) => (
                <>
                    <strong>{money(value)}</strong>
                    <br />
                    <BalanceTag type={record.balance_type} />
                </>
            ),
        },
    ];

    if (!canRead) {
        return (
            <Result status="403" title="403" subTitle="You do not have permission to view supplier ledger."/>
        );
    }

    return (
        <div className="supplier-ledger-page">
            <Breadcrumb
                items={[
                    {
                        title: <Link to="/dashboard">Dashboard</Link>,
                    },
                    { title: "Accounting" },
                    { title: "Supplier Ledger" },
                ]}
            />

            <div className="supplier-ledger-heading">
                <div>
                    <span className="supplier-ledger-eyebrow">ACCOUNTING · সরবরাহকারীর হিসাব</span>
                    <Title level={2}>সরবরাহকারী লেজার</Title>
                    <Text type="secondary">
                        ক্রয়, ফেরত, পরিশোধ ও বর্তমান দেনা-পাওনা এক জায়গায় দেখুন।
                    </Text>
                </div>

                <Button icon={<ReloadOutlined />} onClick={() => load(filters)} loading={loading}>
                    রিফ্রেশ
                </Button>
            </div>

            <Row gutter={[16, 16]} className="supplier-ledger-summary">
                <Col xs={24} sm={12} xl={6}>
                    <Card>
                        <Statistic title="সরবরাহকারী" value={summary.supplier_count || 0} prefix={<TeamOutlined />}/>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card>
                        <Statistic
                            title="সরবরাহকারীকে মোট দিতে হবে"
                            value={Number(summary.total_payable || 0)}
                            precision={2}
                            prefix={<ArrowUpOutlined />}
                            suffix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card>
                        <Statistic
                            title="সরবরাহকারীর কাছ থেকে মোট পাবেন"
                            value={Number(summary.total_receivable || 0)}
                            precision={2}
                            prefix={<ArrowDownOutlined />}
                            suffix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card>
                        <Statistic title="হিসাব মিটেছে" value={summary.settled_count || 0} prefix={<WalletOutlined />}/>
                    </Card>
                </Col>
            </Row>

            <Card className="supplier-ledger-card">
                <div className="supplier-ledger-section">
                    <Title level={4}>সরবরাহকারীর তালিকা</Title>
                    <Text type="secondary">লেনদেন দেখতে সংশ্লিষ্ট সরবরাহকারীর বিবরণ খুলুন।</Text>
                </div>
                <div className="supplier-ledger-filters">
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="নাম, কোড বা মোবাইল নম্বর খুঁজুন"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <Select
                        allowClear
                        placeholder="হিসাবের অবস্থা"
                        value={filters.balance_type}
                        onChange={(value) =>
                            setFilters((x) => ({
                                ...x,
                                balance_type: value,
                                page: 1,
                            }))
                        }
                        options={[
                            { 
                                value: "payable", 
                                label: "দিতে হবে" 
                            },
                            { 
                                value: "receivable", 
                                label: "পাবেন" 
                            },
                            { 
                                value: "settled", 
                                label: "হিসাব মিটেছে" 
                            },
                        ]}
                    />
                </div>

                {error && (
                    <Alert type="error" showIcon message={error} className="supplier-ledger-alert"/>
                )}

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    locale={{
                        emptyText: (
                            <Empty description="No supplier ledger found" />
                        ),
                    }}
                    scroll={{ x: 850 }}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.paginate_size,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        onChange: (page, pageSize) =>
                            setFilters((x) => ({
                                ...x,
                                page,
                                paginate_size: pageSize,
                            })),
                    }}
                />
            </Card>

            <Drawer
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                width={1050}
                title={
                    <Space>
                        <BookOutlined />
                        <span>
                            {selected?.name} · Supplier Statement
                        </span>
                    </Space>
                }
            >
                <div className="supplier-ledger-statement-filters">
                    <RangePicker
                        value={
                            statementFilters.date_from
                                ? [
                                      dayjs(statementFilters.date_from),
                                      dayjs(statementFilters.date_to),
                                  ]
                                : null
                        }
                        onChange={(dates) =>
                            setStatementFilters((x) => ({
                                ...x,
                                page: 1,
                                date_from: dates?.[0]?.format("YYYY-MM-DD"),
                                date_to: dates?.[1]?.format("YYYY-MM-DD"),
                            }))
                        }
                    />

                    <Select
                        allowClear
                        placeholder="Transaction type"
                        value={statementFilters.entry_type}
                        onChange={(value) =>
                            setStatementFilters((x) => ({
                                ...x,
                                page: 1,
                                entry_type: value,
                            }))
                        }
                        options={Object.entries(typeLabel).map(
                            ([value, label]) => ({
                                value,
                                label,
                            })
                        )}
                    />

                    <Button icon={<ReloadOutlined />} onClick={() => loadStatement(selected, statementFilters)}>
                        Refresh
                    </Button>
                </div>

                {statementError && (
                    <Alert type="error" showIcon message={statementError} className="supplier-ledger-alert"/>
                )}

                <Row gutter={[12, 12]} className="statement-summary">
                    <Col xs={12} lg={6}>
                        <Card size="small">
                            <Statistic
                                title="Opening"
                                value={Number(
                                    statement?.summary?.opening_balance || 0
                                )}
                                precision={2}
                                suffix="৳"
                            />
                        </Card>
                    </Col>

                    <Col xs={12} lg={6}>
                        <Card size="small">
                            <Statistic
                                title="Debit"
                                value={Number(
                                    statement?.summary?.total_debit || 0
                                )}
                                precision={2}
                                suffix="৳"
                            />
                        </Card>
                    </Col>

                    <Col xs={12} lg={6}>
                        <Card size="small">
                            <Statistic
                                title="Credit"
                                value={Number(
                                    statement?.summary?.total_credit || 0
                                )}
                                precision={2}
                                suffix="৳"
                            />
                        </Card>
                    </Col>

                    <Col xs={12} lg={6}>
                        <Card size="small">
                            <Statistic
                                title={`Closing (${
                                    statement?.summary?.closing_balance_type ||
                                    "settled"
                                })`}
                                value={Number(
                                    statement?.summary?.closing_balance || 0
                                )}
                                precision={2}
                                suffix="৳"
                            />
                        </Card>
                    </Col>
                </Row>

                <Table
                    rowKey="id"
                    columns={statementColumns}
                    dataSource={statement?.data || []}
                    loading={statementLoading}
                    scroll={{ x: 850 }}
                    locale={{
                        emptyText: (
                            <Empty description="No ledger transactions found" />
                        ),
                    }}
                    pagination={{
                        current: statement?.meta?.current_page || statementFilters.page,
                        pageSize: statementFilters.paginate_size,
                        total: statement?.meta?.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: [15, 30, 50, 100],
                        onChange: (page, pageSize) =>
                            setStatementFilters((x) => ({
                                ...x,
                                page,
                                paginate_size: pageSize,
                            })),
                    }}
                />
            </Drawer>
        </div>
    );
}
