import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Typography, Divider } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, SearchOutlined, ShoppingOutlined,PrinterOutlined,ArrowLeftOutlined,CalendarOutlined} from "@ant-design/icons";
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
    useTitle("Global Sales Report");

    // States
    const orderFromList                         = useSelector((state) => state.orderFrom.list);
    const [orders, setOrders]                   = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [localSearch, setLocalSearch]         = useState("");
    const [orderFromId, setOrderFromId]         = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [summary, setSummary]                 = useState({ total_order: 0, total_amount: 0, total_quantity: 0 });
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
        setSelectedRowKeys([]);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
    };

    const getExportData = () => {
        if (selectedRowKeys.length > 0) {
            return orders.filter(order => selectedRowKeys.includes(order.id));
        }
        return orders;
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
                            borderRadius   : 12,
                            padding        : '2px 12px',
                            fontWeight     : 600,
                            backgroundColor: status?.bg_color + '15',
                            color          : status?.bg_color,
                            borderColor    : status?.bg_color
                        }}
                    >
                        {text || 'N/A'}
                    </Tag>
                );
            },
        },
        {
            title: "Traffic Source",
            key: "source",
            render: (record) => (
                <span className={`source-badge source-${record?.order_from?.name?.toLowerCase()}`} style={{background: record?.order_from?.color, color: '#fff', padding:5, borderRadius:12}}>
                    {record?.order_from?.name}
                </span>
            ),
        },
    ];

    const handlePrint = () => {
        window.print();
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Customer", "Invoice", "Quantity", "Total Price", "Date", "Status", "Source"];
        const rows = dataToExport.map((item, index) => [
            index + 1,
            item.phone_number,
            item.invoice_number,
            item.order_quantity,
            item.payable_price,
            dayjs(item.created_at).format("YYYY-MM-DD HH:mm"),
            item.current_status?.name || 'N/A',
            item.order_from?.name || 'N/A'
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Orders_Report_${selectedRowKeys.length > 0 ? 'Selected' : 'All'}_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Global Sales Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        const dateStr = dayjs().format("YYYY-MM-DD HH:mm");
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        doc.text(`Scope: ${selectedRowKeys.length > 0 ? 'Selected Items' : 'All Items'}`, 14, 36);
        
        const tableColumn = ["#", "Customer", "Invoice", "Qty", "Amount", "Date", "Status"];
        const tableRows = dataToExport.map((item, index) => [
            index + 1,
            item.phone_number,
            item.invoice_number,
            item.order_quantity,
            `৳${Number(item.payable_price).toLocaleString()}`,
            dayjs(item.created_at).format("DD MMM YY"),
            item.current_status?.name || 'N/A'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 8 }
        });

        doc.save(`Orders_Report_${selectedRowKeys.length > 0 ? 'Selected' : 'All'}_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Global Sales Report</Title>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => window.history.back()}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    Back
                </Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        onPressEnter={handleSearch}
                        style={{ width: 250 }}
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

                    <Button icon={<ReloadOutlined />} onClick={handleClearFilters}>
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
                    rowSelection={rowSelection}
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
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total) => `Total ${total} entries`,
                    }}
                />
            </div>
        </div>
    );
}
