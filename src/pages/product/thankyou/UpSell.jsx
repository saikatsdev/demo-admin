import { ArrowLeftOutlined, PlusOutlined, SettingOutlined, HistoryOutlined, ThunderboltOutlined, BarChartOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Spin,Button, Popconfirm, Space, Table, Tag, message, Modal, Card, Statistic, Row, Col, Typography, Divider } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./upsell.css";
import UpsellProducts from "../../../components/upsell/UpsellProducts";

const { Text } = Typography;

const getTriggerTag = (record) => {
    if (record.is_all === 1) {
        return <Tag color="blue" icon={<ThunderboltOutlined />}>
            All Orders
        </Tag>;
    }
    if (Array.isArray(record.trigger_category_ids) && record.trigger_category_ids.length > 0) {
        return <Tag color="green">Category Base</Tag>;
    }
    return <Tag color="purple">Product Base</Tag>;
};

export default function UpSell() {
    useTitle("Upsell Management");

    const navigate = useNavigate();
    const [upsell, setUpsell]           = useState([]);
    const [query, setQuery]             = useState("");
    const [loading, setLoading]         = useState(false);
    const [messageApi, contextHolder]   = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats]             = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [viewId, setViewId]           = useState(null);

    const columns = 
    [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "Upsell Details",
            key: "title",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>{record.title}</Text>
                    <Space size="small">
                        {getTriggerTag(record)}
                        <Text type="secondary" style={{ fontSize: 12 }}>Created: {dayjs(record.created_at).format("MMM DD, YYYY")}</Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: "Schedule",
            key: "schedule",
            width: 250,
            render: (_, record) => (
                <div style={{ fontSize: 13 }}>
                    <div><Text type="secondary">Start:</Text> {dayjs(record.started_at).format("YYYY-MM-DD")}</div>
                    <div><Text type="secondary">End:</Text> {dayjs(record.ended_at).format("YYYY-MM-DD")}</div>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => (
                <Tag color={status === "active" ? "success" : "default"} style={{ borderRadius: 10, padding: '2px 10px', textTransform: 'capitalize', fontWeight: 600 }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Operations",
            key: "operation",
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record.id)} title="View Products"/>

                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => onEdit(record)} title="Edit Offer"/>

                    <Popconfirm title="Delete this campaign?" okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }} onConfirm={() => onDelete(record.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} title="Delete Offer" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const onView = (upsellId) => setViewId(upsellId);
    const openCreate = () => navigate("/add/upsell");
    const onEdit = (item) => navigate(`/edit/upsell/${item.id}`);

    const fetchUpsellList = async () => {
        setLoading(true);
        try {
            const res = await getDatas("/admin/up-sells");
            setUpsell(res?.result?.data || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpsellList();
    }, []);

    const onDelete = async (id) => {
        try {
            const res = await deleteData(`/admin/up-sells/${id}`);
            if (res?.success) {
                messageApi.success(res.msg);
                fetchUpsellList();
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleStatistics = async () => {
        setIsModalOpen(true);
        setLoading(true);
        try {
            const res = await getDatas("/admin/down-sell/reports"); 
            setStats(res?.result?.stats || {});
            setTopProducts(res?.result?.top_products || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUpsell = upsell.filter(item => 
        item.title?.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div style={{ padding: 16 }}>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24 }}>
                <div className="head-left">
                    <h1 className="title">Upsell Campaign List</h1>
                    <p className="subtitle">Manage and track your upsell offers performance</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Upsell List" }]} />
                </div>
            </div>

            <Card className="modern-antd-card" bodyStyle={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <AntInput.Search allowClear placeholder="Search by title..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 320 }} size="large"/>

                    <Space size="middle">
                        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8 }}>
                            Create Offer
                        </Button>

                        <Button size="small" icon={<BarChartOutlined />} onClick={handleStatistics}>
                            Stats
                        </Button>
                        
                        <Button size="small" icon={<SettingOutlined />} onClick={() => navigate("/upsell/settings")}>
                            Settings
                        </Button>

                        <Button size="small" icon={<HistoryOutlined />} title="View Logs">
                            Logs
                        </Button>

                        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                            Back
                        </Button>
                    </Space>
                </div>

                <Table 
                    columns={columns} 
                    dataSource={filteredUpsell} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    className="modern-table"
                />
            </Card>

            <Modal title={<Space><BarChartOutlined /> Upsell Campaign Insights</Space>} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={[<Button key="close" onClick={() => setIsModalOpen(false)}>Close</Button>]}
                width={1100}
                bodyStyle={{ padding: '24px' }}
            >
                <Spin spinning={loading}>
                    <Row gutter={[20, 20]} style={{ marginBottom: 30 }}>
                        <Col xs={24} md={8}>
                            <Card className="stats-card-mini">
                                <Statistic title="Total Conversions" value={stats.total_sell} prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card className="stats-card-mini">
                                <Statistic title="Conversion Rate" value={stats.sell_rate} suffix="%" valueStyle={{ color: '#3f8600' }} />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card className="stats-card-mini">
                                <Statistic title="Generated Revenue" value={stats.total_revenue} prefix="৳" />
                            </Card>
                        </Col>
                    </Row>

                    <Divider orientation="left"><Text strong><ThunderboltOutlined /> Top Performing Products</Text></Divider>
                    
                    <Table 
                        dataSource={topProducts} 
                        rowKey="product_id" 
                        pagination={false} 
                        size="middle"
                        columns={[
                            {
                                title: "Product Info",
                                key: "product",
                                render: (_, record) => (
                                    <Space size="middle">
                                        <img src={record?.image || "/no-image.png"} alt="" style={{ width: 45, height: 45, borderRadius: 6, objectFit: "cover" }} />
                                        <Text strong>{record.product?.name}</Text>
                                    </Space>
                                )
                            },
                            {
                                title: "Orders",
                                dataIndex: "total_orders",
                                key: "total_orders",
                                align: 'center',
                                render: (v) => <Tag color="blue">{v}</Tag>
                            },
                            {
                                title: "Qty Sold",
                                dataIndex: "total_quantity",
                                key: "total_quantity",
                                align: 'center',
                            },
                            {
                                title: "Revenue",
                                dataIndex: "total_amount",
                                key: "total_amount",
                                render: (v) => <Text strong>৳ {parseFloat(v).toLocaleString()}</Text>
                            },
                            {
                                title: "Performance",
                                dataIndex: "percentage",
                                key: "percentage",
                                render: (v) => <Text type="success" strong>{v.toFixed(2)}%</Text>
                            }
                        ]}
                    />
                </Spin>
            </Modal>

            {viewId && (
                <UpsellProducts upsellId={viewId} onClose={() => setViewId(null)}/>
            )}
        </div>
    );
}
