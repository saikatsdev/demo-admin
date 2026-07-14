import { useEffect, useState } from "react";
import { getDatas } from "../../../../api/common/common";
import useTitle from "../../../../hooks/useTitle";
import { Breadcrumb, message, Table, Tag } from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

export default function OrderList() {
    useTitle('UnAssign Order List');

    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 25,
        total: 0,
    });

    const columns = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            width: 80,
        },
        {
            title: "Invoice",
            dataIndex: "invoice_number",
            key: "invoice_number",
            width: 180,
        },
        {
            title: "Customer",
            dataIndex: "customer_name",
            key: "customer_name",
            width: 150,
        },
        {
            title: "Phone",
            dataIndex: "phone_number",
            key: "phone_number",
            width: 140,
        },
        {
            title: "Address",
            dataIndex: "address_details",
            key: "address_details",
            width: 200,
            ellipsis: true,
        },
        {
            title: "Payable",
            dataIndex: "payable_price",
            key: "payable_price",
            width: 120,
            render: (val) => `৳${parseFloat(val).toLocaleString()}`,
        },
        {
            title: "Due",
            dataIndex: "due",
            key: "due",
            width: 100,
            render: (val) => {
                const due = parseFloat(val);
                return (
                    <Tag color={due > 0 ? "red" : "green"}>
                        ৳{due.toLocaleString()}
                    </Tag>
                );
            },
        },
        {
            title: "Paid Status",
            dataIndex: "paid_status",
            key: "paid_status",
            width: 110,
            render: (val) => (
                <Tag color={val === "paid" ? "green" : "red"}>
                    {val?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            width: 160,
            render: (val) => dayjs(val).format("DD MMM YYYY, hh:mm A"),
        },
    ];

    const getOrders = async (page = 1, pageSize = 25) => {
        try {
            setLoading(true);

            const res = await getDatas("/admin/followup/list", {
                page,
                paginate_size: pageSize,
            });

            if (res && res?.success) {
                setOrders(res?.result?.data || []);
                setPagination((prev) => ({
                    ...prev,
                    current: res?.result?.current_page || page,
                    total: res?.result?.total || 0,
                }));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (pag) => {
        getOrders(pag.current, pag.pageSize);
    };

    useEffect(() => {
        getOrders(pagination.current, pagination.pageSize);
    }, []);

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All UnAssign Order List</h1>
                    <p className="subtitle">Manage orders for followup</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Categories" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ padding: "0 16px" }}>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} orders`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                />
            </div>
        </>
    );
}
