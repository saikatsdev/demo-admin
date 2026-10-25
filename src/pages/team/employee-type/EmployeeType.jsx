import {ArrowLeftOutlined,DeleteOutlined,EditOutlined,PlusOutlined,ReloadOutlined,SearchOutlined,SolutionOutlined} from "@ant-design/icons";
import {Avatar,Breadcrumb,Button,Card,Col,Form,Input,message,Modal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,Typography} from "antd";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData, putData } from "../../../api/common/common";
import { usePermission } from "../../../hooks/usePermission";
import useTitle from "../../../hooks/useTitle";

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

const getResponseMessage = (response, fallback) => {
    const validationMessage = Object.values(response?.errors || {})?.[0]?.[0];
    return validationMessage || response?.msg || response?.message || fallback;
};

export default function EmployeeType() {
    useTitle("All Employment Types");

    const { can }                                           = usePermission();
    const [form]                                            = Form.useForm();
    const [messageApi, contextHolder]                       = message.useMessage();
    const [employmentTypes, setEmploymentTypes]             = useState([]);
    const [loading, setLoading]                             = useState(false);
    const [submitting, setSubmitting]                       = useState(false);
    const [isModalOpen, setIsModalOpen]                     = useState(false);
    const [editingEmploymentType, setEditingEmploymentType] = useState(null);
    const [query, setQuery]                                 = useState("");
    const [debouncedQuery, setDebouncedQuery]               = useState("");
    const [status, setStatus]                               = useState();
    const [pagination, setPagination]                       = useState({ current: 1, pageSize: 20, total: 0 });

    const canCreate = can("employment-types-create");
    const canUpdate = can("employment-types-update");
    const canDelete = can("employment-types-delete");

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => window.clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        setPagination((current) => ({ ...current, current: 1 }));
    }, [debouncedQuery, status]);

    const fetchEmploymentTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getDatas("/admin/employment-types", {
                page         : pagination.current,
                paginate_size: pagination.pageSize,
                search_key   : debouncedQuery || undefined,
                status       : status || undefined,
            });

            if (!response?.success) {
                messageApi.error(getResponseMessage(response, "Unable to load employment types"));
                return;
            }

            const result = response?.result || {};
            const meta   = result?.meta || {};

            setEmploymentTypes(result?.data || []);
            setPagination((current) => ({
                ...current,
                current : meta.current_page || current.current,
                pageSize: Number(meta.per_page) || current.pageSize,
                total   : Number(meta.total) || 0,
            }));
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, messageApi, pagination.current, pagination.pageSize, status]);

    useEffect(() => {
        fetchEmploymentTypes();
    }, [fetchEmploymentTypes]);

    const openCreate = () => {
        setEditingEmploymentType(null);
        form.resetFields();
        form.setFieldsValue({ status: "active" });
        setIsModalOpen(true);
    };

    const openEdit = (employmentType) => {
        setEditingEmploymentType(employmentType);
        form.setFieldsValue({
            code       : employmentType.code,
            name       : employmentType.name,
            description: employmentType.description,
            status     : employmentType.status,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) return;

        setIsModalOpen(false);
        setEditingEmploymentType(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const payload = {
            code       : values.code.trim(),
            name       : values.name.trim(),
            description: values.description?.trim() || null,
            status     : values.status,
        };

        setSubmitting(true);
        try {
            const response = editingEmploymentType ? await putData(`/admin/employment-types/${editingEmploymentType.id}`, payload) : await postData("/admin/employment-types", payload);

            if (!response?.success) {
                messageApi.error(getResponseMessage(response, "Unable to save employment type"));
                return;
            }

            messageApi.success(response?.msg || `Employment type ${editingEmploymentType ? "updated" : "created"} successfully`);
            setIsModalOpen(false);
            setEditingEmploymentType(null);
            form.resetFields();
            await fetchEmploymentTypes();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const response = await deleteData(`/admin/employment-types/${id}`);

        if (!response?.success) {
            messageApi.error(getResponseMessage(response, "Unable to delete employment type"));
            return;
        }

        messageApi.success(response?.msg || "Employment type deleted successfully");

        if (employmentTypes.length === 1 && pagination.current > 1) {
            setPagination((current) => ({ ...current, current: current.current - 1 }));
        } else {
            await fetchEmploymentTypes();
        }
    };

    const columns = [
        {
            title: "SL",
            width: 70,
            render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
        },
        {
            title: "Employment Type",
            key: "employment_type",
            width: 280,
            render: (_, record) => (
                <Space size={10}>
                    <Avatar shape="square" icon={<SolutionOutlined />} style={{ background: "#f6ffed", color: "#52c41a" }} />
                    <div>
                        <Text strong>{record.name}</Text>
                        <div><Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text></div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (value) => value ? (
                <Paragraph ellipsis={{ rows: 2, tooltip: value }} style={{ marginBottom: 0, maxWidth: 520 }}>{value}</Paragraph>
            ) : <Text type="secondary">No description</Text>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
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
                        <Tooltip title="Edit employment type">
                            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Delete employment type?"
                            description="This action cannot be undone."
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Tooltip title="Delete employment type"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip>
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
                <div className="head-left"><h1 className="title">Employment Types</h1></div>
                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "HRM" },
                        { title: "Employment Types" },
                    ]} />
                </div>
            </div>

            <Card styles={{ body: { padding: 18 } }}>
                <Row gutter={[12, 12]} justify="space-between" align="middle" style={{ marginBottom: 18 }}>
                    <Col xs={24} lg={16}>
                        <Space wrap>
                            <Input
                                allowClear
                                prefix={<SearchOutlined />}
                                placeholder="Search by employment type name or code"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                style={{ width: 320 }}
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
                            <Tooltip title="Refresh"><Button icon={<ReloadOutlined />} loading={loading} onClick={fetchEmploymentTypes} /></Tooltip>
                        </Space>
                    </Col>
                    <Col xs={24} lg={8} style={{ textAlign: "right" }}>
                        <Space>
                            {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Employment Type</Button>}
                            <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                        </Space>
                    </Col>
                </Row>

                <Table
                    rowKey="id"
                    bordered
                    loading={loading}
                    columns={columns}
                    dataSource={employmentTypes}
                    scroll={{ x: 900 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employment types`,
                        onChange: (current, pageSize) => setPagination((previous) => ({ ...previous, current, pageSize })),
                    }}
                />
            </Card>

            <Modal
                destroyOnHidden
                open={isModalOpen}
                title={editingEmploymentType ? "Edit Employment Type" : "Create Employment Type"}
                okText={editingEmploymentType ? "Update Employment Type" : "Create Employment Type"}
                confirmLoading={submitting}
                onOk={handleSubmit}
                onCancel={closeModal}
                width={720}
            >
                <Form form={form} layout="vertical" requiredMark="optional" style={{ marginTop: 20 }}>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="code" label="Employment Type Code" rules={[{ required: true, whitespace: true, message: "Employment type code is required" }]}>
                                <Input placeholder="e.g. PERMANENT" maxLength={100} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="name" label="Employment Type Name" rules={[{ required: true, whitespace: true, message: "Employment type name is required" }]}>
                                <Input placeholder="e.g. Permanent" maxLength={255} />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="description" label="Description">
                                <TextArea placeholder="Describe this employment type" rows={4} maxLength={1000} showCount />
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
