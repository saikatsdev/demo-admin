import { Link } from "react-router-dom";
import {InfoCircleOutlined, EditOutlined,WhatsAppOutlined,PhoneOutlined,CopyOutlined,DeleteOutlined,ArrowLeftOutlined } from '@ant-design/icons'
import {Input as AntInput, Breadcrumb, Table, Button, Space, message,Modal,DatePicker,Tooltip, Tag, Select} from "antd";
import useTitle from "../../../hooks/useTitle";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";
import OrderInfoModal from "./OrderInfoModal";

export default function Feedback() {
    // Hook
    useTitle("All Feedback Order");

    // State
    const [feedbackOrders, setFeedbackOrders]         = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [pagination, setPagination]                 = useState({current: 1,pageSize: 25,total: 0});
    const [editModalOpen, setEditModalOpen]           = useState(false);
    const [noteValue, setNoteValue]                   = useState("");
    const [feedbackDate, setFeedbackDate]             = useState("");
    const [selectedRecord, setSelectedRecord]         = useState(null);
    const [selectedNoteRecord, setSelectedNoteRecord] = useState(null);
    const [isModalOpen, setIsModalOpen]               = useState(false);
    const [messageApi, contextHolder]                 = message.useMessage();
    const [isStatusModalOpen, setIsStatusModalOpen]   = useState(false);
    const [selectedOrder, setSelectedOrder]           = useState(null);
    const [newStatus, setNewStatus]                   = useState("");
    const [statusLoader, setStatusLoader]             = useState(false);

    // Columns for AntD Table
    const columns = 
    [
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
        setFeedbackDate(record.end_date);
        setSelectedNoteRecord(record);
    }

    const handleStatus = (record) => {
        setSelectedOrder(record);
        setNewStatus(record?.status);
        setIsStatusModalOpen(true);
    };

    // Fetch data with pagination
    const fetchFeedbackOrders = async (page = 1, pageSize = 25, status = null) => {
        setLoading(true);
        try {
            const params = { page, per_page: pageSize };

            if (status !== null) {
                params.status = status;
            }

            const res = await getDatas("/admin/feedback", params);

            if (res && res.success) {
                setFeedbackOrders(res?.result?.data || []);

                setPagination({
                    current: res?.result?.meta?.current_page,
                    pageSize: res?.result?.meta?.per_page,
                    total: res?.result?.meta?.total,
                });
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to fetch feedback orders");
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone) => {
        message.info(`Call ${phone} ...`);
    };

    useEffect(() => {
        fetchFeedbackOrders(pagination.current, pagination.pageSize);
    }, []);

    // Table pagination handler
    const handleTableChange = (pag) => {
        fetchFeedbackOrders(pag.current, pag.pageSize);
    };

    const handleUpdateNote = async () => {
        try {
            const formData = new FormData();
            formData.append("end_date", feedbackDate);
            formData.append("note", noteValue);
            formData.append("_method", "PUT");

            const res = await postData(`/admin/feedback/${selectedNoteRecord.id}`, formData);

            if(res && res?.success){
                fetchFeedbackOrders();
                
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

    const submitStatus = async () => {
        if (!newStatus || !selectedOrder) return;

        try {
            setStatusLoader(true);

            const res = await postData(`/admin/feedback/${selectedOrder.id}/update-status`, {
                status: newStatus,
            });

            if (res.success) {
                
                messageApi.open({
                    type: "success",
                    content: "Status updated successfully",
                });

                setIsStatusModalOpen(false);

                fetchFeedbackOrders();
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
                    <h1 className="title">Feedback Order List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Feedback Order List" },
                        ]}
                    />
                </div>
            </div>

            <div className="incomplete-order-head">
                <AntInput.Search allowClear placeholder="Search by Invoice / Phone / Name" style={{ width: 300 }}/>
                <Space>
                    <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <Table rowKey="id" columns={columns} dataSource={feedbackOrders} loading={loading}
                pagination={{ 
                    current: pagination.current, 
                    pageSize: pagination.pageSize, 
                    total: pagination.total, 
                    showSizeChanger: true, 
                    pageSizeOptions: ["10", "25", "50", "100"]}}
                onChange={handleTableChange}
            />

            <OrderInfoModal isOpen={isModalOpen} onClose={closeModal} data={selectedRecord}/>

            <Modal title="Edit Note" open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={handleUpdateNote}>
                <label><b>Feedback Date:</b></label>
                <DatePicker style={{ width: "100%", marginBottom: "10px" }} value={feedbackDate ? dayjs(feedbackDate) : null} onChange={(date) => setFeedbackDate(date ? date.format("YYYY-MM-DD") : "")}/>
                
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
