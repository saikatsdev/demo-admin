import { useEffect, useState, useCallback } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Tooltip, Card, Typography, Row, Col } from "antd";
import { FilterOutlined, RiseOutlined, FilePdfOutlined, FileExcelOutlined, ReloadOutlined, SearchOutlined, ShoppingOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useTitle from "../../hooks/useTitle";
import "./css/OrderReport.css";

const { Option }   = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function OrderReport() {
    // Hook
    useTitle("Global Sales Report");

    const orderFromList                 = useSelector((state) => state.orderFrom.list);
    const [orders, setOrders]           = useState([]);
    const [loading, setLoading]         = useState(false);
    const [dateFilter, setDateFilter]   = useState("all");
    const [localSearch, setLocalSearch] = useState("");
    const [orderFromId, setOrderFromId] = useState(null);
    const [dateRange, setDateRange]     = useState([null, null]);
    const [summary, setSummary]         = useState({ total_order: 0, total_amount: 0, total_quantity: 0 });
    const [pagination, setPagination]   = useState({current: 1, pageSize: 25, total: 0});

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
        }

        if (dateFilter === "custom" && dateRange?.[0] && dateRange?.[1]) {
            params.start_date = dateRange[0].format("YYYY-MM-DD");
            params.end_date = dateRange[1].format("YYYY-MM-DD");
        }

        try {
            const query = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ""))).toString();
            const res = await getDatas(`/admin/order/reports?${query}`);

            if (res?.success) {
                setOrders(res?.result?.orders?.data || []);
                setSummary({
                    total_order: res?.result?.total_order || 0,
                    total_amount: res?.result?.total_amount || 0,
                    total_quantity: res?.result?.total_quantity || 0,
                });
                setPagination((prev) => ({
                    ...prev,
                    total: res?.result?.total_order || 0,
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
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const columns = 
    [
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
            title: "Customer Contact",
            dataIndex: "phone_number",
            key: "customer",
            render: (text) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{text}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Verified Mobile</span>
                </div>
            ),
        },
        {
            title: "Invoice Reference",
            dataIndex: "invoice_number",
            key: "invoice",
            render: (text) => <span className="invoice-cell">#{text}</span>,
        },
        {
            title: "Volume",
            dataIndex: "order_quantity",
            key: "quantity",
            align: "center",
            render: (val) => <Tag color="blue" style={{ borderRadius: 4 }}>{val} Items</Tag>
        },
        {
            title: "Financials",
            dataIndex: "payable_price",
            key: "price",
            render: (val) => <span className="price-cell">৳ {Number(val).toLocaleString()}</span>,
            align: "right",
        },
        {
            title: "Order Timeline",
            dataIndex: "created_at",
            key: "created_at",
            render: (value) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{dayjs(value).format("DD MMM, YYYY")}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{dayjs(value).format("hh:mm A")}</span>
                </div>
            ),
        },
        {
            title: "Payment State",
            dataIndex: "paid_status",
            key: "paid",
            render: (text) => (
                <span className={`order-paid-btn ${text === "paid" ? "paid" : "unpaid"}`}>
                    {text}
                </span>
            ),
        },
        {
            title: "Current Status",
            dataIndex: ["current_status", "name"],
            key: "status",
            render: (text, record) => {
                const status = record?.current_status;
                return (
                    <Tag 
                        style={{ 
                            borderRadius: 12, 
                            padding: '2px 12px', 
                            fontWeight: 600,
                            backgroundColor: status?.bg_color + '15',
                            color: status?.bg_color,
                            borderColor: status?.bg_color
                        }}
                    >
                        {text || 'N/A'}
                    </Tag>
                );
            },
        },
        {
            title: "Traffic Source",
            dataIndex: ["order_from", "name"],
            key: "source",
            render: (text) => (
                <span className={`source-badge source-${text.toLowerCase()}`}>
                    {text}
                </span>
            ),
        },
    ];

    const downloadCSV = () => {
        const headers = ["SL", "Customer", "Invoice", "Quantity", "Total Price", "Date", "Status", "Source"];
        const rows = orders.map((item, index) => [
            index + 1,
            item.phone_number,
            item.invoice_number,
            item.order_quantity,
            item.payable_price,
            dayjs(item.created_at).format("YYYY-MM-DD HH:mm"),
            item.current_status?.name,
            item.order_from?.name
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Orders_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Sales Transaction Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        const dateStr = dayjs().format("YYYY-MM-DD HH:mm");
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        doc.text(`Record Frequency: ${orders.length} transactions identifier`, 14, 36);
        
        const tableColumn = ["#", "Customer", "Invoice", "Qty", "Amount", "Date", "Status"];
        const tableRows = orders.map((item, index) => [
            index + 1,
            item.phone_number,
            item.invoice_number,
            item.order_quantity,
            `৳${Number(item.payable_price).toLocaleString()}`,
            dayjs(item.created_at).format("DD MMM YY"),
            item.current_status?.name
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 8 }
        });

        doc.save(`Orders_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <div className="report-container">
            <header className="report-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h2>Sales Transaction Insights</h2>
                        <p>Comprehensive overview of order flows, revenue collection, and fulfillment velocity.</p>
                    </div>
                </div>
            </header>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card className="summary-card" bordered={false}>
                        <Text type="secondary">Total Orders</Text>
                        <Title level={3} style={{ margin: 0 }}>{summary.total_order.toLocaleString()}</Title>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="summary-card" bordered={false}>
                        <Text type="secondary">Total Revenue</Text>
                        <Title level={3} style={{ margin: 0, color: '#10b981' }}>৳ {summary.total_amount.toLocaleString()}</Title>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="summary-card" bordered={false}>
                        <Text type="secondary">Items Sold</Text>
                        <Title level={3} style={{ margin: 0, color: '#6366f1' }}>{summary.total_quantity.toLocaleString()}</Title>
                    </Card>
                </Col>
            </Row>

            <div className="filter-card">
                <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap size="middle">
                        <Input 
                            placeholder="Phone, status or source..." 
                            allowClear 
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)} 
                            onPressEnter={handleSearch}
                            style={{ width: 300 }}
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            suffix={
                                <Button type="text" icon={<SearchOutlined />} onClick={handleSearch}/>
                            }
                        />
                        
                        <Select 
                            placeholder="Order Source"
                            value={orderFromId} 
                            style={{ width: 160 }} 
                            onChange={setOrderFromId}
                            allowClear
                            suffixIcon={<ShoppingOutlined style={{ color: '#6366f1' }} />}
                        >
                            {orderFromList?.map(item => (
                                <Option key={item.id} value={item.id}>{item.name}</Option>
                            ))}
                        </Select>

                        <Select 
                            value={dateFilter} 
                            style={{ width: 160 }} 
                            onChange={(val) => {
                                setDateFilter(val);
                                if (val !== "custom") setDateRange([null, null]);
                            }}
                            suffixIcon={<RiseOutlined style={{ color: '#6366f1' }} />}
                        >
                            <Option value="all">All Time</Option>
                            <Option value="today">Today</Option>
                            <Option value="yesterday">Yesterday</Option>
                            <Option value="week">Last 7 Days</Option>
                            <Option value="month">This Month</Option>
                            <Option value="year">This Year</Option>
                            <Option value="custom">Custom Range</Option>
                        </Select>

                        {dateFilter === "custom" && (
                            <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} allowClear />
                        )}

                        <Button icon={<ReloadOutlined />} onClick={handleClearFilters}>
                            Reset
                        </Button>
                    </Space>

                    <Space size="middle">
                        <Button type="primary" icon={<FileExcelOutlined />} onClick={downloadCSV}>
                            CSV
                        </Button>
                        <Button type="primary" style={{ backgroundColor: '#ef4444', border: 'none' }} icon={<FilePdfOutlined />} onClick={downloadPDF}>
                            PDF
                        </Button>
                    </Space>
                </Space>
            </div>

            <Table
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
                    className: "custom-pagination",
                    showTotal: (total) => `Total ${total} transactions processed`,
                }}
            />
        </div>
    );
}
