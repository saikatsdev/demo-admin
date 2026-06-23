import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider, Tag, Card, Row, Col, Image } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, UserOutlined, ShoppingOutlined, LineChartOutlined } from "@ant-design/icons";
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
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [orders, setOrders]                   = useState([]);
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

        const query = new URLSearchParams(params).toString();
        try {
            setLoading(true);
            const res = await getDatas(`/admin/order/reports/up-sell?${query}`);
            if(res && res?.success){
                setOrders(res?.result?.orders?.data || []);
                setSummary(res?.result?.summary || null);
                setPagination(prev => ({ 
                    ...prev, 
                    total: res?.result?.orders?.total || 0,
                    current: res?.result?.orders?.current_page || 1
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
        return orders.filter((order) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                order.customer_name?.toLowerCase().includes(term) || 
                order.phone_number?.toLowerCase().includes(term) || 
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
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Up Sell Report", 14, 22);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.setFontSize(11);
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
        const tableColumn = ["#", "Customer", "Invoice", "Upsell Rev", "Net Total", "Status", "Date"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.customer_name,
            o.invoice_number,
            o.upsell_summary?.total_revenue,
            o.net_order_price,
            o.current_status?.name,
            dayjs(o.created_at).format("DD MMM YYYY")
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 9 }
        });
        doc.save(`Upsell_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Customer", "Phone", "Invoice", "Upsell Items", "Upsell Rev", "Net Total", "Status", "Date"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.customer_name,
            o.phone_number,
            o.invoice_number,
            o.upsell_summary?.items_count,
            o.upsell_summary?.total_revenue,
            o.net_order_price,
            o.current_status?.name,
            dayjs(o.created_at).format("DD MMM YYYY")
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Upsell_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
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
            title: "Customer Profile",
            key: "profile",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserOutlined style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>{record.customer_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.phone_number}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Invoice",
            key: "invoice",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: 13 }}>{record.invoice_number}</Text>
                    <Tag color={record.paid_status === 'paid' ? 'green' : 'volcano'} style={{ width: 'fit-content', fontSize: 10, marginTop: 4 }}>
                        {record.paid_status?.toUpperCase()}
                    </Tag>
                </div>
            )
        },
        {
            title: "Upsell Info",
            key: "upsell_info",
            align: 'center',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Tag color="blue" icon={<ShoppingOutlined />}>
                        {record.upsell_summary?.items_count} Items
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                        Qty: {record.upsell_summary?.total_quantity}
                    </Text>
                </div>
            )
        },
        {
            title: "Upsell Revenue",
            key: "upsell_rev",
            align: 'right',
            render: (_, record) => (
                <Text strong style={{ color: '#10b981' }}>
                    ৳{Number(record.upsell_summary?.total_revenue || 0).toLocaleString()}
                </Text>
            )
        },
        {
            title: "Net Total",
            dataIndex: "net_order_price",
            key: "net_order_price",
            align: 'right',
            render: (val) => <Text strong>৳{Number(val || 0).toLocaleString()}</Text>
        },
        {
            title: "Status",
            key: "status",
            align: 'center',
            render: (_, record) => (
                <Tag color="processing" style={{ borderRadius: 12, padding: '0 10px' }}>
                    {record.current_status?.name}
                </Tag>
            )
        },
        {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontSize: 13 }}>{dayjs(date).format("DD MMM YYYY")}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(date).format("hh:mm A")}</Text>
                </div>
            )
        },
    ];

    const expandedRowRender = (record) => {
        const detailColumns = [
            {
                title: "Product Item",
                key: "product",
                render: (_, item) => (
                    <Space size="middle">
                        <Image
                            src={item.img_path}
                            alt={item.product_name}
                            width={40}
                            height={40}
                            style={{ borderRadius: 6, objectFit: 'cover' }}
                            fallback="https://via.placeholder.com/40"
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text strong style={{ fontSize: 13 }}>{item.product_name}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>ID: {item.product_id}</Text>
                        </div>
                    </Space>
                )
            },
            {
                title: "MRP",
                dataIndex: "mrp",
                key: "mrp",
                align: 'right',
                render: (val) => <Text delete type="secondary" style={{ fontSize: 12 }}>৳{val}</Text>
            },
            {
                title: "Upsell Price",
                dataIndex: "sell_price",
                key: "sell_price",
                align: 'right',
                render: (val) => <Text strong style={{ color: '#10b981' }}>৳{Number(val).toLocaleString()}</Text>
            },
            {
                title: "Qty",
                dataIndex: "quantity",
                key: "quantity",
                align: 'center',
                render: (qty) => <Tag color="default">{qty}</Tag>
            },
            {
                title: "Line Total",
                key: "line_total",
                align: 'right',
                render: (_, item) => <Text strong>৳{Number(item.line_total || 0).toLocaleString()}</Text>
            }
        ];

        return (
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderRadius: 8 }}>
                <Title level={5} style={{ margin: '0 0 16px 0', fontSize: 14, color: '#64748b' }}>
                    Upsell Items Breakdown - Invoice {record.invoice_number}
                </Title>
                <Table
                    columns={detailColumns}
                    dataSource={record.upsell_details || []}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    bordered={false}
                    style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}
                />
            </div>
        );
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Upsell Performance Report</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card" shadow="sm">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Total Orders</Text>
                                    <Title level={3} style={{ margin: 0 }}>{summary.total_orders}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>with upsell items</Text>
                                </Space>
                                <ShoppingOutlined className="summary-icon" style={{ color: '#3b82f6' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Upsell Revenue</Text>
                                    <Title level={3} style={{ margin: 0, color: '#10b981' }}>৳{Number(summary.total_upsell_revenue || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>from {summary.total_upsell_items} items</Text>
                                </Space>
                                <LineChartOutlined className="summary-icon" style={{ color: '#10b981' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Total Order Value</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number(summary.total_order_value || 0).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>inc. non-upsell</Text>
                                </Space>
                                <ShoppingOutlined className="summary-icon" style={{ color: '#6366f1' }} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card bordered={false} className="summary-card">
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Avg. Upsell/Order</Text>
                                    <Title level={3} style={{ margin: 0 }}>৳{Number((summary.total_upsell_revenue / (summary.total_orders || 1)).toFixed(2)).toLocaleString()}</Title>
                                    <Text type="secondary" style={{ fontSize: 11 }}>per order average</Text>
                                </Space>
                                <LineChartOutlined className="summary-icon" style={{ color: '#f59e0b' }} />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search phone / name / invoice..." 
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
                    rowKey="id"
                    columns={columns}
                    dataSource={getFilteredData()}
                    loading={loading}
                    expandable={{
                        expandedRowRender,
                        rowExpandable: (record) => record.upsell_details?.length > 0,
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
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .summary-card:hover {
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }
                .summary-icon {
                    position: absolute;
                    right: 16px;
                    bottom: 16px;
                    font-size: 24px;
                    opacity: 0.15;
                }
            `}</style>
        </div>
    );
}
