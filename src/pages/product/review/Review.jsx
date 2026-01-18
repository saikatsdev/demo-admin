import { ArrowLeftOutlined, PlusOutlined, MessageOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Radio, Modal, Popconfirm, Space, Table, Tag, message,Tooltip,Form,Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle"
import { deleteData, getDatas, postData } from "../../../api/common/common";

const { Text, Paragraph } = Typography;

export default function Review() {
    // Hook
    useTitle("Product Review");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]                   = useState("");
    const [reviews, setReviews]               = useState([]);
    const [messageApi, contextHolder]         = message.useMessage();
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [newStatus, setNewStatus]           = useState("");
    const [loading, setLoading]               = useState(false);
    const [replyOpen, setReplyOpen]           = useState(false);
    const [reviewId, setReviewId]             = useState(null);
    const [replyForm]                         = Form.useForm();

    // Method
    useEffect(() => {
        const getReviews = async () => {
            const res = await getDatas("/admin/product/reviews");

            if(res && res.success){
                setReviews(res?.result?.data || []);
            }
        }

        getReviews();
    }, []);

    const filteredData = reviews.filter(
        (item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.product?.name.toLowerCase().includes(query.toLowerCase()) || item.review.toLowerCase().includes(query.toLowerCase())
    );

    const columns = 
    [
        {
            title: "SL",
            dataIndex: "sl",
            key: "sl",
            render: (text, record, index) => index + 1,
            width: 60,
        },
        {
            title: "Review Image",
            dataIndex: "img_path",
            key: "img_path",
            render: (img) => (
                <img src={img} alt="Review" style={{width: 50,height: 50,objectFit: "cover",borderRadius: 6,border: "1px solid #e5e7eb"}}/>
            ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Product",
            dataIndex: "product",
            key: "product",
            render: (product) => (
                <div style={{ display: "flex", alignItems: "center" }}>
                    <img src={product?.img_path} alt={product?.name} style={{width: 40,height: 40,borderRadius: 4,marginRight: 8}}/>
                    {product?.name}
                </div>
            )
        },
        {
            title: "Rating",
            dataIndex: "rating",
            key: "rating",
            render: (rating = 0) => (
                <span style={{ fontSize: 16 }}>
                    <span style={{ color: "#F59E0B", fontWeight: "bold" }}>
                        {"★".repeat(rating)}
                    </span>
                    <span style={{ color: "#D1D5DB" }}>
                        {"☆".repeat(5 - rating)}
                    </span>
                </span>
            ),
        },
        {
            title: "Review",
            key: "review",
            render: (_, record) => (
                <div>
                    <Paragraph style={{ marginBottom: record.review_reply ? 8 : 0 }}>
                        {record.review}
                    </Paragraph>

                    {record.review_reply && (
                        <div style={{background: "#f6ffed",border: "1px solid #b7eb8f",borderRadius: 6,padding: 10}}>
                            <Tag color="green" style={{ marginBottom: 6 }}>
                                Admin Reply
                            </Tag>

                            <Text type="secondary">
                                {record.review_reply.reply}
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status, record) => (
                <Tag color={status === "approved" ? "green" : status === "cancelled" ? "red" : "orange"} style={{ cursor: "pointer" }} onClick={() => openStatusModal(record)}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" onClick={() => handleEdit(record.id)}>
                        Edit
                    </Button>

                    <Tooltip title="Reply to review">
                        <Button size="small" icon={<MessageOutlined />} onClick={() => handleReply(record.id)}/>
                    </Tooltip>

                    <Popconfirm title="Are you sure delete this review?" okText="Yes" cancelText="No" onConfirm={() => handleDelete(record.id)}>
                        <Button type="primary" danger size="small">
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        }
    ];

    const handleEdit = (id) => {
        navigate(`/edit/review/${id}`);
    }

    const handleDelete = async (id) => {
        const res = await deleteData(`/admin/product/reviews/${id}`);
        if (res && res?.success) {
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            const refreshed = await getDatas("/admin/product/reviews");
            setReviews(refreshed?.result?.data || [])
        }
    }

    const openCreate = () => {
        navigate("/add/review");
    }

    const openStatusModal = (record) => {
        setSelectedReview(record);
        setNewStatus(record.status);
        setIsModalOpen(true);
    };

    const handleReply = (id) => {
        setReviewId(id);
        setReplyOpen(true);
        replyForm.resetFields();
    };


    const handleStatusUpdate = async () => {
        if (!selectedReview) return;

        const payload = {
            id: selectedReview.id,
            status: newStatus,
        };

        try {
            setLoading(true);
            const res = await postData("/admin/product/reviews/status/update", payload);
            if(res && res?.success){
                const refreshed = await getDatas("/admin/product/reviews");

                if(refreshed && refreshed.success){
                    setReviews(refreshed?.result?.data || []);
                }
                setIsModalOpen(false);

                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.error(error);
        }finally{
            setLoading(false);
        }
    };

    const submitReply = async (values) => {
        const payload = {
            review_id: reviewId,
            reply: values.reply,
        };

        const res = await postData("/admin/reply/review", payload);

        if (res && res?.success) {
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            const refreshed = await getDatas("/admin/product/reviews");
            setReviews(refreshed?.result?.data || [])

            setReplyOpen(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Reviews</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Reviews" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table columns={columns} dataSource={filteredData} rowKey="id" bordered pagination={{ pageSize: 10 }}/>

            <Modal title="Update Review Status" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
                <Radio.Group value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ marginBottom: 20 }}>
                    <Radio value="pending">Pending</Radio>
                    <Radio value="approved">Approved</Radio>
                    <Radio value="cancelled">Cancelled</Radio>
                </Radio.Group>

                <div style={{ textAlign: "right" }}>
                    <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={handleStatusUpdate}>
                        {loading ? "Updating..." : "Update"}
                    </Button>
                </div>
            </Modal>

            <Modal title="Reply to Review" open={replyOpen} onCancel={() => setReplyOpen(false)} onOk={() => replyForm.submit()} okText="Reply">
                <Form form={replyForm} layout="vertical" onFinish={submitReply}>
                    <Form.Item label="Reply" name="reply" rules={[{ required: true, message: "Reply is required!" }]}>
                        <AntInput.TextArea rows={4} placeholder="Write your reply..." />
                    </Form.Item>
                </Form>
            </Modal>

        </>
    )
}
