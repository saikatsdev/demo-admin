
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, message, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function OnlinePaymentDiscount() {
    //Hook
    useTitle("Online Payment Discount");

    // State
    const [query, setQuery]                     = useState("");
    const [loading, setLoading]                 = useState(false);
    const [onlinePayment, setItems]             = useState([]);
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [messageApi, contextHolder]           = message.useMessage();
    const [editingItems, setEditingItems]       = useState(null);
    const [filteredData, setFilteredData]       = useState(onlinePayment);
    const [form]                                = Form.useForm();
    const [paymentGateways, setPaymentGateways] = useState([]);

    //Table Columns
    const columns = [
        {
            title : "SL",
            key   : "sl",
            width : 10,
            render: (_,__, index) => (
                index + 1
            )
        },
        {
            title    : "Payment Gateway",
            dataIndex: ["payment_gateway", "name"],
            render   : (_, record) => {
                const gateway = record?.payment_gateway;

                return (
                    <div style = {{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src   = {gateway?.image} alt = {gateway?.name} style = {{width: 28,height: 28,objectFit: "contain",borderRadius: 4,}}/>
                        <span>{gateway?.name}</span>
                    </div>
                );
            },
        },
        {
            title    : "Discount Type",
            dataIndex: "discount_type",
            key      : "discount_type"
        },
        {
            title    : "Discount Amount",
            dataIndex: "discount_amount",
            key      : "discount_amount"
        },
        {
            title    : "Minimum Cart Amount",
            dataIndex: "minimum_cart_amount",
            key      : "minimum_cart_amount"
        },
        {
            title    : "Maximum Discount Amount",
            dataIndex: "maximum_discount_amount",
            key      : "maximum_discount_amount"
        },
        {
            title    : "Custom Message",
            dataIndex: "custom_message",
            key      : "custom_message"
        },
        {
            title    : "Status",
            dataIndex: "status",
            key      : "status",
            render   : (status) => (
                <Tag color = {status === 'active' ? "green" : "danger"} style = {{textTransform:"capitalize"}}>{status}</Tag>
            )
        },
        {
            title : "Action",
            key   : "operation",
            width : 170,
            render: (_, record) => (
                <Space>
                    <Button size = "small" type = "primary" onClick = {() => onEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm title = "Delete Item?" okText = "Yes" cancelText = "No" onConfirm = {() => onDelete(record.id)}>
                    <Button     size  = "small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    useEffect(() => {
        const fetchedDeliveryGateways = async () => {
            const res = await getDatas("/admin/payment-gateways/list");

            if(res && res?.success){
                setPaymentGateways(res?.result);
            }
        };

        fetchedDeliveryGateways();
    }, []);

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
            payment_gateway_id     : record.payment_gateway.id,
            discount_type          : record.discount_type,
            discount_amount        : record.discount_amount,
            minimum_cart_amount    : record.minimum_cart_amount,
            maximum_discount_amount: record.maximum_discount_amount,
            custom_message         : record.custom_message,
            status                 : record.status,
        });
    }

    useEffect(() => {
        if(!query){
            setFilteredData(onlinePayment);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = onlinePayment?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, onlinePayment]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/online-payment/discounts");

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

        formData.append('payment_gateway_id', values.payment_gateway_id);
        formData.append('discount_type', values.discount_type);
        formData.append('discount_amount', values.discount_amount);
        formData.append('minimum_cart_amount', values.minimum_cart_amount);
        formData.append('maximum_discount_amount', values.maximum_discount_amount);
        formData.append('custom_message', values.custom_message);
        if(values.status) formData.append('status', values.status);

        if(editingItems?.id) formData.append('_method', 'PUT');

        const url = editingItems?.id ? `/admin/online-payment/discounts/${editingItems.id}` : `/admin/online-payment/discounts`;

        try {
            setLoading(true);

            const res = await postData(url, formData, {headers:{ "Content-Type": "multipart/form-data"}, method: editingItems?.id ? "PUT" : "POST"});

            if(res?.success){
                const refreshed = await getDatas("/admin/online-payment/discounts");

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
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/online-payment/discounts/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/online-payment/discounts");

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
                    <h1 className="title">Online Payment Discount</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Online Payment Discount" },
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
                <Modal title={editingItems ? "Edit Info" : "Create New"} open={isModalOpen} onOk={handleSubmit} okText={editingItems ? "Update" : "Create"} confirmLoading={loading} onCancel={() => setIsModalOpen(false)}>
                    <div>
                        <Form form={form} layout="s">
                            <div>
                                <Form.Item name="payment_gateway_id" label="Payment Gatewat" rules={[{ required: true }]}>
                                    <Select options={paymentGateways.map(item => ({label: item.name,value: item.id}))} placeholder="Select Payment Gateway"/>
                                </Form.Item>

                                <Form.Item name="discount_type" label="Discount Type" rules={[{ required: true }]}>
                                    <Select options={[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed' }]} placeholder="Select Discount Type"/>
                                </Form.Item>

                                <Form.Item name="discount_amount" label="Discount Amount" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Discount Amount" />
                                </Form.Item>

                                <Form.Item name="minimum_cart_amount" label="Minimum Cart Amount" rules={[{ required: true }]} placeholder="Write Cart Amount">
                                    <AntInput placeholder="Enter Minimum Cart Amount" />
                                </Form.Item>

                                <Form.Item name="maximum_discount_amount" label="Maximum Discount Amount" rules={[{ required: true }]} placeholder="Maximum Discount Amount">
                                    <AntInput placeholder="Enter Maximum Discount Amount" />
                                </Form.Item>

                                <Form.Item name="custom_message" label="Custom Message" rules={[{ required: true }]} placeholder="Write your message">
                                    <AntInput placeholder="Write your message"/>
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
