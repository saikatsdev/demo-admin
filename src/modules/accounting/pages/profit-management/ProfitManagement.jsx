import {ArrowLeftOutlined,ReloadOutlined,SearchOutlined,ShoppingCartOutlined} from "@ant-design/icons";
import {Alert,Button,Card,Col,DatePicker,Empty,Input,Result,Row,Statistic,Table,Tabs,Tooltip,Typography} from "antd";
import dayjs from "dayjs";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import {getOrderProfit,getProductProfit,getProfitSummary,getProfitTrend} from "../../api/profitManagementApi";
import "../../styles/profit-management.css";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const amountFormat = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const money = (value) => {
    const amount = Number(value ?? 0);
    return `${amount < 0 ? "−" : ""}৳ ${amountFormat.format(Math.abs(amount))}`;
};

const initialRange = [dayjs().startOf("month"), dayjs()];

export default function ProfitManagement() {
    useTitle("Profit Management | Accounting");

    const { can }                               = usePermission();
    const allowed                               = can("profit-management-read");
    const [range, setReportRange]               = useState(initialRange);
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
    const requestId                             = useRef(0);
    const orderRequestId                        = useRef(0);
    const productRequestId                      = useRef(0);
    const [orderError, setOrderError]           = useState("");
    const [productError, setProductError]       = useState("");

    const setRange = (dates) => {
        setOrderPage(1);
        setProductPage(1);
        setReportRange(dates);
    };

    const period = useMemo(
        () => ({
            date_from: range?.[0]?.format("YYYY-MM-DD"),
            date_to  : range?.[1]?.format("YYYY-MM-DD"),
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
                throw new Error(s?.message || s?.msg || "Unable to load profit summary");
            }

            setSummary(s.result || {});

            if (!t?.success) {
                throw new Error(t?.message || t?.msg || "দৈনিক হিসাব লোড হয়নি।");
            }

            setTrend(t.result || []);
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

        const id = ++orderRequestId.current;
        setOrderError("");
        setOrders([]);
        const response = await getOrderProfit({
            ...period,
            page         : orderPage,
            paginate_size: orderPageSize,
            search_key   : orderSearch || undefined,
        });

        if (id !== orderRequestId.current) return;

        if (response?.success) {
            setOrders(response.result?.data || []);
            setOrderMeta(response.result?.meta || {});
        } else {
            setOrderError(response?.message || response?.msg || "রিপোর্ট লোড হয়নি।");
        }
    }, [allowed, period, orderPage, orderPageSize, orderSearch]);

    const loadProducts = useCallback(async () => {
        if (!allowed) return;

        const id = ++productRequestId.current;
        setProductError("");
        setProducts([]);
        const response = await getProductProfit({
            ...period,
            page         : productPage,
            paginate_size: productPageSize,
            search_key   : productSearch || undefined,
        });

        if (id !== productRequestId.current){
             return;
        }
        
        if (response?.success) {
            setProducts(response.result?.data || []);
            setProductMeta(response.result?.meta || {});
            setProductNote(response.result?.note || "");
        } else {
            setProductError(response?.message || response?.msg || "রিপোর্ট লোড হয়নি।");
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
    const chartDays = trend.slice(-31);
    const chartMax = Math.max(1, ...chartDays.map((day) => Math.abs(Number(day.net_profit))));

    const dailyColumns = 
    [
        {
            title: "তারিখ",
            dataIndex: "date",
            width: 120,
            render: (v) => dayjs(v).format("DD MMM YYYY"),
        },
        {
            title: "অর্ডার",
            dataIndex: "order_count",
            width: 85,
            align: "center",
        },
        {
            title: "নিট বিক্রি",
            dataIndex: "net_sales",
            align: "right",
            render: money,
        },
        {
            title: "বিক্রি হওয়া পণ্যের খরচ",
            dataIndex: "cogs",
            align: "right",
            render: money,
        },
        {
            title: "মোট লাভ",
            dataIndex: "gross_profit",
            align: "right",
            render: (v) => <strong>{money(v)}</strong>,
        },
        {
            title: "অর্ডারের অতিরিক্ত খরচ",
            dataIndex: "order_costs",
            align: "right",
            render: money,
        },
        {
            title: "অন্যান্য আয়",
            dataIndex: "other_income",
            align: "right",
            render: (v) => (
                <span className="pm-positive">{money(v)}</span>
            ),
        },
        {
            title: "ব্যবসার খরচ",
            dataIndex: "operating_expense",
            align: "right",
            render: (v) => (
                <span className="pm-negative">{money(v)}</span>
            ),
        },
        {
            title: "নিট লাভ / ক্ষতি",
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
            title: "ইনভয়েস",
            dataIndex: "invoice_number",
            width: 140,
            render: (v, r) => v || `#${r.order_id}`,
        },
        {
            title: "গ্রাহক",
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
            title: "তারিখ",
            dataIndex: "order_date",
            width: 120,
            render: (v) =>
                v ? dayjs(v).format("DD MMM YYYY") : "-",
        },
        {
            title: "নিট বিক্রি",
            dataIndex: "net_sales",
            align: "right",
            render: money,
        },
        {
            title: "বিক্রি হওয়া পণ্যের খরচ",
            dataIndex: "cogs",
            align: "right",
            render: money,
        },
        {
            title: "অতিরিক্ত খরচ",
            dataIndex: "additional_cost",
            align: "right",
            render: money,
        },
        {
            title: "লাভ / ক্ষতি",
            dataIndex: "profit",
            align: "right",
            render: (v) => (
                <strong className={Number(v) >= 0 ? "pm-positive" : "pm-negative"}>
                    {money(v)}
                </strong>
            ),
        },
        {
            title: "লাভের হার",
            dataIndex: "margin_percent",
            width: 90,
            align: "right",
            render: (v) => `${Number(v || 0).toFixed(2)}%`,
        },
    ];

    const productColumns = 
    [
        {
            title: "পণ্য",
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
            title: "বিক্রি",
            dataIndex: "sold_qty",
            align: "right",
        },
        {
            title: "ফেরত",
            dataIndex: "returned_qty",
            align: "right",
        },
        {
            title: "নিট পরিমাণ",
            dataIndex: "net_qty",
            align: "right",
        },
        {
            title: "নিট বিক্রি",
            dataIndex: "net_sales",
            align: "right",
            render: money,
        },
        {
            title: "বিক্রি হওয়া পণ্যের খরচ",
            dataIndex: "cogs",
            align: "right",
            render: money,
        },
        {
            title: "মোট লাভ",
            dataIndex: "gross_profit",
            align: "right",
            render: (v) => (
                <strong className={Number(v) >= 0 ? "pm-positive" : "pm-negative"}>
                    {money(v)}
                </strong>
            ),
        },
        {
            title: "লাভের হার",
            dataIndex: "margin_percent",
            align: "right",
            width: 90,
            render: (v) => `${Number(v || 0).toFixed(2)}%`,
        },
    ];

    return (
        <div className="profit-management-page">
            <div className="pagehead pm-hero">
                <div className="head-left">
                    <div className="pm-eyebrow">ACCOUNTING / ব্যবসার হিসাব</div>
                    <h1 className="title">লাভ-ক্ষতির ড্যাশবোর্ড</h1>

                    <p className="pm-subtitle">
                        বিক্রি, পণ্যের ক্রয়মূল্য ও অন্যান্য খরচ মিলিয়ে ব্যবসার চূড়ান্ত হিসাব।
                    </p>
                </div>

                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                    ফিরে যান
                </Button>
            </div>

            <Card className="pm-filter-card">
                <Text strong>হিসাবের সময়সীমা</Text>
                <div className="pm-filter-row">
                    <RangePicker value={range} format="DD MMM YYYY" onChange={(dates) => dates && setRange(dates)} allowClear={false}/>

                    <div className="pm-presets">
                        <Button size="small" onClick={() => setRange([dayjs(), dayjs()])}>
                            আজ
                        </Button>

                        <Button size="small" onClick={() => setRange([dayjs().subtract(1, "day"),dayjs().subtract(1, "day"),])}>
                            গতকাল
                        </Button>

                        <Button size="small" onClick={() => setRange([dayjs().startOf("month"), dayjs()])}>
                            এই মাস
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
                <Alert type="error" showIcon message={error}/>
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="pm-stat">
                        <Statistic title="নিট বিক্রি" value={Number(summary.net_sales || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="pm-stat">
                        <Statistic title="বিক্রি হওয়া পণ্যের খরচ" value={Number(summary.cogs || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className="pm-stat pm-stat-green">
                        <Statistic title="মোট লাভ" value={Number(summary.gross_profit || 0)} formatter={money}
                            suffix={
                                <small>
                                    {Number(summary.gross_margin_percent || 0).toFixed(1)}%
                                </small>
                            }
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card className={`pm-stat ${positive ? "pm-stat-blue" : "pm-stat-red"}`}>
                        <Statistic title="নিট লাভ / ক্ষতি" value={netProfit} formatter={money}
                            suffix={
                                <small>
                                    {Number(summary.net_margin_percent || 0).toFixed(1)}%
                                </small>
                            }
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic title="অতিরিক্ত খরচ" value={Number(summary.additional_cost || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic title="পরিচালন খরচ" value={Number(summary.operating_expense || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic title="অন্যান্য আয়" value={Number(summary.other_income || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic title="অর্ডার থেকে লাভ" value={Number(summary.order_operating_profit || 0)} formatter={money}/>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="pm-mini">
                        <Statistic title="হিসাবে থাকা অর্ডার" value={summary.order_count || 0} prefix={<ShoppingCartOutlined />}/>
                    </Card>
                </Col>
            </Row>

            <Alert type={summary.meta?.cogs_method === "historical_order_detail_buy_price" ? "success" : "warning"}
                showIcon
                message={
                    summary.meta?.cogs_method === "historical_order_detail_buy_price" ? "অর্ডারের সময়ের ক্রয়মূল্য" : "COGS fallback mode"
                }
                description={summary.meta?.cogs_method === "historical_order_detail_buy_price" ? "লাভের হিসাবে অর্ডারে সংরক্ষিত পণ্যের ক্রয়মূল্য ব্যবহার করা হয়েছে।" : "order_details.buy_price was not detected, so current product/variation buy price is being used. Historical profit can change when product cost changes."
                }
            />

            <Card className="pm-trend" title="দৈনিক লাভ-ক্ষতির ধারা" loading={loading}>
                <p className="pm-subtitle">শেষ {chartDays.length} দিনের হিসাব · সবুজে লাভ, লালে ক্ষতি</p>
                {chartDays.length ? (
                    <div className="pm-chart" aria-label="দৈনিক লাভ-ক্ষতি">
                        {chartDays.map(({ date, net_profit }) => (
                            <Tooltip key={date} title={`${dayjs(date).format("DD MMM YYYY")} · ${money(net_profit)}`}>
                                <div className="pm-chart-day" aria-label={`${date}: ${money(net_profit)}`}>
                                    <div className="pm-chart-half">
                                        {Number(net_profit) >= 0 && <span style={{ height: `${Math.abs(Number(net_profit)) / chartMax * 100}%` }} />}
                                    </div>
                                    <div className="pm-chart-half pm-chart-loss">
                                        {Number(net_profit) < 0 && <span style={{ height: `${Math.abs(Number(net_profit)) / chartMax * 100}%` }} />}
                                    </div>
                                </div>
                            </Tooltip>
                        ))}
                    </div>
                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="এই সময়ে কোনো হিসাব নেই" />}
            </Card>

            <Card className="pm-report-card" styles={{ body: { padding: 0 } }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: "daily",
                            label: "দিন অনুযায়ী",
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
                                                description="এই সময়ে কোনো হিসাব নেই"
                                            />
                                        ),
                                    }}
                                />
                            ),
                        },
                        {
                            key: "orders",
                            label: "অর্ডার অনুযায়ী",
                            children: (
                                <div>
                                    <div className="pm-tab-toolbar">
                                        <Input
                                            allowClear
                                            prefix={<SearchOutlined />}
                                            placeholder="ইনভয়েস, গ্রাহক বা মোবাইল নম্বর"
                                            value={orderSearch}
                                            onChange={(e) => {
                                                setOrderSearch(e.target.value);
                                                setOrderPage(1);
                                            }}
                                        />
                                    </div>

                                    <Table
                                        rowKey="order_id"
                                        locale={{ emptyText: orderError || "কোনো অর্ডার পাওয়া যায়নি" }}
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
                            label: "পণ্য অনুযায়ী",
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
                                            placeholder="পণ্যের নাম বা SKU"
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
                                        locale={{ emptyText: productError || "কোনো পণ্য পাওয়া যায়নি" }}
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
