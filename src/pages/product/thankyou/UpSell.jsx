import {ArrowLeftOutlined,PlusOutlined,SettingOutlined,HistoryOutlined,ThunderboltOutlined,BarChartOutlined, EyeOutlined} from "@ant-design/icons";
import {Input as AntInput,Breadcrumb,Button,Popconfirm,Space,Table,Tag,message,Modal} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./upsell.css";
import UpsellProducts from "../../../components/upsell/UpsellProducts";

const getTriggerTag = (record) => {
    if (record.is_all === 1) {
        return <Tag color="blue">For all orders</Tag>;
    }

    if (
        Array.isArray(record.trigger_category_ids) &&
        record.trigger_category_ids.length > 0
    ) {
        return <Tag color="green">On category</Tag>;
    }

    return <Tag color="purple">On product</Tag>;
};

export default function UpSell() {
    // Hook
    useTitle("Up Sell Products");

    // Variable
    const navigate = useNavigate();

    // State
    const [upsell, setUpsell]           = useState([]);
    const [query, setQuery]             = useState("");
    const [loading, setLoading]         = useState(false);
    const [messageApi, contextHolder]   = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats]             = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [viewId, setViewId]           = useState(null);

    // Columns
    const columns = 
    [
        {
            title: "SL",
            dataIndex: "sl",
            key: "sl",
            width: 50,
            render: (_,__, index) => index + 1,
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (text) => <p style={{ textTransform: "capitalize" }}>{text}</p>,
        },
        {
            title: "Trigger",
            key: "trigger",
            render: (_, record) => getTriggerTag(record),
        },
        {
            title: "Start Date",
            dataIndex: "started_at",
            key: "started_at",
            render: (text) => <p>{dayjs(text).format("YYYY-MM-DD")}</p>,
        },
        {
            title: "End Date",
            dataIndex: "ended_at",
            key: "ended_at",
            render: (text) => <p>{dayjs(text).format("YYYY-MM-DD")}</p>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "active" ? "green" : "red"} style={{ textTransform: "capitalize" }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 160,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record.id)}>
                        View
                    </Button>
                    <Button size="small" type="primary" onClick={() => onEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete this?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const onView = (upsellId) => {
        setViewId(upsellId);
    }

    useEffect(() => {
        let isMounted = true;
        const fetchThankyou = async () => {
            setLoading(true);
            const res = await getDatas("/admin/up-sells");
            
            const list = res?.result?.data || [];
            if (isMounted) setUpsell(list);
            setLoading(false);
        };

        fetchThankyou();

        return () => { isMounted = false;};
    }, []);

    const openCreate = () => navigate("/add/upsell");
    const onEdit = (item) => navigate(`/edit/upsell/${item.id}`);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/up-sells/${id}`);
        if (res?.success) {
            const refreshed = await getDatas("/admin/up-sells");
            setUpsell(refreshed?.result?.data || []);
            messageApi.open({ type: "success", content: res.msg });
        }
    };

    const handleHover = (e, hover) => {
        e.currentTarget.style.setProperty("background-color", hover ? "#f5f5f5" : "#fff", "important");
        e.currentTarget.style.setProperty("border-color", hover ? "#c9c9c9" : "#d9d9d9", "important");
    };

    const handleStatistics = async () => {
        setIsModalOpen(true);
        setLoading(true);

        try {
            const res = await getDatas("/admin/down-sell/reports"); 
            setStats(res.result.stats);
            setTopProducts(res.result.top_products);
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Thank You Page Offer</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Thank You Page Offer" }]} />
                </div>
            </div>

            <div className="page-head-search">
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>

                    <Button type="primary" icon={<HistoryOutlined style={{ color: "#000" }} />}
                        style={{ backgroundColor: "#fff", borderColor: "#d9d9d9", color: "#000" }} onMouseEnter={(e) => handleHover(e, true)} onMouseLeave={(e) => handleHover(e, false)}>
                        Logs
                    </Button>

                    <Button type="primary" icon={<SettingOutlined style={{ color: "#000" }} />}
                        style={{ backgroundColor: "#fff", borderColor: "#d9d9d9", color: "#000", marginLeft: 8 }}
                        onClick={() => navigate("/upsell/settings")} onMouseEnter={(e) => handleHover(e, true)} onMouseLeave={(e) => handleHover(e, false)}
                    >
                        Settings
                    </Button>

                    <Button icon={<BarChartOutlined />} onClick={handleStatistics}
                        style={{ backgroundColor: "#fff", borderColor: "#d9d9d9", color: "#000", marginLeft: 8 }} onMouseEnter={(e) => handleHover(e, true)} onMouseLeave={(e) => handleHover(e, false)}
                    >
                        Statistics
                    </Button>
                    
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns} dataSource={upsell} rowKey="id"/>

            <Modal title="Upsell Product Statistics" open={isModalOpen} loading={loading} onOk={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} width={1000}>
                <div className="io-cards">
                    <div className="io-card">
                        <div className="io-badge"></div>
                        <div className="io-card-body">
                            <div className="io-card-label">Total Sell</div>
                            <div className="io-card-value">{stats.total_sell}</div>
                        </div>
                    </div>
                    <div className="io-card">
                        <div className="io-badge"></div>
                        <div className="io-card-body">
                            <div className="io-card-label">Sell Rate</div>
                            <div className="io-card-value">{stats.sell_rate}</div>
                        </div>
                    </div>
                    <div className="io-card">
                        <div className="io-badge"></div>
                        <div className="io-card-body">
                            <div className="io-card-label">Total Revenue</div>
                            <div className="io-card-value">{stats.total_revenue}</div>
                        </div>
                    </div>
                </div>

                <div className="recent-activity-container">
                    <h4><ThunderboltOutlined /> Top 10 Products</h4>

                    <Table  dataSource={topProducts} rowKey="product_id" pagination={false} className="top-products-table"
                        columns=
                        {
                            [
                                {
                                    title: "Image",
                                    key: "image",
                                    render: (_, record) => (
                                    <img src={record?.image ? record.image : "/no-image.png"} alt={record.product?.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover" }}
                                    />
                                    )
                                },
                                {
                                    title: "Product",
                                    key: "product_name",
                                    render: (_, record) => (
                                        <div>
                                            <b>{record.product?.name}</b>
                                            <div style={{ fontSize: 12, color: "#888" }}>৳: {record.total_amount}</div>
                                        </div>
                                    )
                                },
                                {
                                    title: "Orders",
                                    dataIndex: "total_orders",
                                    key: "total_orders",
                                    render: (v) => <b>{v}</b>
                                },
                                {
                                    title: "Quantity",
                                    dataIndex: "total_quantity",
                                    key: "total_quantity"
                                },
                                {
                                    title: "Amount",
                                    dataIndex: "total_amount",
                                    key: "total_amount",
                                    render: (v) => `৳ ${parseFloat(v).toFixed(2)}`
                                },
                                {
                                    title: "Contribution",
                                    dataIndex: "percentage",
                                    key: "percentage",
                                    render: (v) => (
                                        <span style={{ fontWeight: 600 }}>
                                            {v.toFixed(2)}%
                                        </span>
                                    )
                                }
                            ]
                        }
                    />
                </div>
            </Modal>

            {viewId && (
                <UpsellProducts upsellId={viewId} onClose={() => setViewId(null)}/>
            )}
        </>
    )
}
