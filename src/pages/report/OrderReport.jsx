import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import dayjs from "dayjs";
import useTitle from "../../hooks/useTitle";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function OrderReport() {
    // Hook
    useTitle("Order Report");

    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState("today");
    const [localSearch, setLocalSearch] = useState("");
    const [dateRange, setDateRange] = useState([null, null]);

    const [pagination, setPagination] = useState({current: 1,pageSize: 25,total: 0});

    useEffect(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [dateFilter, dateRange]);

    const fetchOrders = async () => {
        setLoading(true);

        let params = {};

        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange[0] !== null && dateRange[1] !== null) {
            params.start_date = dateRange[0].format("YYYY-MM-DD");
            params.end_date = dateRange[1].format("YYYY-MM-DD");
        }

        params.page = pagination.current;
        params.paginate_size = pagination.pageSize;

        const query = new URLSearchParams(params).toString();

        const res = await getDatas(`/admin/order/reports?${query}`);

        if (res?.success) {
            setOrders(res?.result?.orders?.data || []);
            setPagination((prev) => ({
                ...prev,
                total: res?.result?.total_order || 0,
            }));
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const filteredOrders = orders.filter((order) => {
        if (!localSearch) return true;
        const term = localSearch.toLowerCase();
        return (order.phone_number.toLowerCase().includes(term) || order.current_status.name.toLowerCase().includes(term) || order.order_from.name.toLowerCase().includes(term));
    });

    const columns = [
        {
            title: "SL",
            key: "sl",
            render: (text, record, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
        },
        {
            title: "Customer",
            dataIndex: "phone_number",
            key: "customer",
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: "Invoice Number",
            dataIndex: "invoice_number",
            key: "invoice",
        },
        {
            title: "Order Quantity",
            dataIndex: "order_quantity",
            key: "quantity",
        },
        {
            title: "Payable Price",
            dataIndex: "payable_price",
            key: "price",
        },
        {
            title: "Order Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (value) => value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "-",
        },
        {
            title: "Paid Status",
            dataIndex: "paid_status",
            key: "paid",
            render: (text) => (
                <span className={`order-paid-btn ${text === "paid" ? "paid" : "unpaid"}`}>
                    {text}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: ["current_status", "name"],
            key: "status",
            render: (text) => <span className={`statusBadge ${text.toLowerCase()}`}>{text}</span>,
        },
        {
            title: "Source",
            dataIndex: ["order_from", "name"],
            key: "source",
            render: (text) => (
                <span
                    className={`order-status-badge ${
                        text.toLowerCase() === "frontend" ? "source-frontend" : text.toLowerCase() === "youtube" ? "source-youtube" : text.toLowerCase() === "facebook" ? "source-facebook" : "source-default"
                    }`}
                >
                    {text}
                </span>
            ),
        },
    ];

    const downloadCSV = () => {
        const headers = columns.map((col) => col.title);
        const rows = orders.map((item) =>
            columns.map((col) => {
                if (typeof col.dataIndex === "string") return item[col.dataIndex];
                return col.dataIndex.reduce((acc, key) => acc?.[key], item);
            })
        );

        let csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "orders_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {

    }

    return (
        <div className="reportWrapper">
            <h5 className="mb-4">Order Report</h5>

            <Space style={{marginBottom: 16,display: "flex",justifyContent: "space-between",alignItems: "center"}} wrap>
                <Space wrap>
                    <Input.Search placeholder="Search by phone / status / source ..." allowClear value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} style={{ width: 300 }}/>

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
    );
}
