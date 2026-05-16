import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Table, Button, Space, Popconfirm, message, Modal, Form, Select, Card, Typography, Tooltip, Tag } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import { useParams, useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";

const { Title, Text } = Typography;

export default function EditAttribute() {
    // Hook
    useTitle("Edit Attribute Value");

    const navigate = useNavigate();
    const [attributes, setAttributes]         = useState({});
    const [loading, setLoading]               = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode]           = useState("add");
    const [currentValue, setCurrentValue]     = useState(null);
    const [query, setQuery]                   = useState("");
    const [allAttributes, setAllAttributes]   = useState([]);
    const [messageApi, contextHolder]         = message.useMessage();

    const [form]   = Form.useForm();
    const {id}     = useParams();

    const load = useCallback(async () => {
        setLoading(true);

        const [allRes, singleRes] = await Promise.all([
            getDatas("/admin/attributes/list"),
            getDatas(`/admin/attributes/${id}`)
        ]);

        if (allRes?.success) setAllAttributes(allRes.result);
        if (singleRes?.success) setAttributes(singleRes.result);

        setLoading(false);
    }, [id]);

    useEffect(() => {
        let ignore = false;

        const run = async () => {
            if (ignore) return;
            await load();
        };

        run();

        return () => {
            ignore = true;
        };
    }, [load]);


    const handleAdd = () => {
        setModalMode("add");
        setCurrentValue(null);
        form.setFieldsValue({
            attribute_id: Number(id) || null,
            value: "",
        });
        setIsModalVisible(true);
    };

    const handleUpdate = (value) => {
        setModalMode("update");
        setCurrentValue(value);
        form.setFieldsValue({
            id: value.id,
            value: value.value,
            slug: value.slug,
            attribute_id: value.attribute_id,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (valueId) => {
        const res = await deleteData(`/admin/attribute-values/${valueId}`);

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            setAttributes((prev) => ({...prev,values: prev.values.filter((v) => v.id !== valueId)}));
        }
    };

    const handleModalSubmit = async () => {
        try {
            const values = await form.validateFields();

            const formData = new FormData();
            if (modalMode === "update") {
                formData.append("id", currentValue.id);
                formData.append("_method", "PUT");
            }

            if (modalMode === "add") {
                formData.append("attribute_id", values.attribute_id);
            }

            formData.append("value", values.value);
            formData.append("slug", values.value);

            if (modalMode === "add") {
                const res = await postData("/admin/attribute-values", formData);
                if(res && res?.success){
                    messageApi.open({
                        type: "success",
                        content: res.msg,
                    });
                }

                await load();
            } else if (modalMode === "update") {
                const res = await postData(`/admin/attribute-values/${currentValue.id}`, formData);
                if(res && res?.success){
                    messageApi.open({
                        type: "success",
                        content: res.msg,
                    });
                }

                await load();
            }

            setIsModalVisible(false);
        } catch (err) {
            console.error("Validation failed:", err);
            message.error("Failed to submit form");
        }
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 80,
            align: 'center',
            render: (_, __, index) => (
                <Text type="secondary" style={{ fontWeight: 500 }}>
                    {index + 1}
                </Text>
            ),
        },
        { 
            title: "Attribute Value", 
            dataIndex: "value", 
            key: "value",
            render: (text) => <Tag color="blue" style={{ borderRadius: '6px', padding: '4px 12px', fontSize: '13px', fontWeight: 500 }}>{text}</Tag>
        },
        { 
            title: "Slug", 
            dataIndex: "slug", 
            key: "slug",
            render: (text) => <Text type="secondary" style={{ fontFamily: 'monospace' }}>{text}</Text>
        },
        {
            title: "Actions",
            key: "actions",
            width: 140,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Value">
                        <Button type="text" icon={<EditOutlined style={{ color: '#0ea5e9' }} />} onClick={() => handleUpdate(record)} style={{ background: '#f0f9ff', borderRadius: '8px' }}/>
                    </Tooltip>
                    <Tooltip title="Delete Value">
                        <Popconfirm title="Are you sure you want to delete this value?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
                            <Button type="text" danger icon={<DeleteOutlined />} style={{ background: '#fef2f2', borderRadius: '8px' }}/>
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredData = useMemo(() => {
        if (!query) return attributes.values;
            const lowerQuery = query.toLowerCase();
            return attributes.values.filter(
            (b) => b.name?.toLowerCase().includes(lowerQuery)
        );
    }, [attributes, query]);

    useEffect(() => {
        if (id && allAttributes.length) {
            form.setFieldsValue({
                attribute_id: Number(id),
            });
        }
    }, [id, allAttributes]);

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
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/attributes')} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px' }}/>
                    <div>
                        <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                            Configure {attributes.name || 'Attribute'}
                        </Title>
                        <Breadcrumb
                            style={{ fontSize: '12px' }}
                            items={[
                                { title: <Link to="/dashboard" style={{ color: '#64748b' }}>Dashboard</Link> },
                                { title: <Link to="/attributes" style={{ color: '#64748b' }}>Attributes</Link> },
                                { title: <span style={{ color: '#1e293b', fontWeight: 500 }}>Values</span> },
                            ]}
                        />
                    </div>
                </Space>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ 
                            borderRadius: '8px',
                            background  : '#2563eb',
                            height      : '40px',
                            padding     : '0 20px',
                            fontWeight  : 600,
                            boxShadow   : '0 4px 10px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        Add New Value
                    </Button>
                </Space>
            </div>

            <div>
                <Card 
                    variant="borderless"
                    style={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                            <Space>
                                <FilterOutlined style={{ color: '#6366f1' }} />
                                <Text strong style={{ fontSize: '16px' }}>Available Values for {attributes.name}</Text>
                            </Space>
                            <AntInput prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Search values..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 280, borderRadius: '8px' }} allowClear/>
                        </div>
                    }
                >
                    <Table 
                        dataSource={filteredData} 
                        columns={columns} 
                        rowKey="id" 
                        loading={loading} 
                        scroll={{ x: "max-content" }}
                        pagination={{
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} values`,
                        }}
                        style={{ borderRadius: '8px' }}
                    />
                </Card>
            </div>

            <Modal 
                title={
                    <Space>
                        {modalMode === "add" ? <PlusOutlined style={{ color: '#22c55e' }} /> : <EditOutlined style={{ color: '#0ea5e9' }} />}
                        <span>{modalMode === "add" ? "Add Attribute Value" : "Update Attribute Value"}</span>
                    </Space>
                } 
                open={isModalVisible} 
                onOk={handleModalSubmit} 
                onCancel={() => setIsModalVisible(false)} 
                okText={modalMode === "add" ? "Save Value" : "Update Value"}
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
                    <Form.Item name="id" hidden>
                        <AntInput />
                    </Form.Item>

                    <Form.Item name="attribute_id" label={<Text strong>Parent Attribute</Text>} rules={[{ required: true }]}>
                        <Select size="large" options={allAttributes?.map(attr => ({ value: attr.id, label: attr.name }))} placeholder="Select attribute" style={{ borderRadius: '8px' }} disabled/>
                    </Form.Item>

                    <Form.Item label={<Text strong>Value Name</Text>} name="value" rules={[{ required: true, message: "Please input the value!" }]}>
                        <AntInput size="large" placeholder="e.g. Red, XL, Cotton" style={{ borderRadius: '8px' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
