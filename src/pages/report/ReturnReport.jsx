import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Typography, Row, Col, Card, Avatar, Tooltip } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, UserOutlined, ShoppingOutlined, DollarOutlined, BarChartOutlined, PercentageOutlined, RollbackOutlined,WarningOutlined,LineChartOutlined} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ReturnReport() {
    // Hooks
    useTitle("Return Order Performance Analytics");

    // States
    const [localSearch, setLocalSearch]         = useState("");
    const [search, setSearch]                   = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [orders, setOrders]                   = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [topProducts, setTopProducts]         = useState([]);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });

    const getReturnReport = async () => {
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
            const res = await getDatas(`/admin/order/reports/return?${query}`);
            if (res && res?.success) {
                const result = res?.result;
                setOrders(result?.orders?.data || []);
                setSummary(result?.summary || null);
                setTopProducts(result?.top_returned_products || []);
                setPagination(prev => ({ 
                    ...prev, 
                    total: result?.orders?.total || 0,
                    current: result?.orders?.current_page || 1,
                    pageSize: result?.orders?.per_page || prev.pageSize || 25
                }));
            }
        } catch (error) {
            console.error("Error fetching return report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getReturnReport();
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
        doc.text("Return Order Performance & Impact Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD HH:mm")}`, 14, 27);
        
        const tableColumn = ["#", "Customer", "Phone", "Invoice", "Status", "District", "Returned Products", "Return Value", "Payable", "Date"];
        const tableRows = dataToExport.map((o, i) => {
            const productNames = o.return_details?.map(d => `${d.product_name} (x${d.quantity})`).join(', ') || 'N/A';
            return [
                i + 1,
                o.customer_name,
                o.phone_number,
                o.invoice_number,
                o.current_status?.name || "N/A",
                o.district?.name || "N/A",
                productNames,
                `৳${Number(o.return_summary?.total_value || o.net_order_price || 0).toLocaleString()}`,
                `৳${Number(o.payable_price || 0).toLocaleString()}`,
                dayjs(o.created_at).format("DD MMM YYYY")
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 34,
            theme: 'grid',
            headStyles: { fillColor: [156, 39, 176], textColor: 255 },
            styles: { fontSize: 8 }
        });
        doc.save(`Return_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Invoice", "Customer Name", "Phone Number", "Status", "Order Source", "Courier", "District", "Paid Status", "Returned Items List", "Returned Items Count", "Returned Quantity", "Returned Value", "Delivery Charge", "Advance Payment", "Net Price", "Payable Price", "Date"];
        const rows = dataToExport.map((o, i) => {
            const productNames = o.return_details?.map(d => `${d.product_name} (Qty: ${d.quantity}, Total: ৳${d.line_total})`).join('; ') || '';
            const s = o.return_summary || {};
            return [
                i + 1,
                `"${o.invoice_number || ''}"`,
                `"${o.customer_name || ''}"`,
                `"${o.phone_number || ''}"`,
                `"${o.current_status?.name || ''}"`,
                `"${o.order_from?.name || ''}"`,
                `"${o.courier?.name || ''}"`,
                `"${o.district?.name || ''}"`,
                `"${o.paid_status || ''}"`,
                `"${productNames}"`,
                s.items_count || 0,
                s.total_quantity || 0,
                s.total_value || 0,
                o.delivery_charge || 0,
                o.advance_payment || 0,
                o.net_order_price || 0,
                o.payable_price || 0,
                `"${dayjs(o.created_at).format("YYYY-MM-DD HH:mm")}"`
            ];
        });
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Return_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const columns = [
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
            key: "customer",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar 
                        size={38} 
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: '#fdf4ff', color: '#9c27b0', border: '1px solid #f5d0fe', flexShrink: 0 }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <Text strong style={{ fontSize: 12.5, color: '#0f172a', lineHeight: '1.25' }}>
                            {record.customer_name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {record.phone_number}
                        </Text>
                        {record.district?.name && (
                            <Text type="secondary" style={{ fontSize: 10, color: '#64748b' }}>
                                Location: <span style={{ fontWeight: 600, color: '#334155' }}>{record.district.name}</span>
                            </Text>
                        )}
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
                            <Tag 
                                style={{ 
                                    backgroundColor: (record.current_status.bg_color || '#9c27b0') + '18', 
                                    color: record.current_status.bg_color || '#7b1fa2',
                                    border: `1px solid ${(record.current_status.bg_color || '#e1bee7')}50`,
                                    borderRadius: 4,
                                    fontWeight: 700,
                                    fontSize: 9.5,
                                    margin: 0,
                                    padding: '0 5px'
                                }}
                            >
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
                        {record.courier && (
                            <Tag color="purple" style={{ fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 600, padding: '0 4px' }}>
                                {record.courier.name}
                            </Tag>
                        )}
                    </Space>
                </div>
            ),
            width: 200
        },
        {
            title: "Returned Products",
            key: "return_items",
            render: (_, record) => {
                const details = record.return_details || [];
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
                                background: '#fdf4ff50', 
                                borderRadius: 6, 
                                border: '1px solid #f5d0fe' 
                            }}>
                                <Avatar 
                                    shape="square" 
                                    size={32} 
                                    src={item.img_path} 
                                    icon={<ShoppingOutlined />} 
                                    style={{ borderRadius: 4, flexShrink: 0, border: '1px solid #e9d5ff', background: '#fff' }} 
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                    <Text strong style={{ fontSize: 11.5, color: '#0f172a', lineHeight: '1.2' }} ellipsis={{ tooltip: item.product_name }}>
                                        {item.product_name}
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, marginTop: 1 }}>
                                        <Tag color="purple" style={{ fontSize: 9, margin: 0, padding: '0 4px', borderRadius: 3, fontWeight: 700 }}>
                                            x{item.quantity} Pcs
                                        </Tag>
                                        <span style={{ color: '#475569', fontWeight: 600 }}>৳{Number(item.sell_price || 0).toLocaleString()}</span>
                                        {item.current_stock !== undefined && (
                                            <span style={{ color: '#94a3b8', fontSize: 9 }}>Stock: {item.current_stock}</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 11.5, fontWeight: 700, color: Number(item.line_total || 0) >= 0 ? '#7b1fa2' : '#dc2626' }}>
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
            title: "Return Order Value",
            key: "yield",
            align: 'center',
            render: (_, record) => {
                const s = record.return_summary || {};
                const val = Number(s.total_value ?? record.net_order_price ?? 0);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <Tag color="purple" style={{ margin: 0, borderRadius: 4, fontWeight: 700, fontSize: 10.5, padding: '1px 6px' }}>
                            {s.items_count || record.return_details?.length || 0} Items ({s.total_quantity || 0} Pcs)
                        </Tag>

                        <div style={{ background: val >= 0 ? '#fdf4ff' : '#fef2f2', padding: '3px 10px', borderRadius: 6, border: `1px solid ${val >= 0 ? '#f5d0fe' : '#fecaca'}`, display: 'inline-block' }}>
                            <Text strong style={{ color: val >= 0 ? '#7b1fa2' : '#dc2626', fontSize: 13 }}>
                                ৳{val.toLocaleString()}
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
            width: 175
        },
        {
            title: "Payable Price",
            key: "payable",
            align: 'right',
            render: (_, record) => {
                const payable = Number(record.payable_price || 0);
                const advance = Number(record.advance_payment || 0);
                const delivery = Number(record.delivery_charge || 0);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <div style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: 6, border: '1px solid #bbf7d0', display: 'inline-block' }}>
                            <Text strong style={{ color: '#15803d', fontSize: 13 }}>
                                ৳{payable.toLocaleString()}
                            </Text>
                        </div>
                        <div style={{ display: 'flex', gap: 6, fontSize: 9.5 }}>
                            {advance > 0 && (
                                <span style={{ color: '#059669', fontWeight: 600 }}>
                                    Advance: ৳{advance.toLocaleString()}
                                </span>
                            )}
                            {delivery > 0 && (
                                <span style={{ color: '#64748b' }}>
                                    Del: ৳{delivery.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
            width: 155
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
        }
    ];

    return (
        <div className="reportWrapper">
            {/* Top Bar Header */}
            <div className="topBar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0, color: '#0f172a' }}>Return Order Report</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Product return volumes, financial liabilities, status breakdowns, and return item logistics</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={getReturnReport} loading={loading}>
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
                            <Card bordered={false} className="mini-summary-card purple">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon purple">
                                        <RollbackOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Total Returned Value</span>
                                        <span className="mini-card-val">
                                            ৳{Number(summary.total_return_value || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill purple">Payable: ৳{Number(summary.total_payable_price || 0).toLocaleString()}</span>
                                    <span className="footer-pill">Net: ৳{Number(summary.total_net_order_price || 0).toLocaleString()}</span>
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
                                        <span className="mini-card-label">Returned Items & Quantity</span>
                                        <span className="mini-card-val">
                                            {Number(summary.total_return_quantity || 0).toLocaleString()} QTY
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill blue">{summary.total_return_items || 0} Items</span>
                                    <span className="footer-pill">{summary.total_orders || 0} Orders</span>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <WarningOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Return Status Breakdown</span>
                                        <span className="mini-card-val">
                                            {summary.returned_count || 0} Returned
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill orange">Pending Return: {summary.pending_return_count || 0}</span>
                                    <span className="footer-pill red">Partial Return: {summary.partial_return_count || 0}</span>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <LineChartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Average Return Value</span>
                                        <span className="mini-card-val">
                                            ৳{Number(summary.average_return_value || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill red">Disc: -৳{Number(summary.total_return_discount || 0).toLocaleString()}</span>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Top Returned Products Bar */}
                    {topProducts.length > 0 && (
                        <Card size="small" style={{ marginTop: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, overflowX: 'auto', paddingBottom: 2 }}>
                                <Text strong style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    TOP RETURNED PRODUCTS:
                                </Text>
                                {topProducts.map((product, idx) => (
                                    <Tooltip key={idx} title={`${product.product_name} — ${product.return_order_count} return orders (${product.total_return_quantity} pcs)`}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', background: '#fff', padding: '3px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                                            <Avatar size={22} src={product.img_path} icon={<ShoppingOutlined />} style={{ borderRadius: 4 }} />
                                            <Text strong style={{ fontSize: 11, color: '#0f172a' }}>{product.product_name}</Text>
                                            <Tag color="purple" style={{ margin: 0, borderRadius: 3, fontSize: 9.5, fontWeight: 700 }}>
                                                {product.total_return_quantity} pcs
                                            </Tag>
                                            <span style={{ fontSize: 10, color: '#7b1fa2', fontWeight: 600 }}>৳{Number(product.total_return_value || 0).toLocaleString()}</span>
                                        </div>
                                    </Tooltip>
                                ))}
                            </div>
                        </Card>
                    )}
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
