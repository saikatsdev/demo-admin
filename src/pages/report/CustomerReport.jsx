import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Tooltip, Progress } from "antd";
import { FilterOutlined, RiseOutlined, FilePdfOutlined, FileExcelOutlined, UserOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useTitle from "../../hooks/useTitle";
import "./css/CustomerReport.css";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CustomerReport() {
    useTitle("Customer Engagement Report");

    const [localSearch, setLocalSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState("all");
    const [customers, setCustomers] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
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
                        <span className="customer-name">{record.customer_name}</span>
                        <span className="customer-phone">{record.phone_number}</span>
                    </div>
                </div>
            ),
        },
        {
            title: "Volume",
            dataIndex: "order_count",
            key: "order_count",
            align: "center",
            render: (count) => <span className="count-cell">{count} Orders</span>,
        },
        {
            title: "Lifetime Value",
            dataIndex: "order_value",
            key: "order_value",
            align: "right",
            render: (val) => <span className="value-cell">৳ {Number(val).toLocaleString()}</span>,
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: color }}>{rate}%</span>
                            </div>
                            <Progress percent={rate} size={[100, 4]} showInfo={false} strokeColor={color} trailColor="#f1f5f9" />
                        </Tooltip>
                    </div>
                );
            }
        },
    ];

    const expandedRowRender = (record) => (
        <div className="expanded-row-content" style={{ padding: '4px 24px' }}>
            <h5 style={{ marginBottom: 20, fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiseOutlined /> Full Engagement Distribution
            </h5>
            <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                {[
                    { label: 'Pending', count: record.pending_orders, color: '#94a3b8' },
                    { label: 'On Hold', count: record.on_hold_orders, color: '#f59e0b' },
                    { label: 'Approved', count: record.approved_orders, color: '#3b82f6' },
                    { label: 'On Way', count: record.on_way_orders, color: '#8b5cf6' },
                    { label: 'Delivered', count: record.delivered_orders, color: '#10b981' },
                    { label: 'Canceled', count: record.canceled_orders, color: '#ef4444' }
                ].map((item, i) => (
                    <div key={i} className="status-item" style={{ background: '#f8fafc', padding: '12px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                        <span className="label" style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</span>
                        <span className="count" style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const downloadCSV = () => {
        const headers = ["SL", "Customer Name", "Phone", "Orders", "Total Value", "Avg Order Value"];
        const rows = customers.map((c, i) => [
            i + 1,
            c.customer_name,
            c.phone_number,
            c.order_count,
            c.order_value,
            Math.round(c.order_value / c.order_count)
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Customer_Report_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Customer Engagement Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        const dateStr = new Date().toLocaleDateString();
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        doc.text(`Identified Base: ${customers.length} high-intent customers`, 14, 36);
        
        const tableColumn = ["#", "Customer Name", "Phone", "Orders", "Total LTV"];
        const tableRows = customers.map((c, i) => [
            i + 1,
            c.customer_name,
            c.phone_number,
            c.order_count,
            `৳${Number(c.order_value).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 9 }
        });

        doc.save(`Customer_Report_${dateStr}.pdf`);
    };

    return (
        <div className="report-container">
            <header className="report-header">
                <div>
                    <h2>Customer Engagement Insights</h2>
                    <p>Track lifetime value, order frequency, and retention metrics across your client base.</p>
                </div>
            </header>

            <div className="filter-card">
                <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap size="middle">
                        <Input.Search 
                            placeholder="Filter by name or mobile number..." 
                            allowClear 
                            onChange={(e) => setLocalSearch(e.target.value)} 
                            style={{ width: 380 }}
                            prefix={<FilterOutlined style={{ color: '#94a3b8' }} />}
                        />
                        <Select 
                            value={dateFilter} 
                            style={{ width: 180 }} 
                            onChange={(val) => {
                                setDateFilter(val);
                                if (val !== "custom") setDateRange([null, null]);
                            }}
                            suffixIcon={<RiseOutlined style={{ color: '#6366f1' }} />}
                        >
                            <Option value="all">Lifetime History</Option>
                            <Option value="today">Today's Activity</Option>
                            <Option value="yesterday">Yesterday</Option>
                            <Option value="last7days">Last 7 Days</Option>
                            <Option value="last30days">Last 30 Days</Option>
                            <Option value="month">Current Month</Option>
                            <Option value="year">Current Year</Option>
                            <Option value="custom">Specific Range</Option>
                        </Select>

                        {dateFilter === "custom" && (
                            <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} allowClear />
                        )}
                    </Space>

                    <Space size="middle">
                        <Button type="primary" icon={<FileExcelOutlined />} onClick={downloadCSV}>
                            Export CSV
                        </Button>
                        <Button type="primary" style={{ backgroundColor: '#d32f2f', border: 'none', borderRadius: 8 }} icon={<FilePdfOutlined />} onClick={downloadPDF}>
                            Export PDF
                        </Button>
                    </Space>
                </Space>
            </div>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={customers.filter(c => 
                    !localSearch || 
                    c.customer_name?.toLowerCase().includes(localSearch.toLowerCase()) || 
                    c.phone_number?.toLowerCase().includes(localSearch.toLowerCase())
                )}
                loading={loading}
                expandable={{ expandedRowRender }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                    showSizeChanger: true,
                    className: "custom-pagination",
                    showTotal: (total) => `Total ${total} customers identified`,
                }}
            />
        </div>
    );
}
