import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Progress, Tooltip, Typography, Card, Row, Col, Avatar, Badge } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, ShoppingCartOutlined, DollarOutlined, TagOutlined, BarChartOutlined,ShoppingOutlined} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ProductReport() {
    // Hook
    useTitle("Product Performance Analytics");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [search, setSearch]                   = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [products, setProducts]               = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });

    const getProductReport = async () => {
        let params = {};
        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange[0] && dateRange[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date = dateRange[1].format("YYYY-MM-DD");
        }

        if (search?.trim()) {
            params.product_name = search.trim();
        }

        params.page = pagination.current;
        params.paginate_size = pagination.pageSize;

        try {
            setLoading(true);
            const query = new URLSearchParams(params).toString();
            const res = await getDatas(`/admin/order/reports/by-selling?${query}`);

            if (res?.success) {
                const result = res.result;
                setProducts(result.products?.data || []);
                setSummary(result.summary || null);
                setPagination(prev => ({
                    ...prev,
                    total: result.products?.total || 0,
                    current: result.products?.current_page || 1,
                    pageSize: result.products?.per_page || prev.pageSize
                }));
            }
        } catch (error) {
            console.error("Error fetching product sales report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getProductReport();
    }, [dateFilter, dateRange, search, pagination.current, pagination.pageSize]);

    const handleSearchSubmit = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        setSearch(localSearch);
    };

    const handleReset = () => {
        setDateFilter("all");
        setLocalSearch("");
        setSearch("");
        setDateRange([null, null]);
        setSelectedRowKeys([]);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const getExportData = () => {
        if (selectedRowKeys.length > 0) {
            return products.filter(item => selectedRowKeys.includes(item.id));
        }
        return products;
    };

    const handlePrint = () => {
        window.print();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Top Selling Products Performance Report", 14, 20);
        const dateStr = dayjs().format("YYYY-MM-DD HH:mm");
        doc.setFontSize(10);
        doc.text(`Generated on: ${dateStr}`, 14, 27);
        
        const tableColumn = ["#", "Product Name", "SKU", "Brand", "Current Stock", "Sold Qty", "Orders", "Revenue", "Success Rate"];
        const tableRows = dataToExport.map((p, index) => [
            index + 1,
            p.name,
            p.sku,
            p.brand?.name || "N/A",
            p.current_stock,
            p.total_quantity_sold || p.sales_metrics?.total_quantity_sold || 0,
            p.order_count || p.sales_metrics?.order_count || 0,
            `৳${Number(p.total_revenue || p.sales_metrics?.total_revenue || 0).toLocaleString()}`,
            `${p.sales_metrics?.success_rate || 0}%`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 34,
            theme: 'grid',
            headStyles: { fillColor: [30, 80, 162], textColor: 255 },
            styles: { fontSize: 8 }
        });
        doc.save(`Product_Sales_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Product Name", "SKU", "Brand", "Current Stock", "Stock Status", "Sold Quantity", "Total Orders", "Delivered", "Canceled", "Returned", "Processing", "MRP", "Discount", "Sell Price", "Average Price", "Total Revenue", "Total MRP", "Total Discount", "Delivery Success Rate (%)", "Cancel Rate (%)", "Return Rate (%)"];
        const rows = dataToExport.map((p, i) => [
            i + 1,
            `"${p.name || ''}"`,
            `"${p.sku || ''}"`,
            `"${p.brand?.name || 'N/A'}"`,
            p.current_stock || 0,
            `"${p.stock_info?.stock_status || 'in_stock'}"`,
            p.total_quantity_sold || p.sales_metrics?.total_quantity_sold || 0,
            p.order_count || p.sales_metrics?.order_count || 0,
            p.delivered_count || p.sales_metrics?.delivered_count || 0,
            p.canceled_count || p.sales_metrics?.canceled_count || 0,
            p.returned_count || p.sales_metrics?.returned_count || 0,
            p.processing_count || p.sales_metrics?.processing_count || 0,
            p.mrp || 0,
            p.discount || 0,
            p.sell_price || 0,
            p.sales_metrics?.average_sell_price || p.sell_price || 0,
            p.total_revenue || p.sales_metrics?.total_revenue || 0,
            p.total_mrp || p.sales_metrics?.total_mrp || 0,
            p.total_discount || p.sales_metrics?.total_discount || 0,
            `${p.sales_metrics?.success_rate || 0}%`,
            `${p.sales_metrics?.cancel_rate || 0}%`,
            `${p.sales_metrics?.return_rate || 0}%`
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Product_Sales_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const columns = [
        {
            title: "#",
            key: "sl",
            render: (_, __, index) => {
                const rank = (pagination.current - 1) * pagination.pageSize + index + 1;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {rank <= 3 ? (
                            <Tag color={rank === 1 ? 'gold' : rank === 2 ? 'blue' : 'orange'} style={{ margin: 0, fontWeight: 800, fontSize: 10, borderRadius: 10 }}>
                                #{rank}
                            </Tag>
                        ) : (
                            <span style={{ fontWeight: 700, color: '#94a3b8', fontSize: 12 }}>
                                #{rank}
                            </span>
                        )}
                    </div>
                );
            },
            width: 48,
            align: 'center'
        },
        {
            title: "Product Identity",
            key: "product",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Avatar 
                        shape="square" 
                        size={38} 
                        src={record.img_path} 
                        icon={<ShoppingOutlined />} 
                        style={{ borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden' }}>
                        <Text strong style={{ color: '#0f172a', fontSize: 12, lineHeight: '1.2' }} ellipsis={{ tooltip: record.name }}>
                            {record.name}
                        </Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap', overflow: 'hidden' }}>
                            <span style={{ fontSize: 9.5, color: '#1d4ed8', fontWeight: 700, whiteSpace: 'nowrap' }}>SKU: {record.sku}</span>
                            {record.brand && (
                                <>
                                    <span style={{ color: '#cbd5e1', fontSize: 9 }}>•</span>
                                    <span style={{ fontSize: 9.5, color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{record.brand.name}</span>
                                </>
                            )}
                        </div>
                        {record.has_variations ? (
                            <span style={{ fontSize: 9, color: '#7c3aed', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Variable ({record.variation_count} options)
                            </span>
                        ) : (
                            <span style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap' }}>Simple Product</span>
                        )}
                    </div>
                </div>
            ),
            width: 210,
        },
        {
            title: "Pricing & Stock",
            key: "pricing_stock",
            align: 'center',
            render: (_, record) => {
                const stock = record.current_stock;
                const status = record.stock_info?.stock_status || "in_stock";
                let stockColor = "green";
                let stockLabel = "In Stock";
                if (stock <= 0 || status === "out_of_stock") {
                    stockColor = "red";
                    stockLabel = "Out of Stock";
                } else if (stock <= 10) {
                    stockColor = "orange";
                    stockLabel = "Low Stock";
                }

                const avgPrice = record.sales_metrics?.average_sell_price || record.sell_price;
                const mrpVal = Number(record.mrp || 0);
                const sellVal = Number(record.sell_price || 0);
                const discountVal = Number(record.discount || 0);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <Text strong style={{ color: '#0f172a', fontSize: 12.5 }}>
                                ৳{sellVal.toLocaleString()}
                            </Text>
                            {mrpVal > sellVal && (
                                <Text delete type="secondary" style={{ fontSize: 10 }}>
                                    ৳{mrpVal.toLocaleString()}
                                </Text>
                            )}
                        </div>
                        {discountVal > 0 && (
                            <Tag color="error" style={{ fontSize: 9, margin: 0, padding: '0 4px', borderRadius: 3, fontWeight: 700 }}>
                                -৳{discountVal.toLocaleString()} Discount
                            </Tag>
                        )}
                        <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 1 }}>
                            Average Price: <span style={{ fontWeight: 700, color: '#334155' }}>৳{Number(avgPrice || 0).toLocaleString()}</span>
                        </div>
                        <Tag color={stockColor} style={{ fontSize: 9.5, margin: '2px 0 0 0', borderRadius: 10, fontWeight: 700, padding: '0 6px' }}>
                            {stock} Items ({stockLabel})
                        </Tag>
                    </div>
                );
            },
            width: 130
        },
        {
            title: "Sales Volume",
            key: "volume",
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <Tag color="cyan" style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10.5, padding: '2px 8px' }}>
                        {record.total_quantity_sold || record.sales_metrics?.total_quantity_sold || 0} Units Sold
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 10.5, fontWeight: 600 }}>
                        {record.order_count || record.sales_metrics?.order_count || 0} Total Orders
                    </Text>
                </div>
            ),
            width: 110
        },
        {
            title: "Order Status Breakdown",
            key: "status_breakdown",
            align: 'center',
            render: (_, record) => {
                const del = record.delivered_count || record.sales_metrics?.delivered_count || 0;
                const proc = record.processing_count || record.sales_metrics?.processing_count || 0;
                const canc = record.canceled_count || record.sales_metrics?.canceled_count || 0;
                const ret = record.returned_count || record.sales_metrics?.returned_count || 0;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <Tooltip title={`Delivered: ${del}`}>
                                <Tag style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '1px 5px' }}>
                                    Delivered: {del}
                                </Tag>
                            </Tooltip>
                            <Tooltip title={`Processing: ${proc}`}>
                                <Tag style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '1px 5px' }}>
                                    Processing: {proc}
                                </Tag>
                            </Tooltip>
                        </div>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <Tooltip title={`Canceled: ${canc}`}>
                                <Tag style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '1px 5px' }}>
                                    Canceled: {canc}
                                </Tag>
                            </Tooltip>
                            <Tooltip title={`Returned: ${ret}`}>
                                <Tag style={{ background: '#fffbe8', color: '#d97706', border: '1px solid #fef08a', fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '1px 5px' }}>
                                    Returned: {ret}
                                </Tag>
                            </Tooltip>
                        </div>
                    </div>
                );
            },
            width: 160
        },
        {
            title: "Performance Rates",
            key: "rates",
            render: (_, record) => {
                const successRate = record.sales_metrics?.success_rate || 0;
                const cancelRate = record.sales_metrics?.cancel_rate || 0;
                const returnRate = record.sales_metrics?.return_rate || 0;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 1 }}>
                                <span style={{ color: '#475569', fontWeight: 600 }}>Delivery Success</span>
                                <strong style={{ color: '#10b981' }}>{successRate}%</strong>
                            </div>
                            <Progress percent={successRate} size={['100%', 4]} showInfo={false} strokeColor="#10b981" trailColor="#f1f5f9" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, marginBottom: 1 }}>
                                <span style={{ color: '#64748b' }}>Cancel Rate</span>
                                <strong style={{ color: '#ef4444' }}>{cancelRate}%</strong>
                            </div>
                            <Progress percent={cancelRate} size={['100%', 3]} showInfo={false} strokeColor="#ef4444" trailColor="#f1f5f9" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, marginBottom: 1 }}>
                                <span style={{ color: '#64748b' }}>Return Rate</span>
                                <strong style={{ color: '#f59e0b' }}>{returnRate}%</strong>
                            </div>
                            <Progress percent={returnRate} size={['100%', 3]} showInfo={false} strokeColor="#f59e0b" trailColor="#f1f5f9" />
                        </div>
                    </div>
                );
            },
            width: 170
        },
        {
            title: "Financial Revenue",
            key: "revenue",
            align: 'right',
            render: (_, record) => {
                const totRev = Number(record.total_revenue || record.sales_metrics?.total_revenue || 0);
                const totMrp = Number(record.total_mrp || record.sales_metrics?.total_mrp || 0);
                const totDisc = Number(record.total_discount || record.sales_metrics?.total_discount || 0);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <div style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: 6, border: '1px solid #bbf7d0', display: 'inline-block' }}>
                            <Text strong style={{ color: '#15803d', fontSize: 13 }}>
                                ৳{totRev.toLocaleString()}
                            </Text>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748b' }}>
                            MRP: ৳{totMrp.toLocaleString()}
                        </div>
                        {totDisc > 0 && (
                            <span style={{ fontSize: 9.5, color: '#ef4444', fontWeight: 600 }}>
                                Discount: -৳{totDisc.toLocaleString()}
                            </span>
                        )}
                    </div>
                );
            },
            width: 140
        }
    ];

    return (
        <div className="reportWrapper">
            {/* Header */}
            <div className="topBar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0, color: '#0f172a' }}>Product Performance & Sales Report</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Comprehensive top-selling product metrics, status distribution, and financial revenue</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={getProductReport} loading={loading}>
                        Refresh Data
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} className="back-btn">
                        Back
                    </Button>
                </Space>
            </div>

            {/* KPI Summary Cards */}
            {summary && (
                <div className="no-print" style={{ marginBottom: 20 }}>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card blue">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon blue">
                                        <DollarOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Total Product Revenue</span>
                                        <span className="mini-card-val">
                                            ৳{Number(summary.total_revenue || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">MRP: ৳{Number(summary.total_mrp || 0).toLocaleString()}</span>
                                    <span className="footer-pill red">Discount: -৳{Number(summary.total_discount || 0).toLocaleString()}</span>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <ShoppingCartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Total Quantity Sold</span>
                                        <span className="mini-card-val">
                                            {Number(summary.total_quantity_sold || 0).toLocaleString()} Units
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">{summary.total_products || 0} Products</span>
                                    <span className="footer-pill green">{summary.total_orders || 0} Total Orders</span>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card purple">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon purple">
                                        <BarChartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Delivery Success Rate</span>
                                        <span className="mini-card-val">
                                            {summary.success_rate || 0}%
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Delivered: {summary.delivered_count || 0}</span>
                                    <span className="footer-pill">Orders: {summary.total_orders || 0}</span>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <TagOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Losses & Rejections</span>
                                        <span className="mini-card-val" style={{ fontSize: 14 }}>
                                            {summary.canceled_count || 0} Canceled / {summary.returned_count || 0} Returned
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill red">Discount: ৳{Number(summary.total_discount || 0).toLocaleString()}</span>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            {/* Filter and Action Bar */}
            <div className="filter-toolbar no-print" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <Space wrap size="middle" align="center">
                    <Input 
                        placeholder="Search by Product Name..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => {
                            const val = e.target.value;
                            setLocalSearch(val);
                            if (!val) {
                                setPagination(prev => ({ ...prev, current: 1 }));
                                setSearch("");
                            }
                        }} 
                        onPressEnter={handleSearchSubmit}
                        style={{ width: 260 }}
                        className="search-input"
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    />

                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchSubmit}>
                        Search
                    </Button>
                    
                    <Select 
                        value={dateFilter} 
                        style={{ width: 140 }} 
                        onChange={(val) => {
                            setDateFilter(val);
                            if (val !== "custom") setDateRange([null, null]);
                        }}
                        suffixIcon={<CalendarOutlined style={{ color: '#94a3b8' }} />}
                    >
                        <Option value="all">All Time</Option>
                        <Option value="today">Today</Option>
                        <Option value="yesterday">Yesterday</Option>
                        <Option value="week">This Week</Option>
                        <Option value="month">This Month</Option>
                        <Option value="year">This Year</Option>
                        <Option value="custom">Custom Range</Option>
                    </Select>

                    {dateFilter === "custom" && (
                        <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} allowClear style={{ width: 240 }} />
                    )}

                    <Button icon={<ReloadOutlined />} onClick={handleReset} className="reset-btn">
                        Reset
                    </Button>
                </Space>

                <Space size="middle" align="center" className="export-actions">
                    {selectedRowKeys.length > 0 && (
                        <Tag color="blue" className="selected-tag">
                            {selectedRowKeys.length} selected
                        </Tag>
                    )}
                    <Button type="primary" icon={<FileExcelOutlined />} onClick={downloadCSV} className="btn-csv">
                        CSV
                    </Button>
                    <Button type="primary" icon={<FilePdfOutlined />} onClick={downloadPDF} className="btn-pdf">
                        PDF
                    </Button>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint} className="btn-print">
                        Print
                    </Button>
                </Space>
            </div>

            {/* Main Table */}
            <div className="printable">
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    rowKey="id"
                    columns={columns}
                    dataSource={products}
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                        showSizeChanger: true,
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total) => `Total ${total} products`,
                    }}
                />
            </div>
        </div>
    );
}
