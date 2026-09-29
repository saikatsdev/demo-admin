import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Breadcrumb, Button, Card, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData, putData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { Title } = Typography;

const columns = 
[
    { 
        title: "SL", 
        dataIndex: "sl", 
        key: "sl", 
        width: 80 
    },
    { 
        title: "Name", 
        dataIndex: "name", 
        key: "name" 
    },
    { 
        title: "Slug", 
        dataIndex: "slug", 
        key: "slug" 
    },
    {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
            <Tag color={status === "active" ? "success" : "default"} style={{ textTransform: "capitalize" }}>
                {status || "Unknown"}
            </Tag>
        ),
    },
];

export default function JobType() {
    // Hook
    useTitle("Job Types");

    const [jobTypes, setJobTypes]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState("");
    const [refreshKey, setRefreshKey]         = useState(0);
    const [modalOpen, setModalOpen]           = useState(false);
    const [editingJobType, setEditingJobType] = useState(null);
    const [saving, setSaving]                 = useState(false);
    const [deletingId, setDeletingId]         = useState(null);
    const [saveError, setSaveError]           = useState("");
    const [form]                              = Form.useForm();
    const [messageApi, contextHolder]         = message.useMessage();

    useEffect(() => {
        let cancelled = false;

        const fetchJobTypes = async () => {
            try {
                const res = await getDatas("/admin/job-types");
                if (cancelled) return;

                if (res?.success && Array.isArray(res.result)) {
                    setJobTypes(res.result);
                } else {
                    setError(res?.message || res?.msg || "Unable to load job types.");
                }
            } catch {
                if (!cancelled) setError("Unable to load job types. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchJobTypes();
        return () => { cancelled = true; };
    }, [refreshKey]);

    const refreshJobTypes = () => {
        setError("");
        setLoading(true);
        setRefreshKey((value) => value + 1);
    };

    const openModal = (record = null) => {
        setEditingJobType(record);
        setSaveError("");
        form.resetFields();
        form.setFieldsValue({ name: record?.name || "", status: record?.status || "active" });
        setModalOpen(true);
    };

    const handleSave = async (values) => {
        if (saving) return;
        setSaving(true);
        setSaveError("");

        try {
            const payload = { name: values.name.trim(), status: values.status };
            const res = editingJobType
                ? await putData(`/admin/job-types/${editingJobType.id}`, payload)
                : await postData("/admin/job-types", payload);

            if (!res?.success) {
                setSaveError(res?.message || res?.msg || "Unable to save job type. Please try again.");
                if (res?.errors) {
                    form.setFields(["name", "status"].filter((name) => res.errors[name]).map((name) => ({
                        name,
                        errors: Array.isArray(res.errors[name]) ? res.errors[name] : [String(res.errors[name])],
                    })));
                }
                return;
            }

            messageApi.success(res.msg || (editingJobType ? "Job type updated." : "Job type created."));
            setModalOpen(false);
            refreshJobTypes();
        } catch {
            setSaveError("Unable to save job type. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (deletingId !== null) return;
        setDeletingId(id);

        try {
            const res = await deleteData(`/admin/job-types/${id}`);
            if (!res?.success) {
                messageApi.error(res?.message || res?.msg || "Unable to delete job type. Please try again.");
                return;
            }

            messageApi.success(res.msg || "Job type deleted.");
            refreshJobTypes();
        } catch {
            messageApi.error("Unable to delete job type. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const tableColumns = [
        ...columns,
        {
            title: "Actions",
            key: "actions",
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" icon={<EditOutlined />} disabled={loading || saving || deletingId !== null} onClick={() => openModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete job type?"
                        description={`Delete "${record.name}"?`}
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        disabled={loading || saving || deletingId !== null}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} loading={deletingId === record.id} disabled={loading || saving || deletingId !== null}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
            {contextHolder}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "24px 30px", marginBottom: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#1e293b" }}>Job Types</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Job Types" },
                        ]}
                    />
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} disabled={loading || saving || deletingId !== null} style={{ borderRadius: 8, height: 35 }}>
                        Create Job Type
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ borderRadius: 8, height: 35 }}>
                        Back
                    </Button>
                </Space>
            </div>

            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 24 }} />}

            <Card style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <Table
                    rowKey="id"
                    columns={tableColumns}
                    dataSource={jobTypes.map((jobType, index) => ({ ...jobType, sl: index + 1 }))}
                    loading={loading}
                    scroll={{ x: "max-content" }}
                    locale={{ emptyText: error ? "Job types could not be loaded" : "No job types found" }}
                    pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} job types` }}
                />
            </Card>

            <Modal
                title={editingJobType ? "Edit Job Type" : "Create Job Type"}
                open={modalOpen}
                forceRender
                onOk={() => form.submit()}
                onCancel={() => { if (!saving) setModalOpen(false); }}
                okText={editingJobType ? "Update" : "Create"}
                confirmLoading={saving}
                cancelButtonProps={{ disabled: saving }}
                closable={!saving}
                maskClosable={!saving}
                keyboard={!saving}
            >
                {saveError && <Alert type="error" message={saveError} showIcon style={{ marginBottom: 16 }} />}
                <Form form={form} layout="vertical" onFinish={handleSave} disabled={saving}>
                    <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true, message: "Please enter a job type name." }]}>
                        <Input placeholder="Enter job type name" />
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select a status." }]}>
                        <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
