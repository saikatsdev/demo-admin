import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Tag, Card, Row, Col, Avatar, Tooltip } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, UserOutlined, ShoppingOutlined, LineChartOutlined,
DollarOutlined,BarChartOutlined} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function UpsellReport() {
    // Hook
    useTitle("Upsell Report");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [search, setSearch]                   = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [orders, setOrders]                   = useState([]);
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

        if (search?.trim()) {
            params.search_key = search.trim();
        }

        params.page = pagination.current;
        params.paginate_size = pagination.pageSize;

        const query = new URLSearchParams(params).toString();
        try {
            setLoading(true);
            const res = await getDatas(`/admin/order/reports/up-sell?${query}`);
            if (res && res?.success) {
                setOrders(res?.result?.orders?.data || []);
                setSummary(res?.result?.summary || null);
                setPagination(prev => ({ 
                    ...prev, 
                    total: res?.result?.orders?.total || 0,
                    current: res?.result?.orders?.current_page || 1,
                    pageSize: res?.result?.orders?.per_page || prev.pageSize || 25
                }));
            }
        } catch (error) {
            console.error("Error fetching upsell report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getOrderReport();
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

    const handlePrint = () => {
        window.print();
    };

    const getExportData = () => {
        if (selectedRowKeys.length > 0) {
            return orders.filter(item => selectedRowKeys.includes(item.id));
        }
        return orders;
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        doc.setFontSize(16);
        doc.text("Upsell Report", 14, 20);
        const dateStr = dayjs().format("YYYY-MM-DD HH:mm");
        doc.setFontSize(10);
        doc.text(`Generated on: ${dateStr}`, 14, 27);
        
        const tableColumn = ["#", "Customer", "Phone", "Invoice", "Status", "Upsell Products", "Upsell Revenue", "Payable Price", "Date"];
        const tableRows = dataToExport.map((o, i) => {
            const productNames = o.upsell_details?.map(d => `${d.product_name} (x${d.quantity})`).join(', ') || 'N/A';
            return [
                i + 1,
                o.customer_name,
                o.phone_number,
                o.invoice_number,
                o.current_status?.name || 'N/A',
                productNames,
                `৳${Number(o.upsell_summary?.total_revenue || 0).toLocaleString()}`,
                `৳${Number(o.payable_price || 0).toLocaleString()}`,
                dayjs(o.created_at).format("DD MMM YYYY")
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 34,
            theme: 'grid',
            headStyles: { fillColor: [30, 80, 162], textColor: 255 },
            styles: { fontSize: 8 }
        });
        doc.save(`Upsell_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Customer Name", "Phone Number", "Invoice Number", "Order Status", "Order Source", "Paid Status", "Upsell Items List", "Upsell Items Count", "Upsell Total Quantity", "Upsell Total MRP", "Upsell Total Discount", "Upsell Revenue", "Net Order Price", "Payable Price", "Order Date"];
        const rows = dataToExport.map((o, i) => {
            const productNames = o.upsell_details?.map(d => `${d.product_name} (Qty: ${d.quantity}, Total: ৳${d.line_total})`).join('; ') || '';
            return [
                i + 1,
                `"${o.customer_name || ''}"`,
                `"${o.phone_number || ''}"`,
                `"${o.invoice_number || ''}"`,
                `"${o.current_status?.name || ''}"`,
                `"${o.order_from?.name || ''}"`,
                `"${o.paid_status || ''}"`,
                `"${productNames}"`,
                o.upsell_summary?.items_count || 0,
                o.upsell_summary?.total_quantity || 0,
                o.upsell_summary?.total_mrp || 0,
                o.upsell_summary?.total_discount || 0,
                o.upsell_summary?.total_revenue || 0,
                o.net_order_price || 0,
                o.payable_price || 0,
                `"${dayjs(o.created_at).format('YYYY-MM-DD HH:mm')}"`
            ];
        });
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Upsell_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const getStatusColor = (statusName) => {
        const status = statusName?.toLowerCase() || '';
        if (status.includes('delivered')) return 'green';
        if (status.includes('cancel')) return 'red';
        if (status.includes('return')) return 'orange';
        if (status.includes('courier') || status.includes('processing')) return 'blue';
        return 'default';
    };

    const columns = 
    [
        {
            title: "#",
            key: "sl",
            render: (_, __, index) => {
                const rank = (pagination.current - 1) * pagination.pageSize + index + 1;
                return (
                    <span style={{ fontWeight: 600, color: '#94a3b8' }}>
                        #{rank}
                    </span>
                );
            },
            width: 48,
            align: 'center'
        },
        {
            title: "Customer Profile",
            key: "profile",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar 
                        size={38} 
                        icon={<UserOutlined />} 
                        style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', flexShrink: 0 }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <Text strong style={{ color: '#0f172a', fontSize: 12.5, lineHeight: '1.25' }}>
                            {record.customer_name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {record.phone_number}
                        </Text>
                    </div>
                </div>
            ),
            width: 190
        },
        {
            title: "Invoice & Status",
            key: "invoice",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text strong style={{ fontSize: 12.5, color: '#0f172a' }}>
                        {record.invoice_number}
                    </Text>
                    <Space size={4} wrap>
                        {record.current_status && (
                            <Tag color={getStatusColor(record.current_status.name)} style={{ fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '0 5px' }}>
                                {record.current_status.name}
                            </Tag>
                        )}
                        <Tag color={record.paid_status === 'paid' ? 'green' : 'volcano'} style={{ fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '0 5px', textTransform: 'uppercase' }}>
                            {record.paid_status}
                        </Tag>
                        {record.order_from && (
                            <Tag style={{ fontSize: 9.5, margin: 0, borderRadius: 4, background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: 600 }}>
                                {record.order_from.name}
                            </Tag>
                        )}
                    </Space>
                </div>
            ),
            width: 190
        },
        {
            title: "Upsell Products & Items",
            key: "upsell_items",
            render: (_, record) => {
                const details = record.upsell_details || [];
                if (details.length === 0) {
                    return <Text type="secondary" style={{ fontSize: 11 }}>No items</Text>;
                }

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
                        {details.map((item, idx) => (
                            <div key={item.id || idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8, 
                                padding: '4px 7px', 
                                background: '#f8fafc', 
                                borderRadius: 6, 
                                border: '1px solid #e2e8f0' 
                            }}>
                                <Avatar 
                                    shape="square" 
                                    size={32} 
                                    src={item.img_path} 
                                    icon={<ShoppingOutlined />} 
                                    style={{ borderRadius: 4, flexShrink: 0, border: '1px solid #cbd5e1', background: '#fff' }} 
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                    <Text strong style={{ fontSize: 11.5, color: '#0f172a', lineHeight: '1.2' }} ellipsis={{ tooltip: item.product_name }}>
                                        {item.product_name}
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, marginTop: 1 }}>
                                        <Tag color="cyan" style={{ fontSize: 9, margin: 0, padding: '0 4px', borderRadius: 3, fontWeight: 700 }}>
                                            x{item.quantity} Pcs
                                        </Tag>
                                        <span style={{ color: '#475569', fontWeight: 600 }}>৳{Number(item.sell_price || 0).toLocaleString()}</span>
                                        {Number(item.discount || 0) > 0 && (
                                            <span style={{ color: '#ef4444' }}>(-৳{item.discount})</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 11.5, fontWeight: 700, color: Number(item.line_total || 0) >= 0 ? '#15803d' : '#dc2626' }}>
                                        ৳{Number(item.line_total || 0).toLocaleString()}
                                    </div>
                                    {Number(item.mrp || 0) > Number(item.sell_price || 0) && (
                                        <Text delete type="secondary" style={{ fontSize: 9 }}>৳{Number(item.mrp || 0).toLocaleString()}</Text>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            },
            width: 270
        },
        {
            title: "Upsell Summary & Revenue",
            key: "upsell_rev",
            align: 'center',
            render: (_, record) => {
                const s = record.upsell_summary || {};
                const rev = Number(s.total_revenue || 0);
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <Tag color="geekblue" style={{ margin: 0, borderRadius: 4, fontWeight: 700, fontSize: 10.5, padding: '1px 6px' }}>
                            {s.items_count || 0} Items ({s.total_quantity || 0} Pcs)
                        </Tag>

                        <div style={{ background: rev >= 0 ? '#f0fdf4' : '#fef2f2', padding: '3px 10px', borderRadius: 6, border: `1px solid ${rev >= 0 ? '#bbf7d0' : '#fecaca'}`, display: 'inline-block' }}>
                            <Text strong style={{ color: rev >= 0 ? '#15803d' : '#dc2626', fontSize: 13 }}>
                                ৳{rev.toLocaleString()}
                            </Text>
                        </div>

                        <div style={{ display: 'flex', gap: 6, fontSize: 9.5, color: '#64748b' }}>
                            <span>MRP: ৳{Number(s.total_mrp || 0).toLocaleString()}</span>
                            {Number(s.total_discount || 0) > 0 && (
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                    Disc: -৳{Number(s.total_discount || 0).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
            width: 170
        },
        {
            title: "Order Payable Value",
            key: "payable_price",
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Text strong style={{ color: '#0f172a', fontSize: 13 }}>
                        ৳{Number(record.payable_price || 0).toLocaleString()}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                        Net Order: ৳{Number(record.net_order_price || 0).toLocaleString()}
                    </Text>
                </div>
            ),
            width: 140
        },
        {
            title: "Order Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontSize: 11.5, color: '#334155', fontWeight: 600 }}>
                        {dayjs(date).format("DD MMM YYYY")}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                        {dayjs(date).format("hh:mm A")}
                    </Text>
                </div>
            ),
            width: 120
        },
    ];

    return (
        <div className="reportWrapper">
            {/* Header */}
            <div className="topBar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0, color: '#0f172a' }}>Upsell Report</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Analytics on up-sold product items, order conversion value, and upsell revenue</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={getOrderReport} loading={loading}>
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
                            <Card bordered={false} className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <DollarOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Total Upsell Revenue</span>
                                        <span className="mini-card-val">
                                            ৳{Number(summary.total_upsell_revenue || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">MRP: ৳{Number(summary.total_upsell_mrp || 0).toLocaleString()}</span>
                                    <span className="footer-pill red">Disc: -৳{Number(summary.total_upsell_discount || 0).toLocaleString()}</span>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card blue">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon blue">
                                        <ShoppingOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Upsell Sold Quantity</span>
                                        <span className="mini-card-val">
                                            {Number(summary.total_upsell_quantity || 0).toLocaleString()} Units
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill blue">{summary.total_upsell_items || 0} Items</span>
                                    <span className="footer-pill">{summary.total_orders || 0} Orders</span>
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
                                        <span className="mini-card-label">Total Order Payable Value</span>
                                        <span className="mini-card-val">
                                            ৳{Number(summary.total_payable_value || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill purple">Net Order Value: ৳{Number(summary.total_order_value || 0).toLocaleString()}</span>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <LineChartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Avg. Upsell / Order</span>
                                        <span className="mini-card-val">
                                            ৳{Number((summary.total_upsell_revenue / (summary.total_orders || 1)).toFixed(2)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill orange">{summary.total_orders || 0} Upsell Orders</span>
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
                        placeholder="Search Invoice, Customer, Phone..." 
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
                    
                    <Select value={dateFilter} style={{ width: 140 }} 
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

            <div className="printable">
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    rowKey="id"
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                        showSizeChanger: true,
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total) => `Total ${total} orders`,
                    }}
                />
            </div>
        </div>
    );
}
