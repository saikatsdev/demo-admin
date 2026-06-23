import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider, Row, Col, Card, Avatar, Tag, Progress, Tooltip } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, RocketOutlined, DollarOutlined, HistoryOutlined, BarChartOutlined, InboxOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CourierReport() {
    // Hook
    useTitle("Courier Analytics Hub");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [couriers, setCouriers]               = useState([]);
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
            const res = await getDatas(`/admin/order/reports/courier?${query}`);
            if(res && res?.success){
                setCouriers(res?.result?.couriers?.data || []);
                setSummary(res?.result?.summary || null);
                setPagination(prev => ({ 
                    ...prev, 
                    total: res?.result?.couriers?.total || 0,
                    current: res?.result?.couriers?.current_page || 1
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

    const getFilteredData = () => {
        return couriers.filter((c) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return c.courier_name?.toLowerCase().includes(term);
        });
    };

    const getExportData = () => {
        const filtered = getFilteredData();
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.courier_id));
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
        doc.text("Courier Performance Report", 14, 22);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.setFontSize(11);
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
        const tableColumn = ["#", "Courier", "Success Rate", "Orders", "Settlement", "Payable"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.courier_name,
            `${o.courier_metrics?.delivery_success_rate}%`,
            o.order_count,
            `৳${Number(o.total_courier_payable || 0).toLocaleString()}`,
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
        doc.save(`Courier_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Courier", "Delivered", "Canceled", "Returned", "Orders", "Net Price", "Logistics Charge", "Courier Payable", "Success Rate"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.courier_name,
            o.delivered_count,
            o.canceled_count,
            o.returned_count,
            o.order_count,
            o.total_net_order_price,
            o.total_delivery_charge,
            o.total_courier_payable,
            `${o.courier_metrics?.delivery_success_rate}%`
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Courier_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
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
            title: "Courier Partner",
            key: "courier",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar shape="square" size={44} src={record.courier_img_path} style={{ borderRadius: 8, border: '1px solid #f1f5f9' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>{record.courier_name}</Text>
                        <Tag style={{ fontSize: 10, margin: 0, width: 'fit-content', borderRadius: 4 }}>ID: {record.courier_id}</Tag>
                    </div>
                </div>
            ),
            width: 250
        },
        {
            title: "Delivery Health",
            key: "rates",
            render: (_, record) => (
                <div style={{ width: 180 }}>
                    <Tooltip title={`${record.delivered_count} Delivered successfully out of dispatched items`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                            <Text type="secondary">Delivery Success</Text>
                            <Text strong style={{ color: '#10b981' }}>{record.courier_metrics?.delivery_success_rate}%</Text>
                        </div>
                        <Progress percent={record.courier_metrics?.delivery_success_rate} size={[180, 5]} showInfo={false} strokeColor="#10b981" />
                    </Tooltip>
                    <div style={{ display: 'flex', gap: '4px', marginTop: 8 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Overall</div>
                            <Progress percent={record.courier_metrics?.success_rate} size={[60, 2]} showInfo={false} strokeColor="#3b82f6" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Cancel</div>
                            <Progress percent={record.courier_metrics?.cancel_rate} size={[60, 2]} showInfo={false} strokeColor="#ef4444" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Return</div>
                            <Progress percent={record.courier_metrics?.return_rate} size={[60, 2]} showInfo={false} strokeColor="#f59e0b" />
                        </div>
                    </div>
                </div>
            ),
            width: 220
        },
        {
            title: "Volume",
            key: "volume",
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Tag color="blue" icon={<InboxOutlined />} style={{ margin: 0, borderRadius: 4 }}>
                        {record.order_count} Orders
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>{record.unique_customers} Customers</Text>
                    <Text italic style={{ fontSize: 9, marginTop: 2, color: '#94a3b8' }}>Avg. Weight: {record.courier_metrics?.average_item_weight}kg</Text>
                </div>
            ),
            width: 120
        },
        {
            title: "Settlement Status",
            key: "finance",
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ background: '#fef2f2', padding: '4px 10px', borderRadius: 6, border: '1px solid #fee2e2', marginBottom: 4 }}>
                        <Text strong style={{ color: '#b91c1c' }}>৳{Number(record.total_courier_payable).toLocaleString()}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Total Net: ৳{Number(record.total_net_order_price).toLocaleString()}</Text>
                </div>
            ),
            width: 160
        }
    ];

    const expandedRowRender = (record) => (
        <div style={{ padding: '20px 30px', background: '#f8fafc', borderRadius: 12 }}>
            <Title level={5} style={{ margin: '0 0 20px 0', fontSize: 14, color: '#64748b' }}>Logistic Pipeline Analytics: {record.courier_name}</Title>
            <Row gutter={[24, 24]}>
                <Col span={8}>
                    <Card size="small" title="Parcel Status Pipeline" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">In Courier Transit</Text>
                                <Tag color="orange">{record.in_courier_count}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Pending Pickup</Text>
                                <Tag color="blue">{record.courier_pending_count}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Received by Hub</Text>
                                <Tag color="green">{record.courier_received_count}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Total Processing</Text>
                                <Text strong>{record.processing_count}</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Logistics Financials" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Total Logistics Charge</Text>
                                <Text strong>৳{Number(record.total_delivery_charge).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Settlement Balance</Text>
                                <Text strong style={{ color: '#b91c1c' }}>৳{Number(record.total_courier_payable).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Avg. Shipping Cost</Text>
                                <Text strong>৳{record.courier_metrics?.average_delivery_charge}</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Operational Efficiency" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Avg. Order Value</Text>
                                <Text strong>৳{Number(record.courier_metrics?.average_order_value).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Success Grade</Text>
                                <Tag color={record.courier_metrics?.delivery_success_rate > 50 ? 'green' : 'blue'}>
                                    {record.courier_metrics?.delivery_success_rate > 50 ? 'Premium' : 'Standard'}
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
                <Title level={4} style={{ margin: 0 }}>Courier Hub Performance</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card main-stats">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Courier Liabilities</Text>
                                    <Title level={3} style={{ margin: 0, color: '#b91c1c' }}>৳{Number(summary.total_courier_payable || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>for {summary.total_couriers} logistics partners</Text>
                                </Space>
                                <DollarOutlined className="summary-icon" style={{ color: '#ef4444' }} />
                                <div className="card-indicator loss"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Network Transit</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.in_courier_count?.toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>parcels currently in transit</Text>
                                </Space>
                                <RocketOutlined className="summary-icon" style={{ color: '#3b82f6' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Network Health</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Title level={3} style={{ margin: 0 }}>{summary.success_rate}%</Title>
                                        <Progress type="circle" percent={summary.success_rate} size={30} strokeWidth={15} showInfo={false} strokeColor="#8b5cf6" />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Overall success rate</Text>
                                </Space>
                                <BarChartOutlined className="summary-icon" style={{ color: '#8b5cf6' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Pipeline Status</Text>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>{summary.delivered_count}</div>
                                            <div style={{ fontSize: 9, color: '#94a3b8' }}>DELIVERED</div>
                                        </div>
                                        <Divider type="vertical" style={{ height: 20 }} />
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>{summary.returned_count}</div>
                                            <div style={{ fontSize: 9, color: '#94a3b8' }}>RETURNED</div>
                                        </div>
                                    </div>
                                </Space>
                                <HistoryOutlined className="summary-icon" style={{ color: '#10b981' }} />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search courier..." 
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
                    rowKey="courier_id"
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
                .card-indicator.loss { background: #ef4444; }
                .main-stats {
                    background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
                }
            `}</style>
        </div>
    );
}
