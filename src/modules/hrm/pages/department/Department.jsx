import {ApartmentOutlined,ArrowLeftOutlined,DeleteOutlined,EditOutlined,PlusOutlined,ReloadOutlined,SearchOutlined,TeamOutlined} from "@ant-design/icons";
import {Avatar, Breadcrumb, Button, Card, Col, Form, Input, message, Modal,Popconfirm, Row, Select, Space, Table, Tag, Tooltip, Typography} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData, putData } from "../../../../api/common/common";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";

const { Text } = Typography;

const getResponseMessage = (response, fallback) => {
    const validationMessage = Object.values(response?.errors || {})?.[0]?.[0];
    return validationMessage || response?.msg || response?.message || fallback;
};

export default function Department() {
    useTitle("All Departments");

    const { can }                     = usePermission();
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const [departments, setDepartments]             = useState([]);
    const [headOptions, setHeadOptions]             = useState([]);
    const [loading, setLoading]                     = useState(false);
    const [submitting, setSubmitting]               = useState(false);
    const [isModalOpen, setIsModalOpen]             = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [query, setQuery]                         = useState("");
    const [debouncedQuery, setDebouncedQuery]       = useState("");
    const [status, setStatus]                       = useState();
    const [pagination, setPagination]               = useState({ current: 1, pageSize: 20, total: 0 });

    const canCreate = can("departments-create");
    const canUpdate = can("departments-update");
    const canDelete = can("departments-delete");

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => window.clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        setPagination((current) => ({ ...current, current: 1 }));
    }, [debouncedQuery, status]);

    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getDatas("/admin/departments", {
                page         : pagination.current,
                paginate_size: pagination.pageSize,
                search_key   : debouncedQuery || undefined,
                status       : status || undefined,
            });

            if (!response?.success) {
                messageApi.error(getResponseMessage(response, "Unable to load departments"));
                return;
            }

            const result = response?.result || {};
            const meta = result?.meta || {};
            setDepartments(result?.data || []);
            setPagination((current) => ({
                ...current,
                current: meta.current_page || current.current,
                pageSize: Number(meta.per_page) || current.pageSize,
                total: Number(meta.total) || 0,
            }));
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, messageApi, pagination.current, pagination.pageSize, status]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    useEffect(() => {
        let active = true;
        const fetchHeads = async () => {
            const response = await getDatas("/admin/users/list");
            if (!active || !response?.success) return;

            const users = Array.isArray(response?.result) ? response.result : response?.result?.data || [];
            setHeadOptions(users.map((user) => ({
                value: user.id,
                label: user.username || user.name || user.phone_number || `User #${user.id}`,
            })));
        };

        fetchHeads();
        return () => { active = false; };
    }, []);

    const parentOptions = useMemo(() => departments
        .filter((department) => department.id !== editingDepartment?.id)
        .map((department) => ({
            value: department.id,
            label: `${department.name} (${department.code})`,
        })), [departments, editingDepartment?.id]);

    const openCreate = () => {
        setEditingDepartment(null);
        form.resetFields();
        form.setFieldsValue({ status: "active" });
        setIsModalOpen(true);
    };

    const openEdit = (department) => {
        setEditingDepartment(department);
        form.setFieldsValue({
            code        : department.code,
            name        : department.name,
            parent_id   : department.parent_id || undefined,
            head_user_id: department.head_user_id || undefined,
            status      : department.status,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) return;
        setIsModalOpen(false);
        setEditingDepartment(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const payload = {
            code        : values.code.trim(),
            name        : values.name.trim(),
            parent_id   : values.parent_id || null,
            head_user_id: values.head_user_id || null,
            status      : values.status,
        };

        setSubmitting(true);
        try {
            const response = editingDepartment ? await putData(`/admin/departments/${editingDepartment.id}`, payload) : await postData("/admin/departments", payload);

            if (!response?.success) {
                messageApi.error(getResponseMessage(response, "Unable to save department"));
                return;
            }

            messageApi.success(response?.msg || `Department ${editingDepartment ? "updated" : "created"} successfully`);
            setIsModalOpen(false);
            setEditingDepartment(null);
            form.resetFields();
            await fetchDepartments();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const response = await deleteData(`/admin/departments/${id}`);
        if (!response?.success) {
            messageApi.error(getResponseMessage(response, "Unable to delete department"));
            return;
        }

        messageApi.success(response?.msg || "Department deleted successfully");
        if (departments.length === 1 && pagination.current > 1) {
            setPagination((current) => ({ ...current, current: current.current - 1 }));
        } else {
            await fetchDepartments();
        }
    };

    const columns = 
    [
        {
            title: "SL",
            width: 70,
            render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
        },
        {
            title: "Department",
            key: "department",
            width: 240,
            render: (_, record) => (
                <Space size={10}>
                    <Avatar shape="square" icon={<ApartmentOutlined />} style={{ background: "#e6f4ff", color: "#1677ff" }} />
                    <div>
                        <Text strong>{record.name}</Text>
                        <div><Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text></div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Parent Department",
            key: "parent",
            width: 190,
            render: (_, record) => record.parent?.name || <Text type="secondary">Root department</Text>,
        },
        {
            title: "Department Head",
            key: "head",
            width: 210,
            render: (_, record) => record.head ? (
                <Space size={8}>
                    <Avatar size="small" icon={<TeamOutlined />} />
                    <div>
                        <div>{record.head.username}</div>
                        {record.head.phone_number && <Text type="secondary" style={{ fontSize: 11 }}>{record.head.phone_number}</Text>}
                    </div>
                </Space>
            ) : <Text type="secondary">Not assigned</Text>,
        },
        {
            title: "Sub-departments",
            dataIndex: "children_count",
            key: "children_count",
            width: 150,
            align: "center",
            render: (count = 0) => <Tag color="blue">{count}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: (value) => (
                <Tag color={value === "active" ? "green" : value === "draft" ? "gold" : "default"} style={{ textTransform: "capitalize" }}>
                    {value || "N/A"}
                </Tag>
            ),
        },
        (canUpdate || canDelete) && {
            title: "Action",
            key: "action",
            width: 115,
            fixed: "right",
            render: (_, record) => (
                <Space size={4}>
                    {canUpdate && (
                        <Tooltip title="Edit department">
                            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Delete department?"
                            description="Its child departments will become root departments."
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Tooltip title="Delete department"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ].filter(Boolean);

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left"><h1 className="title">Departments</h1></div>
                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "HRM" },
                        { title: "Departments" },
                    ]} />
                </div>
            </div>

            <Card styles={{ body: { padding: 18 } }}>
                <Row gutter={[12, 12]} justify="space-between" align="middle" style={{ marginBottom: 18 }}>
                    <Col xs={24} lg={15}>
                        <Space wrap>
                            <Input
                                allowClear
                                prefix={<SearchOutlined />}
                                placeholder="Search by department name or code"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                style={{ width: 300 }}
                            />
                            <Select
                                allowClear
                                placeholder="All statuses"
                                value={status}
                                onChange={setStatus}
                                style={{ width: 150 }}
                                options={[
                                    { value: "active", label: "Active" },
                                    { value: "inactive", label: "Inactive" },
                                    { value: "draft", label: "Draft" },
                                ]}
                            />
                            <Tooltip title="Refresh"><Button icon={<ReloadOutlined />} loading={loading} onClick={fetchDepartments} /></Tooltip>
                        </Space>
                    </Col>
                    <Col xs={24} lg={9} style={{ textAlign: "right" }}>
                        <Space>
                            {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Department</Button>}
                            <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                        </Space>
                    </Col>
                </Row>

                <Table
                    rowKey="id"
                    bordered
                    loading={loading}
                    columns={columns}
                    dataSource={departments}
                    scroll={{ x: 1085 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} departments`,
                        onChange: (current, pageSize) => setPagination((previous) => ({ ...previous, current, pageSize })),
                    }}
                />
            </Card>

            <Modal
                destroyOnHidden
                open={isModalOpen}
                title={editingDepartment ? "Edit Department" : "Create Department"}
                okText={editingDepartment ? "Update Department" : "Create Department"}
                confirmLoading={submitting}
                onOk={handleSubmit}
                onCancel={closeModal}
                width={720}
            >
                <Form form={form} layout="vertical" requiredMark="optional" style={{ marginTop: 20 }}>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="code" label="Department Code" rules={[{ required: true, whitespace: true, message: "Department code is required" }]}>
                                <Input placeholder="e.g. SALES" maxLength={100} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="name" label="Department Name" rules={[{ required: true, whitespace: true, message: "Department name is required" }]}>
                                <Input placeholder="e.g. Sales" maxLength={255} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="parent_id" label="Parent Department">
                                <Select allowClear showSearch optionFilterProp="label" placeholder="Select parent department" options={parentOptions} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="head_user_id" label="Department Head">
                                <Select allowClear showSearch optionFilterProp="label" placeholder="Select department head" options={headOptions} />
                            </Form.Item>
                        </Col>
                        
                        <Col xs={24} md={12}>
                            <Form.Item name="status" label="Status" rules={[{ required: true, message: "Status is required" }]}>
                                <Select options={[
                                    { value: "active", label: "Active" },
                                    { value: "inactive", label: "Inactive" },
                                    { value: "draft", label: "Draft" },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}
