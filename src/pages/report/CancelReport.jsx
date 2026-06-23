import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider, Tag } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, UserOutlined, StopOutlined } from "@ant-design/icons";
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
    // Hook
    useTitle("Cancel Report");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [orders, setOrders]                   = useState([]);
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
            const res = await getDatas(`/admin/order/reports/cancel?${query}`);
            if(res && res?.success){
                setOrders(res?.result?.data || []);
                setPagination(prev => ({ 
                    ...prev, 
                    total: res?.result?.total || 0,
                    current: res?.result?.current_page || 1
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
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Order Cancel Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.text(`Generated on: ${dateStr} | Filter: ${dateFilter}`, 14, 30);
        
        const tableColumn = ["#", "Customer", "Invoice", "Cancel Reason", "Net Total", "Payable"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.customer_name,
            o.invoice_number,
            o.cancel_reason?.name || "N/A",
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
        doc.save(`Cancel_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL","Phone","Customer","Invoice","Reason","Net Total","Advance","Payable","Date"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.phone_number,
            o.customer_name,
            o.invoice_number,
            o.cancel_reason?.name || "",
            o.net_order_price,
            o.advance_payment,
            o.payable_price,
            dayjs(o.created_at).format("YYYY-MM-DD")
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
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
            title: "Customer Profile",
            key: "profile",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserOutlined style={{ color: '#ef4444' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>{record.customer_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.phone_number}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Invoice Info",
            key: "invoice",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: 13 }}>{record.invoice_number}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(record.created_at).format("DD MMM, YYYY")}</Text>
                </div>
            )
        },
        {
            title: "Cancel Reason",
            key: "reason",
            render: (_, record) => (
                <Tag ghost color="red" icon={<StopOutlined />} style={{ borderRadius: 4 }}>
                    {record.cancel_reason?.name || "N/A"}
                </Tag>
            )
        },
        {
            title: "Net Order",
            dataIndex: "net_order_price",
            key: "net_order_price",
            align: 'right',
            render: (val) => <Text style={{ color: '#4b5563' }}>৳{Number(val || 0).toLocaleString()}</Text>
        },
        {
            title: "Advance",
            dataIndex: "advance_payment",
            key: "advance_payment",
            align: 'right',
            render: (val) => Number(val) > 0 ? <Tag color="green">৳{Number(val).toLocaleString()}</Tag> : <Text type="secondary">৳0</Text>
        },
        {
            title: "Payable",
            dataIndex: "payable_price",
            key: "payable_price",
            align: 'right',
            render: (val) => <Text strong style={{ color: '#1e293b' }}>৳{Number(val || 0).toLocaleString()}</Text>
        }
    ];

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Order Cancel Report</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search phone, name or invoice..." 
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
