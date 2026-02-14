import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ProductReport() {
    // Hook
    useTitle("Product Report");

    // State
    const [localSearch, setLocalSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState("today");
    const [orders, setOrders] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [pagination, setPagination] = useState({current: 1,pageSize: 25,total: 0});

    const columns = [
        {
            title: "SL",
            key: "sl",
            render: (text, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
        },
        {
            title: "Product",
            key: "product",
            render: (_, record) => (
                <div style={{ display: "flex", gap: 10 }}>
                    <img src={record.img_path} alt={record.name} style={{width: 50,height: 50, borderRadius: 6,objectFit: "cover"}}/>
                    <div>
                        <strong style={{ fontSize: 14 }}>
                            {record.name}
                        </strong>
                        <div style={{ fontSize: 12, color: "#888" }}>
                            {record.category?.name}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Category",
            dataIndex: ["category", "name"],
            key: "category",
        },
        {
            title: "Sell Price",
            dataIndex: "sell_price",
            key: "sell_price",
            align: "right",
            render: (value) => (
                <strong style={{ color: "#1C558B" }}>
                    ৳ {Number(value).toLocaleString()}
                </strong>
            ),
        },
        {
            title: "Orders",
            dataIndex: "order_count",
            key: "order_count",
            width: 100,
            align: "center",
            render: (value) => (
                <span style={{ fontWeight: 600 }}>
                    {value}
                </span>
            ),
        },
        {
            title: "Stock",
            dataIndex: "current_stock",
            key: "stock",
            width: 100,
            align: "center",
            render: (value) => (
                <span style={{fontWeight: 600, color: value <= 5 ? "#d32f2f" : value <= 10 ? "#ed6c02" : "#2e7d32"}}>
                    {value}
                </span>
            ),
        },
        {
            title: "Brand",
            dataIndex: ["brand", "name"],
            key: "brand",
        },
        {
            title: "Discount",
            dataIndex: "discount",
            key: "discount",
            align: "right",
            render: (value) => value ? `৳ ${Number(value).toLocaleString()}` : "-",
        },
    ];

    useEffect(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [dateFilter, dateRange]);

    const getOrderReport = async () => {

        let params = {};

        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange[0] !== null && dateRange[1] !== null) {
            params.start_date = dateRange[0].format("YYYY-MM-DD");
            params.end_date = dateRange[1].format("YYYY-MM-DD");
        }

        params.page = pagination.current;
        params.limit = pagination.pageSize;

        const query = new URLSearchParams(params).toString();

        try {
            setLoading(true);
            const res = await getDatas(`/admin/order/reports/by-selling?${query}`);

            if(res && res?.success){
                setOrders(res?.result);

                setPagination((prev) => ({
                    ...prev,
                    total: res?.result?.length || 0,
                }));
            }
        } catch (error) {
            console.log(error)
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        getOrderReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const filteredOrders = orders.filter((order) => {
        if (!localSearch) return true;
        const term = localSearch.toLowerCase();
        return (order.name.toLowerCase().includes(term) || order.slug.toLowerCase().includes(term));
    });

    const downloadCSV = () => {
        const headers = ["Name","Email","Status","Location","Phone","Group","Category",];
        const rows = filteredOrders.map((user) => [user.name,user.email,user.status,user.location,user.phone,user.group,user.category]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {

    }

    return (
        <>
            <div className="reportWrapper">
                <h5 className="mb-4">Product Report</h5>
                <Space style={{marginBottom: 16,display: "flex",justifyContent: "space-between",alignItems: "center"}} wrap>
                    <Space wrap>
                        <Input.Search placeholder="Search by phone / category ..." allowClear value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} style={{ width: 300 }}/>

                        <Space wrap>
                            <Select value={dateFilter} style={{ width: 150 }} onChange={(val) => setDateFilter(val)}>
                                <Option value="today">Today</Option>
                                <Option value="yesterday">Yesterday</Option>
                                <Option value="last7days">Last 7 Days</Option>
                                <Option value="last30days">Last 30 Days</Option>
                                <Option value="month">This Month</Option>
                                <Option value="year">This Year</Option>
                                <Option value="custom">Custom</Option>
                            </Select>

                            {dateFilter === "custom" && (
                                <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} allowClear/>
                            )}
                        </Space>
                    </Space>

                    <Space wrap>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={downloadCSV}>
                            Download CSV
                        </Button>

                        <Button type="primary" style={{ backgroundColor: "#1C558B", borderColor: "#1C558B" }} icon={<DownloadOutlined />} onClick={downloadPDF}>
                            Download PDF
                        </Button>
                    </Space>
                </Space>

                {/* ===== Table ===== */}
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredOrders}
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => {
                            setPagination((prev) => ({ ...prev, current: page, pageSize }));
                        },
                    }}
                />
            </div>
        </>
    )
}
