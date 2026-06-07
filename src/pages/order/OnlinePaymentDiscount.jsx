
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, message, Popconfirm, Space, Table, Tag, Tooltip, Typography, Input as AntInput } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { Title, Text } = Typography;

export default function OnlinePaymentDiscount() {
    //Hook
    useTitle("Online Payment Discount");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]                     = useState("");
    const [loading, setLoading]                 = useState(false);
    const [onlinePayment, setItems]             = useState([]);
    const [messageApi, contextHolder]           = message.useMessage();
    const [filteredData, setFilteredData]       = useState([]);

    //Table Columns
    const columns = [
        {
            title : "SL",
            key   : "sl",
            width : 60,
            align : "center",
            render: (_,__, index) => <span style={{ fontWeight: 500 }}>{index + 1}</span>
        },
        {
            title    : "Payment Gateway",
            dataIndex: ["payment_gateway", "name"],
            render   : (_, record) => {
                const gateway = record?.payment_gateway;
                return (
                    <Space size="middle">
                        <img 
                            src={gateway?.image || "/default-gateway.png"} 
                            alt={gateway?.name} 
                            style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6, border: '1px solid #f0f0f0' }}
                        />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{gateway?.name}</span>
                    </Space>
                );
            },
        },
        {
            title    : "Discount",
            dataIndex: "discount_amount",
            key      : "discount_amount",
            render   : (amount, record) => (
                <Space>
                    <Text strong style={{ color: '#2563eb' }}>{amount}</Text>
                    <Tag color="blue">{record.discount_type === 'percentage' ? '%' : 'Fixed'}</Tag>
                </Space>
            )
        },
        {
            title    : "Cart Limits",
            key      : "limits",
            render   : (_, record) => (
                <div style={{ fontSize: '13px' }}>
                    <div>Min: <Text strong>{record.minimum_cart_amount}</Text></div>
                    <div>Max Dis: <Text strong>{record.maximum_discount_amount}</Text></div>
                </div>
            )
        },
        {
            title    : "Custom Message",
            dataIndex: "custom_message",
            key      : "custom_message",
            ellipsis : true,
            render   : (text) => <Text type="secondary" style={{ fontSize: '13px' }}>{text}</Text>
        },
        {
            title    : "Status",
            dataIndex: "status",
            key      : "status",
            align    : "center",
            render   : (status) => (
                <Tag color={status === 'active' ? "success" : "error"} style={{ textTransform: "capitalize", borderRadius: "10px", padding: "0 12px" }}>
                    {status}
                </Tag>
            )
        },
        {
            title : "Action",
            key   : "operation",
            width : 130,
            align : "center",
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Discount">
                        <Button 
                            type="text" 
                            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
                            onClick={() => navigate(`/edit/online-payment/discount/${record.id}`)} 
                        />
                    </Tooltip>
                    <Popconfirm title="Delete Discount Rule?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
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

    // Method to handle search
    useEffect(() => {
        if (!query) {
            setFilteredData(onlinePayment);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = onlinePayment?.filter(item => 
            item.payment_gateway?.name?.toLowerCase().includes(lowerQuery) || 
            item.discount_type?.toLowerCase().includes(lowerQuery) || 
            item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, onlinePayment]);

    // Fetch Data
    useEffect(() => {
        let isMounted = true;

        const fetchList = async () => {
            try {
                setLoading(true);
                const res = await getDatas("/admin/online-payment/discounts");
                if (res?.success && isMounted) {
                    setItems(res?.result?.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch discounts", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchList();

        return () => {
            isMounted = false;
        }
    }, []);

    const onDelete = async (id) => {
        try {
            const res = await deleteData(`/admin/online-payment/discounts/${id}`);
            if (res?.success) {
                const refreshed = await getDatas("/admin/online-payment/discounts");
                setItems(refreshed?.result?.data || []);
                message.success(res.msg);
            } else {
                message.error("Failed to delete discount rule");
            }
        } catch (error) {
            message.error("An error occurred during deletion");
        }
    }

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
            {contextHolder}
            <div className="pagehead" style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #e9ecef', marginBottom: '24px' }}>
                <div className="head-left">
                    <Title level={4} style={{ margin: 0 }}>Online Payment Discount</Title>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Payment Discounts" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={() => navigate("/add/online-payment/discount")}
                            style={{ borderRadius: '8px' }}
                        >
                            Add New Discount
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
                                placeholder="Search by gateway or status..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                allowClear
                                style={{ width: 400, borderRadius: '10px', padding: '8px 12px' }}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Total Rules: <Text strong style={{ color: '#2563eb' }}>{filteredData.length}</Text>
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
                            showTotal: (total) => `Total ${total} rules`,
                        }}
                    />
                </Card>
            </div>
        </div>
    )
}
