import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Tooltip, Progress, Typography, Divider, Row, Col, Card } from "antd";
import { FilePdfOutlined, FileExcelOutlined, UserOutlined, ArrowLeftOutlined, PrinterOutlined, ReloadOutlined, CalendarOutlined, SearchOutlined, DollarOutlined, BarChartOutlined, LineChartOutlined, HistoryOutlined } from "@ant-design/icons";
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
    useTitle("Customer Intelligence Report");

    // States
    const [localSearch, setLocalSearch]         = useState("");
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
                    pageSize: res.result?.customers?.per_page || 25
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCustomerReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const handlePrint = () => {
        window.print();
    };

    const getFilteredData = () => {
        return customers.filter(c => 
            !localSearch || 
            c.customer_name?.toLowerCase().includes(localSearch.toLowerCase()) || 
            c.phone_number?.toLowerCase().includes(localSearch.toLowerCase())
        );
    };

    const getExportData = () => {
        const filtered = getFilteredData();
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.phone_number));
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
            title: "Client Profile",
            key: "profile",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserOutlined style={{ color: '#64748b' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>{record.customer_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.phone_number}</Text>
                    </div>
                </div>
            ),
            width: 200
        },
        {
            title: "Frequency",
            key: "frequency",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Tag color="geekblue" style={{ borderRadius: 4, margin: 0, width: 'fit-content' }}>{record.order_count} Orders</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>{record.total_quantity} units total</Text>
                </div>
            ),
            width: 140
        },
        {
            title: "Account Health",
            key: "account_health",
            render: (_, record) => {
                const metrics = record.customer_metrics;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Tooltip title={`Delivered: ${metrics.delivered_count} | Canceled: ${metrics.canceled_count} | Returned: ${metrics.returned_count}`}>
                            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#f1f5f9', width: 120 }}>
                                <div style={{ width: `${metrics.success_rate}%`, background: '#10b981' }} />
                                <div style={{ width: `${metrics.cancel_rate}%`, background: '#ef4444' }} />
                                <div style={{ width: `${metrics.return_rate}%`, background: '#f59e0b' }} />
                            </div>
                        </Tooltip>
                        <div style={{ display: 'flex', gap: 8, fontSize: 10, fontWeight: 600 }}>
                            <span style={{ color: '#10b981' }}>{metrics.success_rate}% Success</span>
                            {metrics.cancel_rate > 0 && <span style={{ color: '#ef4444' }}>{metrics.cancel_rate}% Cancel</span>}
                        </div>
                    </div>
                );
            },
            width: 160
        },
        {
            title: "Financial Matrix",
            key: "financials",
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: 4, border: '1px solid #dcfce7', marginBottom: 4 }}>
                        <Text strong style={{ color: '#166534', fontSize: 13 }}>৳{Number(record.total_payable_price).toLocaleString()}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 10 }}>AOV: ৳{Number(record.customer_metrics.average_order_value).toLocaleString()}</Text>
                </div>
            ),
            width: 180
        },
        {
            title: "Engagement Timeline",
            key: "timeline",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <HistoryOutlined style={{ color: '#94a3b8', fontSize: 11 }} />
                        <Text style={{ fontSize: 11 }}>First: {dayjs(record.first_order_at).format('DD MMM YY')}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CalendarOutlined style={{ color: '#94a3b8', fontSize: 11 }} />
                        <Text style={{ fontSize: 11 }} strong>Recent: {dayjs(record.last_order_at || record.first_order_at).format('DD MMM YY')}</Text>
                    </div>
                </div>
            ),
            width: 180
        }
    ];

    const expandedRowRender = (record) => {
        const m = record.customer_metrics;
        return (
            <div style={{ padding: '20px 30px', background: '#f8fafc', borderRadius: 12 }}>
                <Title level={5} style={{ margin: '0 0 20px 0', fontSize: 14, color: '#64748b' }}>Account Intelligence: {record.customer_name}</Title>
                <Row gutter={[24, 24]}>
                    <Col span={8}>
                        <Card size="small" title="Lifecycle Metrics" variant="borderless">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Total Delivered</Text>
                                    <Tag color="success">{m.delivered_count} Orders</Tag>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">In Processing</Text>
                                    <Tag color="processing">{m.processing_count} Orders</Tag>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Total Returned</Text>
                                    <Tag color="warning">{m.returned_count} Orders</Tag>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" title="Wallet Statistics" variant="borderless">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Advance Payments</Text>
                                    <Text strong style={{ color: '#10b981' }}>৳{Number(m.total_advance_payment).toLocaleString()}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Paid Orders</Text>
                                    <Text strong>{m.paid_order_count}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Unpaid Vol.</Text>
                                    <Text strong style={{ color: '#ef4444' }}>{m.unpaid_order_count}</Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" title="Economic Value" variant="borderless">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Net Gross Spend</Text>
                                    <Text strong>৳{Number(m.total_net_order_price).toLocaleString()}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Delivery Contrib.</Text>
                                    <Text strong>৳{Number(m.total_delivery_charge).toLocaleString()}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Account Start</Text>
                                    <Text strong>{dayjs(m.first_order_at).format('MMM YYYY')}</Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Customer Name", "Phone", "Orders", "Success Rate", "Lifetime Value"];
        const rows = dataToExport.map((c, i) => [
            i + 1,
            c.customer_name,
            c.phone_number,
            c.order_count,
            `${c.customer_metrics.success_rate}%`,
            c.total_payable_price
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Customer_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        doc.setFontSize(18);
        doc.text("Customer Intelligence Analysis", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD")}`, 14, 30);
        
        const tableColumn = ["#", "Customer Name", "Phone", "Orders", "Success %", "Lifetime Value"];
        const tableRows = dataToExport.map((c, i) => [
            i + 1,
            c.customer_name,
            c.phone_number,
            c.order_count,
            `${c.customer_metrics.success_rate}%`,
            `৳${Number(c.total_payable_price).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 9 }
        });
        doc.save(`Customer_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Customer Intelligence</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card main-stats">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Account Base</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_customers?.toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>verified unique customers</Text>
                                </Space>
                                <UserOutlined className="summary-icon" style={{ color: '#3b82f6' }} />
                                <div className="card-indicator info"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Aggregate Value</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.total_payable_price || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>cumulative LTV across platform</Text>
                                </Space>
                                <DollarOutlined className="summary-icon" style={{ color: '#10b981' }} />
                                <div className="card-indicator success"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Loyalty Health</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Title level={3} style={{ margin: 0 }}>{summary.success_rate}%</Title>
                                        <Progress type="circle" percent={summary.success_rate} size={30} strokeWidth={15} showInfo={false} strokeColor="#8b5cf6" />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Network-wide fulfillment rate</Text>
                                </Space>
                                <BarChartOutlined className="summary-icon" style={{ color: '#8b5cf6' }} />
                                <div className="card-indicator secondary"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Mean Spend</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.average_order_value || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>average checkout intelligence</Text>
                                </Space>
                                <LineChartOutlined className="summary-icon" style={{ color: '#f59e0b' }} />
                                <div className="card-indicator warning"></div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search Client Name/Phone..." 
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
                    rowKey="phone_number"
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
                .card-indicator.secondary { background: #8b5cf6; }
                .card-indicator.warning { background: #f59e0b; }
            `}</style>
        </div>
    );
}
