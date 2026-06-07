
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Image, Input as AntInput, message, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

const { Title, Text } = Typography;

export default function Courier() {
    // Hook
    useTitle("Courier Management");

    // State
    const [couriers, setCouriers]           = useState([]);
    const [loading, setLoading]             = useState(false);
    const [query, setQuery]                 = useState("");
    const [filteredData, setFilteredData]   = useState([]);
    const [messageApi, contextHolder]       = message.useMessage();

    // Variable
    const navigate = useNavigate();

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: "center",
            render: (_, __, index) => <span style={{ fontWeight: 500 }}>{index + 1}</span>
        },
        {
            title: "Logo",
            dataIndex: "image",
            key: "image",
            width: 100,
            align: "center",
            render: (src, record) => (
                <div style={{ padding: '4px' }}>
                    <Image 
                        src={src || "/default-courier.png"} 
                        alt={record.name} 
                        width={40}
                        height={40}
                        style={{ borderRadius: "8px", objectFit: "cover", border: '1px solid #f0f0f0' }}
                        fallback="/default-courier.png"
                    />
                </div>
            ),
        },
        {
            title: "Courier Details",
            key: "details",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{record.name}</span>
                        {Number(record.is_default) === 1 && (
                            <Tag color="cyan" style={{ fontSize: '10px', borderRadius: '4px' }}>DEFAULT</Tag>
                        )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.slug}</Text>
                </Space>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            align: "center",
            render: (status) => (
                <Tag color={status === "active" ? "success" : "error"} style={{ textTransform: "capitalize", borderRadius: "10px", padding: "0 12px" }}>
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
                    <Tooltip title="Edit Courier">
                        <Button 
                            type="text" 
                            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
                            onClick={() => onEdit(record)} 
                        />
                    </Tooltip>
                    <Popconfirm title="Delete Courier?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
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
        }
    ];

    const openCreate = () => {
        navigate("/add/online-payment/discount"); // Wait, correct path for courier
        navigate("/add/courier");
    }

    const onEdit = (record) => {
        navigate(`/edit/courier/${record.id}`);
    }

    const openTrash = () => {
        navigate('/trash/courier');
    }

    const onDelete = async (id) => {
        try {
            const res = await deleteData(`/admin/couriers/${id}`);
            if (res?.success) {
                const refresh = await getDatas("/admin/couriers");
                setCouriers(refresh?.result?.data || []);
                message.success(res.msg);
            } else {
                message.error("Failed to delete courier");
            }
        } catch (error) {
            message.error("An error occurred during deletion");
        }
    }

    // Handle Search
    useEffect(() => {
        if (!query) {
            setFilteredData(couriers);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = couriers?.filter(item => 
            item.name?.toLowerCase().includes(lowerQuery) || 
            item.slug?.toLowerCase().includes(lowerQuery) || 
            item.status?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, couriers]);

    useEffect(() => {
        let isMounted = true;

        const fetchCouriers = async () => {
            try {
                setLoading(true);
                const res = await getDatas("/admin/couriers");
                if (res?.success && isMounted) {
                    setCouriers(res?.result?.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch couriers", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchCouriers();

        return () => {
            isMounted = false;
        }
    }, []);

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
            {contextHolder}
            <div className="pagehead" style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #e9ecef', marginBottom: '24px' }}>
                <div className="head-left">
                    <Title level={4} style={{ margin: 0 }}>Courier Management</Title>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Couriers" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space>
                        <Button 
                            icon={<DeleteOutlined />} 
                            onClick={openTrash}
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
                            Add New Courier
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
                                placeholder="Search couriers by name, slug or status..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                allowClear
                                style={{ width: 400, borderRadius: '10px', padding: '8px 12px' }}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Active Couriers: <Text strong style={{ color: '#2563eb' }}>{filteredData.length}</Text>
                            </div>
                        </div>
                    }
                >
                    <Table 
                        loading={loading} 
                        columns={columns} 
                        dataSource={filteredData}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) => `Total ${total} couriers`,
                        }}
                    />
                </Card>
            </div>
        </div>
    );
}
