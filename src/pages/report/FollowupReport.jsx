import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function FollowupReport() {
    // Hook
    useTitle("Followup Report");

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
            title: "Customer Name",
            dataIndex: "customer_name",
            key: "customer_name",
        },
        {
            title: "Phone Number",
            dataIndex: "phone_number",
            key: "phone_number",
        },
        {
            title: "Invoice Number",
            dataIndex: "invoice_number",
            key: "invoice_number",
        },
        {
            title: "Order Count",
            dataIndex: "order_count",
            key: "order_count",
        },
        {
            title: "Order Value",
            dataIndex: "order_value",
            key: "order_value",
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

            const res = await getDatas(`/admin/order/reports/followup?${query}`);

            if(res && res?.success){
                setOrders(res?.result?.orders.data);
            }
        } catch (error) {
            console.log(error);
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
        return (order.customer_name.toLowerCase().includes(term) || order.phone_number.toLowerCase().includes(term) || order.invoice_number.toLowerCase().includes(term));
    });

    const downloadPDF = () => {
        
    }

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

    return (
        <>
            <div className="reportWrapper">
                <h5 className="mb-4">Followup Report</h5>
                <Space style={{marginBottom: 16,display: "flex",justifyContent: "space-between",alignItems: "center"}} wrap>
                    <Space wrap>
                        <Input.Search placeholder="Search by phone / name..." allowClear value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} style={{ width: 300 }}/>

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
        </>
    )
}
