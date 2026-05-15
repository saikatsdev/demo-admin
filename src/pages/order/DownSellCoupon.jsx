import { ArrowLeftOutlined, BarChartOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, FireOutlined, PlusOutlined, ShoppingCartOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Card, Divider, Input, message, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteData, getDatas } from '../../api/common/common';
import { useDebounce } from '../../hooks/useDebounce';
import useTitle from '../../hooks/useTitle';
import "./downsell/downsell.css";

const { Text, Title } = Typography;

const DownSellCoupon = () => {
    // Hook
    useTitle("Downsell Campaigns");

    const navigate = useNavigate();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const dSearch = useDebounce(search, 300);
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);

    async function fetchRows() {
        try {
            setLoading(true);
            const res = await getDatas('/admin/down-sells', { per_page: 50 });
            const list = res?.result?.data || res?.data || [];
            setRows(list);
        } catch (e) {
            console.error(e);
            messageApi.error('Failed to load campaigns');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { 
        fetchRows(); 
    }, []);

    const filtered = useMemo(() => {
        const k = (dSearch || '').toLowerCase();
        if (!k) return rows;
        return rows.filter(r => `${r.title} ${r.amount} ${r.status}`.toLowerCase().includes(k));
    }, [rows, dSearch]);

    const handleDelete = async (id) => {
        try {
            const res = await deleteData(`/admin/down-sells/${id}`);
            if (res && res?.success) {
                messageApi.success(res.msg || "Campaign deleted successfully");
                fetchRows();
            } else {
                messageApi.error(res?.msg || "Failed to delete campaign");
            }
        } catch (error) {
            messageApi.error("Something went wrong");
        }
    };

    const columns = [
        { 
            title: 'SL', 
            dataIndex: 'id', 
            render: (_, __, index) => <Text type="secondary">{index + 1}</Text>, 
            width: 60 
        },
        {
            title: 'Image',
            dataIndex: 'image',
            width: 120,
            render: (url) => url ? (
                <div style={{ padding: 4, border: '1px solid #f0f0f0', borderRadius: 8, display: 'inline-block', background: '#fff' }}>
                    <img src={url} alt="Campaign" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                </div>
            ) : (
                <Tag color="default">No Image</Tag>
            ),
        },
        { 
            title: 'Details', 
            key: 'title',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 15 }}>{record.title}</Text>
                    <Text type="secondary" size="small">{record.description?.substring(0, 50)}{record.description?.length > 50 ? '...' : ''}</Text>
                </Space>
            )
        },
        { 
            title: 'Offer', 
            dataIndex: 'amount', 
            width: 130,
            render: (amount, record) => (
                <Tag color="blue" style={{ fontWeight: 600, padding: '4px 8px' }}>
                    {record.type === 'percent' ? `${amount}% OFF` : `৳${amount} OFF`}
                </Tag>
            )
        },
        { 
            title: 'Schedule', 
            key: 'schedule',
            width: 220,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text size="small" type="secondary">Start: <Text strong>{record.started_at?.split(" ")[0]}</Text></Text>
                    <Text size="small" type="secondary">End: <Text strong>{record.ended_at?.split(" ")[0]}</Text></Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 100,
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'default'} style={{ textTransform: "capitalize", borderRadius: 12, padding: '2px 10px' }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => navigate(`/edit/downsell/${record.id}`)} title="Edit Campaign"/>
                    <Popconfirm title="Delete Campaign?" description="Are you sure you want to delete this offer?" okText="Yes" cancelText="No" onConfirm={() => handleDelete(record.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} title="Delete Campaign" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const stats = [
        { key: "total", label: "Active Offers", value: rows.filter(r => r.status === 'active').length, icon: <ShoppingCartOutlined /> },
        { key: "recovered", label: "Fixed Amount", value: rows.filter(r => r.type === 'fixed').length, icon: <CheckCircleOutlined /> },
        { key: "rate", label: "Percentage", value: rows.filter(r => r.type === 'percent').length, icon: <ThunderboltOutlined /> },
        { key: "revenue", label: "Total Campaigns", value: rows.length, icon: <FireOutlined /> },
    ];

    return (
        <div style={{ padding: 16 }}>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Downsell Campaigns</h1>
                    <p className="subtitle">Manage promotional offers triggered when customers skip upsells</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: 'Downsell Campaigns' }]} />
                </div>
            </div>

            <Card className="modern-antd-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <Input placeholder="Search by campaign name or amount..." allowClear prefix={<ThunderboltOutlined style={{ color: '#bfbfbf' }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 400, height: 40, borderRadius: 8 }}/>

                    <Space size="middle">
                        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => navigate("/add/down-sell")}>
                            Create Offer
                        </Button>

                        <Button size="small" icon={<BarChartOutlined />} onClick={() => setIsModalOpen(true)}>
                            Statistics
                        </Button>

                        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                            Back
                        </Button>
                    </Space>
                </div>

                <Table 
                    rowKey="id" 
                    loading={loading} 
                    columns={columns} 
                    dataSource={filtered} 
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    className="modern-table"
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Modal title={<Space><BarChartOutlined /> Campaign Insights</Space>} 
                open={isModalOpen} 
                onCancel={() => setIsModalOpen(false)} 
                footer={[<Button key="close" type="primary" onClick={() => setIsModalOpen(false)}>Close Insights</Button>]}
                width={800}
                className="io-modal"
            >
                <div className="io-cards">
                    {stats.map((s) => (
                        <div key={s.key} className="io-card">
                            <div className="io-badge">{s.icon}</div>
                            <div className="io-card-body">
                                <div className="io-card-label">{s.label}</div>
                                <div className="io-card-value">{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <Divider style={{ margin: '32px 0 24px' }} />

                <div className="recent-activity-container">
                    <Title level={5}><ThunderboltOutlined style={{ color: '#faad14' }} /> Performance Summary</Title>
                    <div className="activity-stats">
                        <div className="activity-card">
                            <p>Today's Interactions</p>
                            <p>Active Displays: <span className="new">124</span></p>
                            <p>Conversions: <span className="converted">18</span></p>
                        </div>
                        <div className="activity-card">
                            <p>Last 7 Days</p>
                            <p>Active Displays: <span className="new">842</span></p>
                            <p>Conversions: <span className="converted">112</span></p>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DownSellCoupon;
