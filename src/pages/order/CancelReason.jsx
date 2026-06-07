import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Card, Form, message, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function CancelReason() {
    //Hook
    useTitle("All Cancel Reason");

    // State
    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [cancelReasons, setItems]       = useState([]);
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [messageApi, contextHolder]     = message.useMessage();
    const [editingItems, setEditingItems] = useState(null);
    const [filteredData, setFilteredData] = useState(cancelReasons);
    const [form]                          = Form.useForm();

    //Table Columns
    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: "center",
            render: (_, __, index) => <span style={{ fontWeight: 500 }}>{index + 1}</span>
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <span style={{ fontWeight: 600, color: "#1890ff" }}>{text}</span>
        },
        {
            title: "Orders Count",
            dataIndex: "orders_count",
            key: "orders_count",
            align: "center",
            render: (count) => <Tag color="blue">{count || 0}</Tag>
        },
        {
            title: "Total Amount",
            dataIndex: "total_amount",
            key: "total_amount",
            align: "right",
            render: (amount) => <span style={{ fontFamily: "monospace" }}>{amount || 0} TK</span>
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            align: "center",
            render: (status) => (
                <Tag color={status === 'active' ? "success" : "error"} style={{ textTransform: "capitalize", borderRadius: "10px", padding: "0 10px" }}>
                    {status}
                </Tag>
            )
        },
        {
            title: "Action",
            key: "operation",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: "#1890ff" }} />}
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm title="Delete Item?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
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
            name:record.name,
            status:record.status,
        });
    }

    useEffect(() => {
        if(!query){
            setFilteredData(cancelReasons);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = cancelReasons?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, cancelReasons]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/cancel-reasons");

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
        if(values.status) formData.append('status', values.status);

        if(editingItems?.id) formData.append('_method', 'PUT');

        const url = editingItems?.id ? `/admin/cancel-reasons/${editingItems.id}` : `/admin/cancel-reasons`;

        setLoading(true);

        const res = await postData(url, formData);

        if(res?.success){
            const refreshed = await getDatas("/admin/cancel-reasons");

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
        const res = await deleteData(`/admin/cancel-reasons/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/cancel-reasons");

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
                    <h1 className="title">All Cancel Reason List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Cancel Reason List" },
                        ]}
                    />
                </div>
            </div>

            <Card
                style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                        <AntInput
                            placeholder="Search by name or status..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            allowClear
                            style={{ width: 350, borderRadius: '8px' }}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Space>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={openCreate}
                                style={{ borderRadius: '8px' }}
                            >
                                Add Reason
                            </Button>
                            <Button 
                                icon={<ArrowLeftOutlined />} 
                                onClick={() => window.history.back()}
                                style={{ borderRadius: '8px' }}
                            >
                                Back
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Table 
                    bordered 
                    loading={loading} 
                    columns={columns} 
                    dataSource={filteredData} 
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`,
                    }}
                />
            </Card>

            <div>
                <Modal title={editingItems ? "Edit Info" : "Create New"} open={isModalOpen} onOk={handleSubmit} okText={editingItems ? "Update" : "Create"} confirmLoading={loading} onCancel={() => setIsModalOpen(false)}>
                    <div>
                        <Form form={form} layout="vertical" initialValues={{width:"960", height:"1200"}}>
                            <div>
                                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                    <AntInput placeholder="Enter Name" />
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
