import {ArrowDownOutlined,ArrowUpOutlined,ReloadOutlined,SearchOutlined,ShoppingCartOutlined} from "@ant-design/icons";
import {Alert,Breadcrumb,Button,Card,Col,DatePicker,Empty,Input,Result,Row,Statistic,Table,Tabs,Tooltip,Typography} from "antd";
import dayjs from "dayjs";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import { Link } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import {getOrderProfit,getProductProfit,getProfitSummary,getProfitTrend} from "../../api/profitManagementApi";
import "../../styles/profit-management.css";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const initialRange = [dayjs().startOf("month"), dayjs()];

export default function ProfitManagement() {
    useTitle("Profit Management | Accounting");

    const { can }                               = usePermission();
    const allowed                               = can("profit-management-read");
    const [range, setRange]                     = useState(initialRange);
    const [summary, setSummary]                 = useState({});
    const [trend, setTrend]                     = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [error, setError]                     = useState(null);
    const [activeTab, setActiveTab]             = useState("daily");
    const [orders, setOrders]                   = useState([]);
    const [orderMeta, setOrderMeta]             = useState({current_page: 1,per_page: 20,total: 0});
    const [orderPage, setOrderPage]             = useState(1);
    const [orderPageSize, setOrderPageSize]     = useState(20);
    const [orderSearch, setOrderSearch]         = useState("");
    const [products, setProducts]               = useState([]);
    const [productMeta, setProductMeta]         = useState({current_page: 1,per_page: 20,total: 0});
    const [productPage, setProductPage]         = useState(1);
    const [productPageSize, setProductPageSize] = useState(20);
    const [productSearch, setProductSearch]     = useState("");
    const [productNote, setProductNote]         = useState("");

    const requestId = useRef(0);

    const period = useMemo(
        () => ({
            date_from: range?.[0]?.format("YYYY-MM-DD"),
            date_to: range?.[1]?.format("YYYY-MM-DD"),
        }),
        [range]
    );

    const loadOverview = useCallback(async () => {
        if (!allowed) return;

        const id = ++requestId.current;

        setLoading(true);
        setError(null);

        try {
            const [s, t] = await Promise.all([
                getProfitSummary(period),
                getProfitTrend(period),
            ]);

            if (id !== requestId.current) return;

            if (!s?.success) {
                throw new Error(
                    s?.message || s?.msg || "Unable to load profit summary"
                );
            }

            setSummary(s.result || []);
            setTrend(t?.success ? (t.result || []) : []);
        } catch (e) {
            if (id === requestId.current) {
                setError(e.message || "Unable to load profit report");
            }
        } finally {
            if (id === requestId.current) {
                setLoading(false);
            }
        }
    }, [allowed, period]);

    const loadOrders = useCallback(async () => {
        if (!allowed) return;

        const response = await getOrderProfit({
            ...period,
            page: orderPage,
            paginate_size: orderPageSize,
            search_key: orderSearch || undefined,
        });

        if (response?.success) {
            setOrders(response.result?.data || []);
            setOrderMeta(response.result?.meta || {});
        }
    }, [allowed, period, orderPage, orderPageSize, orderSearch]);

    const loadProducts = useCallback(async () => {
        if (!allowed) return;

        const response = await getProductProfit({
            ...period,
            page: productPage,
            paginate_size: productPageSize,
            search_key: productSearch || undefined,
        });

        if (response?.success) {
            setProducts(response.result?.data || []);
            setProductMeta(response.result?.meta || {});
            setProductNote(response.result?.note || "");
        }
    }, [allowed, period, productPage, productPageSize, productSearch]);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    useEffect(() => {
        if (activeTab === "orders") loadOrders();
    }, [activeTab, loadOrders]);

    useEffect(() => {
        if (activeTab === "products") loadProducts();
    }, [activeTab, loadProducts]);

    if (!allowed) {
        return (
            <Result status="403" title="Profit Management access required" subTitle="You do not have permission to view profit reports."/>
        );
    }

    const netProfit = Number(summary.net_profit || 0);
    const positive = netProfit >= 0;

    const dailyColumns = 
    [
        {
            title: "Date",
            dataIndex: "date",
            width: 120,
            render: (v) => dayjs(v).format("DD MMM YYYY"),
        },
        {
            title: "Orders",
            dataIndex: "order_count",
            width: 85,
            align: "center",
        },
        {
            title: "Net Sales",
            dataIndex: "net_sales",
            align: "right",
            render: money,
        },
        {
            title: "COGS",
            dataIndex: "cogs",
            align: "right",
            render: money,
        },
        {
            title: "Gross Profit",
            dataIndex: "gross_profit",
            align: "right",
            render: (v) => <strong>{money(v)}</strong>,
        },
        {
            title: "Order Costs",
            dataIndex: "order_costs",
            align: "right",
            render: money,
        },
        {
            title: "Other Income",
            dataIndex: "other_income",
            align: "right",
            render: (v) => (
                <span className="pm-positive">{money(v)}</span>
            ),
        },
        {
            title: "Expenses",
            dataIndex: "operating_expense",
            align: "right",
            render: (v) => (
                <span className="pm-negative">{money(v)}</span>
            ),
        },
        {
            title: "Net Profit",
            dataIndex: "net_profit",
            align: "right",
            render: (v) => (
                <strong
                    className={
                        Number(v) >= 0 ? "pm-positive" : "pm-negative"
                    }
                >
                    {money(v)}
                </strong>
            ),
        },
    ];

    const orderColumns = 
    [
        {
            title: "Invoice",
            dataIndex: "invoice_number",
            width: 140,
            render: (v, r) => v || `#${r.order_id}`,
        },
        {
            title: "Customer",
            key: "customer",
            width: 210,
            render: (_, r) => (
                <div>
                    <strong>{r.customer_name || "-"}</strong>

                    <div>
                        <Text type="secondary">
                            {r.phone_number || ""}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Date",
            dataIndex: "order_date",
            width: 120,
            render: (v) =>
                v ? dayjs(v).format("DD MMM YYYY") : "-",
        },
        {
            title: "Net Sales",
            dataIndex: "net_sales",
            align: "right",
            render: money,
        },
        {
            title: "COGS",
            dataIndex: "cogs",
            align: "right",
            render: money,
        },
        {
            title: "Courier",
            dataIndex: "courier_cost",
            align: "right",
            render: money,
        },
        {
            title: "Additional",
            dataIndex: "additional_cost",
            align: "right",
            render: money,
        },
        {
            title: "Profit",
            dataIndex: "profit",
            align: "right",
            render: (v) => (
                <strong
                    className={
                        Number(v) >= 0 ? "pm-positive" : "pm-negative"
                    }
                >
                    {money(v)}
                </strong>
            ),
        },
        {
            title: "Margin",
            dataIndex: "margin_percent",
            width: 90,
            align: "right",
            render: (v) => `${Number(v || 0).toFixed(2)}%`,
        },
    ];

    const productColumns = 
    [
        {
            title: "Product",
            key: "product",
            width: 260,
            render: (_, r) => (
                <div>
                    <strong>{r.product_name}</strong>

                    <div>
                        <Text type="secondary">{r.sku || ""}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Sold Qty",
            dataIndex: "sold_qty",
            align: "right",
        },
        {
            title: "Returned",
            dataIndex: "returned_qty",
            align: "right",
        },
        {
            title: "Net Qty",
            dataIndex: "net_qty",
            align: "right",
        },
        {
            title: "Net Sales",
            dataIndex: "net_sales",
            align: "right",
            render: money,
        },
        {
            title: "COGS",
            dataIndex: "cogs",
            align: "right",
            render: money,
        },
        {
            title: "Gross Profit",
            dataIndex: "gross_profit",
            align: "right",
            render: (v) => (
                <strong
                    className={
                        Number(v) >= 0 ? "pm-positive" : "pm-negative"
                    }
                >
                    {money(v)}
                </strong>
            ),
        },
        {
            title: "Margin",
            dataIndex: "margin_percent",
            align: "right",
            width: 90,
            render: (v) => `${Number(v || 0).toFixed(2)}%`,
        },
    ];

    return (
        <div className="profit-management-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Profit Management</h1>

                    <p className="pm-subtitle">
                        Understand sales profitability after product cost,
                        returns, courier, operating expenses and other income.
                    </p>
                </div>

                <Breadcrumb
                    items={[
                        {
                            title: <Link to="/dashboard">Dashboard</Link>,
                        },
                        {
                            title: "Accounting",
                        },
                        {
                            title: "Profit Management",
                        },
                    ]}
                />
            </div>

            <Card className="pm-filter-card">
                <div className="pm-filter-row">
                    <RangePicker
                        value={range}
                        format="DD MMM YYYY"
                        onChange={(dates) => dates && setRange(dates)}
                        allowClear={false}
                    />

                    <div className="pm-presets">
                        <Button
                            size="small"
                            onClick={() => setRange([dayjs(), dayjs()])}
                        >
                            Today
                        </Button>

                        <Button
                            size="small"
                            onClick={() =>
                                setRange([
                                    dayjs().subtract(1, "day"),
                                    dayjs().subtract(1, "day"),
                                ])
                            }
                        >
                            Yesterday
                        </Button>

                        <Button
                            size="small"
                            onClick={() =>
                                setRange([dayjs().startOf("month"), dayjs()])
                            }
                        >
                            This Month
                        </Button>
                    </div>

                    <Tooltip title="Refresh">
                        <Button
                            icon={<ReloadOutlined />}
                            loading={loading}
                            onClick={() => {
                                loadOverview();

                                if (activeTab === "orders") loadOrders();
                                if (activeTab === "products") loadProducts();
                            }}
                        />
                    </Tooltip>
                </div>
            </Card>

            {error && (
                <Alert
                    type="error"
                    showIcon
                    message={error}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="pm-stat">
                        <Statistic
                            title="Net Sales"
                            value={Number(summary.net_sales || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="pm-stat">
                        <Statistic
                            title="COGS"
                            value={Number(summary.cogs || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="pm-stat pm-stat-green">
                        <Statistic
                            title="Gross Profit"
                            value={Number(summary.gross_profit || 0)}
                            precision={2}
                            prefix="৳"
                            suffix={
                                <small>
                                    {Number(
                                        summary.gross_margin_percent || 0
                                    ).toFixed(1)}
                                    %
                                </small>
                            }
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card
                        className={`pm-stat ${
                            positive ? "pm-stat-blue" : "pm-stat-red"
                        }`}
                    >
                        <Statistic
                            title="Net Profit"
                            value={netProfit}
                            precision={2}
                            prefix={
                                positive
                                    ? <ArrowUpOutlined />
                                    : <ArrowDownOutlined />
                            }
                            suffix={
                                <small>
                                    {Number(
                                        summary.net_margin_percent || 0
                                    ).toFixed(1)}
                                    %
                                </small>
                            }
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic
                            title="Courier Cost"
                            value={Number(summary.courier_cost || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic
                            title="Additional Cost"
                            value={Number(summary.additional_cost || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic
                            title="Operating Expenses"
                            value={Number(summary.operating_expense || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic
                            title="Other Income"
                            value={Number(summary.other_income || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic
                            title="Order Operating Profit"
                            value={Number(summary.order_operating_profit || 0)}
                            precision={2}
                            prefix="৳"
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic
                            title="Financial Orders"
                            value={summary.order_count || 0}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Alert
                type={
                    summary.meta?.cogs_method ===
                    "historical_order_detail_buy_price"
                        ? "success"
                        : "warning"
                }
                showIcon
                message={
                    summary.meta?.cogs_method ===
                    "historical_order_detail_buy_price"
                        ? "Historical COGS mode"
                        : "COGS fallback mode"
                }
                description={
                    summary.meta?.cogs_method ===
                    "historical_order_detail_buy_price"
                        ? "Profit uses the buy price saved on each order item."
                        : "order_details.buy_price was not detected, so current product/variation buy price is being used. Historical profit can change when product cost changes."
                }
            />

            <Card
                className="pm-report-card"
                styles={{ body: { padding: 0 } }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: "daily",
                            label: "Daily Profit",
                            children: (
                                <Table
                                    rowKey="date"
                                    columns={dailyColumns}
                                    dataSource={trend}
                                    loading={loading}
                                    pagination={{
                                        pageSize: 31,
                                        hideOnSinglePage: true,
                                    }}
                                    scroll={{ x: 1200 }}
                                    locale={{
                                        emptyText: (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="No profit data found"
                                            />
                                        ),
                                    }}
                                />
                            ),
                        },
                        {
                            key: "orders",
                            label: "Order-wise Profit",
                            children: (
                                <div>
                                    <div className="pm-tab-toolbar">
                                        <Input
                                            allowClear
                                            prefix={<SearchOutlined />}
                                            placeholder="Search invoice, customer or phone"
                                            value={orderSearch}
                                            onChange={(e) => {
                                                setOrderSearch(e.target.value);
                                                setOrderPage(1);
                                            }}
                                        />
                                    </div>

                                    <Table
                                        rowKey="order_id"
                                        columns={orderColumns}
                                        dataSource={orders}
                                        scroll={{ x: 1300 }}
                                        pagination={{
                                            current:
                                                orderMeta.current_page ||
                                                orderPage,
                                            pageSize:
                                                orderMeta.per_page ||
                                                orderPageSize,
                                            total: orderMeta.total || 0,
                                            showSizeChanger: true,
                                            pageSizeOptions: [10, 20, 50, 100],
                                            onChange: (p, s) => {
                                                setOrderPage(
                                                    s !== orderPageSize ? 1 : p
                                                );
                                                setOrderPageSize(s);
                                            },
                                        }}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: "products",
                            label: "Product-wise Gross Profit",
                            children: (
                                <div>
                                    {productNote && (
                                        <Alert
                                            type="info"
                                            showIcon
                                            message={productNote}
                                            className="pm-product-note"
                                        />
                                    )}

                                    <div className="pm-tab-toolbar">
                                        <Input
                                            allowClear
                                            prefix={<SearchOutlined />}
                                            placeholder="Search product or SKU"
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                                setProductPage(1);
                                            }}
                                        />
                                    </div>

                                    <Table
                                        rowKey={(r) =>
                                            r.product_id || r.product_name
                                        }
                                        columns={productColumns}
                                        dataSource={products}
                                        scroll={{ x: 1100 }}
                                        pagination={{
                                            current:
                                                productMeta.current_page ||
                                                productPage,
                                            pageSize:
                                                productMeta.per_page ||
                                                productPageSize,
                                            total: productMeta.total || 0,
                                            showSizeChanger: true,
                                            pageSizeOptions: [10, 20, 50, 100],
                                            onChange: (p, s) => {
                                                setProductPage(
                                                    s !== productPageSize ? 1 : p
                                                );
                                                setProductPageSize(s);
                                            },
                                        }}
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            </Card>
        </div>
    );
}