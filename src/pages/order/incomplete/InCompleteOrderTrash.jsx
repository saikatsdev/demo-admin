import { ArrowLeftOutlined, DeleteFilled, UndoOutlined, CopyOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, message, Popconfirm, Space, Table, Tooltip, Image } from "antd";
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
    const [messageApi, contextHolder]           = message.useMessage();
    const [currentPage, setCurrentPage]           = useState(1);
    const [pageSize, setPageSize]                 = useState(10);
    const [totalOrders, setTotalOrders]           = useState(0);
    const [selectedRowKeys, setSelectedRowKeys]   = useState([]);
    const [selectedOrders, setSelectedOrders]     = useState([]);

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys, selectedRows) => {
            setSelectedRowKeys(newSelectedRowKeys);
            setSelectedOrders(selectedRows);
        },
    };

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
            messageApi.error("Error fetching trash orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrashOrders();
    }, [currentPage, pageSize]);

    const copyPhoneNo = async (phoneNumber) => {
        if (!phoneNumber) return;
        try {
            await navigator.clipboard.writeText(phoneNumber);
            messageApi.open({
                type: "success",
                content: "Phone Number Copied",
            });
        } catch (err) {
            console.log(err);
            messageApi.open({
                type: "error",
                content: "Failed to copy phone number",
            });
        }
    };

    const openWhatsApp = (phone) => {
        if (!phone) return;
        let formattedPhone = phone.replace(/\D/g, "");
        if (!formattedPhone.startsWith("88")) {
            formattedPhone = "88" + formattedPhone;
        }
        const whatsappUrl = `https://wa.me/${formattedPhone}`;
        window.open(whatsappUrl, "_blank");
    };

    const onRestore = async (id) => {
        const res = await postData(`/admin/incomplete-orders/${id}/restore`);
        if (res && res.success) {
            messageApi.success(res.message || "Order restored successfully");
            fetchTrashOrders();
        }
    };

    const onForceDelete = async (id) => {
        const res = await deleteData(`/admin/incomplete-orders/${id}/permanent`);
        if (res && res.success) {
            messageApi.success(res.msg || "Order deleted permanently");
            fetchTrashOrders();
        }
    };

    const handleBulkRestore = async () => {
        if (!selectedRowKeys.length) return;
        
        try {
            const res = await postData("/admin/incomplete-orders/bulk-restore", {
                ids: selectedRowKeys
            });
            if (res && res.success) {
                messageApi.success(res.message || "Selected orders restored");
                setSelectedRowKeys([]);
                setSelectedOrders([]);
                fetchTrashOrders();
            }
        } catch (err) {
            messageApi.error("Bulk restore failed");
        }
    };

    const handleBulkPermanentDelete = async () => {
        if (!selectedRowKeys.length) return;

        try {
            const res = await postData("/admin/incomplete-orders/bulk-permanent-delete", {ids: selectedRowKeys});
            
            if (res && res.success) {
                messageApi.success(res.msg || "Selected orders deleted permanently");
                setSelectedRowKeys([]);
                setSelectedOrders([]);
                fetchTrashOrders();
            }
        } catch (err) {
            messageApi.error("Bulk permanent delete failed");
        }
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: "Products",
            key: "products",
            width: 300,
            render: (_, record) => {
                if (!record?.items?.length) return "N/A";
                return (
                    <div>
                        {record.items.map((item, index) => {
                            const product = item?.product;
                            if (!product) return "N/A";
                            const variations = [item?.attribute_value_1, item?.attribute_value_2, item?.attribute_value_3].filter(val => val && typeof val === "string");

                            return (
                                <div key={index} style={{ display: "flex", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: index !== record.items.length - 1 ? "1px dashed #ddd" : "none" }}>
                                    <Image src={product?.image} alt={product?.name || "Product"} width={40} height={50} style={{ objectFit: "cover", borderRadius: 4 }} preview={{ mask: "Preview" }} />
                                    <div>
                                        <div style={{ fontWeight: 600 }}>
                                            {product?.name || "N/A"}
                                        </div>
                                        {variations.length > 0 && (
                                            <div style={{ fontSize: 12, color: "#666" }}>
                                                Variation: {variations.join(" / ")}
                                            </div>
                                        )}
                                        {item.note && (
                                            <div style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>
                                                Note: {item.note}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            }
        },
        {
            title: "Customer Info",
            key: "customer_info",
            width: 250,
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 600 }}>{record.name || "N/A"}</div>
                    <Space>
                        <span>{record.phone_number}</span>
                        <Tooltip title="Copy Phone Number">
                            <CopyOutlined style={{ color: "#1890ff", cursor: "pointer" }} onClick={() => copyPhoneNo(record.phone_number)} />
                        </Tooltip>
                        <Tooltip title="WhatsApp">
                            <WhatsAppOutlined style={{ color: "#25D366", cursor: "pointer" }} onClick={() => openWhatsApp(record.phone_number)} />
                        </Tooltip>
                    </Space>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.address || "No Address"}</div>
                </div>
            ),
        },
        {
            title: "IP Address",
            dataIndex: "ip_address",
            key: "ip_address",
            width: 130,
        },
        {
            title: "Date Info",
            key: "date_info",
            width: 200,
            render: (_, record) => (
                <div style={{ fontSize: '12px' }}>
                    <div><strong>Created:</strong> {record.created_at ? dayjs(record.created_at).format("DD MMM, YYYY hh:mm A") : "N/A"}</div>
                    <div style={{ color: '#ff4d4f' }}><strong>Deleted:</strong> {record.deleted_at ? dayjs(record.deleted_at).format("DD MMM, YYYY hh:mm A") : "N/A"}</div>
                </div>
            )
        },
        {
            title: "Status",
            key: "status",
            width: 120,
            render: (_, record) => (
                <span style={{ 
                    color: record.status?.text_color || "#007bff", 
                    backgroundColor: record.status?.bg_color || "#e6f2ff", 
                    padding: "4px 10px", 
                    borderRadius: "12px", 
                    fontWeight: "600", 
                    fontSize: "11px", 
                    display: "inline-block" 
                }}>
                    {record.status?.name || "N/A"}
                </span>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
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
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{ fontWeight: "600" }}>Incomplete Order Trash</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: <Link to="/incomplete/orders">Incomplete Orders</Link> }, { title: "Trash" }]} />
                </div>
            </div>

            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Button type="primary" ghost icon={<ArrowLeftOutlined />} onClick={() => navigate("/incomplete/orders")}>
                        Back to List
                    </Button>
                </Space>

                <Space>
                    <Popconfirm 
                        title={`Restore ${selectedRowKeys.length} items?`} 
                        disabled={!selectedRowKeys.length} 
                        onConfirm={handleBulkRestore}
                    >
                        <Button 
                            icon={<UndoOutlined />} 
                            style={{ color: '#52c41a', borderColor: '#52c41a' }} 
                            disabled={!selectedRowKeys.length}
                        >
                            Bulk Restore
                        </Button>
                    </Popconfirm>

                    <Popconfirm 
                        title={`Permanently delete ${selectedRowKeys.length} items?`} 
                        disabled={!selectedRowKeys.length} 
                        onConfirm={handleBulkPermanentDelete}
                    >
                        <Button 
                            danger 
                            icon={<DeleteFilled />} 
                            disabled={!selectedRowKeys.length}
                        >
                            Bulk Permanent Delete
                        </Button>
                    </Popconfirm>
                </Space>
            </div>

            <Table 
                bordered 
                loading={loading} 
                columns={columns} 
                dataSource={incompleteOrders} 
                rowKey="id"
                rowSelection={rowSelection}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalOrders,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }
                }}
            />
        </div>
    );
}
