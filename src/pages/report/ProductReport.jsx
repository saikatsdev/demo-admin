import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Progress, Tooltip, Typography, Divider } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, EyeOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ProductReport() {
    // Hook
    useTitle("Product Performance Analytics");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [products, setProducts]               = useState([]);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });

    const getOrderReport = async () => {
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
        params.limit = pagination.pageSize;

        try {
            setLoading(true);
            const query = new URLSearchParams(params).toString();
            const res = await getDatas(`/admin/order/reports/by-selling?${query}`);

            if (res?.success) {
                const result = res.result;
                setProducts(result.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: result.total,
                    current: result.current_page,
                    pageSize: result.per_page
                }));
            }
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
        const filtered = products.filter(p => 
            !localSearch || 
            p.name.toLowerCase().includes(localSearch.toLowerCase()) || 
            p.category?.name?.toLowerCase().includes(localSearch.toLowerCase())
        );
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.id));
        }
        return filtered;
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
            title: "Product Identity",
            key: "product",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={record.img_path} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} alt={record.name} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.category?.name} • SKU: {record.slug}</Text>
                    </div>
                </div>
            ),
            width: "30%",
        },
        {
            title: "Price Details",
            key: "revenue",
            align: "right",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text strong style={{ color: '#0f172a' }}>৳ {Number(record.sell_price).toLocaleString()}</Text>
                    {record.discount > 0 && <Text delete type="secondary" style={{ fontSize: 11 }}>৳ {Number(record.mrp).toLocaleString()}</Text>}
                </div>
            ),
            width: 140
        },
        {
            title: "Sales Velocity",
            key: "sales",
            align: "center",
            render: (_, record) => (
                <div style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Units Sold</span>
                        <Text strong style={{ fontSize: 12, color: '#6366f1' }}>{record.order_count}</Text>
                    </div>
                    <Progress percent={Math.min(100, (record.order_count / 1000) * 100)} size={[100, 4]} showInfo={false} strokeColor="#6366f1" />
                </div>
            ),
            width: 180
        },
        {
            title: "Inventory Level",
            dataIndex: "current_stock",
            key: "stock",
            align: "center",
            render: (stock) => {
                const color = stock < 10 ? "red" : stock < 50 ? "orange" : "green";
                return (
                    <Tag color={color} style={{ borderRadius: 12, fontWeight: 700, padding: '2px 10px' }}>
                        {stock} Items
                    </Tag>
                );
            }
        },
        {
            title: "Success Rate",
            key: "success_rate",
            align: "center",
            render: (_, record) => {
                const delivered = Number(record.status_counts?.find(s => s.slug === 'delivered')?.total || 0);
                const canceled = Number(record.status_counts?.find(s => s.slug === 'canceled')?.total || 0);
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
            <h5 style={{ marginBottom: 16, fontSize: 13, color: '#64748b', fontWeight: 600 }}>Order Status Breakdown</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {record.status_counts?.map((status, i) => (
                    <div key={i} style={{ background: '#fff', padding: '12px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                        <span style={{ display: 'block', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{status.name}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#1c558b' }}>{status.total}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["Product", "SKU", "Orders", "Stock", "Price"];
        const rows = dataToExport.map(p => [
            p.name, p.slug, p.order_count, p.current_stock, p.sell_price
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Product_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Product Performance Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
        const tableColumn = ["#", "Product Name", "SKU", "Orders", "Stock", "Price"];
        const tableRows = dataToExport.map((p, index) => [
            index + 1,
            p.name,
            p.slug,
            p.order_count,
            p.current_stock,
            `৳${Number(p.sell_price).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 9 }
        });

        doc.save(`Product_Report_${dateStr}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Product Performance Analysis</Title>
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
                        placeholder="Search products..." 
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
                    dataSource={getExportData().length === products.length ? products : getExportData()}
                    loading={loading}
                    expandable={{ 
                        expandedRowRender,
                        expandIcon: ({ expanded, onExpand, record }) =>
                            expanded ? (
                                <EyeOutlined style={{ color: '#1c558b', cursor: 'pointer' }} onClick={e => onExpand(record, e)} />
                            ) : (
                                <EyeOutlined style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={e => onExpand(record, e)} />
                            )
                    }}
                    scroll={{ x: 1300 }}
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
