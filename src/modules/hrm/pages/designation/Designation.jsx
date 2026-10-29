import {ArrowLeftOutlined,DeleteOutlined,EditOutlined,IdcardOutlined,PlusOutlined,ReloadOutlined,SearchOutlined} from "@ant-design/icons";
import {Avatar,Breadcrumb,Button,Card,Col,Form,Input,message,Modal,Popconfirm,Row,Select,Space,Table,Tag,Tooltip,Typography} from "antd";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData, putData } from "../../../../api/common/common";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";

const { Text } = Typography;

const getResponseMessage = (response, fallback) => {
    const validationMessage = Object.values(response?.errors || {})?.[0]?.[0];
    return validationMessage || response?.msg || response?.message || fallback;
};

export default function Designation() {
    useTitle("All Designations");

    const { can }                     = usePermission();
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const [designations, setDesignations]             = useState([]);
    const [departmentOptions, setDepartmentOptions]   = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [submitting, setSubmitting]                 = useState(false);
    const [isModalOpen, setIsModalOpen]               = useState(false);
    const [editingDesignation, setEditingDesignation] = useState(null);
    const [query, setQuery]                           = useState("");
    const [debouncedQuery, setDebouncedQuery]         = useState("");
    const [status, setStatus]                         = useState();
    const [departmentId, setDepartmentId]             = useState();
    const [pagination, setPagination]                 = useState({ current: 1, pageSize: 20, total: 0 });

    const canCreate = can("designations-create");
    const canUpdate = can("designations-update");
    const canDelete = can("designations-delete");

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => window.clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        setPagination((current) => ({ ...current, current: 1 }));
    }, [debouncedQuery, departmentId, status]);

    const fetchDesignations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getDatas("/admin/designations", {
                page         : pagination.current,
                paginate_size: pagination.pageSize,
                search_key   : debouncedQuery || undefined,
                department_id: departmentId || undefined,
                status       : status || undefined,
            });

            if (!response?.success) {
                messageApi.error(getResponseMessage(response, "Unable to load designations"));
                return;
            }

            const result = response?.result || {};
            const meta   = result?.meta || {};

            setDesignations(result?.data || []);
            setPagination((current) => ({
                ...current,
                current : meta.current_page || current.current,
                pageSize: Number(meta.per_page) || current.pageSize,
                total   : Number(meta.total) || 0,
            }));
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, departmentId, messageApi, pagination.current, pagination.pageSize, status]);

    useEffect(() => {
        fetchDesignations();
    }, [fetchDesignations]);

    useEffect(() => {
        let active = true;

        const fetchDepartments = async () => {
            const response = await getDatas("/admin/departments", {
                paginate_size: 100,
                status       : "active",
            });

            if (!active || !response?.success) return;

            const departments = response?.result?.data || [];
            setDepartmentOptions(departments.map((department) => ({
                value: department.id,
                label: `${department.name} (${department.code})`,
            })));
        };

        fetchDepartments();
        return () => { active = false; };
    }, []);

    const openCreate = () => {
        setEditingDesignation(null);
        form.resetFields();
        form.setFieldsValue({ status: "active" });
        setIsModalOpen(true);
    };

    const openEdit = (designation) => {
        setEditingDesignation(designation);
        form.setFieldsValue({
            code         : designation.code,
            name         : designation.name,
            department_id: designation.department_id || undefined,
            status       : designation.status,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) return;

        setIsModalOpen(false);
        setEditingDesignation(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const payload = {
            code         : values.code.trim(),
            name         : values.name.trim(),
            department_id: values.department_id || null,
            status       : values.status,
        };

        setSubmitting(true);
        try {
            const response = editingDesignation
                ? await putData(`/admin/designations/${editingDesignation.id}`, payload)
                : await postData("/admin/designations", payload);

            if (!response?.success) {
                messageApi.error(getResponseMessage(response, "Unable to save designation"));
                return;
            }

            messageApi.success(response?.msg || `Designation ${editingDesignation ? "updated" : "created"} successfully`);
            setIsModalOpen(false);
            setEditingDesignation(null);
            form.resetFields();
            await fetchDesignations();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const response = await deleteData(`/admin/designations/${id}`);

        if (!response?.success) {
            messageApi.error(getResponseMessage(response, "Unable to delete designation"));
            return;
        }

        messageApi.success(response?.msg || "Designation deleted successfully");

        if (designations.length === 1 && pagination.current > 1) {
            setPagination((current) => ({ ...current, current: current.current - 1 }));
        } else {
            await fetchDesignations();
        }
    };

    const columns = [
        {
            title: "SL",
            width: 70,
            render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
        },
        {
            title: "Designation",
            key: "designation",
            width: 290,
            render: (_, record) => (
                <Space size={10}>
                    <Avatar shape="square" icon={<IdcardOutlined />} style={{ background: "#f9f0ff", color: "#722ed1" }} />
                    <div>
                        <Text strong>{record.name}</Text>
                        <div><Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text></div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Department",
            key: "department",
            width: 240,
            render: (_, record) => record.department ? (
                <div>
                    <Text>{record.department.name}</Text>
                    <div><Text type="secondary" style={{ fontSize: 12 }}>{record.department.code}</Text></div>
                </div>
            ) : <Text type="secondary">Not assigned</Text>,
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
                        <Tooltip title="Edit designation">
                            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Delete designation?"
                            description="This action cannot be undone."
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Tooltip title="Delete designation"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip>
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
                <div className="head-left"><h1 className="title">Designations</h1></div>
                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: "HRM" },
                        { title: "Designations" },
                    ]} />
                </div>
            </div>

            <Card styles={{ body: { padding: 18 } }}>
                <Row gutter={[12, 12]} justify="space-between" align="middle" style={{ marginBottom: 18 }}>
                    <Col xs={24} xl={17}>
                        <Space wrap>
                            <Input
                                allowClear
                                prefix={<SearchOutlined />}
                                placeholder="Search by designation name or code"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                style={{ width: 300 }}
                            />
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                placeholder="All departments"
                                value={departmentId}
                                onChange={setDepartmentId}
                                options={departmentOptions}
                                style={{ width: 220 }}
                            />
                            <Select
                                allowClear
                                placeholder="All statuses"
                                value={status}
                                onChange={setStatus}
                                style={{ width: 145 }}
                                options={[
                                    { value: "active", label: "Active" },
                                    { value: "inactive", label: "Inactive" },
                                    { value: "draft", label: "Draft" },
                                ]}
                            />
                            <Tooltip title="Refresh"><Button icon={<ReloadOutlined />} loading={loading} onClick={fetchDesignations} /></Tooltip>
                        </Space>
                    </Col>
                    <Col xs={24} xl={7} style={{ textAlign: "right" }}>
                        <Space>
                            {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Designation</Button>}
                            <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                        </Space>
                    </Col>
                </Row>

                <Table
                    rowKey="id"
                    bordered
                    loading={loading}
                    columns={columns}
                    dataSource={designations}
                    scroll={{ x: 835 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} designations`,
                        onChange: (current, pageSize) => setPagination((previous) => ({ ...previous, current, pageSize })),
                    }}
                />
            </Card>

            <Modal
                destroyOnHidden
                open={isModalOpen}
                title={editingDesignation ? "Edit Designation" : "Create Designation"}
                okText={editingDesignation ? "Update Designation" : "Create Designation"}
                confirmLoading={submitting}
                onOk={handleSubmit}
                onCancel={closeModal}
                width={720}
            >
                <Form form={form} layout="vertical" requiredMark="optional" style={{ marginTop: 20 }}>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="code" label="Designation Code" rules={[{ required: true, whitespace: true, message: "Designation code is required" }]}>
                                <Input placeholder="e.g. SR-EXEC" maxLength={100} />
                            </Form.Item>
                        </Col>
                        
                        <Col xs={24} md={12}>
                            <Form.Item name="name" label="Designation Name" rules={[{ required: true, whitespace: true, message: "Designation name is required" }]}>
                                <Input placeholder="e.g. Senior Executive" maxLength={255} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="department_id" label="Department">
                                <Select allowClear showSearch optionFilterProp="label" placeholder="Select department" options={departmentOptions} />
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
