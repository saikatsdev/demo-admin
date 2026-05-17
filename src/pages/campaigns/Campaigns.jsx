import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, InfoCircleOutlined, CalendarOutlined, BarChartOutlined, FireOutlined, CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Popconfirm, Space, Table, Divider, Card, Tag, Col, Row, Tooltip, Modal, Spin, message, Statistic } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function Campaigns() {
    // Hook
    useTitle("Campaigns");

    const [query, setQuery]         = useState("");
    const [campaigns, setCampaings] = useState([]);
    const [loading, setLoading]     = useState(false);
    const [apiLoading, setApiLoading]     = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [campaignDetails, setCampaignDetails] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate                  = useNavigate();

    // Local Search Filter Implementation
    const filteredCampaigns = campaigns.filter(c => {
        if (!query.trim()) return true;
        return c.title?.toLowerCase().includes(query.toLowerCase());
    });

    // Statistics Calculation
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const inactiveCampaigns = campaigns.filter(c => c.status === "inactive").length;

    const columns = [
        {
            title: 'SL',
            key: 'sl',
            width: 60,
            align: 'center',
            render: (_, __, index) => (
                <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: '#f1f5f9', 
                    color: '#64748b', 
                    fontWeight: 500,
                    fontSize: '12px'
                }}>
                    {index + 1}
                </span>
            )
        },
        {
            title: 'Banner Image',
            dataIndex: 'image',
            key: 'image',
            width: 120,
            render: (src, record) => (
                <img 
                    src={src || "/placeholder.jpg"} 
                    alt={record.title} 
                    style={{ width: "80px", height: "45px", borderRadius: "6px", objectFit: "cover", border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                />
            )
        },
        {
            title: 'Campaign Name',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{text}</span>
                    <Tooltip title="Click to View Campaign Items">
                        <InfoCircleOutlined 
                            style={{ color: "#6366f1", cursor: "pointer", transition: 'all 0.2s', fontSize: '15px' }} 
                            onClick={() => fetchCampaignDetails(record.id)}
                            className="hover-scale"
                        />
                    </Tooltip>
                </div>
            )
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (start_date) => {
                if (!start_date) return "-";

                const dateObj = new Date(start_date);
                const formatted = dateObj.toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka",
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                });

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#475569' }}>
                        <CalendarOutlined style={{ color: '#94a3b8' }} />
                        <span>{formatted}</span>
                    </div>
                );
            }
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            render: (end_date) => {
                if (!end_date) return "-";

                const dateObj = new Date(end_date);
                const formatted = dateObj.toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka",
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                });

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#475569' }}>
                        <CalendarOutlined style={{ color: '#94a3b8' }} />
                        <span>{formatted}</span>
                    </div>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            align: 'center',
            render: (status) => {
                const isActive = status === "active";
                return (
                    <Tag 
                        color={isActive ? "success" : "error"} 
                        icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        style={{ 
                            borderRadius: '20px', 
                            padding: '3px 12px', 
                            fontWeight: 600, 
                            textTransform: 'capitalize',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'operation',
            width: 110,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Campaign">
                        <Button 
                            type="text" 
                            icon={<EditOutlined style={{ color: '#4f46e5' }} />} 
                            onClick={() => onEdit(record.id)}
                            style={{ background: '#f5f3ff', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                    </Tooltip>
                    <Popconfirm 
                        title="Delete this campaign?" 
                        okText="Delete" 
                        cancelText="Cancel" 
                        onConfirm={() => onDelete(record.id)} 
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete Campaign">
                            <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />} 
                                style={{ background: '#fff1f0', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    const openCreate = () => {
        navigate("/add/campaign");
    }

    const onEdit = (id) => {
        navigate(`/edit/campaign/${id}`);
    }

    const fetchCampaignDetails = async (id) => {
        try {
            setApiLoading(true);

            const res = await getDatas(`/admin/campaigns/${id}`);

            if(res && res?.success){
                setCampaignDetails(res?.result?.campaign_products || []);
                setIsModalOpen(true);
            }
        } catch (err) {
            message.error("Failed to load campaign details", err);
        } finally {
            setApiLoading(false);
        }
    };

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/campaigns/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/campaigns");

            if(refreshed?.success){
                messageApi.open({
                  type: "success",
                  content: res?.msg,
                });
                setCampaings(refreshed?.result?.data);
            }
        }
    }

    useEffect(() => {
        let isMounted = true;
        const fetchCampaigns = async () => {
            setLoading(true);
            const res = await getDatas("/admin/campaigns");

            const list = res?.result?.data || [];

            if(isMounted){
                setCampaings(list);
                setLoading(false);
            }
        }

        fetchCampaigns();
    }, []);

    const money = (v) => `৳${Number(v || 0).toLocaleString("en-BD")}`;

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{ fontWeight: 600 }}>All Campaigns</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Campaigns" },
                        ]}
                    />
                </div>
            </div>

            {/* Premium Dynamic Statistics Ribbon */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderLeft: '4px solid #6366f1' }}>
                        <Statistic 
                            title={<span style={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Total Campaigns</span>}
                            value={totalCampaigns}
                            prefix={<BarChartOutlined style={{ color: '#6366f1', marginRight: '6px' }} />}
                            valueStyle={{ color: '#1e293b', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderLeft: '4px solid #10b981' }}>
                        <Statistic 
                            title={<span style={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Active Campaigns</span>}
                            value={activeCampaigns}
                            prefix={<FireOutlined style={{ color: '#10b981', marginRight: '6px' }} />}
                            valueStyle={{ color: '#10b981', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderLeft: '4px solid #ef4444' }}>
                        <Statistic 
                            title={<span style={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Inactive Campaigns</span>}
                            value={inactiveCampaigns}
                            prefix={<CloseCircleOutlined style={{ color: '#ef4444', marginRight: '6px' }} />}
                            valueStyle={{ color: '#ef4444', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Controls Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: '12px' }}>
                <AntInput.Search 
                    allowClear 
                    placeholder="Search by campaign name..." 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    style={{ width: 320 }}
                    size="large"
                />
                <Space size="middle">
                    <Tooltip title="Add New Campaign">
                        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                            Add Campaign
                        </Button>
                    </Tooltip>
                    
                    <Button icon={<ArrowLeftOutlined />} size="large" onClick={() => window.history.back()} style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                        Back
                    </Button>
                </Space>
            </div>

            {/* Data Table */}
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} bodyStyle={{ padding: 0 }}>
                <Table 
                    rowKey="id" 
                    loading={loading} 
                    columns={columns} 
                    dataSource={filteredCampaigns} 
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            </Card>

            {/* Details Modal */}
            <Modal 
                title={<span style={{ fontWeight: 700, fontSize: '18px', color: '#1e293b' }}>🎁 Campaign Items Detail</span>} 
                open={isModalOpen} 
                onCancel={() => setIsModalOpen(false)} 
                footer={null} 
                width={850}
                bodyStyle={{ padding: '8px 0px' }}
                style={{ borderRadius: '12px', overflow: 'hidden' }}
            >
                {apiLoading ? (
                    <div style={{ textAlign: "center", padding: '60px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Row gutter={[16, 16]} style={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px 16px' }}>
                        {campaignDetails?.map((item) => {
                            const product = item.product;
                            const variations = product?.variations || [];
                            const categories = product?.categories;

                            return (
                                <Col span={24} key={item.id}>
                                    <Card 
                                        bordered={false} 
                                        style={{ 
                                            borderRadius: '10px', 
                                            border: '1px solid #f1f5f9', 
                                            background: '#f8fafc',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                        }} 
                                        bodyStyle={{ padding: 16 }}
                                    >
                                        <Row gutter={16} align="middle">
                                            <Col xs={24} sm={5} style={{ textAlign: 'center' }}>
                                                <img 
                                                    src={product?.img_path || "/placeholder.jpg"} 
                                                    alt="" 
                                                    style={{ width: "90px", height: "90px", borderRadius: 8, objectFit: "cover", border: '1px solid #e2e8f0' }}
                                                />
                                            </Col>

                                            <Col xs={24} sm={19}>
                                                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                                                    {product?.name}
                                                </h4>

                                                <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {Array.isArray(categories) && categories.length > 0 ? (
                                                        categories.map((c) => (
                                                            <Tag key={c.id} color="blue" style={{ borderRadius: '4px' }}>
                                                                {c.name}
                                                            </Tag>
                                                        ))
                                                    ) : (
                                                        <Tag style={{ borderRadius: '4px' }}>No Category</Tag>
                                                    )}

                                                    {variations.length === 0 && (
                                                        <Space>
                                                            <Tag color="cyan" style={{ textTransform: "capitalize", borderRadius: '4px' }}>
                                                                {item.discount_type}
                                                            </Tag>

                                                            <Tag color="success" style={{ borderRadius: '4px', fontWeight: 600 }}>
                                                                {item.discount_type === "percentage" ? `${Math.round(item.discount)}% OFF` : `Save ${money(Math.round(item.discount))}`}
                                                            </Tag>  
                                                        </Space>
                                                    )}
                                                </div>

                                                {variations.length > 0 ? (
                                                    <div>
                                                        <Divider style={{ margin: "12px 0 10px 0" }} plain>
                                                            <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.05em', fontWeight: 600 }}>VARIATIONS</span>
                                                        </Divider>

                                                        <Space direction="vertical" style={{ width: "100%" }} size={6}>
                                                            {variations.map((v) => {
                                                                const mrp = Number(v.mrp || 0);
                                                                const sell = Number(v.offer_price || 0);
                                                                const saveAmount = mrp - sell;

                                                                return (
                                                                    <div 
                                                                        key={v.id} 
                                                                        style={{ 
                                                                            background: "#ffffff", 
                                                                            border: '1px solid #e2e8f0', 
                                                                            borderRadius: '8px', 
                                                                            padding: '8px 12px',
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            flexWrap: 'wrap',
                                                                            gap: '8px'
                                                                        }}
                                                                    >
                                                                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>
                                                                            {v.attribute_value_1?.name || "Standard Variant"}
                                                                        </span>

                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                                            <div>
                                                                                <span style={{ textDecoration: "line-through", color: "#94a3b8", marginRight: 8, fontSize: '12px' }}>
                                                                                    {money(Math.round(mrp))}
                                                                                </span>
                                                                                <span style={{ color: "#10b981", fontWeight: 700, fontSize: '13px' }}>
                                                                                    {money(Math.round(sell))}
                                                                                </span>
                                                                            </div>

                                                                            <Space size={4}>
                                                                                <Tag color="cyan" style={{ textTransform: "capitalize", fontSize: '10px', borderRadius: '4px', margin: 0 }}>
                                                                                    {v.discount_type}
                                                                                </Tag>
                                                                                <Tag color="purple" style={{ fontSize: '10px', borderRadius: '4px', margin: 0, fontWeight: 600 }}>
                                                                                    Disc: {v.discount}{v.discount_type === "percentage" ? "%" : ""}
                                                                                </Tag>
                                                                                {saveAmount > 0 && (
                                                                                    <Tag color="success" style={{ fontSize: '10px', borderRadius: '4px', margin: 0, fontWeight: 600 }}>
                                                                                        Save {money(Math.round(saveAmount))}
                                                                                    </Tag>
                                                                                )}
                                                                            </Space>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </Space>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 4 }}>
                                                        <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: '13px' }}>
                                                            {money(item.mrp)}
                                                        </span>
                                                        <span style={{ fontSize: "16px", fontWeight: "bold", color: "#10b981" }}>
                                                            {money(item.offer_price)}
                                                        </span>
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Modal>
        </>
    );
}
