import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, EditOutlined, GiftOutlined, PercentageOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, DatePicker, Form, message, Modal, Popconfirm, Select, Space, Table, Tag, Row, Col, Card, Statistic, Tooltip } from "antd";
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

    // Stats calculations
    const totalCoupons = marketCoupons.length;
    const activeCoupons = marketCoupons.filter(c => c.status === 'active').length;
    const percentageCoupons = marketCoupons.filter(c => c.discount_type === 'percentage').length;

    //Table Columns
    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: 'center',
            render: (_, __, index) => (
                <span style={{ 
                    display       : 'inline-flex',
                    alignItems    : 'center',
                    justifyContent: 'center',
                    width         : '24px',
                    height        : '24px',
                    borderRadius  : '50%',
                    background    : '#f3f4f6',
                    color         : '#6b7280',
                    fontWeight    : 500,
                    fontSize      : '12px'
                }}>
                    {index + 1}
                </span>
            )
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <span style={{ fontWeight: 600, color: '#1f2937' }}>{text}</span>
        },
        {
            title: "Coupon Code",
            dataIndex: "code",
            key: "code",
            render: (code) => (
                <span style={{
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    color: "#4f46e5",
                    background: "#e0e7ff",
                    border: "1px dashed #6366f1",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                    fontSize: "13px"
                }}>
                    {code}
                </span>
            )
        },
        {
            title: "Discount",
            key: "discount",
            render: (_, record) => {
                const isPercent = record.discount_type === 'percentage';
                return (
                    <span style={{ 
                        fontWeight: 600, 
                        color: isPercent ? "#10b981" : "#3b82f6",
                        background: isPercent ? "#ecfdf5" : "#eff6ff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "13px"
                    }}>
                        {isPercent ? `${record.discount_amount}% OFF` : `৳${Number(record.discount_amount).toLocaleString()} OFF`}
                    </span>
                );
            }
        },
        {
            title: "Min. Cart Amount",
            dataIndex: "min_cart_amount",
            key: "min_cart_amount",
            render: (amount) => (
                <span style={{ fontWeight: 500, color: "#4b5563" }}>
                    ৳{Number(amount).toLocaleString()}
                </span>
            )
        },
        {
            title: "Validity",
            key: "validity",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                    <span style={{ color: '#4b5563' }}>
                        <span style={{ color: '#9ca3af', marginRight: '4px' }}>Start:</span>
                        {record.started_at ? dayjs(record.started_at).format("DD MMM, YYYY") : 'N/A'}
                    </span>
                    <span style={{ color: '#ef4444', fontWeight: 500 }}>
                        <span style={{ color: '#9ca3af', marginRight: '4px', fontWeight: 'normal' }}>End:</span>
                        {record.ended_at ? dayjs(record.ended_at).format("DD MMM, YYYY") : 'N/A'}
                    </span>
                </div>
            )
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (desc) => (
                <Tooltip title={desc}>
                    <span style={{ color: '#6b7280', fontSize: '13px', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {desc || "-"}
                    </span>
                </Tooltip>
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            align: 'center',
            render: (status) => {
                const isActive = status === 'active';
                return (
                    <Tag 
                        icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 
                        color={isActive ? "success" : "error"} 
                        style={{ 
                            textTransform: "capitalize", 
                            fontWeight: 500, 
                            borderRadius: '12px',
                            padding: '2px 8px'
                        }}
                    >
                        {status}
                    </Tag>
                );
            }
        },
        {
            title: "Action",
            key: "operation",
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Coupon">
                        <Button 
                            type="text" 
                            icon={<EditOutlined style={{ color: "#1890ff" }} />} 
                            onClick={() => onEdit(record)} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                background: '#e6f7ff',
                                borderRadius: '6px'
                            }}
                        />
                    </Tooltip>
                    <Popconfirm title="Delete this coupon?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Tooltip title="Delete Coupon">
                            <Button 
                                type="text" 
                                danger
                                icon={<DeleteOutlined />} 
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    background: '#fff1f0',
                                    borderRadius: '6px'
                                }}
                            />
                        </Tooltip>
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
            name           : record.name,
            code           : record.code,
            discount_amount: record.discount_amount,
            min_cart_amount: record.min_cart_amount,
            discount_type  : record.discount_type,
            started_at     : record.started_at ? dayjs(record.started_at): null,
            ended_at       : record.ended_at ? dayjs(record.ended_at)    : null,
            description    : record.description,
            status         : record.status,
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

        try {
            setLoading(true);

            const res = await postData(url, formData);

            if(res?.success){
                const refreshed = await getDatas("/admin/coupons");

                setItems(refreshed?.result?.data);

                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    setLoading(false);
                    setIsModalOpen(false);
                }, 300);
            }else{
                messageApi.open({
                    type: "error",
                    content: "Something Went Wrong",
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
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
        }else{
            messageApi.open({
                type: "error",
                content: "Something Went Wrong",
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

            {/* Quick Stat Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#f8fafc', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                        <Statistic 
                            title={<span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Total Coupons</span>}
                            value={totalCoupons} 
                            prefix={<GiftOutlined style={{ color: '#6366f1', marginRight: '6px' }} />}
                            valueStyle={{ color: '#0f172a', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#f8fafc', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                        <Statistic 
                            title={<span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Active Coupons</span>}
                            value={activeCoupons} 
                            prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: '6px' }} />}
                            valueStyle={{ color: '#10b981', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#f8fafc', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                        <Statistic 
                            title={<span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Percentage Discounts</span>}
                            value={percentageCoupons} 
                            prefix={<PercentageOutlined style={{ color: '#3b82f6', marginRight: '6px' }} />}
                            valueStyle={{ color: '#3b82f6', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <AntInput.Search allowClear placeholder="Search by name or status..." style={{ width: 320 }} value={query} onChange={(e) => setQuery(e.target.value)}/>
                <Space size="middle">
                    <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                        Add Coupon
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} size="large" onClick={() => window.history.back()} style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                        Back
                    </Button>
                </Space>
            </div>

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <Table 
                    bordered={false} 
                    loading={loading} 
                    columns={columns}  
                    dataSource={filteredData}
                    rowKey="id"
                    pagination={{
                        showSizeChanger: true,
                        defaultPageSize: 10,
                        pageSizeOptions: ['10', '20', '50'],
                        style: { marginTop: '16px' }
                    }}
                />
            </div>

            <div>
                <Modal 
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700, paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                            <GiftOutlined style={{ color: '#4f46e5' }} />
                            <span>{editingItems ? "Edit Coupon Settings" : "Create New Coupon"}</span>
                        </div>
                    } 
                    open={isModalOpen} 
                    onOk={handleSubmit} 
                    okText={editingItems ? "Update Coupon" : "Create Coupon"}
                    confirmLoading={loading} 
                    onCancel={() => setIsModalOpen(false)}
                    width={640}
                    bodyStyle={{ paddingTop: '20px' }}
                    okButtonProps={{ style: { borderRadius: '6px', height: '38px', fontWeight: 500 } }}
                    cancelButtonProps={{ style: { borderRadius: '6px', height: '38px' } }}
                >
                    <Form form={form} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="name" label={<span style={{ fontWeight: 500 }}>Coupon Name</span>} rules={[{ required: true, message: "Name is required" }]}>
                                    <AntInput placeholder="e.g. Eid Mega Sale" style={{ height: '40px', borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="code" label={<span style={{ fontWeight: 500 }}>Coupon Code</span>} rules={[{ required: true, message: "Code is required" }]}>
                                    <AntInput placeholder="e.g. EIDMEGA50" prefix={<GiftOutlined style={{ color: '#a3a3a3' }} />} style={{ height: '40px', borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="discount_amount" label={<span style={{ fontWeight: 500 }}>Discount Value</span>} rules={[{ required: true, message: "Discount is required" }]}>
                                    <AntInput type="number" placeholder="Value (e.g. 10)" style={{ height: '40px', borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="min_cart_amount" label={<span style={{ fontWeight: 500 }}>Min. Cart Amount (৳)</span>} rules={[{ required: true, message: "Minimum cart amount is required" }]}>
                                    <AntInput type="number" placeholder="e.g. 500" prefix="৳" style={{ height: '40px', borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="discount_type" label={<span style={{ fontWeight: 500 }}>Discount Type</span>} rules={[{ required: true, message: "Type is required" }]} initialValue="fixed">
                                    <Select options={[{ value: 'fixed', label: 'Fixed Amount (৳)' }, { value: 'percentage', label: 'Percentage (%)' }]} style={{ height: '40px' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="status" label={<span style={{ fontWeight: 500 }}>Status</span>} rules={[{ required: true }]} initialValue="active">
                                    <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} style={{ height: '40px' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="started_at" label={<span style={{ fontWeight: 500 }}>Start Date</span>} rules={[{ required: true, message: "Start date is required" }]}>
                                    <DatePicker style={{ width: "100%", height: '40px', borderRadius: '6px' }} suffixIcon={<CalendarOutlined />} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="ended_at" label={<span style={{ fontWeight: 500 }}>End Date</span>} rules={[{ required: true, message: "End date is required" }]}>
                                    <DatePicker style={{ width: "100%", height: '40px', borderRadius: '6px' }} suffixIcon={<CalendarOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="description" label={<span style={{ fontWeight: 500 }}>Description</span>} rules={[{ required: true, message: "Description is required" }]}>
                            <AntInput.TextArea rows={4} placeholder="Describe the terms/details of this coupon code..." style={{ borderRadius: '6px' }} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    )
}
