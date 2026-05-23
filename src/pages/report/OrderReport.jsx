import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Row, Col, Card, Tooltip } from "antd";
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import dayjs from "dayjs";
import useTitle from "../../hooks/useTitle";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./report.css";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function OrderReport() {
    // Hook
    useTitle("Order Report");

    const [orders, setOrders]   = useState([]);
    const [summary, setSummary] = useState({
        total_order: 0,
        total_quantity: 0,
        total_payable: 0
    });
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState("today");
    const [localSearch, setLocalSearch] = useState("");
    const [dateRange, setDateRange] = useState([null, null]);

    const [pagination, setPagination] = useState({current: 1, pageSize: 25, total: 0});

    useEffect(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [dateFilter, dateRange]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let params = {};

            if (dateFilter && dateFilter !== "custom") {
                params.filter = dateFilter;
            } else if (dateFilter === "custom" && dateRange[0] !== null && dateRange[1] !== null) {
                params.start_date = dateRange[0].format("YYYY-MM-DD");
                params.end_date = dateRange[1].format("YYYY-MM-DD");
            }

            params.page = pagination.current;
            params.paginate_size = pagination.pageSize;
            if (localSearch) params.search = localSearch;

            const query = new URLSearchParams(params).toString();
            const res = await getDatas(`/admin/order/reports?${query}`);

            if (res?.success) {
                setOrders(res?.result?.orders?.data || []);
                setSummary({
                    total_order: res?.result?.total_order || 0,
                    total_quantity: res?.result?.total_quantity || 0,
                    total_payable: res?.result?.total_payable || 0,
                });
                setPagination((prev) => ({
                    ...prev,
                    total: res?.result?.total_order || 0,
                }));
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const handleSearch = (value) => {
        setLocalSearch(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const columns = [
        {
            title: "SL",
            key: "sl",
            render: (text, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 70,
            align: 'center',
        },
        {
            title: "Customer",
            dataIndex: "phone_number",
            key: "customer",
            render: (text) => <span style={{ fontWeight: 600, color: '#1c558b' }}>{text}</span>,
        },
        {
            title: "Invoice Number",
            dataIndex: "invoice_number",
            key: "invoice",
            render: (text) => <code style={{ color: '#e83e8c' }}>{text}</code>
        },
        {
            title: "Order Quantity",
            dataIndex: "order_quantity",
            key: "quantity",
            align: 'center',
        },
        {
            title: "Payable Price",
            dataIndex: "payable_price",
            key: "price",
            render: (text) => <strong>৳{Number(text).toLocaleString()}</strong>,
            align: 'right',
        },
        {
            title: "Order Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (value) => value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "-",
        },
        {
            title: "Paid Status",
            dataIndex: "paid_status",
            key: "paid",
            render: (text) => (
                <span className={`order-paid-btn ${text === "paid" ? "paid" : "unpaid"}`}>
                    {text}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: ["current_status", "name"],
            key: "status",
            render: (text) => <span className={`statusBadge ${text?.toLowerCase()}`}>{text}</span>,
        },
        {
            title: "Source",
            dataIndex: ["order_from", "name"],
            key: "source",
            render: (text) => (
                <span
                    className={`order-status-badge ${
                        text?.toLowerCase() === "frontend" ? "source-frontend" : 
                        text?.toLowerCase() === "youtube" ? "source-youtube" : 
                        text?.toLowerCase() === "facebook" ? "source-facebook" : "source-default"
                    }`}
                >
                    {text}
                </span>
            ),
        },
    ];

    const exportToExcel = () => {
        const dataToExport = orders.map((order, index) => ({
            "SL": (pagination.current - 1) * pagination.pageSize + index + 1,
            "Customer": order.phone_number,
            "Invoice": order.invoice_number,
            "Quantity": order.order_quantity,
            "Payable Price": order.payable_price,
            "Date": dayjs(order.created_at).format("DD MMM YYYY, hh:mm A"),
            "Paid Status": order.paid_status,
            "Order Status": order.current_status?.name,
            "Source": order.order_from?.name
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, `Order_Report_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(18);
        doc.setTextColor(28, 85, 139);
        doc.text("Order Report", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${dayjs().format("DD MMM YYYY, hh:mm A")}`, 14, 30);
        doc.text(`Filter: ${dateFilter.toUpperCase()}`, 14, 35);

        // Summary Table in PDF
        autoTable(doc, {
            startY: 40,
            head: [['Total Orders', 'Total Quantity', 'Total Payable']],
            body: [[summary.total_order, summary.total_quantity, `BTD ${summary.total_payable.toLocaleString()}`]],
            theme: 'grid',
            headStyles: { fillColor: [242, 249, 253], textColor: [0, 0, 0] },
        });

        // Main Data Table
        const tableColumn = ["SL", "Customer", "Invoice", "Qty", "Price", "Date", "Status"];
        const tableRows = orders.map((order, index) => [
            (pagination.current - 1) * pagination.pageSize + index + 1,
            order.phone_number,
            order.invoice_number,
            order.order_quantity,
            order.payable_price,
            dayjs(order.created_at).format("DD MMM YY"),
            order.current_status?.name
        ]);

        autoTable(doc, {
            startY: (doc).lastAutoTable.cursor.y + 10,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [28, 85, 139], textColor: [255, 255, 255] },
            styles: { fontSize: 8 },
        });

        doc.save(`Order_Report_${dayjs().format("YYYY-MM-DD")}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar">
                <h4 style={{ margin: 0, fontWeight: 700, color: '#1c558b' }}>Order Report</h4>
                <Space>
                    <Tooltip title="Reload Data">
                        <Button icon={<ReloadOutlined />} onClick={fetchOrders} />
                    </Tooltip>
                    <Button 
                        type="primary" 
                        icon={<FileExcelOutlined />} 
                        onClick={exportToExcel}
                        style={{ backgroundColor: '#107c41', borderColor: '#107c41' }}
                    >
                        Export Excel
                    </Button>
                    <Button 
                        type="primary" 
                        danger 
                        icon={<FilePdfOutlined />} 
                        onClick={exportToPDF}
                    >
                        Export PDF
                    </Button>
                </Space>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="custom-report-cards">
                <Col xs={24} sm={8}>
                    <div className="report-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="card-header"><h6>Total Orders</h6></div>
                                <div className="card-value">{summary.total_order}</div>
                            </div>
                            <div className="card-icon" style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}>
                                <DownloadOutlined />
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={8}>
                    <div className="report-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="card-header"><h6>Total Quantity</h6></div>
                                <div className="card-value">{summary.total_quantity}</div>
                            </div>
                            <div className="card-icon" style={{ backgroundColor: '#f6ffed', color: '#52c41a' }}>
                                <SearchOutlined />
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={8}>
                    <div className="report-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="card-header"><h6>Total Amount</h6></div>
                                <div className="card-value">৳{Number(summary.total_payable).toLocaleString()}</div>
                            </div>
                            <div className="card-icon" style={{ backgroundColor: '#fff7e6', color: '#fa8c16' }}>
                                <strong>৳</strong>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Filter Section */}
            <Card style={{ marginBottom: 20 }} bodyStyle={{ padding: '16px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={8}>
                        <Input 
                            placeholder="Search by phone / invoice / source..." 
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            allowClear 
                            value={localSearch} 
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </Col>
                    <Col xs={24} md={16}>
                        <Space wrap>
                            <span style={{ fontWeight: 500 }}>Filter By:</span>
                            <Select value={dateFilter} style={{ width: 140 }} onChange={(val) => setDateFilter(val)}>
                                <Option value="today">Today</Option>
                                <Option value="yesterday">Yesterday</Option>
                                <Option value="last7days">Last 7 Days</Option>
                                <Option value="last30days">Last 30 Days</Option>
                                <Option value="month">This Month</Option>
                                <Option value="year">This Year</Option>
                                <Option value="custom">Custom Range</Option>
                            </Select>

                            {dateFilter === "custom" && (
                                <RangePicker 
                                    value={dateRange} 
                                    onChange={(dates) => setDateRange(dates)} 
                                    allowClear
                                />
                            )}
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={orders}
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50', '100'],
                    onChange: (page, pageSize) => {
                        setPagination((prev) => ({ ...prev, current: page, pageSize }));
                    },
                }}
                scroll={{ x: 1000 }}
                bordered
                className="teamTable"
            />
        </div>
    );
}
