import { Link, useNavigate } from "react-router-dom";
import {InfoCircleOutlined, EditOutlined,WhatsAppOutlined,PhoneOutlined,CopyOutlined,DeleteOutlined,ArrowLeftOutlined } from '@ant-design/icons'
import {Input as AntInput, Breadcrumb, Table, Button, Space, message,Modal,DatePicker,Tooltip, Tag, Select} from "antd";
import useTitle from "../../../hooks/useTitle";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import OrderInfoModal from "./OrderInfoModal";

export default function FollowupSell() {
    // Hook
    useTitle("All Follow Up Order");

    // Variable
    const navigate = useNavigate();

    // State
    const [followUpOrders, setFollowUpOrders]         = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [pagination, setPagination]                 = useState({current: 1,pageSize: 25,total: 0});
    const [editModalOpen, setEditModalOpen]           = useState(false);
    const [noteValue, setNoteValue]                   = useState("");
    const [followupDate, setFollowupDate]             = useState("");
    const [selectedRecord, setSelectedRecord]         = useState(null);
    const [selectedNoteRecord, setSelectedNoteRecord] = useState(null);
    const [isModalOpen, setIsModalOpen]               = useState(false);
    const [messageApi, contextHolder]                 = message.useMessage();
    const [searchText, setSearchText]                 = useState("");
    const [isStatusModalOpen, setIsStatusModalOpen]   = useState(false);
    const [selectedOrder, setSelectedOrder]           = useState(null);
    const [newStatus, setNewStatus]                   = useState("");
    const [activeStatus, setActiveStatus]             = useState(null);
    const [orderSummary, setOrderSummary]             = useState({});
    const [statusLoader, setStatusLoader]             = useState(false);

    // Columns for AntD Table
    const columns = [
        {
            title: "SL",
            key: "sl",
            render: (_, __, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 60,
        },
        {
            title: "Invoice",
            dataIndex: ["order", "invoice_number"],
            key: "invoice_number",
            render: (text, record) => {
                const orderExists = record?.order;

                return (
                    <Space>
                        {orderExists ? (
                            <>
                                {text}
                                <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer" }} onClick={() => handleInfoClick(record)}/>
                            </>
                        ) : (
                            <span style={{ color: "red" }}>Order not found</span>
                        )}
                    </Space>
                );
            },
        },
        {
            title: "Customer",
            dataIndex: ["order", "customer_name"],
            key: "customer_name",
            render: (text, record) => record?.order?.customer_name || "N/A",
        },
        {
            title: "Phone",
            dataIndex: ["order", "phone_number"],
            key: "phone_number",
            render: (text, record) => {
                const phone = record?.order?.phone_number || "N/A";

                return (
                    <Space size="middle">
                        <span>{phone}</span>

                        <Tooltip title="Copy phone number">
                            <CopyOutlined style={{ fontSize: 18, color: "#1890ff", cursor: phone !== "N/A" ? "pointer" : "not-allowed" }} onClick={() => phone !== "N/A" && copyPhoneNo(phone)}/>
                        </Tooltip>

                        <Tooltip title="Open WhatsApp">
                            <WhatsAppOutlined style={{ fontSize: 18, color: "#25D366", cursor: phone !== "N/A" ? "pointer" : "not-allowed" }} onClick={() => phone !== "N/A" && openWhatsApp(phone)}/>
                        </Tooltip>
                    </Space>
                );
            },
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
        },
        {
            title: "Note",
            dataIndex: "note",
            key: "note",
            render: (text, record) => (
                <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: 8 }}>{text || "-"}</span>
                    <EditOutlined style={{ color: "#1677ff", cursor: "pointer" }} onClick={() => {handleNote(record)}}/>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status, record) => (
                <Tag style={{textTransform:"capitalize", cursor:"pointer"}} color={status === "approved" ? "green" : "red"} onClick={() => handleStatus(record)}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" onClick={() => handleCall(record.order.phone_number)}>
                        <PhoneOutlined />
                    </Button>
                    <Button type="default" size="small" onClick={() => handleConvert(record)}>
                        Convert Order
                    </Button>
                    <Button size="small" danger="danger" className="incomplete-delete" onClick={() => handleDelete(record.id)}>
                        {<DeleteOutlined />}
                    </Button>
                </Space>
            ),
        },
    ];

    const copyPhoneNo = (phone) => {
        navigator.clipboard.writeText(phone);
        
        messageApi.open({
            type: "success",
            content: "Phone number copied.",
        });

    };

    const openWhatsApp = (phone) => {
        if (!phone) return;

        const cleaned = phone.replace(/\D/g, "");

        const finalNumber = cleaned.startsWith("880") ? cleaned : `880${cleaned}`;

        window.open(`https://wa.me/${finalNumber}`, "_blank");
    };

    const handleInfoClick = (record) => {
        if (!record?.order) {
            
            messageApi.open({
                type: "success",
                content: "Order details not available yet.",
            });

            return;
        }

        setSelectedRecord(record);
        setIsModalOpen(true);
        setSelectedNoteRecord(record);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRecord(null);
    };

    const handleNote = (record) => {
        setEditModalOpen(true);
        setNoteValue(record.note);
        setFollowupDate(record.end_date);
        setSelectedNoteRecord(record);
    }

    const handleStatus = (record) => {
        setSelectedOrder(record);
        setNewStatus(record?.status);
        setIsStatusModalOpen(true);
    };

    // Fetch data with pagination
    const fetchFollowUpOrders = async (page = 1, pageSize = 25, status = null) => {
        setLoading(true);
        try {
            const params = { page, per_page: pageSize };

            if (status !== null) {
                params.status = status;
            }

            const res = await getDatas("/admin/followup", params);

            if (res && res.success) {
                setFollowUpOrders(res?.result?.data?.data || []);
                setOrderSummary(res?.result?.summary || {});
                setPagination({
                    current: res?.result?.data?.meta?.current_page,
                    pageSize: res?.result?.data?.meta?.per_page,
                    total: res?.result?.data?.meta?.total,
                });
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to fetch follow-up orders");
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = followUpOrders.filter((item) => {
        if (!searchText) return true;

        const key = searchText.toLowerCase();
        const order = item.order;

        return (
            order?.invoice_number?.toLowerCase().includes(key) || order?.phone_number?.toLowerCase().includes(key) || order?.customer_name?.toLowerCase().includes(key) || item?.note?.toLowerCase().includes(key) || String(item.order_id).includes(key)
        );
    });


    const handleCall = (phone) => {
        message.info(`Call ${phone} ...`);
    };

    const handleConvert = (record) => {
        const order = record.order || {};

        const name         = order.customer_name;
        const address      = order.address_details;
        const phone_number = order.phone_number;

        navigate("/order-add", {state: {name: name,address: address,phone_number: phone_number, is_follow_order:1}});
    };

    // On component mount
    useEffect(() => {
        fetchFollowUpOrders(pagination.current, pagination.pageSize);
    }, []);

    // Table pagination handler
    const handleTableChange = (pag) => {
        fetchFollowUpOrders(pag.current, pag.pageSize);
    };

    const handleUpdateNote = async () => {
        try {
            const payload = {
                id: selectedNoteRecord.id,
                end_date: followupDate,
                note: noteValue,
                _method: "PUT"
            };

            const res = await postData(`/admin/followup/${selectedNoteRecord.id}`, payload);

            if(res && res?.success){
                const refreshed = await getDatas("/admin/followup");
                setFollowUpOrders(refreshed?.result?.data || []);
                
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }

            setEditModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete orders?`
        );

        if (!confirmDelete) return;

        try {
            const res = await deleteData(`/admin/followup/${id}`);

            if(res && res?.success){
                fetchFollowUpOrders();

                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    const submitStatus = async () => {
        if (!newStatus || !selectedOrder) return;

        try {
            setStatusLoader(true);

            const res = await postData(`/admin/followup/${selectedOrder.id}/update-status`, {
                status: newStatus,
            });

            if (res.success) {
                
                messageApi.open({
                    type: "success",
                    content: "Status updated successfully",
                });

                setIsStatusModalOpen(false);

                fetchFollowUpOrders();
            } else {
                message.error(res.msg || "Failed to update status");
            }
        } catch (err) {
            console.error(err);
            message.error("Something went wrong!");
        }finally{
            setStatusLoader(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Follow Up Order List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Follow Up Order List" },
                        ]}
                    />
                </div>
            </div>

            <div className="incomplete-order-head">
                <AntInput.Search allowClear placeholder="Search by Invoice / Phone / Name" style={{ width: 300 }} onChange={(e) => setSearchText(e.target.value)}/>
                <Space>
                    <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <div className="page-item-data-wrapper" style={{marginBottom:10}}>
                <Space wrap size="middle">
                    <Button type={activeStatus === null ? "primary" : "default"} onClick={() => { setActiveStatus(null); fetchFollowUpOrders(1, 25, null); }}>
                        Total <span className="count-badge">{orderSummary.total}</span>
                    </Button>

                    <Button type={activeStatus === "pending" ? "primary" : "default"} onClick={() => { setActiveStatus("pending"); fetchFollowUpOrders(1, 25, "pending"); }}>
                        Pending <span className="count-badge">{orderSummary.pending}</span>
                    </Button>

                    <Button type={activeStatus === "approved" ? "primary" : "default"} onClick={() => { setActiveStatus("approved"); fetchFollowUpOrders(1, 25, "approved"); }}>
                        Approved <span className="count-badge">{orderSummary.approved}</span>
                    </Button>

                    <Button danger type={activeStatus === "canceled" ? "primary" : "default"} onClick={() => { setActiveStatus("cancelled"); fetchFollowUpOrders(1, 25, "cancelled"); }}>
                        Cancelled <span className="count-badge">{orderSummary.cancelled}</span>
                    </Button>
                </Space>
            </div>

            <Table rowKey="id" columns={columns} dataSource={filteredOrders} loading={loading}
                pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["10", "25", "50", "100"]}}
                onChange={handleTableChange}
            />

            <OrderInfoModal isOpen={isModalOpen} onClose={closeModal} data={selectedRecord}/>

            <Modal title="Edit Note" open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={handleUpdateNote}>
                <label><b>Followup Date:</b></label>
                <DatePicker style={{ width: "100%", marginBottom: "10px" }} value={followupDate ? dayjs(followupDate) : null} onChange={(date) => setFollowupDate(date ? date.format("YYYY-MM-DD") : "")}/>
                
                <label><b>Note:</b></label>
                <AntInput.TextArea rows={4} value={noteValue} onChange={(e) => setNoteValue(e.target.value)} placeholder="Write note..."/>
            </Modal>

            <Modal title={`Update Status for Order #${selectedOrder?.order_id || selectedOrder?.id}`} open={isStatusModalOpen} onCancel={() => setIsStatusModalOpen(false)} onOk={submitStatus} loading={statusLoader}>
                <Select  value={newStatus} onChange={(value) => setNewStatus(value)} style={{ width: 200 }}>
                    <Select.Option value="pending">Pending</Select.Option>
                    <Select.Option value="approved">Approved</Select.Option>
                    <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
            </Modal>
        </>
    );
}
