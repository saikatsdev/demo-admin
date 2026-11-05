import { ReloadOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Result, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getWarehouseList } from "../../api";
import { getLowStockAlerts } from "../../api/stockApi";
import "../../styles/low-stock-alert.css";

const unpack = (response) => ({
    rows: response?.result?.data || [],
    meta: response?.result?.meta || {},
    summary: response?.result?.summary || {},
});

const quantity = (value) => Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
});

const money = (value) => Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

export default function LowStockAlert() {
    const { can } = usePermission();
    const allowed = can("stocks-read");

    const [query, setQuery] = useState("");
    const [searchKey, setSearchKey] = useState("");
    const [itemType, setItemType] = useState("all");
    const [stockStatus, setStockStatus] = useState("all");
    const [warehouseId, setWarehouseId] = useState();
    const [warehouses, setWarehouses] = useState([]);
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [meta, setMeta] = useState({ current_page: 1, per_page: 25, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useTitle("Low Stock Alert | Inventory & Stock");

    useEffect(() => {
        if (!allowed) return;
        getWarehouseList().then((response) => {
            setWarehouses(response?.result?.data || response?.result || []);
        });
    }, [allowed]);

    useEffect(() => {
        const timer = window.setTimeout(() => setSearchKey(query.trim()), 350);
        return () => window.clearTimeout(timer);
    }, [query]);

    const load = useCallback(async (page = 1, size = 25) => {
        if (!allowed) return;

        setLoading(true);
        setError("");

        const response = await getLowStockAlerts({
            search_key: searchKey || undefined,
            item_type: itemType,
            stock_status: stockStatus,
            warehouse_id: warehouseId,
            page,
            paginate_size: size,
        });

        setLoading(false);

        if (!response?.success) {
            setError(response?.message || response?.msg || "Unable to load low stock alerts");
            return;
        }

        const data = unpack(response);
        setRows(data.rows);
        setMeta(data.meta);
        setSummary(data.summary);
    }, [allowed, itemType, searchKey, stockStatus, warehouseId]);

    useEffect(() => {
        load(1, meta.per_page || 25);
        // meta.per_page intentionally excluded to prevent duplicate requests when server meta changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]);

    const columns = [
        {
            title: "SL",
            width: 64,
            align: "center",
            render: (_, __, index) => ((meta.current_page || 1) - 1) * (meta.per_page || 25) + index + 1,
        },
        {
            title: "Item",
            width: 300,
            render: (_, row) => (
                <div>
                    <Space size={8} wrap>
                        <Typography.Text strong>{row.name}</Typography.Text>
                        <Tag color={row.item_type === "product" ? "blue" : "purple"}>
                            {row.item_type === "product" ? "Product" : "Raw material"}
                        </Tag>
                    </Space>
                    {row.variation_name && <div className="lsa-muted">{row.variation_name}</div>}
                    <div className="lsa-muted">{row.code || "No code"}</div>
                </div>
            ),
        },
        {
            title: "Warehouse",
            width: 220,
            render: (_, row) => (
                <div>
                    <Typography.Text strong>{row.warehouse?.name || "—"}</Typography.Text>
                    <div className="lsa-muted">{row.warehouse?.code || ""}</div>
                </div>
            ),
        },
        {
            title: "Current stock",
            width: 150,
            align: "right",
            render: (_, row) => (
                <Typography.Text strong className={row.stock_status === "out" ? "lsa-out" : "lsa-low"}>
                    {quantity(row.quantity)} {row.unit}
                </Typography.Text>
            ),
        },
        {
            title: "Alert at",
            width: 140,
            align: "right",
            render: (_, row) => row.alert_quantity === null
                ? <Typography.Text type="secondary">Not set</Typography.Text>
                : `${quantity(row.alert_quantity)} ${row.unit}`,
        },
        {
            title: "Shortage",
            width: 140,
            align: "right",
            render: (_, row) => row.shortage_quantity === null
                ? "—"
                : <Typography.Text strong>{quantity(row.shortage_quantity)} {row.unit}</Typography.Text>,
        },
        {
            title: "Stock value",
            width: 150,
            align: "right",
            render: (_, row) => `৳ ${money(row.stock_value)}`,
        },
        {
            title: "Status",
            width: 130,
            align: "center",
            fixed: "right",
            render: (_, row) => (
                <Tag color={row.stock_status === "out" ? "red" : "orange"}>
                    {row.stock_status === "out" ? "Out of stock" : "Low stock"}
                </Tag>
            ),
        },
    ];

    if (!allowed) {
        return <Result status="403" title="Stock access required" subTitle="You do not have permission to view low stock alerts." />;
    }

    return (
        <div className="low-stock-alert-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Low Stock Alert</h1>
                    <p className="lsa-subtitle">Products and raw materials that need attention based on warehouse stock levels.</p>
                </div>
            </div>

            <div className="lsa-stat-grid">
                <Card><Statistic title="Total alerts" value={summary.total_alerts || 0} prefix={<WarningOutlined />} /></Card>
                <Card className="lsa-low-card"><Statistic title="Low stock" value={summary.low_stock || 0} /></Card>
                <Card className="lsa-out-card"><Statistic title="Out of stock" value={summary.out_of_stock || 0} /></Card>
                <Card><Statistic title="Product alerts" value={summary.product_alerts || 0} /></Card>
                <Card><Statistic title="Raw material alerts" value={summary.raw_material_alerts || 0} /></Card>
            </div>

            <Card className="lsa-shell" styles={{ body: { padding: 0 } }}>
                <div className="lsa-toolbar">
                    <Space wrap>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search product, SKU, material or code"
                            className="lsa-search"
                        />

                        <Select
                            value={itemType}
                            onChange={setItemType}
                            className="lsa-filter"
                            options={[
                                { value: "all", label: "All item types" },
                                { value: "product", label: "Products" },
                                { value: "raw_material", label: "Raw materials" },
                            ]}
                        />

                        <Select
                            allowClear
                            value={warehouseId}
                            onChange={setWarehouseId}
                            placeholder="All warehouses"
                            className="lsa-filter"
                            options={warehouses.map((warehouse) => ({
                                value: warehouse.id,
                                label: `${warehouse.code} — ${warehouse.name}`,
                            }))}
                        />

                        <Select
                            value={stockStatus}
                            onChange={setStockStatus}
                            className="lsa-filter"
                            options={[
                                { value: "all", label: "All alert statuses" },
                                { value: "low", label: "Low stock" },
                                { value: "out", label: "Out of stock" },
                            ]}
                        />

                        <Button icon={<ReloadOutlined />} onClick={() => load(meta.current_page || 1, meta.per_page || 25)}>
                            Refresh
                        </Button>
                    </Space>
                </div>

                {error && <Alert className="lsa-error" type="error" showIcon message={error} />}

                <Table
                    rowKey={(row) => `${row.item_type}-${row.id}`}
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    scroll={{ x: 1350 }}
                    pagination={{
                        current: meta.current_page || 1,
                        pageSize: meta.per_page || 25,
                        total: meta.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 25, 50, 100],
                        showTotal: (total) => `${total} alert${total === 1 ? "" : "s"}`,
                        onChange: (page, size) => load(page, size),
                    }}
                />
            </Card>
        </div>
    );
}
