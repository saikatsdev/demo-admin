import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Progress, Tooltip, Typography, Divider, Card, Row, Col, Avatar, Badge } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, EyeOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, ShoppingCartOutlined, DollarOutlined, DropboxOutlined, RiseOutlined, TagOutlined, BarChartOutlined } from "@ant-design/icons";
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
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [products, setProducts]               = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });

    const getOrderReport = async () => {
        let params = {};
        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange[0] && dateRange[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date = dateRange[1].format("YYYY-MM-DD");
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
                    current: result.products?.current_page || 1
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getOrderReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const getFilteredData = () => {
        return products.filter(p => 
            !localSearch || 
            p.name?.toLowerCase().includes(localSearch.toLowerCase()) || 
            p.sku?.toLowerCase().includes(localSearch.toLowerCase()) ||
            p.brand?.name?.toLowerCase().includes(localSearch.toLowerCase())
        );
    };

    const getExportData = () => {
        const filtered = getFilteredData();
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.id));
        }
        return filtered;
    };

    const handlePrint = () => {
        window.print();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Product Performance Report", 14, 22);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.setFontSize(11);
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
        const tableColumn = ["#", "Product Name", "SKU", "Sold Qty", "Revenue", "Success Rate"];
        const tableRows = dataToExport.map((p, index) => [
            index + 1,
            p.name,
            p.sku,
            p.total_quantity_sold,
            `৳${Number(p.total_revenue || 0).toLocaleString()}`,
            `${p.sales_metrics?.success_rate}%`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 8 }
        });
        doc.save(`Product_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Product Name", "SKU", "Brand", "Current Stock", "Total Sold", "Revenue", "Success Rate"];
        const rows = dataToExport.map((p, i) => [
            i + 1,
            p.name,
            p.sku,
            p.brand?.name || "N/A",
            p.current_stock,
            p.total_quantity_sold,
            p.total_revenue,
            `${p.sales_metrics?.success_rate}%`
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Product_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const columns = [
        {
            title: "#",
            key: "sl",
            render: (_, __, index) => (
                <span style={{ fontWeight: 600, color: '#94a3b8' }}>
                    {(pagination.current - 1) * pagination.pageSize + index + 1}
                </span>
            ),
            width: 60,
            align: 'center'
        },
        {
            title: "Product Identity",
            key: "product",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Badge count={record.order_count} overflowCount={999} size="small" offset={[0, 40]} color="#3b82f6">
                        <Avatar shape="square" size={54} src={record.img_path} style={{ borderRadius: 8, border: '1px solid #f1f5f9' }} />
                    </Badge>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b', fontSize: 13 }}>{record.name}</Text>
                        <Space style={{ marginTop: 4 }} size={4} wrap>
                            <Tag color="blue" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>SKU: {record.sku}</Tag>
                            {record.brand && <Tag style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>{record.brand.name}</Tag>}
                            {record.categories?.slice(0, 1).map(cat => <Tag key={cat.id} style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>{cat.name}</Tag>)}
                        </Space>
                    </div>
                </div>
            ),
            width: 320,
        },
        {
            title: "Sell Price",
            key: "price",
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text strong style={{ color: '#0f172a' }}>৳{Number(record.sell_price).toLocaleString()}</Text>
                    {Number(record.discount) > 0 && (
                        <Text delete type="secondary" style={{ fontSize: 11 }}>৳{Number(record.mrp).toLocaleString()}</Text>
                    )}
                </div>
            ),
            width: 120
        },
        {
            title: "Stock Status",
            key: "stock",
            align: 'center',
            render: (_, record) => {
                const stock = record.current_stock;
                const status = record.stock_info?.stock_status;
                let color = "green";
                if (stock <= 5) color = "red";
                else if (stock <= 20) color = "orange";
                
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Text strong style={{ color: color === 'red' ? '#ef4444' : '#1e293b' }}>{stock}</Text>
                        <Tag color={color} style={{ fontSize: 9, margin: '4px 0 0 0', borderRadius: 10, textTransform: 'uppercase' }}>
                            {status?.replace('_', ' ')}
                        </Tag>
                    </div>
                )
            },
            width: 110
        },
        {
            title: "Volume",
            key: "volume",
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Tooltip title="Total items sold across all orders">
                        <Tag color="cyan" style={{ margin: 0, borderRadius: 4 }}>
                            {record.total_quantity_sold} Sold
                        </Tag>
                    </Tooltip>
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>{record.order_count} Orders</Text>
                </div>
            ),
            width: 100
        },
        {
            title: "Performance Rates",
            key: "rates",
            render: (_, record) => (
                <div style={{ width: 160 }}>
                    <Tooltip title={`Success: ${record.sales_metrics?.delivered_count} Delivered`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                            <Text type="secondary">Success</Text>
                            <Text strong>{record.sales_metrics?.success_rate}%</Text>
                        </div>
                        <Progress percent={record.sales_metrics?.success_rate} size={[160, 4]} showInfo={false} strokeColor="#10b981" />
                    </Tooltip>
                    <div style={{ display: 'flex', gap: '8px', marginTop: 8 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Cancel</div>
                            <Progress percent={record.sales_metrics?.cancel_rate} size={[80, 2]} showInfo={false} strokeColor="#ef4444" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Return</div>
                            <Progress percent={record.sales_metrics?.return_rate} size={[80, 2]} showInfo={false} strokeColor="#f59e0b" />
                        </div>
                    </div>
                </div>
            ),
            width: 200
        },
        {
            title: "Total Revenue",
            key: "revenue",
            align: 'right',
            render: (_, record) => (
                <div style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'inline-block' }}>
                    <Text strong style={{ color: '#0f172a' }}>৳{Number(record.total_revenue || 0).toLocaleString()}</Text>
                </div>
            ),
            width: 140
        }
    ];

    const expandedRowRender = (record) => (
        <div style={{ padding: '20px 30px', background: '#f8fafc', borderRadius: 12 }}>
            <Title level={5} style={{ margin: '0 0 20px 0', fontSize: 14, color: '#64748b' }}>In-depth Sales Analytics: {record.name}</Title>
            <Row gutter={[24, 24]}>
                <Col span={8}>
                    <Card size="small" title="Status Distribution" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Delivered</Text>
                                <Text strong style={{ color: '#10b981' }}>{record.sales_metrics?.delivered_count}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Canceled</Text>
                                <Text strong style={{ color: '#ef4444' }}>{record.sales_metrics?.canceled_count}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Returned</Text>
                                <Text strong style={{ color: '#f59e0b' }}>{record.sales_metrics?.returned_count}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Processing</Text>
                                <Text strong style={{ color: '#3b82f6' }}>{record.sales_metrics?.processing_count}</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Financials" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Average Sell Price</Text>
                                <Text strong>৳{Number(record.sales_metrics?.average_sell_price).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Total MRP Value</Text>
                                <Text strong>৳{Number(record.sales_metrics?.total_mrp).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Total Discount Given</Text>
                                <Text strong style={{ color: '#ef4444' }}>৳{Number(record.sales_metrics?.total_discount).toLocaleString()}</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Stock Info" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Current Available</Text>
                                <Tag color={record.current_stock > 10 ? 'green' : 'red'}>{record.current_stock} Items</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Variation Type</Text>
                                <Text strong>{record.has_variations ? 'Variable' : 'Simple'}</Text>
                            </div>
                            {record.has_variations && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Variations</Text>
                                    <Text strong>{record.variation_count} Options</Text>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Main Product Sales Report</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card main-stats">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Overall Revenue</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.total_revenue || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>from {summary.total_orders} total orders</Text>
                                </Space>
                                <RiseOutlined className="summary-icon" style={{ color: '#10b981' }} />
                                <div className="card-indicator success"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Quantity Sold</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_quantity_sold?.toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>across {summary.total_products} products</Text>
                                </Space>
                                <DropboxOutlined className="summary-icon" style={{ color: '#3b82f6' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Order Dispatch Health</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Title level={3} style={{ margin: 0 }}>{summary.success_rate}%</Title>
                                        <Progress type="circle" percent={summary.success_rate} size={30} strokeWidth={15} showInfo={false} strokeColor="#10b981" />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Success delivery rate</Text>
                                </Space>
                                <BarChartOutlined className="summary-icon" style={{ color: '#8b5cf6' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Operational Loss</Text>
                                    <Title level={3} style={{ margin: 0, color: '#ef4444' }}>৳{Number(summary.total_discount || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>total discount applied</Text>
                                </Space>
                                <TagOutlined className="summary-icon" style={{ color: '#ef4444' }} />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search product, SKU or brand..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        style={{ width: 280 }}
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    />
                    
                    <Select 
                        value={dateFilter} 
                        style={{ width: 140 }} 
                        onChange={(val) => {
                            setDateFilter(val);
                            if (val !== "custom") setDateRange([null, null]);
                        }}
                        suffixIcon={<CalendarOutlined style={{ color: '#bfbfbf' }} />}
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
                        <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} allowClear style={{ width: 250 }} />
                    )}

                    <Button icon={<ReloadOutlined />} onClick={() => {
                        setDateFilter("all");
                        setLocalSearch("");
                        setDateRange([null, null]);
                        setSelectedRowKeys([]);
                        setPagination(prev => ({ ...prev, current: 1 }));
                    }}>
                        Reset
                    </Button>
                </Space>

                <Space size="middle">
                    {selectedRowKeys.length > 0 && (
                        <Text strong style={{ color: '#1677ff' }}>
                            {selectedRowKeys.length} selected
                        </Text>
                    )}
                    <Button type="primary" icon={<FileExcelOutlined />} onClick={downloadCSV}>
                        CSV
                    </Button>
                    <Button type="primary" icon={<FilePdfOutlined />} style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }} onClick={downloadPDF}>
                        PDF
                    </Button>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                        Print
                    </Button>
                </Space>
            </div>

            <div className="printable">
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    rowKey="id"
                    columns={columns}
                    dataSource={getFilteredData()}
                    loading={loading}
                    expandable={{
                        expandedRowRender,
                        rowExpandable: (record) => true,
                    }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                        showSizeChanger: true,
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total) => `Total ${total} entries`,
                    }}
                />
            </div>

            <style jsx>{`
                .summary-card {
                    height: 100%;
                    border-radius: 12px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    background: #fff;
                }
                .summary-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }
                .summary-icon {
                    position: absolute;
                    right: 16px;
                    bottom: 16px;
                    font-size: 28px;
                    opacity: 0.12;
                    transition: all 0.3s ease;
                }
                .summary-card:hover .summary-icon {
                    opacity: 0.25;
                    transform: scale(1.1);
                }
                .card-indicator {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                }
                .card-indicator.success { background: #10b981; }
                .main-stats {
                    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
                }
            `}</style>
        </div>
    );
}
