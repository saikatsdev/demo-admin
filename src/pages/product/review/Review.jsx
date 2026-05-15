import { ArrowLeftOutlined, PlusOutlined, MessageOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, UserOutlined, MailOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Radio, Modal, Popconfirm, Space, Table, Tag, message, Tooltip, Form, Typography,Card,Avatar,Rate,Badge} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle"
import { deleteData, getDatas, postData } from "../../../api/common/common";

const { Text, Paragraph, Title } = Typography;

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
    const [tableLoading, setTableLoading]     = useState(false);
    const [replyForm]                         = Form.useForm();

    // Method
    const getReviews = async () => {
        try {
            setTableLoading(true);
            const res = await getDatas("/admin/product/reviews");
            if (res && res.success) {
                setReviews(res?.result?.data || []);
            }
        } finally {
            setTableLoading(false);
        }
    }

    useEffect(() => {
        getReviews();
    }, []);

    const filteredData = reviews.filter(
        (item) => 
            item.name.toLowerCase().includes(query.toLowerCase()) || 
            item.product?.name?.toLowerCase().includes(query.toLowerCase()) || 
            item.review.toLowerCase().includes(query.toLowerCase())
    );

    const columns = [
        {
            title: "SL",
            dataIndex: "sl",
            key: "sl",
            render: (text, record, index) => <Text type="secondary">{index + 1}</Text>,
            width: 50,
        },
        {
            title: "Product",
            dataIndex: "product",
            key: "product",
            width: 250,
            render: (product) => (
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Avatar 
                        shape="square" 
                        size={48} 
                        src={product?.img_path} 
                        icon={<ShoppingOutlined />} 
                        style={{ backgroundColor: '#f5f5f5', border: '1px solid #f0f0f0' }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <Text strong style={{ display: "block", fontSize: "14px" }} ellipsis={{ tooltip: product?.name }}>
                            {product?.name || 'N/A'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                            SKU: {product?.sku || 'N/A'}
                        </Text>
                    </div>
                </div>
            )
        },
        {
            title: "Reviewer",
            key: "reviewer",
            width: 200,
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: '14px' }}>
                        <UserOutlined style={{ marginRight: 6, fontSize: '12px', color: '#bfbfbf' }} />
                        {record.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        <MailOutlined style={{ marginRight: 6, fontSize: '12px', color: '#bfbfbf' }} />
                        {record.email || 'No Email'}
                    </Text>
                </div>
            )
        },
        {
            title: "Content",
            key: "content",
            width: 350,
            render: (_, record) => (
                <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <Rate disabled defaultValue={Number(record.rating)} style={{ fontSize: '12px' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>({record.rating}/5)</Text>
                    </div>
                    <Paragraph 
                        ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                        style={{ marginBottom: record.review_reply ? 8 : 0, fontSize: '13px' }}
                    >
                        {record.review}
                    </Paragraph>

                    {record.review_reply && (
                        <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8, padding: '8px 12px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Badge status="success" />
                                <Text strong style={{ fontSize: '11px', color: '#52c41a', textTransform: 'uppercase' }}>
                                    Admin Reply
                                </Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                "{record.review_reply.reply}"
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
            width: 120,
            render: (status, record) => {
                let color = "orange";
                let icon = <ClockCircleOutlined />;
                if (status === "approved") { color = "green"; icon = <CheckCircleOutlined />; }
                if (status === "cancelled") { color = "red"; icon = <CloseCircleOutlined />; }
                
                return (
                    <Tooltip title="Click to change status">
                        <Tag 
                            icon={icon}
                            color={color} 
                            style={{ 
                                cursor: "pointer", 
                                borderRadius: '12px', 
                                padding: '2px 10px', 
                                fontWeight: 500,
                                textTransform: 'capitalize'
                            }} 
                            onClick={() => openStatusModal(record)}
                        >
                            {status}
                        </Tag>
                    </Tooltip>
                );
            }
        },
        {
            title: "Actions",
            key: "actions",
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Review">
                        <Button 
                            type="primary" 
                            ghost 
                            shape="circle" 
                            icon={<EditOutlined />} 
                            onClick={() => handleEdit(record.id)}
                        />
                    </Tooltip>

                    <Tooltip title="Reply to review">
                        <Button 
                            shape="circle" 
                            icon={<MessageOutlined />} 
                            onClick={() => handleReply(record.id)}
                        />
                    </Tooltip>

                    <Popconfirm 
                        title="Delete Review"
                        description="Are you sure you want to delete this review? This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes, Delete"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete Review">
                            <Button 
                                type="text" 
                                danger 
                                shape="circle" 
                                icon={<DeleteOutlined />} 
                            />
                        </Tooltip>
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
            messageApi.success(res.msg);
            getReviews();
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
                getReviews();
                setIsModalOpen(false);
                messageApi.success(res.msg);
            }
        } catch (error) {
            console.error(error);
        } finally {
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
            messageApi.success(res.msg);
            getReviews();
            setReplyOpen(false);
        }
    };

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            {contextHolder}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Product Reviews" },
                        ]}
                        style={{ marginBottom: '8px' }}
                    />
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                        <MessageOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                        Review Management
                        <Badge count={filteredData.length} style={{ backgroundColor: '#1890ff', marginLeft: '12px', verticalAlign: 'middle' }} overflowCount={999}/>
                    </Title>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Review</Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            {/* Main Content Card */}
            <Card className="shadow-sm" style={{ borderRadius: '12px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <AntInput 
                        placeholder="Search by customer name, product, or review content..." 
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        size="large"
                        allowClear
                        style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }}
                    />
                </div>

                <Table 
                    columns={columns} 
                    dataSource={filteredData} 
                    rowKey="id" 
                    loading={tableLoading}
                    pagination={{ 
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} reviews`
                    }}
                    style={{ borderRadius: '8px' }}
                />
            </Card>

            <Modal 
                title={<span><ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />Update Review Status</span>}
                open={isModalOpen} 
                onCancel={() => setIsModalOpen(false)} 
                footer={null}
                centered
                width={400}
            >
                <div style={{ padding: '10px 0' }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                        Select the new visibility status for this review:
                    </Text>
                    <Radio.Group 
                        value={newStatus} 
                        onChange={(e) => setNewStatus(e.target.value)} 
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <Radio value="pending" style={{ background: '#fff7e6', padding: '12px', borderRadius: '8px', border: '1px solid #ffd591', width: '100%' }}>
                            <Badge status="warning" text="Pending (Hidden from site)" />
                        </Radio>
                        <Radio value="approved" style={{ background: '#f6ffed', padding: '12px', borderRadius: '8px', border: '1px solid #b7eb8f', width: '100%' }}>
                            <Badge status="success" text="Approved (Visible on site)" />
                        </Radio>
                        <Radio value="cancelled" style={{ background: '#fff1f0', padding: '12px', borderRadius: '8px', border: '1px solid #ffa39e', width: '100%' }}>
                            <Badge status="error" text="Cancelled (Rejected)" />
                        </Radio>
                    </Radio.Group>

                    <div style={{ textAlign: "right", marginTop: '24px' }}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" onClick={handleStatusUpdate} loading={loading}>
                                Save Changes
                            </Button>
                        </Space>
                    </div>
                </div>
            </Modal>

            <Modal title={<span><MessageOutlined style={{ marginRight: 8, color: '#1890ff' }} />Admin Response</span>}
                open={replyOpen} 
                onCancel={() => setReplyOpen(false)} 
                onOk={() => replyForm.submit()} 
                okText="Submit Reply"
                centered
            >
                <Form form={replyForm} layout="vertical" onFinish={submitReply} style={{ marginTop: '16px' }}>
                    <Form.Item label="Your Reply" name="reply" rules={[{ required: true, message: "Please enter a response!" }]}>
                        <AntInput.TextArea rows={5} placeholder="Type your reply to the customer here..." style={{ borderRadius: '8px' }}/>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
