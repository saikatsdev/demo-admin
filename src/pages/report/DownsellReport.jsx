import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider, Tag } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function DownsellReport() {
    // Hook
    useTitle("Downsell Report");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [orders, setOrders]                   = useState([]);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({current: 1,pageSize: 25,total: 0});

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            render: (text, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
            align: 'center'
        },
        {
            title: "Customer",
            key: "customer",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong>{record.customer_name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.phone_number}</Text>
                </div>
            )
        },
        {
            title: "Invoice",
            dataIndex: "invoice_number",
            key: "invoice_number",
            render: (invoice) => <Text type="secondary" style={{ fontSize: 12 }}>{invoice}</Text>
        },
        {
            title: "Amount",
            dataIndex: "payable_price",
            key: "payable_price",
            align: "right",
            render: (val) => <Text strong>৳{Number(val || 0).toLocaleString()}</Text>
        },
        {
            title: "Paid Status",
            dataIndex: "paid_status",
            key: "paid_status",
            align: "center",
            render: (status) => (
                <Tag color={status === "paid" ? "green" : "red"} style={{ textTransform: "capitalize" }}>
                    {status}
                </Tag>
            )
        },
        {
            title: "Order Status",
            key: "current_status",
            align: "center",
            render: (_, record) => (
                <Tag color="blue">{record.current_status?.name || "—"}</Tag>
            )
        },
        {
            title: "Order From",
            key: "order_from",
            align: "center",
            render: (_, record) => (
                <Tag color="purple">{record.order_from?.name || "—"}</Tag>
            )
        },
        {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => dayjs(date).format("DD MMM YYYY")
        },
    ];

    useEffect(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [dateFilter, dateRange]);

    const getOrderReport = async () => {
        let params = {};
        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange[0] && dateRange[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date   = dateRange[1].format("YYYY-MM-DD");
        }

        params.page            = pagination.current;
        params.pagination_size = pagination.pageSize;

        const query = new URLSearchParams(params).toString();

        try {
            setLoading(true);

            const res = await getDatas(`/admin/order/reports/down-sell?${query}`);

            if(res && res?.success){
                setOrders(res?.result?.data || []);
                setPagination(prev => ({ ...prev, total: res?.result?.total || 0 }));
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

    const getExportData = () => {
        const filtered = orders.filter((order) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                order.customer_name?.toLowerCase().includes(term) || 
                order.phone_number?.toLowerCase().includes(term) || 
                order.invoice_number?.toLowerCase().includes(term)
            );
        });
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.id));
        }
        return filtered;
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Downsell Report", 14, 22);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.setFontSize(11);
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
        const tableColumn = ["#", "Customer", "Phone", "Invoice", "Amount", "Paid Status", "Order Status", "Order From", "Date"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.customer_name,
            o.phone_number,
            o.invoice_number,
            o.payable_price,
            o.paid_status,
            o.current_status?.name || "",
            o.order_from?.name || "",
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
        doc.save(`Downsell_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Customer Name", "Phone Number", "Invoice Number", "Amount", "Paid Status", "Order Status", "Order From", "Date"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.customer_name,
            o.phone_number,
            o.invoice_number,
            o.payable_price,
            o.paid_status,
            o.current_status?.name || "",
            o.order_from?.name || "",
            dayjs(o.created_at).format("DD MMM YYYY")
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Downsell_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Down-sell Sales Report</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                    Back
                </Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search by phone / name / invoice..." 
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
                        setDateFilter("today");
                        setLocalSearch("");
                        setDateRange([null, null]);
                        setSelectedRowKeys([]);
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
                    dataSource={getExportData().length === orders.length ? orders : getExportData()}
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
