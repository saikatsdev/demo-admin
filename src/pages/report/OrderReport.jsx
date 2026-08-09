import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Typography, Divider, Row, Col, Card, Progress, Tooltip, Badge, Tabs } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, SearchOutlined, ShoppingOutlined, PrinterOutlined, ArrowLeftOutlined, CalendarOutlined, ShoppingCartOutlined, UserOutlined, GlobalOutlined, DollarOutlined, BarChartOutlined, LineChartOutlined, RocketOutlined, TagOutlined,CheckCircleOutlined, InfoCircleOutlined, WalletOutlined, FilterOutlined,CloseCircleOutlined, SyncOutlined, PieChartOutlined, AppstoreOutlined} from "@ant-design/icons";
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

export default function OrderReport() {
    // Hook
    useTitle("Order Report");

    // Redux & State
    const orderFromList                         = useSelector((state) => state.orderFrom?.list || []);
    const [orders, setOrders]                   = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [statusBreakdown, setStatusBreakdown] = useState([]);
    const [orderFromBreakdown, setOrderFromBreakdown] = useState([]);
    const [paymentBreakdown, setPaymentBreakdown]     = useState([]);

    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [localSearch, setLocalSearch]         = useState("");
    const [orderFromId, setOrderFromId]         = useState(null);
    const [statusId, setStatusId]               = useState(null);
    const [paidStatusFilter, setPaidStatusFilter] = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });
    const [breakdownView, setBreakdownView]     = useState("status");

    const fetchOrders = async () => {
        setLoading(true);
        let params = {
            page             : pagination.current,
            paginate_size    : pagination.pageSize,
            search           : localSearch,
            order_from_id    : orderFromId,
            current_status_id: statusId,
            paid_status      : paidStatusFilter,
        };

        if (dateFilter !== "all" && dateFilter !== "custom") {params.filter = dateFilter} else if (dateFilter === "custom" && dateRange?.[0] && dateRange?.[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date = dateRange[1].format("YYYY-MM-DD");
        }

        try {
            const query = new URLSearchParams(
                Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ""))
            ).toString();
            const res = await getDatas(`/admin/order/reports?${query}`);

            if (res?.success && res?.result) {
                const resData = res.result;
                setOrders(resData?.orders?.data || []);
                setSummary(resData?.summary || null);
                setStatusBreakdown(resData?.status_breakdown || []);
                setOrderFromBreakdown(resData?.order_from_breakdown || []);
                setPaymentBreakdown(resData?.payment_breakdown || []);

                setPagination((prev) => ({
                    ...prev,
                    total: resData?.orders?.total || 0,
                    current: resData?.orders?.current_page || 1,
                    pageSize: resData?.orders?.per_page || prev.pageSize
                }));
            }
        } catch (err) {
            console.error("Failed to fetch order report:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize, orderFromId, statusId, paidStatusFilter]);

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchOrders();
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
                order.district?.name?.toLowerCase().includes(term)
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
            title: "Identity & Channel",
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
            width: 195
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
                        <Text type="secondary" className="customer-phone">{record.phone_number || "N/A"}</Text>
                    </div>
                </div>
            ),
            width: 180
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
            width: 150
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
                        <span className="qty-tag">Qty: {record.total_quantity || 1}</span>
                        <span className="net-price">Net: ৳{Number(record.net_order_price || 0).toLocaleString()}</span>
                    </div>
                </div>
            ),
            width: 170
        },
        {
            title: "Order Flags",
            key: "flags",
            align: 'center',
            render: (_, record) => {
                const hasFlags = record.is_duplicate || record.is_follow_order || record.is_down_sell || record.is_cross_sell;
                if (!hasFlags) {
                    return <Tag color="success" className="flag-tag standard">Regular</Tag>;
                }
                return (
                    <div className="flags-wrapper">
                        {Boolean(record.is_duplicate) && <Tag color="error" className="flag-tag">Duplicate</Tag>}
                        {Boolean(record.is_follow_order) && <Tag color="processing" className="flag-tag">Follow Up</Tag>}
                        {Boolean(record.is_down_sell) && <Tag color="warning" className="flag-tag">Down Sell</Tag>}
                        {Boolean(record.is_cross_sell) && <Tag color="purple" className="flag-tag">Cross Sell</Tag>}
                    </div>
                );
            },
            width: 140
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
                    <Tag  color={record.paid_status === 'paid' ? 'success' : 'error'} className="payment-tag">
                        {record.paid_status ? record.paid_status.toUpperCase() : 'UNPAID'}
                    </Tag>
                </div>
            ),
            width: 135
        }
    ];

    const expandedRowRender = (record) => (
        <div className="order-expanded-details">
            <div className="expanded-header">
                <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                    Detailed Metrics: {record.invoice_number}
                </Text>
                <Tag color={record.paid_status === 'paid' ? 'green' : 'red'}>
                    {record.paid_status?.toUpperCase()}
                </Tag>
            </div>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card size="small" title="Financials & Pricing" className="expanded-card">
                        <div className="detail-row"><span>MRP:</span><strong>৳{Number(record.mrp || 0).toLocaleString()}</strong></div>
                        <div className="detail-row"><span>Discount:</span><strong className="text-red">-৳{Number(record.discount || 0).toLocaleString()}</strong></div>
                        <div className="detail-row"><span>Sell Price:</span><strong>৳{Number(record.sell_price || 0).toLocaleString()}</strong></div>
                        <div className="detail-row"><span>Delivery Charge:</span><strong>+৳{Number(record.delivery_charge || 0).toLocaleString()}</strong></div>
                        <div className="detail-row"><span>Advance Payment:</span><strong className="text-green">৳{Number(record.advance_payment || 0).toLocaleString()}</strong></div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className="detail-row final"><span>Total Payable:</span><strong className="text-primary">৳{Number(record.payable_price || 0).toLocaleString()}</strong></div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small" title="Logistics & Customer" className="expanded-card">
                        <div className="detail-row"><span>Customer Name:</span><strong>{record.customer_name || 'N/A'}</strong></div>
                        <div className="detail-row"><span>Phone Number:</span><strong>{record.phone_number || 'N/A'}</strong></div>
                        <div className="detail-row"><span>District:</span><strong>{record.district?.name || 'N/A'}</strong></div>
                        <div className="detail-row"><span>Courier Partner:</span><strong>{record.courier?.name || 'Unassigned'}</strong></div>
                        <div className="detail-row"><span>Channel Source:</span><strong>{record.order_from?.name || 'Website'}</strong></div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small" title="Order Metrics & Flags" className="expanded-card">
                        <div className="detail-row"><span>Total Items / Qty:</span><strong>{record.total_quantity || 1} Pcs</strong></div>
                        <div className="detail-row"><span>Net Order Price:</span><strong>৳{Number(record.net_order_price || 0).toLocaleString()}</strong></div>
                        <div className="detail-row"><span>Duplicate Flag:</span><strong>{record.is_duplicate ? "Yes" : "No"}</strong></div>
                        <div className="detail-row"><span>Follow-up Flag:</span><strong>{record.is_follow_order ? "Yes" : "No"}</strong></div>
                        <div className="detail-row"><span>Downsell Flag:</span><strong>{record.is_down_sell ? "Yes" : "No"}</strong></div>
                        <div className="detail-row"><span>Cross-sell Flag:</span><strong>{record.is_cross_sell ? "Yes" : "No"}</strong></div>
                        <div className="detail-row"><span>Order Date:</span><strong>{dayjs(record.created_at).format('DD MMM YYYY, hh:mm A')}</strong></div>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    const handlePrint = () => {
        window.print();
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Invoice Number", "Customer Name", "Phone", "Channel", "Courier", "District", "MRP", "Discount", "Sell Price", "Delivery Charge", "Advance Payment", "Payable Price", "Net Order Price", "Total Quantity", "Duplicate", "Followup", "Downsell", "Cross-sell", "Status", "Paid Status", "Created At"];
        const rows = dataToExport.map((item, index) => [
            index + 1,
            `"${item.invoice_number || ''}"`,
            `"${item.customer_name || ''}"`,
            `"${item.phone_number || ''}"`,
            `"${item.order_from?.name || ''}"`,
            `"${item.courier?.name || 'Unassigned'}"`,
            `"${item.district?.name || 'N/A'}"`,
            item.mrp || 0,
            item.discount || 0,
            item.sell_price || 0,
            item.delivery_charge || 0,
            item.advance_payment || 0,
            item.payable_price || 0,
            item.net_order_price || 0,
            item.total_quantity || 1,
            item.is_duplicate ? "Yes" : "No",
            item.is_follow_order ? "Yes" : "No",
            item.is_down_sell ? "Yes" : "No",
            item.is_cross_sell ? "Yes" : "No",
            `"${item.current_status?.name || ''}"`,
            `"${item.paid_status || 'unpaid'}"`,
            `"${dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss")}"`
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Orders_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        
        doc.setFontSize(16);
        doc.text("Order Report", 14, 18);
        doc.setFontSize(9);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD HH:mm:ss")} | Total Items: ${dataToExport.length}`, 14, 25);
        
        if (summary) {
            doc.text(`Total Volume: ${summary.total_orders} Orders | Total Payable: ৳${Number(summary.total_payable_price || 0).toLocaleString()} | Success Rate: ${summary.success_rate}%`, 14, 31);
        }

        const tableColumn = ["#", "Invoice", "Customer", "Phone", "Logistics", "MRP", "Discount", "Advance", "Payable", "Status", "Paid"];
        const tableRows = dataToExport.map((item, index) => [
            index + 1,
            item.invoice_number,
            item.customer_name || 'N/A',
            item.phone_number || 'N/A',
            `${item.courier?.name || 'Unassigned'} (${item.district?.name || 'N/A'})`,
            `৳${Number(item.mrp || 0).toLocaleString()}`,
            `৳${Number(item.discount || 0).toLocaleString()}`,
            `৳${Number(item.advance_payment || 0).toLocaleString()}`,
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

        doc.save(`Orders_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print flex-between">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                            Order Report
                        </Title>
                        {summary && (
                            <Badge count={`${summary.total_orders?.toLocaleString()} Orders`} style={{ backgroundColor: '#10b981' }}/>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Comprehensive revenue analytics, channel distribution
                    </Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>
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
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card blue">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon blue">
                                        <DollarOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Total Payable Value</span>
                                        <div className="mini-card-val">
                                            ৳{Number(summary.total_payable_price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">MRP ৳{Number(summary.total_mrp || 0).toLocaleString()}</span>
                                    <span className="footer-pill red">Disc -৳{Number(summary.total_discount || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <ShoppingCartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Total Orders</span>
                                            <span className="mini-badge-pill">{summary.processing_count} Proc.</span>
                                        </div>
                                        <div className="mini-card-val">
                                            {summary.total_orders?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">{summary.success_rate}% Del. ({summary.delivered_count})</span>
                                    <span className="footer-pill">Canc {summary.canceled_count}</span>
                                    <span className="footer-pill">Ret {summary.returned_count}</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card purple">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon purple">
                                        <TagOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Products Sold & AOV</span>
                                        <div className="mini-card-val">
                                            {summary.total_quantity_sold?.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Units</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">AOV ৳{Number(summary.average_order_value || 0).toLocaleString()}</span>
                                    <span className="footer-pill">{summary.unique_customers?.toLocaleString()} Clients</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <WalletOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Advance Collected</span>
                                        <div className="mini-card-val text-green">
                                            ৳{Number(summary.total_advance_payment || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Paid {summary.paid_order_count}</span>
                                    <span className="footer-pill red">Unpaid {summary.unpaid_order_count}</span>
                                    <span className="footer-pill">Cpn ৳{Number(summary.total_coupon_value || 0).toLocaleString()}</span>
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
                                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Order Distribution Analytics</span>
                                {(statusId || orderFromId || paidStatusFilter) && (
                                    <Tag color="blue" closable 
                                        onClose={() => {
                                            setStatusId(null);
                                            setOrderFromId(null);
                                            setPaidStatusFilter(null);
                                        }}
                                        style={{ fontSize: 10, margin: 0 }}
                                    >
                                        Filter Active
                                    </Tag>
                                )}
                            </Space>
                            <Tabs activeKey={breakdownView} onChange={setBreakdownView} size="small" style={{ marginBottom: -8 }}
                                items={[
                                    { key: 'status', label: `Status (${statusBreakdown.length})` },
                                    { key: 'channel', label: `Channel (${orderFromBreakdown.length})` },
                                    { key: 'payment', label: `Payment (${paymentBreakdown.length})` }
                                ]}
                            />
                        </div>
                    }
                >
                    {breakdownView === 'status' && (
                        <div className="status-chip-ribbon">
                            {statusBreakdown.map((item) => {
                                const isSelected = statusId === item.status_id;
                                const percent = summary?.total_orders ? Math.round((item.order_count / summary.total_orders) * 100) : 0;
                                return (
                                    <div key={item.status_id} className={`status-chip ${isSelected ? 'active' : ''}`} onClick={() => setStatusId(isSelected ? null : item.status_id)}>
                                        <span className="chip-name">{item.status_name}</span>
                                        <span className="chip-count">{item.order_count}</span>
                                        <span className="chip-price">৳{Number(item.total_payable_price || 0).toLocaleString()}</span>
                                        <span className="chip-percent">{percent}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {breakdownView === 'channel' && (
                        <div className="channel-chip-ribbon">
                            {orderFromBreakdown.map((item) => {
                                const isSelected = orderFromId === item.order_from_id;
                                const percent = summary?.total_orders ? Math.round((item.order_count / summary.total_orders) * 100) : 0;
                                return (
                                    <div key={item.order_from_id} className={`compact-channel-chip ${isSelected ? 'active' : ''}`} onClick={() => setOrderFromId(isSelected ? null : item.order_from_id)}>
                                        <ShoppingOutlined style={{ color: '#1E50A2', fontSize: 14 }} />
                                        <span className="chip-name">{item.order_from_name}</span>
                                        <span className="chip-count">{item.order_count} Orders ({percent}%)</span>
                                        <span className="chip-price">Total: ৳{Number(item.total_payable_price || 0).toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {breakdownView === 'payment' && (
                        <div className="payment-chip-ribbon">
                            {paymentBreakdown.map((item) => {
                                const isPaid = item.paid_status === 'paid';
                                const isSelected = paidStatusFilter === item.paid_status;
                                return (
                                    <div key={item.paid_status} className={`compact-payment-chip ${isPaid ? 'paid' : 'unpaid'} ${isSelected ? 'active' : ''}`}
                                        onClick={() => setPaidStatusFilter(isSelected ? null : item.paid_status)}
                                    >
                                        <Badge status={isPaid ? "success" : "error"} text={
                                            <span className="chip-name" style={{ textTransform: 'uppercase' }}>
                                                {item.paid_status}
                                            </span>
                                        } />
                                        <span className="chip-count">{item.order_count} Orders</span>
                                        <span className="chip-price">Payable: ৳{Number(item.total_payable_price || 0).toLocaleString()}</span>
                                        <span className="chip-advance">Advance: ৳{Number(item.total_advance_payment || 0).toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            <div className="filter-toolbar no-print">
                <Space wrap size="middle" align="center">
                    <Input placeholder="Search Invoice, Customer, Phone, Courier, District..." allowClear value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} onPressEnter={handleSearch} className="search-input" prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}/>
                    
                    <Select placeholder="Order Source" value={orderFromId} style={{ width: 140 }} onChange={setOrderFromId} allowClear suffixIcon={<ShoppingOutlined style={{ color: '#94a3b8' }} />}>
                        {orderFromList?.map(item => (
                            <Option key={item.id} value={item.id}>{item.name}</Option>
                        ))}
                    </Select>

                    <Select 
                        placeholder="Order Status"
                        value={statusId} 
                        style={{ width: 150 }} 
                        onChange={setStatusId}
                        allowClear
                        suffixIcon={<FilterOutlined style={{ color: '#94a3b8' }} />}
                    >
                        {statusBreakdown?.map(item => (
                            <Option key={item.status_id} value={item.status_id}>{item.status_name} ({item.order_count})</Option>
                        ))}
                    </Select>

                    <Select placeholder="Payment Status" value={paidStatusFilter} style={{ width: 140 }} onChange={setPaidStatusFilter} allowClear>
                        <Option value="paid">Paid</Option>
                        <Option value="unpaid">Unpaid</Option>
                    </Select>

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
                    expandable={{
                        expandedRowRender,
                    }}
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
                        showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} orders`,
                    }}
                    className="order-intelligence-table"
                />
            </div>
        </div>
    );
}
