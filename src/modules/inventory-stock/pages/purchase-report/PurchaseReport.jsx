import {DownloadOutlined,ReloadOutlined,SearchOutlined,ShoppingCartOutlined,WalletOutlined} from "@ant-design/icons";
import {Alert,Breadcrumb,Button,Card,Col,DatePicker,Empty,Input,Result,Row,Select,Space,Statistic,Table,Tag,Tooltip,Typography} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getPurchaseReport, getSupplierList, getWarehouseList } from "../../api";
import "../../styles/purchase-report.css";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const money = (value) => `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

const statusColor = (status) => ({
    draft: "gold",
    completed: "green",
    cancelled: "red",
    paid: "green",
    partial: "blue",
    unpaid: "red",
}[status] || "default");

const rowsFrom = (response) => response?.result?.data || response?.result || [];

export default function PurchaseReport() {
    useTitle("Purchase Report | Inventory & Stock");

    const { can } = usePermission();
    const canRead = can("purchases-read");
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [meta, setMeta] = useState({ total: 0, current_page: 1, per_page: 25 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const requestId = useRef(0);

    const [filters, setFilters] = useState({
        page: 1,
        paginate_size: 25,
        search_key: "",
        supplier_id: undefined,
        warehouse_id: undefined,
        status: undefined,
        payment_status: undefined,
        date_from: undefined,
        date_to: undefined,
    });

    useEffect(() => {
        if (!canRead) return;

        Promise.allSettled([
            getSupplierList({ limit: 50 }),
            getWarehouseList(),
        ]).then(([supplierResult, warehouseResult]) => {
            if (supplierResult.status === "fulfilled" && supplierResult.value?.success) {
                setSuppliers(rowsFrom(supplierResult.value));
            }
            if (warehouseResult.status === "fulfilled" && warehouseResult.value?.success) {
                setWarehouses(rowsFrom(warehouseResult.value));
            }
        });
    }, [canRead]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const value = query.trim();
            setFilters((current) => current.search_key === value ? current : { ...current, search_key: value, page: 1 });
        }, 400);

        return () => window.clearTimeout(timer);
    }, [query]);

    const load = useCallback(async () => {
        if (!canRead) return;

        const id = ++requestId.current;
        setLoading(true);
        setError(null);

        try {
            const params = Object.fromEntries(
                Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "")
            );
            const response = await getPurchaseReport(params);

            if (id !== requestId.current) return;
            if (!response?.success) throw new Error(response?.message || response?.msg || "Unable to load purchase report");

            setRows(response.result?.data || []);
            setSummary(response.result?.summary || {});
            setMeta(response.result?.meta || { total: 0, current_page: 1, per_page: filters.paginate_size });
        } catch (loadError) {
            if (id !== requestId.current) return;
            setRows([]);
            setSummary({});
            setMeta({ total: 0, current_page: 1, per_page: filters.paginate_size });
            setError(loadError?.message || "Unable to load purchase report");
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [canRead, filters]);

    useEffect(() => { load(); }, [load]);

    const changeFilter = (changes) => {
        setFilters((current) => ({ ...current, ...changes, page: "page" in changes ? changes.page : 1 }));
    };

    const exportExcel = () => {
        const data = rows.map((record, index) => ({
            SL: (filters.page - 1) * filters.paginate_size + index + 1,
            "Purchase No": record.purchase_no,
            Date: record.purchase_date ? dayjs(record.purchase_date).format("DD MMM YYYY") : "",
            Supplier: record.supplier?.name || "",
            "Supplier Code": record.supplier?.code || "",
            Warehouse: record.warehouse?.name || "",
            "Item Lines": record.item_lines || 0,
            Quantity: record.item_quantity || 0,
            "Grand Total": Number(record.grand_total || 0),
            Paid: Number(record.paid_amount || 0),
            Due: Number(record.due_amount || 0),
            Status: record.status || "",
            "Payment Status": record.payment_status || "",
        }));

        const sheet = XLSX.utils.json_to_sheet(data);
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, "Purchase Report");
        XLSX.writeFile(book, `purchase-report-${dayjs().format("YYYY-MM-DD")}.xlsx`);
    };

    const columns = useMemo(() => [
        {
            title: "SL",
            width: 64,
            align: "center",
            render: (_, __, index) => (filters.page - 1) * filters.paginate_size + index + 1,
        },
        {
            title: "Purchase",
            dataIndex: "purchase_no",
            width: 145,
            render: (value) => <Text strong>{value || "-"}</Text>,
        },
        {
            title: "Date",
            dataIndex: "purchase_date",
            width: 130,
            render: (value) => value ? dayjs(value).format("DD MMM YYYY") : "-",
        },
        {
            title: "Supplier",
            width: 210,
            render: (_, record) => (
                <div>
                    <Text strong>{record.supplier?.name || "-"}</Text>
                    {record.supplier?.code && <div className="purchase-report-muted">{record.supplier.code}</div>}
                </div>
            ),
        },
        {
            title: "Warehouse",
            width: 180,
            render: (_, record) => (
                <div>
                    <Text>{record.warehouse?.name || "-"}</Text>
                    {record.warehouse?.code && <div className="purchase-report-muted">{record.warehouse.code}</div>}
                </div>
            ),
        },
        {
            title: "Qty",
            dataIndex: "item_quantity",
            width: 90,
            align: "right",
            render: (value, record) => (
                <div>
                    <Text strong>{Number(value || 0).toLocaleString("en-BD")}</Text>
                    <div className="purchase-report-muted">{record.item_lines || 0} line(s)</div>
                </div>
            ),
        },
        {
            title: "Purchase Total",
            dataIndex: "grand_total",
            width: 150,
            align: "right",
            render: (value) => <Text strong>{money(value)}</Text>,
        },
        {
            title: "Paid",
            dataIndex: "paid_amount",
            width: 135,
            align: "right",
            render: (value) => money(value),
        },
        {
            title: "Due",
            dataIndex: "due_amount",
            width: 135,
            align: "right",
            render: (value) => <Text className={Number(value || 0) > 0 ? "purchase-report-due" : ""}>{money(value)}</Text>,
        },
        {
            title: "Status",
            width: 165,
            fixed: "right",
            render: (_, record) => (
                <Space size={4} wrap>
                    <Tag color={statusColor(record.status)} className="purchase-report-status">{record.status || "-"}</Tag>
                    <Tag color={statusColor(record.payment_status)} className="purchase-report-status">{record.payment_status || "-"}</Tag>
                </Space>
            ),
        },
    ], [filters.page, filters.paginate_size]);

    if (!canRead) {
        return <Result status="403" title="Purchase report access required" subTitle="You do not have permission to view purchase reports." />;
    }

    return (
        <div className="purchase-report-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Purchase Report</h1>
                    <p className="purchase-report-subtitle">Analyze supplier purchases, payments, dues, quantities and purchase status.</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "Inventory & Stock" },
                        { title: "Purchase Report" },
                    ]} />
                </div>
            </div>

            <Row gutter={[16, 16]} className="purchase-report-summary">
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Total Purchase" value={summary.total_purchase || 0} precision={2} prefix="৳" />
                        <div className="purchase-report-card-note">{Number(summary.purchase_count || 0).toLocaleString("en-BD")} purchase(s)</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Total Paid" value={summary.total_paid || 0} precision={2} prefix={<WalletOutlined />} />
                        <div className="purchase-report-card-note">Completed: {Number(summary.completed_count || 0).toLocaleString("en-BD")}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Total Due" value={summary.total_due || 0} precision={2} prefix="৳" />
                        <div className="purchase-report-card-note">Draft: {Number(summary.draft_count || 0).toLocaleString("en-BD")}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Purchased Quantity" value={summary.total_item_quantity || 0} prefix={<ShoppingCartOutlined />} />
                        <div className="purchase-report-card-note">Quantity across filtered purchases</div>
                    </Card>
                </Col>
            </Row>

            <Card className="purchase-report-card" styles={{ body: { padding: 0 } }}>
                <div className="purchase-report-toolbar">
                    <Space wrap size={[8, 8]}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Purchase no, supplier, phone"
                            className="purchase-report-search"
                        />
                        <RangePicker
                            value={filters.date_from && filters.date_to ? [dayjs(filters.date_from), dayjs(filters.date_to)] : null}
                            onChange={(dates) => changeFilter({
                                date_from: dates?.[0]?.format("YYYY-MM-DD"),
                                date_to: dates?.[1]?.format("YYYY-MM-DD"),
                            })}
                            allowClear
                        />
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            placeholder="All suppliers"
                            value={filters.supplier_id}
                            onChange={(supplier_id) => changeFilter({ supplier_id })}
                            className="purchase-report-select"
                            options={suppliers.map((supplier) => ({
                                value: supplier.id,
                                label: `${supplier.name}${supplier.code ? ` (${supplier.code})` : ""}`,
                            }))}
                        />
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            placeholder="All warehouses"
                            value={filters.warehouse_id}
                            onChange={(warehouse_id) => changeFilter({ warehouse_id })}
                            className="purchase-report-select"
                            options={warehouses.map((warehouse) => ({
                                value: warehouse.id,
                                label: `${warehouse.name}${warehouse.code ? ` (${warehouse.code})` : ""}`,
                            }))}
                        />
                        <Select
                            allowClear
                            placeholder="Purchase status"
                            value={filters.status}
                            onChange={(status) => changeFilter({ status })}
                            className="purchase-report-status-select"
                            options={[
                                { value: "draft", label: "Draft" },
                                { value: "completed", label: "Completed" },
                                { value: "cancelled", label: "Cancelled" },
                            ]}
                        />
                        <Select
                            allowClear
                            placeholder="Payment status"
                            value={filters.payment_status}
                            onChange={(payment_status) => changeFilter({ payment_status })}
                            className="purchase-report-status-select"
                            options={[
                                { value: "unpaid", label: "Unpaid" },
                                { value: "partial", label: "Partial" },
                                { value: "paid", label: "Paid" },
                            ]}
                        />
                    </Space>

                    <Space>
                        <Tooltip title="Refresh report">
                            <Button icon={<ReloadOutlined />} loading={loading} onClick={load} />
                        </Tooltip>
                        <Button icon={<DownloadOutlined />} disabled={!rows.length} onClick={exportExcel}>
                            Export Page
                        </Button>
                    </Space>
                </div>

                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={error}
                        action={<Button size="small" onClick={load}>Retry</Button>}
                        className="purchase-report-error"
                    />
                )}

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    scroll={{ x: 1450 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error ? "Purchase report unavailable" : "No purchase data found"} /> }}
                    pagination={{
                        current: meta.current_page || filters.page,
                        pageSize: meta.per_page || filters.paginate_size,
                        total: meta.total || 0,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 25, 50, 100],
                        showTotal: (count, range) => `${range[0]}-${range[1]} of ${count}`,
                        onChange: (page, pageSize) => changeFilter({
                            page: pageSize !== filters.paginate_size ? 1 : page,
                            paginate_size: pageSize,
                        }),
                    }}
                />
            </Card>
        </div>
    );
}
