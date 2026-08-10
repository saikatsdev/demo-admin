import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Typography, Divider, Row, Col, Card, Badge, Tabs, Tooltip, Avatar } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, SearchOutlined, ShoppingOutlined, PrinterOutlined, ArrowLeftOutlined, CalendarOutlined, UserOutlined, GlobalOutlined, DollarOutlined, FilterOutlined, PieChartOutlined, ClockCircleOutlined,RocketOutlined,ShoppingCartOutlined,CheckCircleOutlined,WarningOutlined,TagOutlined} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useTitle from "../../hooks/useTitle";
import "./report.css";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function IncompleteOrderReport() {
    // Hook
    useTitle("Incomplete Order & Abandoned Cart Report");

    // Redux & State
    const orderFromList                         = useSelector((state) => state.orderFrom?.list || []);
    const [orders, setOrders]                   = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [products, setProducts]               = useState([]);
    const [periodBreakdown, setPeriodBreakdown] = useState({});

    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [localSearch, setLocalSearch]         = useState("");
    const [orderFromId, setOrderFromId]         = useState(null);
    const [statusId, setStatusId]               = useState(null);
    const [paidStatusFilter, setPaidStatusFilter] = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });
    const [breakdownView, setBreakdownView]     = useState("period");

    const fetchIncompleteReport = async () => {
        setLoading(true);
        let params = {
            page             : pagination.current,
            paginate_size    : pagination.pageSize,
            search           : localSearch,
            order_from_id    : orderFromId,
            current_status_id: statusId,
            paid_status      : paidStatusFilter,
        };

        if (dateFilter !== "all" && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange?.[0] && dateRange?.[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date = dateRange[1].format("YYYY-MM-DD");
        }

        try {
            const query = new URLSearchParams(
                Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ""))
            ).toString();
            const res = await getDatas(`/admin/order/reports/incomplete?${query}`);

            if (res?.success && res?.result) {
                const resData = res.result;
                setOrders(resData?.converted_orders?.data || []);
                setSummary(resData?.summary || null);
                setProducts(resData?.top_abandoned_products || resData?.products || []);
                setPeriodBreakdown(resData?.period_breakdown || {});

                setPagination((prev) => ({
                    ...prev,
                    total: resData?.converted_orders?.total || 0,
                    current: resData?.converted_orders?.current_page || 1,
                    pageSize: resData?.converted_orders?.per_page || prev.pageSize
                }));
            }
        } catch (err) {
            console.error("Failed to fetch incomplete order report:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncompleteReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize, orderFromId, statusId, paidStatusFilter]);

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchIncompleteReport();
    };

    const handleClearFilters = () => {
        setDateFilter("all");
        setLocalSearch("");
        setOrderFromId(null);
        setStatusId(null);
        setPaidStatusFilter(null);
        setDateRange([null, null]);
        setSelectedRowKeys([]);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const getFilteredData = () => {
        return orders.filter((order) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                order.invoice_number?.toLowerCase().includes(term) ||
                order.customer_name?.toLowerCase().includes(term) ||
                order.phone_number?.toLowerCase().includes(term) ||
                order.courier?.name?.toLowerCase().includes(term) ||
                order.district?.name?.toLowerCase().includes(term) ||
                order.order_details?.some(d => d.product_name?.toLowerCase().includes(term) || d.sku?.toLowerCase().includes(term))
            );
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
                <span className="sl-badge">
                    {(pagination.current - 1) * pagination.pageSize + index + 1}
                </span>
            ),
            width: 55,
            align: 'center',
            fixed: 'left'
        },
        {
            title: "Identity & Source",
            key: "identity",
            fixed: 'left',
            render: (_, record) => (
                <div className="cell-identity">
                    <Text strong className="invoice-title">{record.invoice_number}</Text>
                    <div className="channel-meta">
                        {record.order_from?.name && (
                            <Tag 
                                className="channel-tag"
                                style={{ 
                                    background: record.order_from?.color || '#1E50A2',
                                }}
                            >
                                {record.order_from?.name}
                            </Tag>
                        )}
                        <Text type="secondary" className="date-text">
                            {dayjs(record.created_at).format('DD MMM YY, hh:mm A')}
                        </Text>
                    </div>
                </div>
            ),
            width: 185
        },
        {
            title: "Customer Profile",
            key: "customer",
            render: (_, record) => (
                <div className="cell-customer">
                    <div className="avatar-circle">
                        <UserOutlined style={{ color: '#475569', fontSize: 13 }} />
                    </div>
                    <div className="customer-info">
                        <Text strong className="customer-name" ellipsis={{ tooltip: record.customer_name }}>
                            {record.customer_name || "N/A"}
                        </Text>
                        <Text type="secondary" className="customer-phone">
                            {record.phone_number || "N/A"}
                        </Text>
                    </div>
                </div>
            ),
            width: 175
        },
        {
            title: "Cart & Products Breakdown",
            key: "cart_items",
            render: (_, record) => {
                const details = record.order_details || [];
                const summary = record.order_summary || {};
                
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tag color="purple" style={{ margin: 0, fontSize: 10, padding: '0 6px', fontWeight: 600, borderRadius: 4 }}>
                                {summary.items_count || details.length} Items ({summary.total_quantity || 1} Pcs)
                            </Tag>
                        </div>
                        {details.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: '#f8fafc', padding: '4px 8px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
                                {details.slice(0, 2).map((item, idx) => (
                                    <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                                        <Text style={{ fontSize: 11, color: '#334155', maxWidth: 160 }} ellipsis={{ tooltip: item.product_name }}>
                                            {item.product_name}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 10 }}>
                                            x{item.quantity} (৳{Number(item.sell_price || item.mrp || 0).toLocaleString()})
                                        </Text>
                                    </div>
                                ))}
                                {details.length > 2 && (
                                    <Text type="secondary" style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>
                                        +{details.length - 2} more items...
                                    </Text>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
            width: 250
        },
        {
            title: "Pricing Breakdown",
            key: "pricing_breakdown",
            render: (_, record) => (
                <div className="pricing-grid">
                    <div className="price-item">
                        <span className="price-label">MRP:</span>
                        <span className="price-val">৳{Number(record.mrp || 0).toLocaleString()}</span>
                    </div>
                    <div className="price-item">
                        <span className="price-label">Discount:</span>
                        <span className="price-val text-red">-৳{Number(record.discount || 0).toLocaleString()}</span>
                    </div>
                    <div className="price-item">
                        <span className="price-label">Delivery:</span>
                        <span className="price-val">+৳{Number(record.delivery_charge || 0).toLocaleString()}</span>
                    </div>
                    {Number(record.advance_payment || 0) > 0 && (
                        <div className="price-item">
                            <span className="price-label">Advance:</span>
                            <span className="price-val text-green">৳{Number(record.advance_payment).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            ),
            width: 185
        },
        {
            title: "Logistics",
            key: "logistics",
            render: (_, record) => (
                <div className="cell-logistics">
                    <div className="logistics-row">
                        <RocketOutlined className="logistics-icon" />
                        <Text className="courier-name">{record.courier?.name || "Unassigned"}</Text>
                    </div>
                    <div className="logistics-row">
                        <GlobalOutlined className="logistics-icon" />
                        <Text type="secondary" className="district-name">{record.district?.name || "N/A"}</Text>
                    </div>
                </div>
            ),
            width: 155
        },
        {
            title: "Financial Summary",
            key: "financials",
            align: 'right',
            render: (_, record) => (
                <div className="cell-financials">
                    <div className="payable-pill">
                        <Text strong className="payable-amount">
                            ৳{Number(record.payable_price || 0).toLocaleString()}
                        </Text>
                    </div>
                    <div className="net-meta">
                        <span className="net-price">Net: ৳{Number(record.net_order_price || 0).toLocaleString()}</span>
                    </div>
                </div>
            ),
            width: 165
        },
        {
            title: "Status",
            key: "status",
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <div className="cell-status">
                    <Tag 
                        className="status-pill"
                        style={{ 
                            background: record.current_status?.bg_color || '#e2e8f0',
                            color: record.current_status?.text_color || '#334155'
                        }}
                    >
                        {record.current_status?.name || 'N/A'}
                    </Tag>
                    <Tag color={record.paid_status === 'paid' ? 'success' : 'error'} className="payment-tag">
                        {record.paid_status ? record.paid_status.toUpperCase() : 'UNPAID'}
                    </Tag>
                </div>
            ),
            width: 135
        }
    ];

    const handlePrint = () => {
        window.print();
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = [
            "SL", 
            "Invoice Number", 
            "Customer Name", 
            "Phone", 
            "Channel", 
            "Courier", 
            "District", 
            "Items Count", 
            "Total Quantity", 
            "MRP", 
            "Discount", 
            "Sell Price", 
            "Delivery Charge", 
            "Advance Payment", 
            "Payable Price", 
            "Net Order Price", 
            "Status", 
            "Paid Status", 
            "Created At"
        ];

        const rows = dataToExport.map((item, index) => [
            index + 1,
            `"${item.invoice_number || ''}"`,
            `"${item.customer_name || ''}"`,
            `"${item.phone_number || ''}"`,
            `"${item.order_from?.name || ''}"`,
            `"${item.courier?.name || 'Unassigned'}"`,
            `"${item.district?.name || 'N/A'}"`,
            item.order_summary?.items_count || item.order_details?.length || 1,
            item.order_summary?.total_quantity || 1,
            item.mrp || 0,
            item.discount || 0,
            item.sell_price || 0,
            item.delivery_charge || 0,
            item.advance_payment || 0,
            item.payable_price || 0,
            item.net_order_price || 0,
            `"${item.current_status?.name || ''}"`,
            `"${item.paid_status || 'unpaid'}"`,
            `"${dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss")}"`
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Incomplete_Orders_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        
        doc.setFontSize(16);
        doc.text("Incomplete & Abandoned Order Report", 14, 18);
        doc.setFontSize(9);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD HH:mm:ss")} | Total Items: ${dataToExport.length}`, 14, 25);
        
        if (summary) {
            doc.text(`Total Incomplete: ${summary.total_incomplete_orders} | Total Converted: ${summary.total_converted_orders} | Conv. Rate: ${summary.conversion_rate}% | Recovered Revenue: ৳${Number(summary.converted_order_revenue || 0).toLocaleString()}`, 14, 31);
        }

        const tableColumn = ["#", "Invoice", "Customer", "Phone", "Logistics", "Items", "MRP", "Discount", "Payable", "Status", "Paid"];
        const tableRows = dataToExport.map((item, index) => [
            index + 1,
            item.invoice_number,
            item.customer_name || 'N/A',
            item.phone_number || 'N/A',
            `${item.courier?.name || 'Unassigned'} (${item.district?.name || 'N/A'})`,
            `${item.order_summary?.items_count || 1} items (${item.order_summary?.total_quantity || 1} pcs)`,
            `৳${Number(item.mrp || 0).toLocaleString()}`,
            `৳${Number(item.discount || 0).toLocaleString()}`,
            `৳${Number(item.payable_price || 0).toLocaleString()}`,
            item.current_status?.name || 'N/A',
            (item.paid_status || 'unpaid').toUpperCase()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: summary ? 36 : 30,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontWeight: 'bold' },
            styles: { fontSize: 8, cellPadding: 2.5 }
        });

        doc.save(`Incomplete_Orders_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print flex-between">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                            Incomplete Order & Abandoned Cart Report
                        </Title>
                        {summary && (
                            <Badge count={`${summary.total_incomplete_orders?.toLocaleString()} Incomplete`} style={{ backgroundColor: '#ef4444' }}/>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Checkout recovery performance, abandoned product analytics & converted order tracking
                    </Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchIncompleteReport} loading={loading}>
                        Refresh Data
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} className="back-btn">
                        Back
                    </Button>
                </Space>
            </div>

            <Divider className="no-print" style={{ margin: '14px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 16 }}>
                    <Row gutter={[12, 12]}>
                        {/* Card 1: Recovered Order Revenue */}
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card blue">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon blue">
                                        <DollarOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Recovered Order Revenue</span>
                                        <div className="mini-card-val">
                                            ৳{Number(summary.converted_order_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">Net ৳{Number(summary.total_net_order_price || 0).toLocaleString()}</span>
                                    <span className="footer-pill green">Delivery ৳{Number(summary.total_delivery_charge || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </Col>

                        {/* Card 2: Cart Conversion & Attempts */}
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <ShoppingCartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Cart Conversion Rate</span>
                                            <span className="mini-badge-pill">{summary.conversion_rate}% Conv.</span>
                                        </div>
                                        <div className="mini-card-val">
                                            {summary.total_converted_orders?.toLocaleString()} / {summary.total_attempts?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill red">Incomplete {summary.total_incomplete_orders}</span>
                                    <span className="footer-pill green">Converted {summary.total_converted_orders}</span>
                                    <span className="footer-pill">Attempts {summary.total_attempts}</span>
                                </div>
                            </div>
                        </Col>

                        {/* Card 3: Avg Converted Order Value */}
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card purple">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon purple">
                                        <TagOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Avg Converted Value</span>
                                        <div className="mini-card-val">
                                            ৳{Number(summary.average_converted_order_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">{summary.total_converted_orders} Recovered Orders</span>
                                    <span className="footer-pill green">Rev ৳{(Number(summary.converted_order_revenue || 0) / 1000).toFixed(1)}k</span>
                                </div>
                            </div>
                        </Col>

                        {/* Card 4: Monthly Incomplete Overview */}
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <ClockCircleOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Monthly Abandoned</span>
                                        <div className="mini-card-val text-red">
                                            {(periodBreakdown?.this_month?.incomplete_orders ?? summary.total_incomplete_orders ?? 0).toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Carts</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Today: {periodBreakdown?.today?.converted_orders || 0} Conv.</span>
                                    <span className="footer-pill green">Week: {periodBreakdown?.this_week?.converted_orders || 0} Conv.</span>
                                    <span className="footer-pill green">Month: {periodBreakdown?.this_month?.converted_orders || 0} Conv.</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="no-print breakdown-section" style={{ marginBottom: 14 }}>
                <Card 
                    size="small" 
                    className="breakdown-card-wrapper"
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <Space align="center" size={6}>
                                <PieChartOutlined style={{ color: '#1E50A2', fontSize: 14 }} />
                                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Incomplete & Conversion Intelligence</span>
                            </Space>
                            <Tabs activeKey={breakdownView} onChange={setBreakdownView} size="small" style={{ marginBottom: -8 }}
                                items={[
                                    { key: 'period', label: `Period Breakdown (${Object.keys(periodBreakdown).length})` },
                                    { key: 'products', label: `Top Abandoned Products (${products.length})` }
                                ]}
                            />
                        </div>
                    }
                >
                    {breakdownView === 'period' && (
                        <div className="payment-chip-ribbon">
                            {Object.entries(periodBreakdown).map(([key, data]) => (
                                <div key={key} className="compact-payment-chip paid">
                                    <span className="chip-name" style={{ textTransform: 'capitalize' }}>
                                        {key.replace('_', ' ')}
                                    </span>
                                    <span className="chip-count">Incomplete: {data.incomplete_orders}</span>
                                    <span className="chip-advance">Converted: {data.converted_orders}</span>
                                    <span className="chip-price">Rev: ৳{Number(data.converted_revenue || 0).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {breakdownView === 'products' && (
                        <div className="channel-chip-ribbon">
                            {products.slice(0, 6).map((item) => (
                                <div key={item.id} className="compact-channel-chip">
                                    <Avatar shape="square" size={24} src={item.img_path} icon={<ShoppingOutlined />} />
                                    <span className="chip-name" style={{ maxWidth: 140 }} title={item.name}>
                                        {item.name}
                                    </span>
                                    <span className="chip-count" style={{ color: '#ef4444', fontWeight: 700 }}>
                                        {item.period_abandoned_count || item.total_abandoned_items || 0} Abandoned
                                    </span>
                                    <span className="chip-price">
                                        ৳{Number(item.sell_price || item.mrp || 0).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <div className="filter-toolbar no-print">
                <Space wrap size="middle" align="center">
                    <Input 
                        placeholder="Search Invoice, Customer, Phone, Courier, District..." 
                        allowClear 
                        value={localSearch} 
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        onPressEnter={handleSearch} 
                        className="search-input" 
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    />
                    
                    <Select 
                        placeholder="Order Source" 
                        value={orderFromId} 
                        style={{ width: 140 }} 
                        onChange={setOrderFromId} 
                        allowClear 
                        suffixIcon={<ShoppingOutlined style={{ color: '#94a3b8' }} />}
                    >
                        {orderFromList?.map(item => (
                            <Option key={item.id} value={item.id}>{item.name}</Option>
                        ))}
                    </Select>

                    <Select 
                        placeholder="Payment Status" 
                        value={paidStatusFilter} 
                        style={{ width: 140 }} 
                        onChange={setPaidStatusFilter} 
                        allowClear
                    >
                        <Option value="paid">Paid</Option>
                        <Option value="unpaid">Unpaid</Option>
                    </Select>

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

                    <Button icon={<ReloadOutlined />} onClick={handleClearFilters} className="reset-btn">
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

            {/* Table section */}
            <div className="printable order-table-container">
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    rowKey="id"
                    columns={columns}
                    dataSource={getFilteredData()}
                    loading={loading}
                    scroll={{ x: 1300 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '25', '50', '100'],
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} converted incomplete orders`,
                    }}
                    className="order-intelligence-table"
                />
            </div>
        </div>
    );
}
