


import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function DeliveryCharge() {
    //Hook
    useTitle("Delivery Charge");

    // State
    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [deliveryCharge, setItems]                = useState([]);
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [messageApi, contextHolder]     = message.useMessage();
    const [editingItems, setEditingItems] = useState(null);
    const [filteredData, setFilteredData] = useState(deliveryCharge);
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
            title: "Delivery Fee",
            dataIndex: "delivery_fee",
            key: "delivery_fee"
        },
        {
            title: "Minimum Time",
            dataIndex: "min_time",
            key: "min_time"
        },
        {
            title: "Maximum Time",
            dataIndex: "max_time",
            key: "max_time"
        },
        {
            title: "Time Unit",
            dataIndex: "time_unit",
            key: "time_unit"
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
            name:record.name,
            delivery_fee:record.delivery_fee,
            min_time:record.min_time,
            max_time:record.max_time,
            time_unit:record.time_unit,
            status:record.status,
        });
    }

    useEffect(() => {
        if(!query){
            setFilteredData(deliveryCharge);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = deliveryCharge?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, deliveryCharge]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/delivery-gateways");

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
        formData.append('delivery_fee', values.delivery_fee);
        formData.append('min_time', values.min_time);
        formData.append('max_time', values.max_time);
        formData.append('time_unit', values.time_unit);
        if(values.status) formData.append('status', values.status);

        if(editingItems?.id) formData.append('_method', 'PUT');

        const url = editingItems?.id ? `/admin/delivery-gateways/${editingItems.id}` : `/admin/delivery-gateways`;

        setLoading(true);

        const res = await postData(url, formData, {headers:{ "Content-Type": "multipart/form-data"}, method: editingItems?.id ? "PUT" : "POST"});

        if(res && res?.success){
            const refreshed = await getDatas("/admin/delivery-gateways");

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
        const res = await deleteData(`/admin/delivery-gateways/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/delivery-gateways");

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
                    <h1 className="title">Delivery Charge List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Delivery Charge List" },
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
                <Modal title={editingItems ? "Edit Info" : "Create New"} open={isModalOpen} onOk={handleSubmit} okText={editingItems ? "Update" : "Create"}
                    confirmLoading={loading} onCancel={() => setIsModalOpen(false)}>
                    <div>
                        <Form form={form} layout="s" initialValues={{width:"960", height:"1200"}}>
                            <div>
                                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Name" />
                                </Form.Item>

                                <Form.Item name="delivery_fee" label="Delivery Fee" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Delivery Fee" />
                                </Form.Item>

                                <Form.Item name="min_time" label="Minimum Time" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Minimum Time" />
                                </Form.Item>

                                <Form.Item name="max_time" label="Maximum Time" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Maximum Time" />
                                </Form.Item>


                                <Form.Item name="time_unit" label="Time Unit" rules={[{ required: true }]}>
                                    <Select options={[{ value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }, { value: 'weeks', label: 'Weeks' }]} />
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
