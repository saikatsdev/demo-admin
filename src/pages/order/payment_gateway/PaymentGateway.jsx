
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Card, Form, message, Popconfirm, Select, Space, Table, Tag, Tooltip, Image, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

const { Title, Text } = Typography;

export default function PaymentGateway() {
    //Hook
    useTitle("Payment Gateway");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]               = useState("");
    const [loading, setLoading]           = useState(false);
    const [paymentGateway, setItems]      = useState([]);
    const [messageApi, contextHolder]     = message.useMessage();
    const [filteredData, setFilteredData] = useState([]);

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
            title: "Gateway Icon",
            dataIndex: "image",
            key: "image",
            width: 120,
            align: "center",
            render: (src, record) => (
                <div style={{ padding: '4px' }}>
                    <Image 
                        src={src || "/default-gateway.png"} 
                        alt={record.name} 
                        width={60}
                        height={40}
                        style={{ borderRadius: "8px", objectFit: "contain", border: '1px solid #f0f0f0' }}
                        fallback="/default-gateway.png"
                    />
                </div>
            )
        },
        {
            title: "Gateway Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <span style={{ fontWeight: 600, color: '#1e293b' }}>{text}</span>
        },
        {
            title: "Phone / Account Number",
            dataIndex: "phone_number",
            key: "phone_number",
            render: (text) => <Text copyable={{ tooltips: ['Copy Number', 'Copied!'] }}>{text || "N/A"}</Text>
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            align: "center",
            render: (status) => (
                <Tag color={status === 'active' ? "success" : "error"} style={{ textTransform: "capitalize", borderRadius: "10px", padding: "0 12px" }}>
                    {status}
                </Tag>
            )
        },
        {
            title: "Action",
            key: "operation",
            width: 140,
            align: "center",
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Gateway">
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: "#1890ff" }} />}
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm title="Move to Trash?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
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
        navigate("/add/payment/gateway");
    }

    const onEdit = (record) => {
        navigate(`/edit/payment/gateway/${record.id}`);
    }

    useEffect(() => {
        if (!query) {
            setFilteredData(paymentGateway);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = paymentGateway?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || 
            item.phone_number?.toLowerCase().includes(lowerQuery) || 
            item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, paymentGateway]);

    useEffect(() => {
        let isMounted = true;

        const fetchGateways = async () => {
            try {
                setLoading(true);
                const res = await getDatas("/admin/payment-gateways");
                if (res?.success && isMounted) {
                    setItems(res?.result?.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch gateways", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchGateways();

        return () => {
            isMounted = false;
        }
    }, []);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/payment-gateways/${id}`);

        if (res?.success) {
            const refreshed = await getDatas("/admin/payment-gateways");
            setItems(refreshed?.result?.data || []);

            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }
    }

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
            {contextHolder}
            
            <div className="pagehead" style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #e9ecef', marginBottom: '24px' }}>
                <div className="head-left">
                    <Title level={4} style={{ margin: 0 }}>Payment Gateway List</Title>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Payment Gateway" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space>
                        <Button 
                            icon={<DeleteOutlined />} 
                            onClick={() => navigate('/payment/gateway/trash')}
                            style={{ borderRadius: '8px' }}
                        >
                            Trash
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={openCreate}
                            style={{ borderRadius: '8px' }}
                        >
                            Add New Gateway
                        </Button>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate(-1)}
                            style={{ borderRadius: '8px' }}
                        >
                            Back
                        </Button>
                    </Space>
                </div>
            </div>

            <div style={{ padding: '0 24px' }}>
                <Card 
                    variant="borderless" 
                    style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                            <AntInput
                                placeholder="Search by name, number or status..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                allowClear
                                style={{ width: 400, borderRadius: '10px', padding: '8px 12px' }}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Total Found: <Text strong style={{ color: '#1890ff' }}>{filteredData.length}</Text> Gateways
                            </div>
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
                            showTotal: (total) => `Showing ${total} gateways`,
                            position: ['bottomRight']
                        }}
                        style={{ background: '#fff' }}
                    />
                </Card>
            </div>
        </div>
    )
}
