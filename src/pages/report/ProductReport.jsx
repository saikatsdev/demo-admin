import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Progress, Tooltip } from "antd";
import { DownloadOutlined, FilterOutlined, RiseOutlined, EyeOutlined, StockOutlined, DollarOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import "./css/ProductReport.css";

const { Option } = Select;
const { RangePicker } = DatePicker;

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ProductReport() {
    // Hook
    useTitle("Product Performance Analytics");

    // State
    const [localSearch, setLocalSearch] = useState("");
    const [loading, setLoading]         = useState(false);
    const [dateFilter, setDateFilter]   = useState("all");
    const [products, setProducts]       = useState([]);
    const [dateRange, setDateRange]     = useState([null, null]);
    const [pagination, setPagination]   = useState({ current: 1, pageSize: 25, total: 0 });

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
            title: "Product Identity",
            key: "product",
            render: (_, record) => (
                <div className="product-info-cell">
                    <img src={record.img_path} className="product-image" alt={record.name} />
                    <div className="product-details">
                        <h4>{record.name}</h4>
                        <span>{record.category?.name} • SKU: {record.slug}</span>
                    </div>
                </div>
            ),
            width: "30%",
        },
        {
            title: "Price Details",
            key: "revenue",
            align: "right",
            render: (_, record) => {
                const hasDiscount = record.discount > 0;
                const discountPercentage = hasDiscount ? Math.round((Number(record.discount) / Number(record.mrp)) * 100) : 0;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        {hasDiscount && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                                    ৳ {Number(record.mrp).toLocaleString()}
                                </span>
                                <Tag color="green" style={{ border: 'none', fontSize: 10, margin: 0, padding: '0 4px', borderRadius: 4 }}>
                                    {discountPercentage}% OFF
                                </Tag>
                            </div>
                        )}

                        <div className="price-tag" style={{ fontSize: 16, color: '#0f172a' }}>
                            ৳ {Number(record.sell_price).toLocaleString()}
                        </div>

                        {hasDiscount && (
                            <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>
                                Save ৳ {Number(record.discount).toLocaleString()}
                            </div>
                        )}
                    </div>
                );
            },
            width: 180
        },
        {
            title: "Sales Velocity",
            key: "sales",
            align: "center",
            render: (_, record) => (
                <div style={{ textAlign: 'left', minWidth: 150, padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Units Sold</span>
                        <b style={{ fontSize: 13, color: '#6366f1' }}>{record.order_count}</b>
                    </div>
                    <Progress percent={Math.min(100, (record.order_count / 2000) * 100)} size="small" showInfo={false} strokeColor={{ '0%': '#8b5cf6', '100%': '#6366f1' }} />
                </div>
            ),
            width: 200
        },
        {
            title: "Inventory Level",
            dataIndex: "current_stock",
            key: "stock",
            align: "center",
            render: (stock) => {
                const color = stock < 10 ? "red" : stock < 50 ? "orange" : "green";
                const label = stock < 10 ? "Critical" : stock < 50 ? "Low" : "Optimal";
                return (
                    <Tooltip title={`${label} Stock Level`}>
                        <Tag color={color} style={{ borderRadius: 12, fontWeight: 700, padding: '2px 10px', minWidth: 80, textAlign: 'center' }}>
                            {stock} Items
                        </Tag>
                    </Tooltip>
                );
            }
        },
        {
            title: "Fulfillment Status",
            key: "status_summary",
            render: (_, record) => {
                const delivered = record.status_counts?.find(s => s.slug === 'delivered')?.total || 0;
                const canceled = record.status_counts?.find(s => s.slug === 'canceled')?.total || 0;
                return (
                    <div className="status-summary">
                        <Tag color="success" className="mini-status" style={{ border: 'none' }}>
                            <span style={{ marginRight: 4 }}>✓</span> {delivered}
                        </Tag>
                        <Tag color="error" className="mini-status" style={{ border: 'none' }}>
                            <span style={{ marginRight: 4 }}>✕</span> {canceled}
                        </Tag>
                    </div>
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
        <div className="expanded-row-content">
            <h5 style={{ marginBottom: 20, fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                <EyeOutlined /> Full Order Status Distribution
            </h5>
            <div className="status-grid">
                {record.status_counts?.map((status, i) => (
                    <div key={i} className="status-item">
                        <span className="label">{status.name}</span>
                        <span className="count">{status.total}</span>
                    </div>
                ))}
                {(!record.status_counts || record.status_counts.length === 0) && (
                    <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>No status data available for this product.</div>
                )}
            </div>
        </div>
    );

    const downloadCSV = () => {
        const headers = ["Product", "SKU", "Category", "Orders", "Stock", "Price", "Revenue"];
        const rows = products.map(p => [
            p.name, p.slug, p.category?.name, p.order_count, p.current_stock, p.sell_price, (p.order_count * p.sell_price)
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Product_Report_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Product Performance Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        const dateStr = new Date().toLocaleDateString();
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        doc.text(`Total Products: ${products.length}`, 14, 36);
        
        const tableColumn = ["#", "Product Name", "Category", "Orders", "Stock", "Price"];
        const tableRows = products.map((p, index) => [
            index + 1,
            p.name,
            p.category?.name || "N/A",
            p.order_count,
            p.current_stock,
            `TK ${Number(p.sell_price).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 'auto' },
                5: { halign: 'right' }
            }
        });

        doc.save(`Product_Report_${dateStr}.pdf`);
    };

    return (
        <div className="report-container">
            <header className="report-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h2>Product Performance Insights</h2>
                        <p>Analyze high-velocity products and track fulfillment life cycles.</p>
                    </div>
                    <div className="table-stats">
                        Showing {products.length} Products
                    </div>
                </div>
            </header>

            <div className="filter-card">
                <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap size="middle">
                        <Input.Search placeholder="Filter by name, category or SKU..." allowClear onChange={(e) => setLocalSearch(e.target.value)} style={{ width: 380 }} prefix={<FilterOutlined style={{ color: '#94a3b8' }} />} />
                        <Select value={dateFilter} style={{ width: 180 }} onChange={(val) => {
                                setDateFilter(val);
                                if (val !== "custom") setDateRange([null, null]);
                                setPagination(prev => ({ ...prev, current: 1 }));
                            }}
                            suffixIcon={<RiseOutlined style={{ color: '#6366f1' }} />}
                        >
                            <Option value="all">All Time History</Option>
                            <Option value="today">Today's Performance</Option>
                            <Option value="yesterday">Yesterday</Option>
                            <Option value="last7days">Last 7 Days</Option>
                            <Option value="last30days">Last 30 Days</Option>
                            <Option value="month">Current Month</Option>
                            <Option value="year">Current Year</Option>
                            <Option value="custom">Custom Date Range</Option>
                        </Select>

                        {dateFilter === "custom" && (
                            <RangePicker value={dateRange} onChange={(dates) => {
                                    setDateRange(dates);
                                    setPagination(prev => ({ ...prev, current: 1 }));
                                }} />
                        )}
                    </Space>

                    <Space size="middle">
                        <Button type="primary" icon={<DownloadOutlined />} onClick={downloadCSV}>
                            Download CSV
                        </Button>
                        
                        <Button type="primary" style={{ backgroundColor: '#d32f2f', border: 'none', borderRadius: 8 }} icon={<DownloadOutlined />} onClick={downloadPDF}>
                            Download PDF
                        </Button>
                    </Space>
                </Space>
            </div>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={products.filter(p => 
                    !localSearch || 
                    p.name.toLowerCase().includes(localSearch.toLowerCase()) || 
                    p.category?.name?.toLowerCase().includes(localSearch.toLowerCase())
                )}
                loading={loading}
                expandable={{ 
                    expandedRowRender,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        expanded ? (
                            <EyeOutlined style={{ color: '#6366f1', cursor: 'pointer' }} onClick={e => onExpand(record, e)} />
                        ) : (
                            <EyeOutlined style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={e => onExpand(record, e)} />
                        )
                }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                    showSizeChanger: true,
                    className: "custom-pagination",
                    showTotal: (total) => `Total ${total} entries identified`,
                }}
            />
        </div>
    );
}
