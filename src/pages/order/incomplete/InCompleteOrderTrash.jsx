import { ArrowLeftOutlined, DeleteFilled, RollbackOutlined, UndoOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, message, Popconfirm, Space, Table, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import dayjs from "dayjs";

export default function InCompleteOrderTrash() {
    // Hooks
    useTitle("Incomplete Order Trash");

    // States
    const navigate                                = useNavigate();
    const [incompleteOrders, setIncompleteOrders] = useState([]);
    const [loading, setLoading]                   = useState(false);
    const [currentPage, setCurrentPage]           = useState(1);
    const [pageSize, setPageSize]                 = useState(10);
    const [totalOrders, setTotalOrders]           = useState(0);

    const fetchTrashOrders = async () => {
        setLoading(true);
        try {
            const params = {
                trash: 1,
                page: currentPage,
                paginate_size: pageSize,
            };

            const res = await getDatas("/admin/incomplete-orders/trashed", params);
            
            if (res && res.success) {
                setIncompleteOrders(res.result?.data || []);
                setTotalOrders(res.result?.meta?.total || 0);
            }
        } catch (err) {
            console.log(err);
            message.error("Error fetching trash orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrashOrders();
    }, [currentPage, pageSize]);

    const onRestore = async (id) => {
        const res = await postData(`/admin/incomplete-orders/${id}/restore`);
        if (res && res.success) {
            message.success(res.message || "Order restored successfully");
            fetchTrashOrders();
        }
    };

    const onForceDelete = async (id) => {
        const res = await deleteData(`/admin/incomplete-orders/${id}/permanent`);
        if (res && res.success) {
            message.success(res.msg || "Order deleted permanently");
            fetchTrashOrders();
        }
    };

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 60,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Phone Number",
            dataIndex: "phone_number",
            key: "phone_number",
        },
        {
            title: "Deleted At",
            dataIndex: "deleted_at",
            key: "deleted_at",
            render: (date) => date ? dayjs(date).format("MMMM DD, YYYY hh:mm A") : "N/A",
        },
        {
            title: "Actions",
            key: "actions",
            width: 150,
            align: "center",
            render: (_, record) => (
                <Space size={6}>
                    <Tooltip title="Restore Order">
                        <Popconfirm title="Restore this order?" onConfirm={() => onRestore(record.id)}>
                            <Button size="small" type="text" style={{ color: '#52c41a', backgroundColor: '#f6ffed' }} icon={<UndoOutlined />} />
                        </Popconfirm>
                    </Tooltip>

                    <Tooltip title="Permanent Delete">
                        <Popconfirm title="Permanently delete this order?" onConfirm={() => onForceDelete(record.id)}>
                            <Button size="small" type="text" danger style={{ backgroundColor: '#fff2f0' }} icon={<DeleteFilled />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        }
    ];

    return (
        <div style={{ padding: "20px" }}>
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{ fontWeight: "600" }}>Incomplete Order Trash</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: <Link to="/incomplete/orders">Incomplete Orders</Link> }, { title: "Trash" }]} />
                </div>
            </div>

            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <Button type="primary" ghost icon={<ArrowLeftOutlined />} onClick={() => navigate("/incomplete/orders")}>
                    Back to List
                </Button>
            </div>

            <Table 
                bordered 
                loading={loading} 
                columns={columns} 
                dataSource={incompleteOrders} 
                rowKey="id"
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalOrders,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }
                }}
            />
        </div>
    );
}
