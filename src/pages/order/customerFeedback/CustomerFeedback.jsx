import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./CustomerFeedback.css";

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

export default function CustomerFeedback() {
    useTitle("All Customer Feedback");

    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
    });

    const getFeedbacks = async (page = pagination.current, pageSize = pagination.pageSize) => {
        try {
            setLoading(true);

            const res = await getDatas("/admin/customer/feedback", {
                page,
                paginate_size: pageSize,
            });

            if (res?.success) {
                const result = res.result || {};
                setFeedbacks(result.data || []);
                setPagination({
                    current: result.current_page || page,
                    pageSize: result.per_page || pageSize,
                    total: result.total || 0,
                });
            }
        } catch (error) {
            console.error(error);
            message.error("Failed to fetch customer feedback list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getFeedbacks(1, DEFAULT_PAGE_SIZE);
    }, []);

    const filteredFeedbacks = useMemo(() => {
        if (!searchQuery.trim()) return feedbacks;

        const query = searchQuery.trim().toLowerCase();
        return feedbacks.filter((item) =>
            item.title?.toLowerCase().includes(query) ||
            item.slug?.toLowerCase().includes(query) ||
            item.status?.toLowerCase().includes(query)
        );
    }, [feedbacks, searchQuery]);

    const activeCount = feedbacks.filter((item) => item.status === "active").length;
    const inactiveCount = feedbacks.filter((item) => item.status === "inactive").length;

    const openCreate = () => {
        setEditingItem(null);
        form.resetFields();
        form.setFieldsValue({ status: "active" });
        setIsModalOpen(true);
    };

    const onEdit = (record) => {
        setEditingItem(record);
        form.setFieldsValue({
            title: record.title,
            status: record.status || "active",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitLoading(true);

            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("status", values.status);

            if (editingItem?.id) formData.append("_method", "PUT");

            const url = editingItem?.id
                ? `/admin/customer/feedback/${editingItem.id}`
                : "/admin/customer/feedback";

            const res = await postData(url, formData);

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg || (editingItem ? "Feedback updated successfully" : "Feedback created successfully"),
                });
                setIsModalOpen(false);
                form.resetFields();
                getFeedbacks(pagination.current, pagination.pageSize);
            } else {
                message.error(res?.msg || "Something went wrong");
            }
        } catch (error) {
            if (error?.errorFields) return;
            console.error(error);
            message.error("Something went wrong");
        } finally {
            setSubmitLoading(false);
        }
    };

    const onDelete = async (id) => {
        try {
            const res = await deleteData(`/admin/customer/feedback/${id}`);

            if (res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg || "Feedback deleted successfully",
                });
                getFeedbacks(pagination.current, pagination.pageSize);
            } else {
                message.error(res?.msg || "Failed to delete feedback");
            }
        } catch (error) {
            console.error(error);
            message.error("Something went wrong while deleting");
        }
    };

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 70,
            align: "center",
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (text) => <span className="customer-feedback-title">{text || "N/A"}</span>,
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
            render: (text) => <span className="customer-feedback-slug">{text || "N/A"}</span>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            align: "center",
            width: 120,
            render: (status) => (
                <Tag
                    color={status === "active" ? "success" : "default"}
                    style={{ textTransform: "capitalize", borderRadius: 10, padding: "2px 12px", fontWeight: 500, margin: 0 }}
                >
                    {status || "N/A"}
                </Tag>
            ),
        },
        {
            title: "Action",
            key: "action",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: "#1C558B" }} />}
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this feedback?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => onDelete(record.id)}
                    >
                        <Tooltip title="Delete">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleTableChange = (pag) => {
        getFeedbacks(pag.current, pag.pageSize);
    };

    return (
        <div className="customer-feedback-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Customer Feedback List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Customer Feedback List" },
                        ]}
                    />
                </div>
            </div>

            <div className="customer-feedback-stats">
                <Card className="customer-feedback-stat-card" bordered={false}>
                    <div className="customer-feedback-stat-label">Total Feedback</div>
                    <div className="customer-feedback-stat-value">{pagination.total}</div>
                </Card>
                <Card className="customer-feedback-stat-card" bordered={false}>
                    <div className="customer-feedback-stat-label">Active</div>
                    <div className="customer-feedback-stat-value" style={{ color: "#52c41a" }}>{activeCount}</div>
                </Card>
                <Card className="customer-feedback-stat-card" bordered={false}>
                    <div className="customer-feedback-stat-label">Inactive</div>
                    <div className="customer-feedback-stat-value" style={{ color: "#8c8c8c" }}>{inactiveCount}</div>
                </Card>
            </div>

            <div className="customer-feedback-toolbar">
                <div className="customer-feedback-toolbar-inner">
                    <Input
                        allowClear
                        placeholder="Search title, slug, or status..."
                        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                        className="customer-feedback-search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <Space wrap>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className="customer-feedback-btn-primary"
                            onClick={openCreate}
                        >
                            Add Feedback
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => getFeedbacks(pagination.current, pagination.pageSize)}
                            loading={loading}
                            style={{ borderRadius: 8 }}
                        >
                            Refresh
                        </Button>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => window.history.back()}
                            style={{ borderRadius: 8 }}
                        >
                            Back
                        </Button>
                    </Space>
                </div>
            </div>

            <div className="customer-feedback-table-card">
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredFeedbacks}
                    loading={loading}
                    bordered
                    scroll={{ x: 760 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        pageSizeOptions: PAGE_SIZE_OPTIONS,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    }}
                    onChange={handleTableChange}
                />
            </div>

            <Modal
                title={editingItem ? "Edit Customer Feedback" : "Create Customer Feedback"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText={editingItem ? "Update" : "Create"}
                confirmLoading={submitLoading}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: "Please enter feedback title" }]}
                    >
                        <Input placeholder="Enter feedback title" />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true, message: "Please select status" }]}
                        initialValue="active"
                    >
                        <Select
                            options={[
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "Inactive" },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
