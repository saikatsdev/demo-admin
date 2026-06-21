import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Tag, Avatar, Progress, Tooltip, Divider } from "antd";
import { 
    FilePdfOutlined, 
    FileExcelOutlined, 
    ReloadOutlined, 
    InboxOutlined, 
    ArrowLeftOutlined, 
    PrinterOutlined,
    CalendarOutlined,
    ShoppingCartOutlined
} from "@ant-design/icons";
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
    const [localSearch, setLocalSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState("");
    const [orders, setOrders] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0
    });
    
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
            title: "Product Details",
            key: "product",
            width: 350,
            render: (_, record) => (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar 
                        shape="square" 
                        size={54} 
                        src={record.img_path} 
                        icon={<InboxOutlined />}
                        style={{ borderRadius: 8, border: "1px solid #f0f0f0" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Text strong style={{ fontSize: 14, color: "#262626" }}>
                            {record.name}
                        </Text>
                        <Space split={<Text type="secondary">|</Text>} size={4}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Brand: <span style={{ color: "#1890ff" }}>{record.brand?.name || "N/A"}</span>
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Cat: {record.categories?.[0]?.name || "N/A"}
                            </Text>
                        </Space>
                    </div>
                </div>
            ),
        },
        {
            title: "Pricing",
            key: "pricing",
            width: 200,
            render: (_, record) => {
                const hasVariations = record.variations?.length > 1;
                return (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text strong style={{ color: "#1C558B", whiteSpace: "nowrap" }}>
                            {hasVariations ? (
                                <>
                                    ৳ {Number(record.min_sell_price).toLocaleString()} 
                                    <span style={{ margin: "0 4px", color: "#8c8c8c", fontWeight: "normal" }}>-</span> 
                                    {Number(record.max_sell_price).toLocaleString()}
                                </>
                            ) : (
                                `৳ ${Number(record.sell_price).toLocaleString()}`
                            )}
                        </Text>
                        {!hasVariations && record.discount > 0 && (
                            <Text delete type="secondary" style={{ fontSize: 11 }}>
                                ৳ {Number(record.mrp).toLocaleString()}
                            </Text>
                        )}
                        {hasVariations && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {record.variations.length} Variations
                            </Text>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Stock",
            dataIndex: "current_stock",
            key: "stock",
            width: 100,
            align: "center",
            render: (value) => (
                <Tag color={value <= 0 ? "error" : value <= 10 ? "warning" : "success"} style={{ borderRadius: 12, padding: "0 10px" }}>
                    {value}
                </Tag>
            ),
        },
        {
            title: "Total Order",
            dataIndex: "order_count",
            key: "order_count",
            width: 110,
            align: "center",
            render: (value) => <Text strong style={{ color: "#1890ff" }}>{value || 0}</Text>,
        },
        {
            title: "Success Rate",
            key: "success_rate",
            width: 140,
            align: "center",
            render: (_, record) => {
                const total = record.order_count || 0;
                const delivered = record.status_counts?.find(s => s.slug === 'delivered')?.total || 0;
                const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
                return (
                    <Tooltip title={`${delivered} Delivered / ${total} Total`}>
                        <div style={{ padding: "0 10px" }}>
                            <Progress 
                                percent={rate} 
                                size="small" 
                                strokeColor={rate >= 80 ? "#52c41a" : rate >= 50 ? "#1C558B" : "#faad14"}
                                format={(p) => <span style={{ fontSize: 11, fontWeight: 600 }}>{p}%</span>}
                            />
                        </div>
                    </Tooltip>
                );
            }
        },
        {
            title: "Order Breakdown",
            key: "breakdown",
            width: 450,
            render: (_, record) => (
                <Space wrap size={[8, 8]} style={{ padding: '4px 0' }}>
                    {record.status_counts?.map((status) => (
                        <div key={status.slug} style={{ 
                            display     : 'inline-flex',
                            alignItems  : 'center',
                            background  : '#f5f5f5',
                            border      : '1px solid #d9d9d9',
                            borderRadius: '6px',
                            padding     : '2px 10px',
                            fontSize    : '12px',
                            boxShadow   : '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                            <span style={{ color: '#595959', marginRight: 8, fontWeight: 500 }}>{status.name}</span>
                            <Text strong style={{ color: '#1C558B' }}>{status.total}</Text>
                        </div>
                    ))}
                    {(!record.status_counts || record.status_counts.length === 0) && (
                        <Text type="secondary" italic style={{ fontSize: 12 }}>No order history</Text>
                    )}
                </Space>
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
        doc.text("Sale Report: Top Selling Inventory", 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Filter: ${dateFilter}`, 14, 28);

        const tableData = dataToExport.map((item, index) => {
            const hasVariations = item.variations?.length > 1;
            const pricing = hasVariations ? `${item.min_sell_price} - ${item.max_sell_price}` : item.sell_price;
            
            const total = item.order_count || 0;
            const delivered = item.status_counts?.find(s => s.slug === 'delivered')?.total || 0;
            const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;

            const breakdown = item.status_counts?.map(s => `${s.name}: ${s.total}`).join(" | ") || "No History";

            return [
                index + 1,
                item.name,
                item.brand?.name || "N/A",
                pricing,
                item.current_stock,
                total,
                `${rate}%`,
                breakdown
            ];
        });

        autoTable(doc, {
            startY: 35,
            head: [["SL", "Product Name", "Brand", "Pricing", "Stock", "Orders", "Success", "Breakdown"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], fontSize: 9, halign: 'center' },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'center' },
                5: { halign: 'center' },
                6: { halign: 'center', cellWidth: 15 },
                7: { cellWidth: 60 }
            }
        });

        doc.save(`Sale_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["Product Name", "Brand", "Pricing", "Stock", "Total Orders", "Success Rate", "Breakdown"];
        
        const rows = dataToExport.map((item) => {
            const hasVariations = item.variations?.length > 1;
            const price = hasVariations 
                ? `${item.min_sell_price} - ${item.max_sell_price}` 
                : item.sell_price;
            
            const total = item.order_count || 0;
            const delivered = item.status_counts?.find(s => s.slug === 'delivered')?.total || 0;
            const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;

            const breakdown = item.status_counts?.map(s => `${s.name} (${s.total})`).join(" | ") || "";

            return [
                `"${item.name}"`,
                `"${item.brand?.name || "N/A"}"`,
                price,
                item.current_stock,
                total,
                `${rate}%`,
                `"${breakdown}"`
            ];
        });

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Sale_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Analytics: Top Selling Sales Report</Title>
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
                        prefix={<ShoppingCartOutlined style={{ color: '#bfbfbf' }} />}
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
                        <Option value="">All Time</Option>
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
                        setDateFilter("");
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

