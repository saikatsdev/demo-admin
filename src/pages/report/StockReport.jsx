import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider, Avatar, Tag, Row, Col, Card, Progress, Tooltip } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, InboxOutlined, DollarOutlined, BarChartOutlined, LineChartOutlined, AlertOutlined, SafetyOutlined, ClusterOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function StockReport() {
    // Hook
    useTitle("Stock Inventory Intelligence");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [products, setProducts]               = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({current: 1, pageSize: 25, total: 0});

    const getStockReport = async () => {
        let params = {};
        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange[0] && dateRange[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date = dateRange[1].format("YYYY-MM-DD");
        }
        params.page = pagination.current;
        params.paginate_size = pagination.pageSize;

        const query = new URLSearchParams(params).toString();

        try {
            setLoading(true);
            const res = await getDatas(`/admin/order/reports/products?${query}`);
            if(res && res?.success){
                setProducts(res?.result?.products?.data || []);
                setSummary(res?.result?.summary || null);
                setPagination(prev => ({ 
                    ...prev, 
                    total: res?.result?.products?.total || 0,
                    current: res?.result?.products?.current_page || 1
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getStockReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const handlePrint = () => {
        window.print();
    };

    const getFilteredData = () => {
        return products.filter((p) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (p.name?.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term));
        });
    };

    const getExportData = () => {
        const filtered = getFilteredData();
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.id));
        }
        return filtered;
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
            title: "Asset Identity",
            key: "identity",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar 
                        shape="square" 
                        size={48} 
                        src={record.img_path} 
                        icon={<InboxOutlined />}
                        style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b', fontSize: 13 }}>{record.name}</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tag style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 4px', background: '#f1f5f9', color: '#64748b', border: 'none' }}>{record.sku}</Tag>
                            {record.has_variations && <Tag color="blue" size="small" style={{ fontSize: 9, borderRadius: 4, margin: 0 }}>{record.variation_count} Variants</Tag>}
                        </div>
                    </div>
                </div>
            ),
            width: 250
        },
        {
            title: "Inventory Level",
            key: "stock",
            render: (_, record) => {
                const s = record.stock_info;
                let color = '#3b82f6';
                if (s.stock_status === 'out_of_stock') color = '#ef4444';
                else if (s.stock_status === 'low_stock') color = '#f59e0b';
                else color = '#10b981';

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ color: color }}>{record.effective_stock} Units</Text>
                            <Tag color={color} style={{ fontSize: 10, margin: 0, borderRadius: 12, border: 'none', fontWeight: 600 }}>{s.stock_status?.replace('_', ' ').toUpperCase()}</Tag>
                        </div>
                        <Progress percent={(record.effective_stock / 100) * 100} size={[120, 4]} showInfo={false} strokeColor={color} trailColor="#f1f5f9" />
                    </div>
                );
            },
            width: 180
        },
        {
            title: "Movement Velocity",
            key: "velocity",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BarChartOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                        <Text style={{ fontSize: 12 }}>Period: {record.period_sold_qty || 0}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <LineChartOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                        <Text style={{ fontSize: 11 }} type="secondary">Lifetime: {record.total_sell_qty || 0}</Text>
                    </div>
                </div>
            ),
            width: 160
        },
        {
            title: "Financial Value",
            key: "financials",
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: 4, border: '1px solid #dcfce7', marginBottom: 4 }}>
                        <Text strong style={{ color: '#166534', fontSize: 13 }}>৳{Number(record.stock_info.stock_value || 0).toLocaleString()}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 10 }}>MRP: ৳{Number(record.mrp).toLocaleString()}</Text>
                </div>
            ),
            width: 180
        }
    ];

    const expandedRowRender = (record) => (
        <div style={{ padding: '20px 30px', background: '#f8fafc', borderRadius: 12 }}>
            <Title level={5} style={{ margin: '0 0 20px 0', fontSize: 14, color: '#64748b' }}>Technical Inventory Analysis: {record.name}</Title>
            <Row gutter={[24, 24]}>
                <Col span={8}>
                    <Card size="small" title="Threshold Dynamics" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Alert Quantity</Text>
                                <Tag color="error">{record.alert_qty || record.stock_info.stock_threshold} Units</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Minimum Target</Text>
                                <Text strong>{record.minimum_qty} Units</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Effective Ratio</Text>
                                <Text strong>{((record.effective_stock / 100) * 100).toFixed(1)}% Fill</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Architecture" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Product Brand</Text>
                                <Text strong>{record.brand?.name || "N/A"}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Categories</Text>
                                <Space size={2} wrap>
                                    {record.categories?.map(c => <Tag key={c.id} style={{ fontSize: 9, margin: 0 }}>{c.name}</Tag>)}
                                </Space>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Current Status</Text>
                                <Tag color={record.status === 'active' ? 'green' : 'red'}>{record.status?.toUpperCase()}</Tag>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Price Intelligence" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Sell Price</Text>
                                <Text strong>৳{Number(record.sell_price).toLocaleString()}</Text>
                            </div>
                            {record.has_variations && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">Min Var. Price</Text>
                                        <Text strong>৳{Number(record.variation_info.min_variation_price).toLocaleString()}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">Max Var. Price</Text>
                                        <Text strong>৳{Number(record.variation_info.max_variation_price).toLocaleString()}</Text>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Product", "SKU", "Stock", "Status", "Asset Value"];
        const rows = dataToExport.map((p, i) => [
            i + 1,
            p.name,
            p.sku,
            p.effective_stock,
            p.stock_info.stock_status,
            p.stock_info.stock_value
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Stock_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        doc.setFontSize(18);
        doc.text("Inventory Intelligence Analysis", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD")}`, 14, 30);
        
        const tableColumn = ["#", "Product", "SKU", "Stock Level", "Status", "Asset Value"];
        const tableRows = dataToExport.map((p, i) => [
            i + 1,
            p.name,
            p.sku,
            `${p.effective_stock} units`,
            p.stock_info.stock_status,
            `৳${Number(p.stock_info.stock_value).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 8 }
        });
        doc.save(`Stock_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Inventory Intelligence Hub</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card main-stats">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Cumulative Units</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_effective_stock?.toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>total items across platform</Text>
                                </Space>
                                <SafetyOutlined className="summary-icon" style={{ color: '#3b82f6' }} />
                                <div className="card-indicator info"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Asset Valuation</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.total_stock_value || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>cumulative inventory liquidity</Text>
                                </Space>
                                <DollarOutlined className="summary-icon" style={{ color: '#10b981' }} />
                                <div className="card-indicator success"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Risk Profile</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Title level={3} style={{ margin: 0 }}>{summary.out_of_stock_count + summary.low_stock_count}</Title>
                                        <Progress type="circle" percent={((summary.out_of_stock_count + summary.low_stock_count) / summary.total_products * 100).toFixed(0)} size={30} strokeWidth={15} showInfo={false} strokeColor="#ef4444" />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>alerts needing resolution</Text>
                                </Space>
                                <AlertOutlined className="summary-icon" style={{ color: '#ef4444' }} />
                                <div className="card-indicator secondary"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Inventory Density</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.average_stock_per_product}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>average units per SKU</Text>
                                </Space>
                                <ClusterOutlined className="summary-icon" style={{ color: '#f59e0b' }} />
                                <div className="card-indicator warning"></div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search Product/SKU..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        style={{ width: 300 }}
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
                    <Button type="primary" icon={<FileExcelOutlined />} onClick={downloadCSV}>CSV</Button>
                    <Button type="primary" icon={<FilePdfOutlined />} style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }} onClick={downloadPDF}>PDF</Button>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
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
                    padding: 20px;
                }
                .summary-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }
                .summary-icon {
                    position: absolute;
                    right: 16px;
                    bottom: 16px;
                    font-size: 32px;
                    opacity: 0.1;
                    transition: all 0.3s ease;
                }
                .summary-card:hover .summary-icon {
                    opacity: 0.2;
                    transform: scale(1.1);
                }
                .card-indicator {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                }
                .card-indicator.info { background: #3b82f6; }
                .card-indicator.success { background: #10b981; }
                .card-indicator.secondary { background: #ef4444; }
                .card-indicator.warning { background: #f59e0b; }
            `}</style>
        </div>
    );
}
