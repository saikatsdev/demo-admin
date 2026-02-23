import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined,InfoCircleOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Popconfirm, Space, Table, Divider,Card,Tag,Col,Row,Tooltip,Modal,Spin, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function Campaigns() {
    // Hook
    useTitle("Campaigns");

    const [query, setQuery]         = useState();
    const [campaigns, setCampaings] = useState([]);
    const [loading, setLoading]     = useState(false);
    const [apiLoading, setApiLoading]     = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [campaignDetails, setCampaignDetails] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate                  = useNavigate();

    const columns = [
        {
            title: 'SL',
            key: 'sl',
            width:50,
            render: (_,__, index) => (
                index + 1
            )
        },
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            render:(src,record) => (
                <img src={src} alt={record.title} style={{width:"30px", height:"30px", borderRadius:"4px", objectFit:"cover"}}/>
            )
        },
        {
            title: 'Campaign Name',
            dataIndex: 'title',
            key:'title',
            render: (text, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {text}
                    <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer" }} onClick={() => fetchCampaignDetails(record.id)}/>
                </div>
            )
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key:'start_date',
            render: (start_date) => {
                if (!start_date) return "";

                const dateObj = new Date(start_date);

                return dateObj.toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                });
            }
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key:'end_date',
            render: (end_date) => {
                if (!end_date) return "";

                const dateObj = new Date(end_date);

                return dateObj.toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                });
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key:'status',
            render: (status) => (
                <Tag style={{textTransform:"capitalize"}} color={status === "active" ? "green" : "red"}>{status}</Tag>
            ),
        },
        {
            title: 'Action',
            key:'operation',
            width:150,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onEdit(record.id)}>
                        <EditOutlined />
                    </Button>
                    <Popconfirm title="Delete campaign?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)} >
                        <Button size="small" danger>
                            <DeleteOutlined />
                        </Button>
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
            message.error("Failed to load campaign", err);
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

    const money = (v) => `৳ ${Number(v || 0).toLocaleString("en-BD")}`;

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{fontWeight:600}}>All Campaigns</h1>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Tooltip placement="top" title="Add Campaigns">
                        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    </Tooltip>
                    
                    <Tooltip placement="top" title="Back">
                        <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                    </Tooltip>
                </Space>
            </div>

            <Table rowKey="id" loading={loading} columns={columns} dataSource={campaigns} scroll={{ x: 'max-content' }}/>

            <Modal title="Campaign Products" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={900}>
                {apiLoading ? (
                    <div style={{ textAlign: "center", padding: 40 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Row gutter={[16, 16]}>
                        {campaignDetails?.map((item) => {
                            const product = item.product;
                            const variations = product?.variations || [];

                            return (
                                <Col span={24} key={item.id}>
                                    <Card style={{ borderRadius: 10 }} bodyStyle={{ padding: 16 }}>
                                        <Row gutter={16}>
                                            <Col span={5}>
                                                <img src={product?.img_path} alt="" style={{width: "80%",borderRadius: 8,objectFit: "cover"}}/>
                                            </Col>

                                            <Col span={19}>
                                                <h3 style={{ marginBottom: 5, fontSize:18 }}>
                                                    {product?.name}
                                                </h3>

                                                <div style={{ marginBottom: 10 }}>
                                                    <Tag color="blue">
                                                        {product?.category?.name}
                                                    </Tag>

                                                    <Tag color="red">
                                                        {item.discount_type === "percentage" ? `${Math.round(item.discount)}% OFF` : `Save ${money(Math.round(item.discount))}`}
                                                    </Tag>
                                                </div>

                                                {variations.length > 0 ? (
                                                    <div>
                                                        <Divider style={{ margin: "10px 0" }}>
                                                            Variations
                                                        </Divider>

                                                        <Space direction="vertical" style={{ width: "100%" }}>
                                                            {variations.map((v) => {
                                                                const mrp = Number(v.mrp || 0);
                                                                const sell = Number(v.offer_price || 0);
                                                                const saveAmount = mrp - sell;

                                                                return (
                                                                    <Card size="small" key={v.id} style={{ background: "#fafafa" }}>
                                                                        <Row justify="space-between" align="middle">
                                                                            <Col>
                                                                                <b>{v.attribute_value_1?.name}</b>
                                                                            </Col>

                                                                            <Col style={{ textAlign: "right" }}>
                                                                                <div>
                                                                                    <span style={{textDecoration: "line-through",color: "#999",marginRight: 10}}>
                                                                                        {money(Math.round(mrp))}
                                                                                    </span>

                                                                                    <span style={{color: "#52c41a",fontWeight: 700,fontSize: 16}}>
                                                                                        {money(Math.round(sell))}
                                                                                    </span>
                                                                                </div>

                                                                                {saveAmount > 0 && (
                                                                                    <div style={{ marginTop: 4 }}>
                                                                                        <Tag color="volcano">
                                                                                            Save {money(Math.round(saveAmount))}
                                                                                        </Tag>
                                                                                    </div>
                                                                                )}
                                                                            </Col>
                                                                        </Row>
                                                                    </Card>
                                                                );
                                                            })}
                                                        </Space>
                                                    </div>
                                                ) : (
                                                    (() => {
                                                        const saveAmount = Number(item.mrp || 0) - Number(item.offer_price || 0);

                                                        return (
                                                            <div style={{ marginBottom: 10 }}>
                                                                <span style={{textDecoration: "line-through", color: "#999"}}>
                                                                    {money(item.mrp)}
                                                                </span>

                                                                <span style={{marginLeft: 12,fontSize: 18,fontWeight: "bold",color: "#52c41a"}}>
                                                                    {money(item.offer_price)}
                                                                </span>

                                                                {saveAmount > 0 && (
                                                                    <Tag color="volcano" style={{ marginLeft: 4 }}>
                                                                        Save {money(Math.round(saveAmount))}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        );
                                                    })()
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
