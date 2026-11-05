import { DownloadOutlined, ReloadOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Breadcrumb, Button, Card, Empty, Input, Result, Segmented, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getWarehouseList } from "../../api";
import { getStockOverview } from "../../api/stockApi";
import "../../styles/stock.css";

const quantity = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
const money    = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusMeta = (status) => ({
    out      : { color: "red", label: "Out of stock" },
    low      : { color: "orange", label: "Low stock" },
    available: { color: "green", label: "Available" }
}[status] || { color: "default", label: status || "—" });

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const stockValue = (row) => Number(row.quantity || 0) * Number(row.buy_price || 0);

export default function StockReport() {
    useTitle("Inventory Stock Report");

    const { can } = usePermission();
    const allowed = can("stocks-read");

    const [type, setType]             = useState("product");
    const [warehouse, setWarehouse]   = useState();
    const [status, setStatus]         = useState();
    const [search, setSearch]         = useState("");
    const [debounced, setDebounced]   = useState("");
    const [warehouses, setWarehouses] = useState([]);
    const [rows, setRows]             = useState([]);
    const [summary, setSummary]       = useState({});
    const [meta, setMeta]             = useState({ current_page: 1, per_page: 25, total: 0 });
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(search.trim()), 350);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (allowed) {
            getWarehouseList()
                .then((r) => setWarehouses(r?.result?.data || r?.result || []))
                .catch(() => {});
        }
    }, [allowed]);

    const load = useCallback(async (page = 1, size = 25) => {
        if (!allowed) return;

        setLoading(true);
        setError("");

        try {
            const res = await getStockOverview({
                item_type    : type,
                warehouse_id : warehouse,
                stock_status : status,
                search_key   : debounced || undefined,
                page,
                paginate_size: size
            });

            if (!res?.success) {
                throw new Error(res?.msg || "Unable to load inventory report");
            }

            setRows(res?.result?.data || []);
            setMeta(res?.result?.meta || { current_page: page, per_page: size, total: 0 });
            setSummary(res?.result?.summary || {});
        } catch (e) {
            setError(e?.message || "Unable to load inventory report");
        } finally {
            setLoading(false);
        }
    }, [allowed, type, warehouse, status, debounced]);

    useEffect(() => {
        load();
    }, [load]);

    const exportPage = () => {
        const headers = [
            "Warehouse",
            "Code",
            "Item",
            "Variation",
            "Unit",
            "Quantity",
            "Alert quantity",
            "Unit cost",
            "Stock value",
            "Status"
        ];

        const data = rows.map((r) => [
            r.warehouse?.name,
            r.code,
            r.name,
            r.variation_name,
            r.unit,
            r.quantity,
            r.alert_quantity,
            r.buy_price,
            stockValue(r),
            r.stock_status
        ]);

        const csv = "\uFEFF" + [headers, ...data].map((line) => line.map(csvCell).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");

        link.href = url;
        link.download = `inventory-stock-report-page-${meta.current_page || 1}.csv`;
        link.click();

        URL.revokeObjectURL(url);
    };

    const columns = 
    [
        {
            title: "SL",
            width: 64,
            align: "center",
            render: (_, __, index) => ((meta.current_page || 1) - 1) * (meta.per_page || 25) + index + 1
        },
        {
            title: type === "product" ? "Product" : "Raw material",
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
                <Typography.Text strong>
                    {row.warehouse?.name || "—"}
                </Typography.Text>

                <div className="stock-muted">
                    {row.warehouse?.code || "No code"}
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
            width: 140,
            align: "right",
            render: (_, row) => row.alert_quantity === null || row.alert_quantity === undefined ? "—" : `${quantity(row.alert_quantity)} ${row.unit || ""}`
        },
        {
            title: "Unit cost",
            width: 140,
            align: "right",
            render: (_, row) => `৳ ${money(row.buy_price)}`
        },
        {
            title: "Stock value",
            width: 150,
            align: "right",
            render: (_, row) => 
            <Typography.Text strong>
                ৳ {money(stockValue(row))}
            </Typography.Text>
        },
        {
            title: "Status",
            width: 130,
            align: "center",
            render: (_, row) => {
                const { color, label } = statusMeta(row.stock_status);

                return <Tag color={color}>{label}</Tag>;
            }
        }
    ];

    if (!allowed) {
        return <Result status="403" title="Stock access required" subTitle="You do not have permission to view stock reports." />;
    }

    return (
        <div className="stock-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Inventory Stock Report</h1>

                    <p className="stock-subtitle">
                        Current warehouse balances valued at the configured product or variation purchase price.
                    </p>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "Inventory & Stock" },
                        { title: "Stock Report" }
                    ]} />
                </div>
            </div>

            <Card className="stock-shell" styles={{ body: { padding: 0 } }}>
                <div className="stock-head">
                    <div>
                        <Typography.Text strong>
                            Stock valuation register
                        </Typography.Text>

                        <div>
                            <Typography.Text type="secondary">
                                {meta.total || 0} stock line{meta.total === 1 ? "" : "s"} · this is not a historical cost accounting report
                            </Typography.Text>
                        </div>
                    </div>

                    <Space wrap>
                        <Segmented value={type} onChange={(v) => { setType(v); setRows([]); }} options={[
                            { value: "product", label: "Products" },
                            { value: "raw_material", label: "Raw materials" }
                        ]} />

                        <Button type="primary" icon={<DownloadOutlined />} disabled={!rows.length} onClick={exportPage}>
                            Export CSV
                        </Button>
                    </Space>
                </div>

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

                <div className="stock-toolbar">
                    <Space wrap>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${type === "product" ? "product or SKU" : "material or code"}`}
                            className="stock-search"
                        />

                        <Select
                            allowClear
                            value={warehouse}
                            onChange={setWarehouse}
                            placeholder="All warehouses"
                            className="stock-filter"
                            options={warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))}
                        />

                        <Select
                            allowClear
                            value={status}
                            onChange={setStatus}
                            placeholder="All stock statuses"
                            className="stock-filter"
                            options={[
                                { value: "available", label: "Available" },
                                { value: "low", label: "Low stock" },
                                { value: "out", label: "Out of stock" }
                            ]}
                        />

                        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => load(meta.current_page || 1, meta.per_page || 25)} />
                    </Space>
                </div>

                {error && <Alert type="error" showIcon message={error} className="stock-error" />}

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    scroll={{ x: 1400 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No stock records found" /> }}
                    pagination={{
                        current        : meta.current_page || 1,
                        pageSize       : meta.per_page || 25,
                        total          : meta.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 25, 50, 100],
                        showTotal      : (total, range) => `${range[0]}–${range[1]} of ${total}`,
                        onChange       : (page, size) => load(page, size)
                    }}
                />
            </Card>
        </div>
    );
}
