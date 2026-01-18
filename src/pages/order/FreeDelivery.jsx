


import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function FreeDelivery() {
    //Hook
    useTitle("Free Delivery");

    // State
    const [query, setQuery]               = useState("");
    const [selectedType, setSelectedType] = useState(null);
    const [loading, setLoading]           = useState(false);
    const [freeDelivery, setItems]                = useState([]);
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [messageApi, contextHolder]     = message.useMessage();
    const [editingItems, setEditingItems] = useState(null);
    const [filteredData, setFilteredData] = useState(freeDelivery);
    const [form]                          = Form.useForm();

    //Table Columns
    const columns = [
        {
            title: "SL",
            key:"sl",
            width: 10,
            render: (_,__, index) => (
                index + 1
            )
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type"
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity"
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price"
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === 'active' ? "green" : "danger"} style={{textTransform:"capitalize"}}>{status}</Tag>
            )
        },
        {
            title: "Action",
            key: "operation",
            width:170,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete Item?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    //Method
    const openCreate = () => {
        setIsModalOpen(true);
        setEditingItems(null);
        form.resetFields();
    }

    const onEdit = (record) => {
        setEditingItems(record);
        setIsModalOpen(true);

        form.setFieldsValue({
            type:record.type,
            quantity:record.quantity ?? '',
            price:record.price ?? '',
            status:record.status,
        });
    }

    useEffect(() => {
        if(!query){
            setFilteredData(freeDelivery);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = freeDelivery?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, freeDelivery]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/free-delivery");

            const list = res?.result?.data;

            if(isMounted){
                setItems(list);
            }

            setLoading(false);
        }

        fetchContactList();

        return () => {
            isMounted = false;
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const values = await form.validateFields();

        const formData = new FormData();

        formData.append('type', values.type);
        formData.append("quantity", values.quantity || 0);
        formData.append('price', values.price || 0);
        if(values.status) formData.append('status', values.status);

        if(editingItems?.id) formData.append('_method', 'PUT');

        const url = editingItems?.id ? `/admin/free-delivery/${editingItems.id}` : `/admin/free-delivery`;

        setLoading(true);

        const res = await postData(url, formData);

        if(res?.success){
            const refreshed = await getDatas("/admin/free-delivery");

            setItems(refreshed?.result?.data);
            setSelectedType(null);

            messageApi.open({
              type: "success",
              content: res.msg,
            });
        }

        setTimeout(() => {
            setLoading(false);
            setIsModalOpen(false);
        }, 500);
    }

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/free-delivery/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/free-delivery");

            setItems(refreshed?.result?.data);

            messageApi.open({
              type: "success",
              content: res.msg,
            });
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Free Delivery List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Free Delivery List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>
                <Space>
                    <Button size="small" icon={<DeleteOutlined />}>Trash</Button>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns}  dataSource={filteredData}/>

            <div>
                <Modal style={{textAlign:"center"}}
                    title={editingItems ? "Edit Info" : "Create New"}
                    open={isModalOpen}
                    onOk={handleSubmit}
                    okText={editingItems ? "Update" : "Create"}
                    confirmLoading={loading}
                    onCancel={() => setIsModalOpen(false)}
                >
                    <div>
                        <Form form={form} layout="s">
                            <div>
                                <Form.Item name="type" label="Free Shipping Type" rules={[{ required: true }]}>
                                    <Select options={[{ value: 'quantity', label: 'Quantity' }, { value: 'price', label: 'Price' }]} onChange={(value) => setSelectedType(value)}/>
                                </Form.Item>

                                {selectedType === "quantity" && (
                                    <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter Quantity" />
                                    </Form.Item>
                                )}

                                {selectedType === "price" && (
                                    <Form.Item name="price" label="Price" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter Price" />
                                    </Form.Item>
                                )}

                                <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
                                    <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
                                </Form.Item>
                            </div>
                        </Form>
                    </div>
                </Modal>
            </div>

        </>
    )
}
