import { Link, useNavigate } from "react-router-dom";
import {InfoCircleOutlined, EditOutlined } from '@ant-design/icons'
import {Input, Breadcrumb, Table, Button, Space, message,Modal,DatePicker, Tag} from "antd";
import useTitle from "../../../hooks/useTitle";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";
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
            render: (text, record) => (
                <Space>
                    {text}
                    <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer" }} onClick={() => handleInfoClick(record)}/>
                </Space>
            ),
        },
        {
            title: "Customer",
            dataIndex: ["order", "customer_name"],
            key: "customer_name",
        },
        {
            title: "Phone",
            dataIndex: ["order", "phone_number"],
            key: "phone_number",
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
                <Tag style={{textTransform:"capitalize"}} color={status === "active" ? "green" : "red"} onClick={() => handleStatus(record)}>{status}</Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button type="primary" onClick={() => handleCall(record.order.phone_number)}>
                        Call
                    </Button>
                    <Button type="default" onClick={() => handleConvert(record)}>
                        Convert Order
                    </Button>
                </Space>
            ),
        },
    ];

    const handleInfoClick = (record) => {
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
        console.log(record);
    }

    // Fetch data with pagination
    const fetchFollowUpOrders = async (page = 1, pageSize = 25) => {
        setLoading(true);
        try {
            const res = await getDatas(`/admin/followup?page=${page}&per_page=${pageSize}`);
            if (res && res.success) {
                setFollowUpOrders(res.result.data);
                setPagination({
                    current: res.result.meta.current_page,
                    pageSize: res.result.meta.per_page,
                    total: res.result.meta.total,
                });
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to fetch follow-up orders");
        } finally {
            setLoading(false);
        }
    };

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

            <Table rowKey="id" columns={columns} dataSource={followUpOrders} loading={loading}
                pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["10", "25", "50", "100"]}}
                onChange={handleTableChange}
            />

            <OrderInfoModal isOpen={isModalOpen} onClose={closeModal} data={selectedRecord}/>

            <Modal title="Edit Note" open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={handleUpdateNote}>
                <label><b>Followup Date:</b></label>
                <DatePicker style={{ width: "100%", marginBottom: "10px" }} value={followupDate ? dayjs(followupDate) : null} onChange={(date) => setFollowupDate(date ? date.format("YYYY-MM-DD") : "")}/>
                
                <label><b>Note:</b></label>
                <Input.TextArea rows={4} value={noteValue} onChange={(e) => setNoteValue(e.target.value)} placeholder="Write note..."/>
            </Modal>
        </>
    );
}
