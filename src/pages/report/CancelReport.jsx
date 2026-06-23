import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Typography, Divider, Row, Col, Card, Avatar } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, UserOutlined, ShoppingOutlined, StopOutlined, WarningOutlined, DollarOutlined, AreaChartOutlined, GlobalOutlined, CarOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CancelReport() {
    // Hooks
    useTitle("Cancel Order Intelligence");

    // States
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [orders, setOrders]                   = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [reasonBreakdown, setReasonBreakdown] = useState([]);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });

    const getCancelReport = async () => {
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
            const res = await getDatas(`/admin/order/reports/cancel?${query}`);
            if(res && res?.success){
                const result = res?.result;
                setOrders(result?.orders?.data || []);
                setSummary(result?.summary || null);
                setReasonBreakdown(result?.cancel_reason_breakdown || []);
                setPagination(prev => ({ 
                    ...prev, 
                    total: result?.orders?.total || 0,
                    current: result?.orders?.current_page || 1
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCancelReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const handlePrint = () => {
        window.print();
    };

    const getFilteredData = () => {
        return orders.filter((order) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                order.phone_number?.toLowerCase().includes(term) || 
                order.customer_name?.toLowerCase().includes(term) ||
                order.invoice_number?.toLowerCase().includes(term)
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

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        doc.setFontSize(18);
        doc.text("Cancel Order Intelligence Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD")} | Filter: ${dateFilter}`, 14, 30);
        
        const tableColumn = ["#", "Invoice", "Customer", "Reason", "Items", "Cancel Value", "Date"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.invoice_number,
            o.customer_name,
            o.cancel_reason_info?.name || "N/A",
            o.cancel_summary?.items_count,
            `৳${Number(o.cancel_summary?.total_value).toLocaleString()}`,
            dayjs(o.created_at).format("DD MMM YYYY")
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38], textColor: 255 },
            styles: { fontSize: 8 }
        });
        doc.save(`Cancel_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Invoice", "Customer", "Phone", "Reason", "Items", "Qty", "Cancel Value", "Advance", "Date"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.invoice_number,
            o.customer_name,
            o.phone_number,
            o.cancel_reason_info?.name || "",
            o.cancel_summary?.items_count,
            o.cancel_summary?.total_quantity,
            o.cancel_summary?.total_value,
            o.advance_payment,
            dayjs(o.created_at).format("YYYY-MM-DD")
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Cancel_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
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
            title: "Cancellation Identity",
            key: "identity",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ color: '#1e293b' }}>{record.invoice_number}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="default" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>{dayjs(record.created_at).format("DD MMM, YYYY")}</Tag>
                        {record.order_from && (
                            <Tag color="blue" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>{record.order_from.name}</Tag>
                        )}
                    </div>
                </div>
            ),
            width: 180
        },
        {
            title: "Customer Impact",
            key: "customer",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#fef2f2', color: '#ef4444' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: 13, color: '#1e293b' }}>{record.customer_name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.phone_number}</Text>
                    </div>
                </div>
            ),
            width: 200
        },
        {
            title: "Attrition Reason",
            key: "reason",
            render: (_, record) => (
                <Tag 
                    icon={<StopOutlined />}
                    style={{ 
                        backgroundColor: '#fff1f2', 
                        color: '#be123c',
                        border: '1px solid #fecdd3',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 11,
                        padding: '2px 8px'
                    }}
                >
                    {record.cancel_reason_info?.name?.toUpperCase() || "UNSPECIFIED"}
                </Tag>
            ),
            width: 180
        },
        {
            title: "Disruption Value",
            key: "financial",
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text strong style={{ color: '#dc2626' }}>৳{Number(record.cancel_summary?.total_value || 0).toLocaleString()}</Text>
                    {Number(record.advance_payment) > 0 && (
                        <Text type="success" style={{ fontSize: 10 }}>Advance: ৳{Number(record.advance_payment).toLocaleString()}</Text>
                    )}
                </div>
            ),
            width: 150
        }
    ];

    const expandedRowRender = (record) => {
        const detailColumns = [
            {
                title: "Product Item",
                key: "item",
                render: (_, item) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar shape="square" size={40} src={item.img_path} icon={<ShoppingOutlined />} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text strong style={{ fontSize: 12 }}>{item.product_name}</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>SKU: {item.sku}</Text>
                        </div>
                    </div>
                )
            },
            {
                title: "Pricing Metrics",
                key: "pricing",
                align: 'right',
                render: (_, item) => (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12 }}>৳{Number(item.sell_price).toLocaleString()} × {item.quantity}</Text>
                        {Number(item.discount) > 0 && <Text type="danger" style={{ fontSize: 10 }}>-৳{Number(item.discount).toLocaleString()} Price Cut</Text>}
                    </div>
                )
            },
            {
                title: "Impact Total",
                key: "total",
                align: 'right',
                render: (_, item) => <Text strong style={{ color: '#991b1b' }}>৳{Number(item.line_total).toLocaleString()}</Text>
            }
        ];

        return (
            <div style={{ padding: '20px', background: '#fff1f280', borderRadius: 12 }}>
                <Row gutter={[24, 24]}>
                    <Col span={16}>
                        <Card size="small" variant="borderless" title="Canceled Inventory Logic">
                            <Table
                                columns={detailColumns}
                                dataSource={record.cancel_details || []}
                                pagination={false}
                                size="small"
                                rowKey="id"
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" variant="borderless" title="Logistics & Compliance">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary"><GlobalOutlined /> Territory</Text>
                                    <Text strong>{record.district?.name}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary"><CarOutlined /> Failed Courier</Text>
                                    <Text strong>{record.courier?.name}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary"><InfoCircleOutlined /> Source</Text>
                                    <Tag color="blue">{record.order_from?.name}</Tag>
                                </div>
                                <Divider style={{ margin: '8px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Product MRP</Text>
                                    <Text>৳{Number(record.mrp).toLocaleString()}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Est. Delivery Fee</Text>
                                    <Text>৳{Number(record.delivery_charge).toLocaleString()}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #fecdd3', paddingTop: 8 }}>
                                    <Text strong>Opportunity Loss</Text>
                                    <Text strong style={{ color: '#be123c', fontSize: 16 }}>৳{Number(record.payable_price).toLocaleString()}</Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Cancel Order Intelligence</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card alert-stats">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Rev. Disruption</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.total_canceled_value || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>cumulative revenue lost</Text>
                                </Space>
                                <StopOutlined className="summary-icon" style={{ color: '#ef4444' }} />
                                <div className="card-indicator secondary"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Attrition Rate</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_orders}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>orders canceled in period</Text>
                                </Space>
                                <WarningOutlined className="summary-icon" style={{ color: '#f59e0b' }} />
                                <div className="card-indicator warning"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Canceled Units</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_canceled_quantity}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>inventory impact (pcs)</Text>
                                </Space>
                                <AreaChartOutlined className="summary-icon" style={{ color: '#3b82f6' }} />
                                <div className="card-indicator info"></div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Avg Impact</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.average_canceled_value || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>mean loss per cancellation</Text>
                                </Space>
                                <DollarOutlined className="summary-icon" style={{ color: '#10b981' }} />
                                <div className="card-indicator success"></div>
                            </Card>
                        </Col>
                    </Row>

                    {reasonBreakdown.length > 0 && (
                        <Card size="small" style={{ marginTop: 16, borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                <Text strong style={{ fontSize: 12, color: '#64748b' }}>ATTRITION HEATMAP:</Text>
                                {reasonBreakdown.slice(0, 6).map((reason, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Tag color="red" style={{ margin: 0, borderRadius: 12 }}>{reason.cancel_reason_name}</Tag>
                                        <Text strong style={{ fontSize: 11 }}>{reason.order_count}</Text>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search Invoice, Customer, Phone..." 
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

                <Space size="middle" className="no-print">
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
                        rowExpandable: (record) => record.cancel_details?.length > 0,
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
