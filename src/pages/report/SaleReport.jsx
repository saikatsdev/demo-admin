import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Card, Typography, Tag, Avatar, Progress, Tooltip } from "antd";
import { DownloadOutlined, ShoppingCartOutlined, ReloadOutlined, InboxOutlined, FilePdfOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            background: '#f5f5f5', 
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '12px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
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
        let params = {};

        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange && dateRange[0] && dateRange[1]) {
            params.start_date = dateRange[0].format("YYYY-MM-DD");
            params.end_date = dateRange[1].format("YYYY-MM-DD");
        }

        params.page = pagination.current;
        params.paginate_size = pagination.pageSize;

        const query = new URLSearchParams(params).toString();

        try {
            setLoading(true);

            const res = await getDatas(`/admin/order/reports/by-selling?${query}`);

            if(res && res.success){
                const data = res.result?.data || [];
                setOrders(data);
                setPagination((prev) => ({
                    ...prev,
                    total: res.result?.total || res.result?.data?.length || 0,
                }));
            }
        } catch (error) {
            console.error("Error fetching sale report:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        const dataToExport = selectedRowKeys.length > 0 ? orders.filter(item => selectedRowKeys.includes(item.id)) : filteredOrders;

        const doc = new jsPDF("landscape");
        doc.text("Analytics: Top Selling Inventory Report", 14, 20);
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

        doc.save(`Sales_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    useEffect(() => {
        getOrderReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const filteredOrders = orders?.filter((order) => {
        if (!localSearch) return true;
        const term = localSearch.toLowerCase();
        return (
            order.name.toLowerCase().includes(term) || 
            order.brand?.name?.toLowerCase().includes(term) ||
            order.categories?.some(cat => cat.name.toLowerCase().includes(term))
        );
    });

    const downloadCSV = () => {
        const dataToExport = selectedRowKeys.length > 0 
            ? orders.filter(item => selectedRowKeys.includes(item.id))
            : filteredOrders;

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
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Sale_Report_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalOrders = orders.reduce((acc, curr) => acc + (curr.order_count || 0), 0);
    const totalStock = orders.reduce((acc, curr) => acc + (curr.current_stock || 0), 0);

    return (
        <div style={{ padding: "0px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
                <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #1C558B 0%, #2d74b8 100%)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: "block" }}>Total Order Volume</Text>
                            <Title level={3} style={{ color: "#fff", margin: "4px 0 0 0" }}>{totalOrders.toLocaleString()}</Title>
                        </div>
                        <Avatar size={48} style={{ backgroundColor: "rgba(255,255,255,0.2)" }} icon={<ShoppingCartOutlined style={{ color: "#fff" }} />} />
                    </div>
                </Card>

                <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Total Inventory Assets</Text>
                            <Title level={3} style={{ margin: "4px 0 0 0" }}>{totalStock.toLocaleString()}</Title>
                        </div>
                        <Avatar size={48} style={{ backgroundColor: "#f6ffed" }} icon={<InboxOutlined style={{ color: "#52c41a" }} />} />
                    </div>
                </Card>

                <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 13, display: "block" }}>Monitored Products</Text>
                            <Title level={3} style={{ margin: "4px 0 0 0" }}>{pagination.total}</Title>
                        </div>
                        <Avatar size={48} style={{ backgroundColor: "#e6f7ff" }} icon={<ReloadOutlined style={{ color: "#1890ff" }} />} />
                    </div>
                </Card>
            </div>

            <Card 
                bordered={false} 
                className="base-card"
                style={{ borderRadius: 12, boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}
                title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                        <div>
                            <Title level={4} style={{ margin: 0, color: "#1C558B" }}>Analytics: Top Selling Inventory</Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {selectedRowKeys.length > 0 
                                    ? `Selected ${selectedRowKeys.length} items for export`
                                    : "Detailed performance metrics across all selling channels"
                                }
                            </Text>
                        </div>
                        <Space>
                            {selectedRowKeys.length > 0 && (
                                <Button danger type="text" size="small" onClick={() => setSelectedRowKeys([])}>
                                    Clear Selection
                                </Button>
                            )}
                            <Button shape="round" icon={<DownloadOutlined />} onClick={downloadCSV} style={{ backgroundColor: "#f5f5f5" }}>
                                Export CSV {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
                            </Button>
                            <Button shape="round" type="primary" icon={<FilePdfOutlined />} onClick={downloadPDF} style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}>
                                Export PDF {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
                            </Button>
                        </Space>
                    </div>
                }
            >
                <div style={{ marginBottom: 24, padding: "16px", borderRadius: 12, background: "#fafafa" }}>
                    <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space wrap size={16}>
                            <Input.Search 
                                placeholder="Filter products, brands..." 
                                allowClear 
                                size="large"
                                value={localSearch} 
                                onChange={(e) => setLocalSearch(e.target.value)} 
                                style={{ width: 400 }}
                                prefix={<ShoppingCartOutlined style={{ color: "#bfbfbf" }} />}
                            />

                            <Select 
                                value={dateFilter} 
                                size="large"
                                style={{ width: 180 }} 
                                onChange={(val) => setDateFilter(val)}
                                dropdownStyle={{ borderRadius: 8 }}
                                placeholder="Select Time Range"
                            >
                                <Option value="">All Time</Option>
                                <Option value="today">Today's Sales</Option>
                                <Option value="yesterday">Yesterday</Option>
                                <Option value="week">This Week</Option>
                                <Option value="month">This Month</Option>
                                <Option value="year">This Year</Option>
                                <Option value="custom">📅 Custom Range</Option>
                            </Select>
                            {dateFilter === "custom" && (
                                <RangePicker 
                                    size="large"
                                    value={dateRange} 
                                    onChange={(dates) => setDateRange(dates)} 
                                    allowClear 
                                    style={{ borderRadius: 8 }}
                                />
                            )}
                        </Space>
                    </Space>
                </div>

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredOrders}
                    loading={loading}
                    className="advanced-table"
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    pagination={{
                        current        : pagination.current,
                        pageSize       : pagination.pageSize,
                        total          : pagination.total,
                        showSizeChanger: true,
                        pageSizeOptions: ["15", "25", "50", "100"],
                        onChange       : (page, pageSize) => {
                            setPagination((prev) => ({ ...prev, current: page, pageSize }));
                        },
                        showTotal: (total) => `Analysis shown for ${total} items`,
                        style    : { marginTop: 24 }
                    }}
                    scroll={{ x: 1300 }}
                    style={{ marginTop: 10 }}
                />
            </Card>
        </div>
    );
}

