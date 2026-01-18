import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb,Table, Button, Space, Popconfirm, message, Modal, Form,Select } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import { useParams } from "react-router-dom";

export default function EditAttribute() {
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


    // Open Add Modal
    const handleAdd = () => {
        setModalMode("add");
        setCurrentValue(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    // Open Update Modal
    const handleUpdate = (value) => {
        setModalMode("update");
        setCurrentValue(value);
        form.setFieldsValue({ id:value.id,value: value.value, slug: value.slug });
        setIsModalVisible(true);
    };

    // Delete handler
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

    // Submit Add/Update
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
            render: (_, __, index) => index + 1,
        },
        { 
            title: "Value", 
            dataIndex: "value", 
            key: "value" 
        },
        { 
            title: "Slug", 
            dataIndex: "slug", 
            key: "slug" 
        },
        {
            title: "Actions",
            key: "actions",
            width:160,
            render: (_, record) => (
            <Space>
                <Button size="small" type="primary" onClick={() => handleUpdate(record)}>
                    Edit
                </Button>
                
                <Popconfirm title="Are you sure to delete this value?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
                    <Button size="small" danger>Delete</Button>
                </Popconfirm>
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
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Edit Attributes Value</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: `Edit ${attributes.name} Attributes Value` },
                        ]}
                    />
                </div>
            </div>

            <div style={{display: "flex",justifyContent: "space-between",alignItems: "center",marginBottom: 16}}>
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Add
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} scroll={{ x: "max-content" }}/>

            <Modal title={modalMode === "add" ? "Add Value" : "Update Value"} open={isModalVisible} onOk={handleModalSubmit} onCancel={() => setIsModalVisible(false)} okText={modalMode === "add" ? "Save" : "Update"}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="id" hidden>
                        <AntInput />
                    </Form.Item>

                    <Form.Item name="attribute_id" label="Attribute" rules={[{ required: true }]}>
                        <Select options={allAttributes?.map(attr => ({value: attr.id,label: attr.name}))} placeholder="Select attribute"/>
                    </Form.Item>

                    <Form.Item label="Value" name="value" rules={[{ required: true, message: "Please input the value!" }]}>
                        <AntInput />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
