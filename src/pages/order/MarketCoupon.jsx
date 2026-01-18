import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, DatePicker, Form, message, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function MarketCoupon() {
    //Hook
    useTitle("All Coupons List");

    // State
    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [marketCoupons, setItems]       = useState([]);
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [messageApi, contextHolder]     = message.useMessage();
    const [editingItems, setEditingItems] = useState(null);
    const [filteredData, setFilteredData] = useState(marketCoupons);
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
            title: "Code",
            dataIndex: "code",
            key: "code"
        },
        {
            title: "Discount Type",
            dataIndex: "discount_type",
            key: "discount_type"
        },
        {
            title: "Discount Amount",
            dataIndex: "discount_amount",
            key: "discount_amount"
        },
        {
            title: "Minimum Cart Amount",
            dataIndex: "min_cart_amount",
            key: "min_cart_amount"
        },
        {
            title: "Started At",
            dataIndex: "started_at",
            key: "started_at"
        },
        {
            title: "Ended At",
            dataIndex: "ended_at",
            key: "ended_at"
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description"
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
          name: record.name,
          code: record.code,
          discount_amount: record.discount_amount,
          min_cart_amount: record.min_cart_amount,
          discount_type: record.discount_type,
          started_at: record.started_at ? dayjs(record.started_at) : null,
          ended_at: record.ended_at ? dayjs(record.ended_at) : null,
          description: record.description,
          status: record.status,
        });
    }

    useEffect(() => {
        if(!query){
            setFilteredData(marketCoupons);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = marketCoupons?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, marketCoupons]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/coupons");

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
        formData.append('code', values.code);
        formData.append('discount_amount', values.discount_amount);
        formData.append('min_cart_amount', values.min_cart_amount);
        formData.append('discount_type', values.discount_type);
        formData.append("started_at", values.started_at.format("YYYY-MM-DD"));
        formData.append("ended_at", values.ended_at.format("YYYY-MM-DD"));
        formData.append('description', values.description);
        if(values.status) formData.append('status', values.status);

        if(editingItems?.id) formData.append('_method', 'PUT');

        const url = editingItems?.id ? `/admin/coupons/${editingItems.id}` : `/admin/coupons`;

        setLoading(true);

        const res = await postData(url, formData);

        if(res?.success){
            const refreshed = await getDatas("/admin/coupons");

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
        const res = await deleteData(`/admin/coupons/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/coupons");

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
                    <h1 className="title">All Coupons List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Coupons List" },
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
                <Modal
                    title={editingItems ? "Edit Coupon" : "Create New Coupon"}
                    open={isModalOpen}
                    onOk={handleSubmit}
                    okText={editingItems ? "Update" : "Create"}
                    confirmLoading={loading}
                    onCancel={() => setIsModalOpen(false)}
                >
                    <div>
                        <Form form={form} layout="s" initialValues={{started_at: editingItems?.started_at ? dayjs(editingItems.started_at) : null, ended_at: editingItems?.ended_at ? dayjs(editingItems.ended_at) : null,}}>
                            <div>
                                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px"}}>
                                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter Name" />
                                    </Form.Item>

                                    <Form.Item name="code" label="Coupon Code" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter Coupon Code" />
                                    </Form.Item>
                                </div>

                                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px"}}>
                                    <Form.Item name="discount_amount" label="Discount Amount" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter Discount Amount" />
                                    </Form.Item>

                                    <Form.Item name="min_cart_amount" label="Min. Cart Amount" rules={[{ required: true }]}>
                                        <AntInput placeholder="Enter Cart Amount" />
                                    </Form.Item>
                                </div>

                                <Form.Item name="discount_type" label="Discount Type" rules={[{ required: true }]}>
                                    <Select  options={[{ value: 'fixed', label: 'Fixed' }, { value: 'percentage', label: '% Percentage' }]} />
                                </Form.Item>
                                
                                <Form.Item name="started_at" label="Start Date" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: "100%" }} />
                                </Form.Item>

                                <Form.Item name="ended_at" label="End Date" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: "100%" }} />
                                </Form.Item>


                                <Form.Item name="description" label="Description" rules={[{ required: true }]}>
                                    <AntInput.TextArea rows={4}  placeholder="Enter your description here..."/>
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
