import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Tooltip, Progress, Typography, Divider } from "antd";
import { 
    FilePdfOutlined, 
    FileExcelOutlined, 
    UserOutlined, 
    ArrowLeftOutlined, 
    PrinterOutlined,
    ReloadOutlined,
    CalendarOutlined,
    SearchOutlined,
    RiseOutlined
} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CustomerReport() {
    useTitle("Customer Engagement Report");

    const [localSearch, setLocalSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState("all");
    const [customers, setCustomers] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });

    const getCustomerReport = async () => {
        let params = {};
        if (dateFilter === "all") {
            params.filter = "all";
        } else if (dateFilter !== "custom") {
            params.filter = dateFilter;
        } else {
            if (!dateRange[0] || !dateRange[1]) return;
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date = dateRange[1].format("YYYY-MM-DD");
        }

        params.page = pagination.current;
        params.paginate_size = pagination.pageSize;

        try {
            setLoading(true);
            const query = new URLSearchParams(params).toString();
            const res = await getDatas(`/admin/order/reports/by-customer?${query}`);

            if (res && res.success) {
                const { data, total, current_page, per_page } = res.result;
                setCustomers(data || []);
                setPagination(prev => ({
                    ...prev,
                    total: total || 0,
                    current: current_page || 1,
                    pageSize: per_page || 25
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCustomerReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const handlePrint = () => {
        window.print();
    };

    const getExportData = () => {
        const filtered = customers.filter(c => 
            !localSearch || 
            c.customer_name?.toLowerCase().includes(localSearch.toLowerCase()) || 
            c.phone_number?.toLowerCase().includes(localSearch.toLowerCase())
        );
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
            title: "Customer Profile",
            key: "profile",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserOutlined style={{ color: '#64748b' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>{record.customer_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.phone_number}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Volume",
            dataIndex: "order_count",
            key: "order_count",
            align: "center",
            render: (count) => <Tag color="blue" style={{ borderRadius: 4 }}>{count} Orders</Tag>,
        },
        {
            title: "Lifetime Value",
            dataIndex: "order_value",
            key: "order_value",
            align: "right",
            render: (val) => <Text strong style={{ color: '#0f172a' }}>৳ {Number(val).toLocaleString()}</Text>,
        },
        {
            title: "Fulfillment Status",
            key: "delivery_summary",
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Tooltip title="Delivered Orders">
                        <Tag color="success" style={{ border: 'none', borderRadius: 4 }}>
                            ✓ {record.delivered_orders}
                        </Tag>
                    </Tooltip>
                    <Tooltip title="Canceled Orders">
                        <Tag color="error" style={{ border: 'none', borderRadius: 4 }}>
                            ✕ {record.canceled_orders}
                        </Tag>
                    </Tooltip>
                </div>
            )
        },
        {
            title: "Success Rate",
            key: "success_rate",
            align: "center",
            render: (_, record) => {
                const delivered = Number(record.delivered_orders);
                const canceled = Number(record.canceled_orders);
                const totalFinished = delivered + canceled;
                const rate = totalFinished > 0 ? Math.round((delivered / totalFinished) * 100) : 0;
                
                let color = "#ef4444";
                if (rate >= 80) color = "#10b981";
                else if (rate >= 50) color = "#f59e0b";

                return (
                    <div style={{ width: 100, margin: '0 auto' }}>
                        <Tooltip title={`${delivered} Delivered / ${canceled} Canceled`}>
                            <Progress percent={rate} size={[100, 4]} showInfo={false} strokeColor={color} trailColor="#f1f5f9" />
                            <Text strong style={{ fontSize: 11, color: color }}>{rate}%</Text>
                        </Tooltip>
                    </div>
                );
            }
        },
    ];

    const expandedRowRender = (record) => (
        <div style={{ padding: '16px 24px', background: '#fafafa', borderRadius: 8 }}>
            <h5 style={{ marginBottom: 16, fontSize: 13, color: '#64748b', fontWeight: 600 }}>Full Engagement Distribution</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Pending', count: record.pending_orders, color: '#94a3b8' },
                    { label: 'Hold', count: record.on_hold_orders, color: '#f59e0b' },
                    { label: 'Approved', count: record.approved_orders, color: '#3b82f6' },
                    { label: 'On Way', count: record.on_way_orders, color: '#8b5cf6' },
                    { label: 'Delivered', count: record.delivered_orders, color: '#10b981' },
                    { label: 'Canceled', count: record.canceled_orders, color: '#ef4444' }
                ].map((item, i) => (
                    <div key={i} style={{ background: '#fff', padding: '12px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                        <span style={{ display: 'block', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Customer Name", "Phone", "Orders", "Total Value"];
        const rows = dataToExport.map((c, i) => [
            i + 1,
            c.customer_name,
            c.phone_number,
            c.order_count,
            c.order_value
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Customer_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Customer Engagement Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
        const tableColumn = ["#", "Customer Name", "Phone", "Orders", "Total LTV"];
        const tableRows = dataToExport.map((c, i) => [
            i + 1,
            c.customer_name,
            c.phone_number,
            c.order_count,
            `৳${Number(c.order_value).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 9 }
        });

        doc.save(`Customer_Report_${dateStr}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Customer Engagement Report</Title>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => window.history.back()}
                >
                    Back
                </Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search customers..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        style={{ width: 250 }}
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
                    dataSource={getExportData().length === customers.length ? customers : getExportData()}
                    loading={loading}
                    expandable={{ expandedRowRender }}
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
