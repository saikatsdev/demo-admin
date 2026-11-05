import { AppstoreOutlined, HistoryOutlined, ReloadOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, Card, DatePicker, Empty, Input, Result, Segmented, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getWarehouseList } from "../../api";
import { getStockMovements, getStockOverview } from "../../api/stockApi";
import "../../styles/stock.css";

const { RangePicker } = DatePicker;

const unpack = (response) => ({ 
    rows   : response?.result?.data || [],
    meta   : response?.result?.meta || {},
    summary: response?.result?.summary || {}
});

const quantity = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
const money    = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const movementColor = (type) => ({ 
    purchase             : "green",
    raw_material_purchase: "green",
    adjustment_in        : "cyan",
    adjustment_out       : "orange",
    sale                 : "red",
    packaging_usage      : "purple",
    transfer_in          : "blue",
    transfer_out         : "geekblue"
}[type] || "default");

export default function StockOverview() {
    const { can }                         = usePermission();
    const allowed                         = can("stocks-read");
    const [view, setView]                 = useState("overview");
    const [itemType, setItemType]         = useState("product");
    const [warehouseId, setWarehouseId]   = useState();
    const [stockStatus, setStockStatus]   = useState();
    const [movementType, setMovementType] = useState();
    const [dates, setDates]               = useState(null);
    const [query, setQuery]               = useState("");
    const [searchKey, setSearchKey]       = useState("");
    const [warehouses, setWarehouses]     = useState([]);
    const [rows, setRows]                 = useState([]);
    const [summary, setSummary]           = useState({});
    const [meta, setMeta]                 = useState({ current_page: 1, per_page: 25, total: 0 });
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState("");
    useTitle("Stock Overview | Inventory & Stock");

    useEffect(() => { if (allowed) getWarehouseList().then((r) => setWarehouses(r?.result?.data || r?.result || [])); }, [allowed]);
    useEffect(() => { const timer = window.setTimeout(() => setSearchKey(query.trim()), 350); return () => window.clearTimeout(timer); }, [query]);

    const load = useCallback(async (page = 1, size = 25) => {
        if (!allowed) return;

        setLoading(true);

        setError("");

        const common = { 
            item_type: itemType, 
            warehouse_id: warehouseId, 
            search_key: searchKey || undefined, 
            page, 
            paginate_size: size 
        };

        const response = view === "overview" ? await getStockOverview({ ...common, stock_status: stockStatus }) : await getStockMovements({ ...common, movement_type: movementType, date_from: dates?.[0]?.format("YYYY-MM-DD"), date_to: dates?.[1]?.format("YYYY-MM-DD") });

        setLoading(false);

        if (!response?.success) { 
            setError(response?.msg || "Unable to load stock information"); 
            return; 
        }

        const data = unpack(response); 
        setRows(data.rows); 
        setMeta(data.meta); 
        setSummary(data.summary);
    }, [allowed, dates, itemType, movementType, searchKey, stockStatus, view, warehouseId]);

    useEffect(() => { 
        load(1, 25); 
    }, [load]);

    const overviewColumns = 
    [
        { 
            title: "SL", 
            width: 64, 
            align: "center", 
            render: (_, __, index) => ((meta.current_page || 1) - 1) * (meta.per_page || 25) + index + 1 
        },
        { 
            title: itemType === "product" ? "Product" : "Raw material", 
            width: 280, 
            render: (_, row) => 
            <div className="stock-item-cell">
                <div>
                    <Typography.Text strong>
                        {row.name}
                    </Typography.Text>

                    {row.variation_name && 
                        <div className="stock-variation">
                            {row.variation_name}
                        </div>
                    }
                    <span>
                        {row.code || "No code"}
                    </span>
                </div>
            </div> 
        },
        { 
            title: "Warehouse", 
            width: 220, 
            render: (_, row) => 
            <div>
                <Typography.Text strong>{row.warehouse?.name}</Typography.Text>
                <div className="stock-muted">
                    {row.warehouse?.code}
                </div>
            </div> 
        },
        { 
            title: "Current stock", 
            width: 170, 
            align: "right", 
            render: (_, row) => 
            <Typography.Text strong className={`stock-quantity ${row.stock_status}`}>
                {quantity(row.quantity)} {' '}
                <small>{row.unit}</small>
            </Typography.Text> 
        },
        { 
            title: "Alert at", 
            width: 130, 
            align: "right", 
            render: (_, row) => row.alert_quantity === null ? "—" : `${quantity(row.alert_quantity)} ${row.unit}` 
        },
        { 
            title: "Buy price", 
            width: 140, 
            align: "right", 
            render: (_, row) => `৳ ${money(row.buy_price)}` 
        },
        { 
            title: "Status", 
            width: 120, 
            align: "center", 
            render: (_, row) => 
            <Tag color={row.stock_status === "out" ? "red" : row.stock_status === "low" ? "orange" : "green"}>
                {row.stock_status === "out" ? "Out of stock" : row.stock_status === "low" ? "Low stock" : "Available"}
            </Tag> 
        },
    ];

    const movementColumns = 
    [
        { 
            title: "SL", 
            width: 64, 
            align: "center", 
            render: (_, __, index) => ((meta.current_page || 1) - 1) * (meta.per_page || 25) + index + 1 
        },
        { 
            title: "Date & time", 
            width: 170, 
            render: (_, row) => 
            <div>
                <Typography.Text>
                    {dayjs(row.movement_date).format("DD MMM YYYY")}
                </Typography.Text>
                <div className="stock-muted">
                    {dayjs(row.movement_date).format("hh:mm A")}
                </div>
            </div> 
        },
        { 
            title: "Item", 
            width: 260, 
            render: (_, row) => 
            <div>
                <Typography.Text strong>
                    {row.name}
                </Typography.Text>

                {row.variation_name && 
                    <div className="stock-variation">
                        {row.variation_name}
                    </div>
                }
                
                <div className="stock-muted">
                    {row.code || "No code"}
                </div>
            </div> 
        },
        { 
            title: "Warehouse", 
            width: 190, 
            render: (_, row) => 
            <div>
                <Typography.Text strong>
                    {row.warehouse?.name}
                </Typography.Text>

                <div className="stock-muted">
                    {row.warehouse?.code}
                </div>
            </div> 
        },
        { 
            title: "Movement", 
            width: 160, 
            render: (_, row) => 
            <Tag color={movementColor(row.movement_type)} style={{textTransform:"capitalize"}}>
                {String(row.movement_type).replaceAll("_", " ")}
            </Tag> 
        },
        { 
            title: "Change", 
            width: 120, 
            align: "right", 
            render: (_, row) => 
            <Typography.Text strong className={Number(row.quantity) >= 0 ? "stock-in" : "stock-out"}>
                {Number(row.quantity) >= 0 ? "+" : ""}{quantity(row.quantity)} {row.unit}
            </Typography.Text> 
        },
        { 
            title: "Before → After", 
            width: 190, 
            align: "right", 
            render: (_, row) => `${quantity(row.quantity_before)} → ${quantity(row.quantity_after)} ${row.unit}` 
        },
        { 
            title: "Reference", 
            width: 160, 
            render: (_, row) => row.reference_id ? `${row.reference_type || "Reference"} #${row.reference_id}` : "—" 
        },
        { 
            title: "Note", 
            dataIndex: "note", 
            width: 260, 
            ellipsis: true, 
            render: (value) => value || "—" 
        },
    ];

    if (!allowed) {
        return <Result status="403" title="Stock access required" subTitle="You do not have permission to view stock information." />;
    }

    return (
        <div className="stock-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Stock Overview</h1>
                    <p className="stock-subtitle">Warehouse-wise stock position and complete inventory movement history.</p>
                </div>
            </div>

            <Card className="stock-shell" styles={{ body: { padding: 0 } }}>
                <div className="stock-head">
                    <Segmented value={view} onChange={setView} options={[
                        { value: "overview", label: "Stock overview", icon: <AppstoreOutlined /> }, 
                        { value: "movements", label: "Movement history", icon: <HistoryOutlined /> }
                    ]} />

                    <Segmented value={itemType} onChange={(v) => { setItemType(v); setRows([]); }} options={[
                        { value: "product", label: "Products" }, 
                        { value: "raw_material", label: "Raw materials" }
                    ]} />
                </div>

                {view === "overview" && 
                    <div className="stock-stat-grid">
                        <Card>
                            <Statistic title="Stock lines" value={summary.stock_lines || 0} />
                        </Card>

                        <Card>
                            <Statistic title="Total quantity" value={summary.total_quantity || 0} />
                        </Card>

                        <Card className="stock-low-card">
                            <Statistic title="Low stock" value={summary.low_stock || 0} prefix={<WarningOutlined />} />
                        </Card>

                        <Card className="stock-out-card">
                            <Statistic title="Out of stock" value={summary.out_of_stock || 0} />
                        </Card>
                    </div>
                }

                <div className="stock-toolbar">
                    <Space wrap>
                        <Input allowClear prefix={<SearchOutlined />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${itemType === "product" ? "product or SKU" : "material or code"}`} className="stock-search" />

                        <Select allowClear value={warehouseId} onChange={setWarehouseId} placeholder="All warehouses" className="stock-filter" options={warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))} />

                        {view === "overview" ? 
                            <Select allowClear value={stockStatus} onChange={setStockStatus} placeholder="All stock statuses" className="stock-filter" options={[{ value: "available", label: "Available" }, { value: "low", label: "Low stock" }, { value: "out", label: "Out of stock" }]} />
                            : 
                            <>
                                <Select allowClear value={movementType} onChange={setMovementType} placeholder="All movement types" className="stock-filter" options={[
                                    { value: "purchase", label: "Purchase" }, 
                                    { value: "raw_material_purchase", label: "Raw material purchase" }, 
                                    { value: "adjustment_in", label: "Adjustment in" }, 
                                    { value: "adjustment_out", label: "Adjustment out" }, 
                                    { value: "sale", label: "Sale" }, 
                                    { value: "transfer_in", label: "Transfer in" }, 
                                    { value: "transfer_out", label: "Transfer out" }
                                ]} />

                                <RangePicker value={dates} onChange={setDates} />
                            </>
                        }

                        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => load(meta.current_page || 1, meta.per_page || 25)} />
                    </Space>
                </div>

                {error && <Alert type="error" showIcon message={error} className="stock-error" />}

                <Table rowKey="id" columns={view === "overview" ? overviewColumns : movementColumns} dataSource={rows} loading={loading} 
                scroll={{ x: view === "overview" ? 1220 : 1750 }} 
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description={view === "overview" ? "No stock records found" : "No movement history found"} /> }} 
                pagination={{ 
                    current        : meta.current_page || 1,
                    pageSize       : meta.per_page || 25,
                    total          : meta.total || 0,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 25, 50, 100],
                    showTotal      : (total, range) => `${range[0]}–${range[1]} of ${total}`,
                    onChange       : (page, size) => load(page, size)
                }} />
            </Card>
        </div>
    );
}
