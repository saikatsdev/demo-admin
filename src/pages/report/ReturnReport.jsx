import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider } from "antd";
import { 
    FilePdfOutlined, 
    FileExcelOutlined, 
    ReloadOutlined, 
    ArrowLeftOutlined, 
    PrinterOutlined,
    CalendarOutlined,
    SearchOutlined
} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ReturnReport() {
    // Hook
    useTitle("Return Report");

    // State
    const [localSearch, setLocalSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState("today");
    const [orders, setOrders] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination] = useState({current: 1,pageSize: 25,total: 0});

    const columns = [
        {
            title: "SL",
            key: "sl",
            render: (text, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
            align: 'center'
        },
        {
            title: "Phone Number",
            dataIndex: "phone_number",
            key: "phone_number",
        },
        {
            title: "Customer Name",
            dataIndex: "customer_name",
            key: "customer_name",
            render: (name) => <Text strong>{name}</Text>
        },
        {
            title: "Return Date",
            dataIndex: "updated_at",
            key: "updated_at",
            render: (value) => dayjs(value).format("MMM DD, YYYY hh:mm A"),
        },
        {
            title: "Total Amount",
            dataIndex: "net_order_price",
            key: "net_order_price",
            align: 'right',
            render: (val) => `৳${Number(val || 0).toLocaleString()}`
        },
        {
            title: "Advanced",
            dataIndex: "advance_payment",
            key: "advance_payment",
            align: 'right',
            render: (val) => `৳${Number(val || 0).toLocaleString()}`
        },
        {
            title: "Payable",
            key: "payable_price",
            align: 'right',
            render: (_, record) => {
                const payable = Number(record.payable_price || 0);
                const advance = Number(record.advance_payment || 0);
                const finalAmount = advance > 0 ? payable - advance : payable;
                return <Text strong>৳{finalAmount.toLocaleString()}</Text>;
            },
        }
    ];

    useEffect(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [dateFilter, dateRange]);

    const getOrderReport = async () => {
        let params = {};
        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange[0] && dateRange[1]) {
            params.start_date = dateRange[0].format("YYYY-MM-DD");
            params.end_date = dateRange[1].format("YYYY-MM-DD");
        }
        params.page = pagination.current;
        params.limit = pagination.pageSize;

        const query = new URLSearchParams(params).toString();
        try {
            setLoading(true);
            const res = await getDatas(`/admin/order/reports/return?${query}`);
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
                order.phone_number?.toLowerCase().includes(term) || 
                order.customer_name?.toLowerCase().includes(term)
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
        doc.text("Order Return Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.text(`Generated on: ${dateStr} | Filter: ${dateFilter}`, 14, 30);
        
        const tableColumn = ["#", "Phone", "Customer", "Return Date", "Total", "Payable"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.phone_number,
            o.customer_name,
            dayjs(o.updated_at).format("YYYY-MM-DD"),
            o.net_order_price,
            o.payable_price
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 9 }
        });
        doc.save(`Return_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Phone Number", "Customer Name", "Return Date", "Total Amount", "Advanced Payment", "Payable Price"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.phone_number,
            o.customer_name,
            dayjs(o.updated_at).format("YYYY-MM-DD"),
            o.net_order_price,
            o.advance_payment,
            o.payable_price
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Return_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Space size="large">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>Order Return Report</Title>
                </Space>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search phone or name..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        style={{ width: 250 }}
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    />
                    
                    <Select 
                        value={dateFilter} 
                        style={{ width: 150 }} 
                        onChange={(val) => {
                            setDateFilter(val);
                            if (val !== "custom") setDateRange([null, null]);
                        }}
                        suffixIcon={<CalendarOutlined style={{ color: '#bfbfbf' }} />}
                    >
                        <Option value="today">Today</Option>
                        <Option value="yesterday">Yesterday</Option>
                        <Option value="last7days">Last 7 Days</Option>
                        <Option value="last30days">Last 30 Days</Option>
                        <Option value="month">Current Month</Option>
                        <Option value="year">Current Year</Option>
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
