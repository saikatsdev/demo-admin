import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, SettingOutlined, FilterOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Modal, Popconfirm, Select, Space, Table, Tag, message, Card, Typography, Tooltip } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

const { Title, Text } = Typography;

export default function Attribute() {

    // Hook
    const navigate = useNavigate();
    useTitle("All Attributes");

    // State
    const [query, setQuery]                       = useState("");
    const [editingAttribute, setEditingAttribute] = useState(null)
    const [attributes, setAttributes]             = useState([]);
    const [isModalOpen, setIsModalOpen]           = useState(false);
    const [loading, setLoading]                   = useState(false);
    const [pagination, setPagination]             = useState({ current: 1, pageSize: 10, total: 0 })
    const { current, pageSize }                   = pagination;
    const [debouncedQuery, setDebouncedQuery]     = useState("");
    const [form]                                  = Form.useForm();
    const [messageApi, contextHolder]             = message.useMessage();

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 70,
            align: 'center',
            render: (_, __, index) => (
                <Text type="secondary" style={{ fontWeight: 500 }}>
                    {index + 1 + (pagination.current - 1) * pagination.pageSize}
                </Text>
            ),
        },
        {
            title: "Attribute Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <Text strong style={{ color: '#1e293b' }}>{text}</Text>,
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
            render: (text) => <Tag color="blue" style={{ borderRadius: '4px' }}>{text}</Tag>,
        },
        {
            title: "Configured Values",
            dataIndex: "values",
            key: "values",
            render: (values, record) => (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    {values && values.length > 0 ? (
                        values.slice(0, 5).map((v) => (
                            <Tag key={v.id} color="default" style={{ borderRadius: '12px', fontSize: '12px' }}>
                                {v.value}
                            </Tag>
                        ))
                    ) : (
                        <Text type="secondary" italic>No values</Text>
                    )}
                    {values && values.length > 5 && (
                        <Tag color="default" style={{ borderRadius: '12px' }}>+{values.length - 5} more</Tag>
                    )}
                    <Tooltip title="Configure Values">
                        <Button 
                            type="text" 
                            size="small" 
                            icon={<SettingOutlined style={{ color: '#6366f1' }} />}
                            onClick={() => navigate(`/attributes/config/${record.id}`)}
                            style={{ marginLeft: 4 }}
                        />
                    </Tooltip>
                </div>
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => (
                <Tag 
                    color={status === "active" ? "success" : "error"} 
                    style={{ borderRadius: '20px', padding: '0 12px', textTransform: 'capitalize', fontWeight: 600 }}
                >
                    {status}
                </Tag>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 140,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Attribute">
                        <Button 
                            type="text" 
                            icon={<EditOutlined style={{ color: '#0ea5e9' }} />} 
                            onClick={() => onEdit(record)}
                            style={{ background: '#f0f9ff', borderRadius: '8px' }}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Attribute">
                        <Popconfirm title="Are you sure you want to delete this attribute?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                            <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />}
                                style={{ background: '#fef2f2', borderRadius: '8px' }}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500);

        return () => clearTimeout(handle)
    }, [query])

    useEffect(() => {
        setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }))
    }, [debouncedQuery])

    useEffect(() => {
        let isMounted = true;
        const fetchAttributes = async () => {
            setLoading(true);

            const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } };

            const res = await getDatas("/admin/attributes", params);

            const list = res?.result?.data || [];

            const meta = res?.result?.meta;

            if (isMounted) {
                setAttributes(list);
                if (meta) {
                    setPagination((p) => {
                        const next = {
                            ...p,
                            current: meta.current_page || p.current,
                            pageSize: meta.per_page || p.pageSize,
                            total: meta.total || p.total,
                        }

                        const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total;

                        return unchanged ? p : next;
                    })
                }
            }
            setLoading(false);
        };

        fetchAttributes();

        return () => {
            isMounted = false;
        }
    }, [current, pageSize, debouncedQuery]);

    const filteredData = useMemo(() => {
        if (!query) return attributes;

        const lowerQuery = query.toLowerCase();

        return attributes.filter(
            (b) => b.name?.toLowerCase().includes(lowerQuery)
        );
    }, [attributes, query]);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/attributes/${id}`);

        if (res && res?.success) {
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } };

            const refreshed = await getDatas("/admin/attributes", params);

            setAttributes(refreshed?.result?.data || []);

            const meta = refreshed?.result?.meta;

            if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }));
        }
    }

    const onEdit = (record) => {
        setEditingAttribute(record);
        form.setFieldsValue({
            name  : record.name,
            slug  : record.slug,
            status: record.status,
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingAttribute(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();

        const formData = new FormData();

        formData.append('name', values.name);
        formData.append('slug', values.slug);
        if (values.status) formData.append('status', values.status);
        if (editingAttribute?.id) formData.append("_method", "PUT");

        let res;

        if (editingAttribute?.id) {
            res = await postData(`/admin/attributes/${editingAttribute.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
            res = await postData('/admin/attributes', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        }

        if (res && res?.success) {
            setIsModalOpen(false);
            form.resetFields();

            messageApi.open({
                type: "success",
                content: res.msg,
            });

            const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } };

            const refreshed = await getDatas("/admin/attributes", params);

            setAttributes(refreshed?.result?.data || []);

            const meta = refreshed?.result?.meta;

            if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }));
        }
    }

    return (
        <div style={{ background: '#f4f7fe', minHeight: '100vh' }}>
            {contextHolder}

            <div style={{
                background    : '#fff',
                padding       : '16px 24px',
                borderBottom  : '1px solid #e2e8f0',
                display       : 'flex',
                justifyContent: 'space-between',
                alignItems    : 'center',
                marginBottom  : 24
            }}>
                <Space size="middle">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px' }}/>
                    <div>
                        <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Product Attributes</Title>
                        <Breadcrumb
                            style={{ fontSize: '12px' }}
                            items={[
                                { title: <Link to="/dashboard" style={{ color: '#64748b' }}>Dashboard</Link> },
                                { title: <span style={{ color: '#1e293b', fontWeight: 500 }}>Attributes</span> },
                            ]}
                        />
                    </div>
                </Space>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: '8px', background: '#2563eb', height: '40px', padding: '0 20px', fontWeight: 600, boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' }}
                    >
                        Create Attribute
                    </Button>
                </Space>
            </div>

            <div>
                <Card variant="borderless"
                    style={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                            <Space>
                                <FilterOutlined style={{ color: '#6366f1' }} />
                                <Text strong style={{ fontSize: '16px' }}>All Attributes</Text>
                            </Space>
                            <AntInput prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Search by name..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 280, borderRadius: '8px' }} allowClear
                            />
                        </div>
                    }
                >
                    <Table 
                        rowKey="id" 
                        loading={loading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} attributes`,
                            onChange: (page, pageSize) => {
                                setPagination((p) => ({ ...p, current: page, pageSize }));
                            },
                        }}
                        columns={columns}
                        dataSource={filteredData}
                        scroll={{ x: "max-content" }}
                        style={{ borderRadius: '8px' }}
                        rowClassName={() => 'attribute-row'}
                    />
                </Card>
            </div>

            <Modal 
                open={isModalOpen} 
                onCancel={() => setIsModalOpen(false)} 
                title={
                    <Space>
                        {editingAttribute ? <EditOutlined style={{ color: '#0ea5e9' }} /> : <PlusOutlined style={{ color: '#22c55e' }} />}
                        <span>{editingAttribute ? "Edit Attribute" : "Create New Attribute"}</span>
                    </Space>
                } 
                onOk={handleSubmit} 
                okText={editingAttribute ? "Update Attribute" : "Save Attribute"}
                confirmLoading={loading}
                width={500}
                centered
                styles={{
                    mask: { backdropFilter: 'blur(4px)' },
                    header: { borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' },
                    footer: { borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '20px' }
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label={<Text strong>Attribute Name</Text>} rules={[{ required: true, message: 'Please enter attribute name' }]}>
                        <AntInput size="large" placeholder="e.g. Color, Size, Material" style={{ borderRadius: '8px' }} />
                    </Form.Item>

                    <Form.Item name="slug" label={<Text strong>Attribute Slug</Text>} rules={[{ required: true, message: 'Please enter slug' }]}>
                        <AntInput size="large" placeholder="e.g. product-color" style={{ borderRadius: '8px' }} />
                    </Form.Item>

                    <Form.Item name="status" label={<Text strong>Visibility Status</Text>} rules={[{ required: true }]} initialValue="active">
                        <Select size="large" style={{ borderRadius: '8px' }} options={[
                            { value: "active", label: <Space><Tag color="success">Active</Tag><span>Visible to customers</span></Space> },
                            { value: "inactive", label: <Space><Tag color="default">Inactive</Tag><span>Hidden from catalog</span></Space> },
                        ]} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
