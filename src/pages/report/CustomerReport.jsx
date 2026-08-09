import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Tooltip, Progress, Typography, Card, Row, Col, Avatar } from "antd";
import { FilePdfOutlined, FileExcelOutlined, UserOutlined, ArrowLeftOutlined, PrinterOutlined, ReloadOutlined, CalendarOutlined, SearchOutlined, DollarOutlined,BarChartOutlined, LineChartOutlined, HistoryOutlined,CheckCircleOutlined,CloseCircleOutlined,SyncOutlined,RollbackOutlined} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CustomerReport() {
    // Hooks
    useTitle("Customer Performance Analytics");

    // States
    const [localSearch, setLocalSearch]         = useState("");
    const [search, setSearch]                   = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [customers, setCustomers]             = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });

    const getCustomerReport = async () => {
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

        try {
            setLoading(true);
            const query = new URLSearchParams(params).toString();
            const res = await getDatas(`/admin/order/reports/by-customer?${query}`);

            if (res && res.success) {
                setCustomers(res.result?.customers?.data || []);
                setSummary(res.result?.summary || null);
                setPagination(prev => ({
                    ...prev,
                    total: res.result?.customers?.total || 0,
                    current: res.result?.customers?.current_page || 1,
                    pageSize: res.result?.customers?.per_page || prev.pageSize || 25
                }));
            }
        } catch (error) {
            console.error("Error fetching customer report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCustomerReport();
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
            return customers.filter(item => selectedRowKeys.includes(item.phone_number || item.id));
        }
        return customers;
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = [
            "SL", "Customer Name", "Phone Number", "Total Orders", "Total Quantity", 
            "Delivered", "Canceled", "Returned", "Processing", "Success Rate (%)", 
            "Paid Orders", "Unpaid Orders", "Advance Payment", "Delivery Charge", 
            "Net Order Price", "Payable Price", "Average Order Value", "First Order", "Last Order"
        ];

        const rows = dataToExport.map((c, i) => {
            const m = c.customer_metrics || {};
            return [
                i + 1,
                `"${c.customer_name || ''}"`,
                `"${c.phone_number || ''}"`,
                c.order_count || m.order_count || 0,
                c.total_quantity || m.total_quantity || 0,
                c.delivered_count ?? m.delivered_count ?? 0,
                c.canceled_count ?? m.canceled_count ?? 0,
                c.returned_count ?? m.returned_count ?? 0,
                c.processing_count ?? m.processing_count ?? 0,
                `${m.success_rate ?? c.success_rate ?? 0}%`,
                c.paid_order_count ?? m.paid_order_count ?? 0,
                c.unpaid_order_count ?? m.unpaid_order_count ?? 0,
                c.total_advance_payment || m.total_advance_payment || 0,
                c.total_delivery_charge || m.total_delivery_charge || 0,
                c.total_net_order_price || m.total_net_order_price || 0,
                c.total_payable_price || m.total_payable_price || 0,
                m.average_order_value || c.average_order_value || 0,
                `"${c.first_order_at || m.first_order_at || ''}"`,
                `"${c.last_order_at || m.last_order_at || ''}"`
            ];
        });

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Customer_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        doc.setFontSize(16);
        doc.text("Customer Performance & Sales Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD HH:mm")}`, 14, 27);
        
        const tableColumn = ["#", "Customer Name", "Phone", "Orders", "Qty", "Delivered", "Canceled", "Returned", "Success Rate", "AOV", "Lifetime Value"];
        const tableRows = dataToExport.map((c, i) => {
            const m = c.customer_metrics || {};
            return [
                i + 1,
                c.customer_name,
                c.phone_number,
                c.order_count || m.order_count || 0,
                c.total_quantity || m.total_quantity || 0,
                c.delivered_count ?? m.delivered_count ?? 0,
                c.canceled_count ?? m.canceled_count ?? 0,
                c.returned_count ?? m.returned_count ?? 0,
                `${m.success_rate ?? c.success_rate ?? 0}%`,
                `৳${Number(m.average_order_value || c.average_order_value || c.total_payable_price || 0).toLocaleString()}`,
                `৳${Number(c.total_payable_price || m.total_payable_price || 0).toLocaleString()}`
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
        doc.save(`Customer_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
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
            width: 200
        },
        {
            title: "Order Quantity",
            key: "frequency",
            align: 'center',
            render: (_, record) => {
                const m = record.customer_metrics || {};
                const orderCount = record.order_count || m.order_count || 0;
                const totalQty = record.total_quantity || m.total_quantity || 0;
                const paidCount = Number(record.paid_order_count ?? m.paid_order_count ?? 0);
                const unpaidCount = Number(record.unpaid_order_count ?? m.unpaid_order_count ?? 0);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Tag color="geekblue" style={{ borderRadius: 4, margin: 0, fontWeight: 700, fontSize: 10.5 }}>
                            {orderCount} {orderCount === 1 ? 'Order' : 'Orders'}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 10.5 }}>
                            {totalQty} QTY Sold
                        </Text>
                        <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 1 }}>
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>{paidCount} Paid</span> | <span style={{ color: '#dc2626', fontWeight: 600 }}>{unpaidCount} Unpaid</span>
                        </div>
                    </div>
                );
            },
            width: 140
        },
        {
            title: "Order Status Breakdown",
            key: "status_breakdown",
            align: 'center',
            render: (_, record) => {
                const m = record.customer_metrics || {};
                const del = Number(record.delivered_count ?? m.delivered_count ?? 0);
                const proc = Number(record.processing_count ?? m.processing_count ?? 0);
                const canc = Number(record.canceled_count ?? m.canceled_count ?? 0);
                const ret = Number(record.returned_count ?? m.returned_count ?? 0);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <Tooltip title={`Delivered: ${del}`}>
                                <Tag style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '1px 5px' }}>
                                    <CheckCircleOutlined /> Delivered: {del}
                                </Tag>
                            </Tooltip>
                            <Tooltip title={`Processing: ${proc}`}>
                                <Tag style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '1px 5px' }}>
                                    <SyncOutlined /> Processing: {proc}
                                </Tag>
                            </Tooltip>
                        </div>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <Tooltip title={`Canceled: ${canc}`}>
                                <Tag style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '1px 5px' }}>
                                    <CloseCircleOutlined /> Canceled: {canc}
                                </Tag>
                            </Tooltip>
                            <Tooltip title={`Returned: ${ret}`}>
                                <Tag style={{ background: '#fffbe8', color: '#d97706', border: '1px solid #fef08a', fontSize: 9.5, margin: 0, borderRadius: 4, fontWeight: 700, padding: '1px 5px' }}>
                                    <RollbackOutlined /> Returned: {ret}
                                </Tag>
                            </Tooltip>
                        </div>
                    </div>
                );
            },
            width: 170
        },
        {
            title: "Performance Rates",
            key: "rates",
            render: (_, record) => {
                const m = record.customer_metrics || {};
                const successRate = Number(m.success_rate ?? record.success_rate ?? 0);
                const cancelRate = Number(m.cancel_rate ?? record.cancel_rate ?? 0);
                const returnRate = Number(m.return_rate ?? record.return_rate ?? 0);

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
            width: 165
        },
        {
            title: "Total Order Amount",
            key: "financials",
            align: 'right',
            render: (_, record) => {
                const m = record.customer_metrics || {};
                const totalPayable = Number(record.total_payable_price || m.total_payable_price || 0);
                const aov = Number(m.average_order_value || record.average_order_value || totalPayable);
                const advance = Number(record.total_advance_payment || m.total_advance_payment || 0);
                const deliveryCharge = Number(record.total_delivery_charge || m.total_delivery_charge || 0);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <div style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: 6, border: '1px solid #bbf7d0', display: 'inline-block' }}>
                            <Text strong style={{ color: '#15803d', fontSize: 13 }}>
                                ৳{totalPayable.toLocaleString()}
                            </Text>
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748b' }}>
                            Average Order Value: <span style={{ fontWeight: 600, color: '#334155' }}>৳{aov.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, fontSize: 9.5 }}>
                            {advance > 0 && (
                                <span style={{ color: '#059669', fontWeight: 600 }}>
                                    Advance: ৳{advance.toLocaleString()}
                                </span>
                            )}
                            {deliveryCharge > 0 && (
                                <span style={{ color: '#64748b' }}>
                                    Delivery Charge: ৳{deliveryCharge.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
            width: 175
        },
        {
            title: "Order Date",
            key: "timeline",
            render: (_, record) => {
                const firstDate = record.first_order_at || record.customer_metrics?.first_order_at;
                const lastDate = record.last_order_at || record.customer_metrics?.last_order_at || firstDate;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <HistoryOutlined style={{ color: '#94a3b8', fontSize: 11 }} />
                            <Text style={{ fontSize: 10.5, color: '#64748b' }}>
                                First Order: <span style={{ fontWeight: 600, color: '#334155' }}>{firstDate ? dayjs(firstDate).format('DD MMM YYYY') : 'N/A'}</span>
                            </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CalendarOutlined style={{ color: '#94a3b8', fontSize: 11 }} />
                            <Text style={{ fontSize: 10.5, color: '#64748b' }}>
                                Recent Order: <span style={{ fontWeight: 700, color: '#0f172a' }}>{lastDate ? dayjs(lastDate).format('DD MMM YYYY') : 'N/A'}</span>
                            </Text>
                        </div>
                    </div>
                );
            },
            width: 160
        }
    ];

    return (
        <div className="reportWrapper">
            {/* Header */}
            <div className="topBar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0, color: '#0f172a' }}>Customer Performance & Intelligence Report</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Detailed account lifetime value, fulfillment health, and order engagement analytics</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={getCustomerReport} loading={loading}>
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
                                        <UserOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Total Customer</span>
                                        <span className="mini-card-val">
                                            {Number(summary.total_customers || 0).toLocaleString()} Customers
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">{summary.total_orders || 0} Total Orders</span>
                                    <span className="footer-pill blue">{summary.total_quantity || 0} Qty Sold</span>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <DollarOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Total Payable (TAKA)</span>
                                        <span className="mini-card-val">
                                            ৳{Number(summary.total_payable_price || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Net Price: ৳{Number(summary.total_net_order_price || 0).toLocaleString()}</span>
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
                                    <span className="footer-pill">Total: {summary.total_orders || 0}</span>
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
                                        <span className="mini-card-label">Average Order Value (AOV)</span>
                                        <span className="mini-card-val">
                                            ৳{Number(summary.average_order_value || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill red">Cancel: {summary.canceled_count || 0}</span>
                                    <span className="footer-pill orange">Return: {summary.returned_count || 0}</span>
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
                        placeholder="Search Client Name or Phone..." 
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
                    rowKey={(record) => record.phone_number || record.customer_name}
                    columns={columns}
                    dataSource={customers}
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                        showSizeChanger: true,
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total) => `Total ${total} customers`,
                    }}
                />
            </div>
        </div>
    );
}
