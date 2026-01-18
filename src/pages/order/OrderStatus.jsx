

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function OrderStatus() {
    //Hook
    useTitle("Order Status");

    // State
    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [orderStatus, setItems]                = useState([]);
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [messageApi, contextHolder]     = message.useMessage();
    const [editingItems, setEditingItems] = useState(null);
    const [filteredData, setFilteredData] = useState(orderStatus);
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
            title: "Name",
            dataIndex: "name",
            key: "name"
        },
        {
            title: "BG Color",
            dataIndex: "bg_color",
            key: "bg_color"
        },
        {
            title: "Text Color",
            dataIndex: "text_color",
            key: "text_color"
        },
        {
            title: "Order Count",
            dataIndex: "orders_count",
            key: "orders_count"
        },
        {
            title: "Total Amount",
            dataIndex: "total_amount",
            key: "total_amount"
        },
        {
            title: "Position",
            dataIndex: "position",
            key: "position"
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
    const onEdit = (record) => {
        setEditingItems(record);
        setIsModalOpen(true);

        form.setFieldsValue({
            name:record.name,
            bg_color:record.bg_color ?? '',
            text_color:record.text_color ?? '',
            position:record.position,
        });
    }

    useEffect(() => {
        if(!query){
            setFilteredData(orderStatus);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = orderStatus?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, orderStatus]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/statuses");

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

        formData.append('name', values.name);
        formData.append("bg_color", values.bg_color || 0);
        formData.append('text_color', values.text_color || 0);
        formData.append('position', values.position || 0);
        if(values.status) formData.append('status', values.status);

        if(editingItems?.id) formData.append('_method', 'PUT');

        const url = editingItems?.id ? `/admin/statuses/${editingItems.id}` : `/admin/statuses`;

        setLoading(true);

        const res = await postData(url, formData);

        if(res?.success){
            const refreshed = await getDatas("/admin/statuses");

            setItems(refreshed?.result?.data);

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
        const res = await deleteData(`/admin/statuses/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/statuses");

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
                    <h1 className="title">All Statuses List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Statuses List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>
                <Space>
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
                                <Form.Item name="name" label="Status Name" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Name" />
                                </Form.Item>

                                <Form.Item name="position" label="Position" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Position" />
                                </Form.Item>

                                <Form.Item name="bg_color" label="Background Color" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Bg Color" />
                                </Form.Item>

                                <Form.Item name="text_color" label="Text Color" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Text Color" />
                                </Form.Item>

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
