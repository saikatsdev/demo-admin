import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider, Row, Col, Card, Tag, Progress, Tooltip } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, EnvironmentOutlined, GlobalOutlined, TeamOutlined, ShoppingCartOutlined, DollarOutlined, BarChartOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function LocationReport() {
    // Hook
    useTitle("Location Wise Analytics");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [locations, setLocations]             = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({current: 1, pageSize: 25, total: 0});

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
            const res = await getDatas(`/admin/order/reports/by-location?${query}`);
            
            if(res && res?.success){
                setLocations(res?.result?.locations?.data || []);
                setSummary(res?.result?.summary || null);
                setPagination(prev => ({ 
                    ...prev, 
                    total: res?.result?.locations?.total || 0,
                    current: res?.result?.locations?.current_page || 1
                }));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getOrderReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const handlePrint = () => {
        window.print();
    };

    const getFilteredData = () => {
        return locations.filter((loc) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return loc.district_name?.toLowerCase().includes(term);
        });
    };

    const getExportData = () => {
        const filtered = getFilteredData();
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.district_id));
        }
        return filtered;
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Order Report by Location", 14, 22);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.setFontSize(11);
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
        const tableColumn = ["#", "District", "Customers", "Orders", "Success Rate", "Payable"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.district_name,
            o.unique_customers,
            o.order_count,
            `${o.location_metrics?.success_rate}%`,
            `৳${Number(o.total_payable_price || 0).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 8 }
        });
        doc.save(`Location_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "District", "Customers", "Orders", "Delivered", "Canceled", "Net Price", "Payable", "Success Rate"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.district_name,
            o.unique_customers,
            o.order_count,
            o.delivered_count,
            o.canceled_count,
            o.total_net_order_price,
            o.total_payable_price,
            `${o.location_metrics?.success_rate}%`
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Location_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
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
            title: "District / Region",
            key: "location",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EnvironmentOutlined style={{ color: '#3b82f6', fontSize: 18 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>{record.district_name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>Region ID: {record.district_id}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Client Volume",
            key: "volume",
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Tag color="geekblue" icon={<TeamOutlined />} style={{ margin: 0, borderRadius: 4 }}>
                        {record.unique_customers} Customers
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>{record.order_count} Total Orders</Text>
                </div>
            )
        },
        {
            title: "Performance Rates",
            key: "rates",
            render: (_, record) => (
                <div style={{ width: 160 }}>
                    <Tooltip title={`${record.delivered_count} Delivered / ${record.canceled_count} Canceled`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                            <Text type="secondary">Success Rate</Text>
                            <Text strong>{record.location_metrics?.success_rate}%</Text>
                        </div>
                        <Progress percent={record.location_metrics?.success_rate} size={[160, 4]} showInfo={false} strokeColor="#10b981" />
                    </Tooltip>
                    <div style={{ display: 'flex', gap: '8px', marginTop: 8 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Cancel</div>
                            <Progress percent={record.location_metrics?.cancel_rate} size={[80, 2]} showInfo={false} strokeColor="#ef4444" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Return</div>
                            <Progress percent={record.location_metrics?.return_rate} size={[80, 2]} showInfo={false} strokeColor="#f59e0b" />
                        </div>
                    </div>
                </div>
            ),
            width: 200
        },
        {
            title: "Financial Stats",
            key: "financials",
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: 4, border: '1px solid #dcfce7', marginBottom: 4 }}>
                        <Text strong style={{ color: '#166534', fontSize: 13 }}>৳{Number(record.total_payable_price).toLocaleString()}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Net: ৳{Number(record.total_net_order_price).toLocaleString()}</Text>
                </div>
            ),
            width: 150
        }
    ];

    const expandedRowRender = (record) => (
        <div style={{ padding: '20px 30px', background: '#f8fafc', borderRadius: 12 }}>
            <Title level={5} style={{ margin: '0 0 20px 0', fontSize: 14, color: '#64748b' }}>Detailed Location Metrics: {record.district_name}</Title>
            <Row gutter={[24, 24]}>
                <Col span={8}>
                    <Card size="small" title="Activity Breakdown" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Processing Orders</Text>
                                <Text strong style={{ color: '#3b82f6' }}>{record.processing_count}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Unique Customers</Text>
                                <Text strong>{record.unique_customers}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Avg. Order Value</Text>
                                <Text strong>৳{Number(record.location_metrics?.average_order_value).toLocaleString()}</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Revenue & Loss" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Shipment Income</Text>
                                <Text strong style={{ color: '#10b981' }}>৳{Number(record.total_delivery_charge).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Advance Received</Text>
                                <Text strong>৳{Number(record.total_advance_payment).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Total Discounts</Text>
                                <Text strong style={{ color: '#ef4444' }}>৳{Number(record.total_discount).toLocaleString()}</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Campaign Performance" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Coupon Redemption</Text>
                                <Text strong>৳{Number(record.total_coupon_value).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Success Grade</Text>
                                <Tag color={record.location_metrics?.success_rate > 30 ? 'green' : record.location_metrics?.success_rate > 20 ? 'blue' : 'orange'}>
                                    {record.location_metrics?.success_rate > 30 ? 'High' : record.location_metrics?.success_rate > 20 ? 'Average' : 'Low'}
                                </Tag>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Regional Sales Performance</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card main-stats">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Regional Revenue</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.total_payable_price || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>from {summary.total_locations} active districts</Text>
                                </Space>
                                <GlobalOutlined className="summary-icon" style={{ color: '#3b82f6' }} />
                                <div className="card-indicator success"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Unique Customers</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.unique_customers?.toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>total {summary.total_orders} orders</Text>
                                </Space>
                                <TeamOutlined className="summary-icon" style={{ color: '#10b981' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Network Efficiency</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Title level={3} style={{ margin: 0 }}>{summary.success_rate}%</Title>
                                        <Progress type="circle" percent={summary.success_rate} size={30} strokeWidth={15} showInfo={false} strokeColor="#10b981" />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Overall success rate</Text>
                                </Space>
                                <BarChartOutlined className="summary-icon" style={{ color: '#8b5cf6' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Logistics Income</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.total_delivery_charge || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>total delivery charges</Text>
                                </Space>
                                <ShoppingCartOutlined className="summary-icon" style={{ color: '#f59e0b' }} />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search by district..." 
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
                    rowKey="district_id"
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
                    padding: 16px;
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
                .card-indicator.success { background: #3b82f6; }
                .main-stats {
                    background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
                }
            `}</style>
        </div>
    );
}
