import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Tag, Avatar, Divider } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, InboxOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function SaleReport() {
    // Hook
    useTitle("Sale Report");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("");
    const [orders, setOrders]                   = useState([]);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({current: 1,pageSize: 20,total: 0});
    
    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            render: (text, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
            align: "center",
        },
        {
            title: "Product",
            key: "product",
            width: 380,
            render: (_, record) => (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar 
                        shape="square" 
                        size={48} 
                        src={record.img_path} 
                        icon={<InboxOutlined />}
                        style={{ borderRadius: 8, flexShrink: 0, border: "1px solid #f0f0f0" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <Text strong style={{ fontSize: 14, color: "#262626", lineHeight: "1.4" }} ellipsis={{ tooltip: record.name }}>
                            {record.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Brand: <span style={{ color: "#1890ff", fontWeight: 500 }}>{record.brand?.name || "N/A"}</span>
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Categories",
            key: "categories",
            width: 250,
            render: (_, record) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {record.categories?.map(cat => (
                        <Tag key={cat.id} style={{ margin: 0, borderRadius: 4, fontSize: 11, background: "#f0f5ff", border: "1px solid #adc6ff", color: "#2f54eb" }}>
                            {cat.name}
                        </Tag>
                    ))}
                    {(!record.categories || record.categories.length === 0) && <Text type="secondary" italic style={{ fontSize: 12 }}>Uncategorized</Text>}
                </div>
            ),
        },
        {
            title: "Inventory",
            dataIndex: "current_stock",
            key: "stock",
            width: 120,
            align: "center",
            render: (value) => (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Tag color={value <= 0 ? "error" : value <= 10 ? "warning" : "success"} style={{ margin: 0, borderRadius: 12, minWidth: 60 }}>
                        {value > 0 ? `${value} in stock` : "Out of stock"}
                    </Tag>
                </div>
            ),
        },
        {
            title: "Price Range",
            key: "pricing",
            width: 200,
            align: "right",
            render: (_, record) => {
                const isRange = record.min_sell_price !== record.max_sell_price;
                return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <Text strong style={{ color: "#1C558B", fontSize: 15 }}>
                            {isRange ? (
                                <>
                                    ৳{Number(record.min_sell_price).toLocaleString()} - {Number(record.max_sell_price).toLocaleString()}
                                </>
                            ) : (
                                `৳${Number(record.sell_price).toLocaleString()}`
                            )}
                        </Text>
                        {record.discount > 0 && !isRange && (
                            <Text delete type="secondary" style={{ fontSize: 11 }}>
                                ৳{Number(record.mrp).toLocaleString()}
                            </Text>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Total Orders",
            dataIndex: "order_count",
            key: "order_count",
            width: 130,
            align: "center",
            render: (value) => (
                <div style={{ 
                    background: "#e6f7ff", 
                    color: "#1890ff", 
                    padding: "4px 12px", 
                    borderRadius: "6px", 
                    display: "inline-block",
                    fontWeight: 700,
                    fontSize: 14,
                    border: "1px solid #91d5ff"
                }}>
                    <ShoppingCartOutlined style={{ marginRight: 6 }} />
                    {value || 0}
                </div>
            ),
        },
    ];

    useEffect(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [dateFilter, dateRange]);

    const getOrderReport = async () => {
        let params = {
            page: pagination.current,
            paginate_size: pagination.pageSize,
        };

        if (dateFilter) {
            params.filter = dateFilter;
            
            if (dateFilter === "custom" && dateRange && dateRange[0] && dateRange[1]) {
                params.from_date = dateRange[0].format("YYYY-MM-DD");
                params.to_date   = dateRange[1].format("YYYY-MM-DD");
            }
        }

        const query = new URLSearchParams(params).toString();

        try {
            setLoading(true);
            const res = await getDatas(`/admin/order/reports/by-selling?${query}`);

            if (res && res.success) {
                setOrders(res.result?.data || []);
                setPagination((prev) => ({
                    ...prev,
                    total: res.result?.total || 0,
                }));
            }
        } catch (error) {
            console.error("Error fetching sale report:", error);
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
        const filtered = orders?.filter((order) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                order.name.toLowerCase().includes(term) || 
                order.brand?.name?.toLowerCase().includes(term) ||
                order.categories?.some(cat => cat.name.toLowerCase().includes(term))
            );
        });
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.id));
        }
        return filtered;
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        doc.text("Sale Report: Top Selling Products", 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Filter: ${dateFilter || 'All'}`, 14, 28);

        const tableData = dataToExport.map((item, index) => {
            const pricing = item.min_sell_price !== item.max_sell_price 
                ? `${item.min_sell_price} - ${item.max_sell_price}` 
                : item.sell_price;
            
            const cats = item.categories?.map(c => c.name).join(", ") || "N/A";

            return [
                index + 1,
                item.name,
                item.brand?.name || "N/A",
                cats,
                pricing,
                item.current_stock,
                item.order_count || 0
            ];
        });

        autoTable(doc, {
            startY: 35,
            head: [["SL", "Product Name", "Brand", "Categories", "Pricing Range", "Stock", "Total Sold"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], fontSize: 9, halign: 'center' },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                2: { cellWidth: 30 },
                3: { cellWidth: 40 },
                4: { halign: 'right', cellWidth: 35 },
                5: { halign: 'center', cellWidth: 20 },
                6: { halign: 'center', cellWidth: 25 }
            }
        });

        doc.save(`Top_Selling_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["Product Name", "Brand", "Categories", "Pricing", "Stock", "Total Sold"];
        
        const rows = dataToExport.map((item) => {
            const price = item.min_sell_price !== item.max_sell_price 
                ? `${item.min_sell_price} - ${item.max_sell_price}` 
                : item.sell_price;
            
            const cats = item.categories?.map(c => c.name).join(" | ") || "N/A";

            return [
                `"${item.name}"`,
                `"${item.brand?.name || "N/A"}"`,
                `"${cats}"`,
                price,
                item.current_stock,
                item.order_count || 0
            ];
        });

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Top_Selling_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Analytics: Top Selling Sales Report</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
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
                        prefix={<ShoppingCartOutlined style={{ color: '#bfbfbf' }} />}
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
                    dataSource={getExportData().length === orders.length ? orders : getExportData()} // This hack is for display only
                    loading={loading}
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

