import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Typography, Divider, Row, Col, Card, Progress } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, SearchOutlined, ShoppingOutlined, PrinterOutlined, ArrowLeftOutlined, CalendarOutlined, ShoppingCartOutlined, UserOutlined, GlobalOutlined, DollarOutlined, BarChartOutlined, LineChartOutlined, RocketOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useTitle from "../../hooks/useTitle";
import "./report.css";

const { Option }   = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function OrderReport() {
    // Hook
    useTitle("Global Order Intelligence");

    // States
    const orderFromList                         = useSelector((state) => state.orderFrom.list);
    const [orders, setOrders]                   = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [localSearch, setLocalSearch]         = useState("");
    const [orderFromId, setOrderFromId]         = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({current: 1, pageSize: 25, total: 0});

    const fetchOrders = async () => {
        setLoading(true);
        let params = {
            page         : pagination.current,
            paginate_size: pagination.pageSize,
            search       : localSearch,
            order_from_id: orderFromId,
        };

        if (dateFilter !== "all" && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange?.[0] && dateRange?.[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date   = dateRange[1].format("YYYY-MM-DD");
        }

        try {
            const query = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ""))).toString();
            const res = await getDatas(`/admin/order/reports?${query}`);

            if (res?.success) {
                setOrders(res?.result?.orders?.data || []);
                setSummary(res?.result?.summary || null);
                setPagination((prev) => ({
                    ...prev,
                    total: res?.result?.orders?.total || 0,
                    current: res?.result?.orders?.current_page || 1
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize, orderFromId]);

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchOrders();
    };

    const handleClearFilters = () => {
        setDateFilter("all");
        setLocalSearch("");
        setOrderFromId(null);
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
                order.phone_number?.toLowerCase().includes(term)
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
                <span style={{ fontWeight: 600, color: '#94a3b8' }}>
                    {(pagination.current - 1) * pagination.pageSize + index + 1}
                </span>
            ),
            width: 60,
            align: 'center'
        },
        {
            title: "Identity & Channel",
            key: "identity",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ color: '#1e293b' }}>{record.invoice_number}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Tag style={{ fontSize: 10, margin: 0, borderRadius: 4, background: record.order_from?.color, color: '#fff', border: 'none' }}>
                            {record.order_from?.name}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 10 }}>{dayjs(record.created_at).format('DD MMM, YYYY')}</Text>
                    </div>
                </div>
            ),
            width: 200
        },
        {
            title: "Customer Profile",
            key: "customer",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserOutlined style={{ color: '#64748b' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Text strong style={{ fontSize: 13 }} ellipsis>{record.customer_name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.phone_number}</Text>
                    </div>
                </div>
            ),
            width: 210
        },
        {
            title: "Logistics",
            key: "logistics",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RocketOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                        <Text style={{ fontSize: 12 }}>{record.courier?.name || "Unassigned"}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <GlobalOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                        <Text style={{ fontSize: 11 }} type="secondary">{record.district?.name || "N/A"}</Text>
                    </div>
                </div>
            ),
            width: 160
        },
        {
            title: "Financials",
            key: "financials",
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ background: '#f0fdf4', padding: '2px 8px', borderRadius: 4, border: '1px solid #dcfce7', marginBottom: 4 }}>
                        <Text strong style={{ color: '#166534', fontSize: 13 }}>৳{Number(record.payable_price).toLocaleString()}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 10 }}>Qty: {record.total_quantity} | Net: ৳{Number(record.net_order_price).toLocaleString()}</Text>
                </div>
            ),
            width: 180
        },
        {
            title: "Status",
            key: "status",
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Tag 
                        style={{ 
                            margin: 0, 
                            borderRadius: 12, 
                            padding: '2px 12px',
                            background: record.current_status?.bg_color,
                            color: record.current_status?.text_color,
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 11
                        }}
                    >
                        {record.current_status?.name}
                    </Tag>
                    <Tag color={record.paid_status === 'paid' ? 'success' : 'error'} size="small" style={{ fontSize: 9, borderRadius: 4, margin: 0 }}>
                        {record.paid_status?.toUpperCase()}
                    </Tag>
                </div>
            ),
            width: 140
        }
    ];

    const expandedRowRender = (record) => (
        <div style={{ padding: '20px 30px', background: '#f8fafc', borderRadius: 12 }}>
            <Title level={5} style={{ margin: '0 0 20px 0', fontSize: 14, color: '#64748b' }}>Technical Order Breakdown: {record.invoice_number}</Title>
            <Row gutter={[24, 24]}>
                <Col span={8}>
                    <Card size="small" title="Pricing Structure" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">MRP Value</Text>
                                <Text strong>৳{Number(record.mrp).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Standard Discount</Text>
                                <Text strong style={{ color: '#ef4444' }}>৳{Number(record.discount).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Delivery Cost</Text>
                                <Text strong>৳{Number(record.delivery_charge).toLocaleString()}</Text>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Process Flags" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Is Duplicate?</Text>
                                <Tag color={record.is_duplicate ? 'red' : 'green'}>{record.is_duplicate ? 'Yes' : 'No'}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Follow-up Order</Text>
                                <Tag color={record.is_follow_order ? 'blue' : 'default'}>{record.is_follow_order ? 'Yes' : 'No'}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Downsell Flag</Text>
                                <Tag color={record.is_down_sell ? 'orange' : 'default'}>{record.is_down_sell ? 'Yes' : 'No'}</Tag>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card size="small" title="Audit Information" variant="borderless">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Total Quantity</Text>
                                <Text strong>{record.total_quantity} Units</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Advance Paid</Text>
                                <Text strong style={{ color: '#10b981' }}>৳{Number(record.advance_payment).toLocaleString()}</Text>
                            </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Timestamp</Text>
                                <Text strong>{dayjs(record.created_at).format('DD MMM YY, hh:mm A')}</Text>
                            </div>
                        </div>
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
        const headers = ["SL", "Customer", "Invoice", "Quantity", "Total Price", "Date", "Status", "Source"];
        const rows = dataToExport.map((item, index) => [
            index + 1,
            item.customer_name,
            item.invoice_number,
            item.total_quantity,
            item.payable_price,
            dayjs(item.created_at).format("YYYY-MM-DD HH:mm"),
            item.current_status?.name || 'N/A',
            item.order_from?.name || 'N/A'
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
        doc.setFontSize(18);
        doc.text("Global Order Intelligence Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD HH:mm")}`, 14, 30);
        
        const tableColumn = ["#", "Customer", "Invoice", "Qty", "Amount", "Date", "Status"];
        const tableRows = dataToExport.map((item, index) => [
            index + 1,
            item.customer_name,
            item.invoice_number,
            item.total_quantity,
            `৳${Number(item.payable_price).toLocaleString()}`,
            dayjs(item.created_at).format("DD MMM YY"),
            item.current_status?.name || 'N/A'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 8 }
        });

        doc.save(`Orders_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Global Order Intelligence</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card main-stats">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Gross Pipeline</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_orders?.toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>orders from {summary.unique_customers} unique clients</Text>
                                </Space>
                                <ShoppingCartOutlined className="summary-icon" style={{ color: '#3b82f6' }} />
                                <div className="card-indicator info"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>In-Flight Volume</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.processing_count?.toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>parcels currently processing</Text>
                                </Space>
                                <BarChartOutlined className="summary-icon" style={{ color: '#10b981' }} />
                                <div className="card-indicator success"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Conversion Health</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Title level={3} style={{ margin: 0 }}>{summary.success_rate}%</Title>
                                        <Progress type="circle" percent={summary.success_rate} size={30} strokeWidth={15} showInfo={false} strokeColor="#8b5cf6" />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Global success benchmark</Text>
                                </Space>
                                <LineChartOutlined className="summary-icon" style={{ color: '#8b5cf6' }} />
                                <div className="card-indicator secondary"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Avg. Intelligence</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.average_order_value || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>mean value per order</Text>
                                </Space>
                                <DollarOutlined className="summary-icon" style={{ color: '#f59e0b' }} />
                                <div className="card-indicator warning"></div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search Invoice/Customer/Phone..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        onPressEnter={handleSearch}
                        style={{ width: 280 }}
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    />
                    
                    <Select 
                        placeholder="Source"
                        value={orderFromId} 
                        style={{ width: 140 }} 
                        onChange={setOrderFromId}
                        allowClear
                        suffixIcon={<ShoppingOutlined style={{ color: '#bfbfbf' }} />}
                    >
                        {orderFromList?.map(item => (
                            <Option key={item.id} value={item.id}>{item.name}</Option>
                        ))}
                    </Select>

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

                    <Button icon={<ReloadOutlined />} onClick={handleClearFilters}>Reset</Button>
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
                .card-indicator.secondary { background: #8b5cf6; }
                .card-indicator.warning { background: #f59e0b; }
            `}</style>
        </div>
    );
}
