import {ArrowLeftOutlined,PlusOutlined,SettingOutlined,HistoryOutlined,ThunderboltOutlined,BarChartOutlined, EyeOutlined, EditOutlined, DeleteOutlined} from "@ant-design/icons";
import {Input as AntInput,Breadcrumb,Button,Popconfirm,Space,Table,Tag,message,Modal} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import UpsellProducts from "../../../components/upsell/UpsellProducts";
import "./crosssell.css";

const getTriggerTag = (record) => {
    if (record.condition_type === "all_product") {
        return <Tag color="blue">For all Product</Tag>;
    }

    if (record.condition_type === "on_category") {
        return <Tag color="green">On Specific Category</Tag>;
    }

    if (record.condition_type === "on_product") {
        return <Tag color="purple">On Specific Product</Tag>;
    }

    return <Tag color="default">N/A</Tag>;
};


export default function CrossSell() {
    // Hook
    useTitle("Cross Sell Products");

    // Variable
    const navigate = useNavigate();

    // State
    const [upsell, setUpsell]           = useState([]);
    const [query, setQuery]             = useState("");
    const [loading, setLoading]         = useState(false);
    const [messageApi, contextHolder]   = message.useMessage();
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
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record.id)} />
                    <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => onEdit(record)} />
                    <Popconfirm title="Delete this?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
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
            const res = await getDatas("/admin/cross-sells");
            
            const list = res?.result?.data || [];
            if (isMounted) setUpsell(list);
            setLoading(false);
        };

        fetchThankyou();

        return () => { isMounted = false;};
    }, []);

    const openCreate = () => navigate("/cross-sell/add");
    const onEdit = (item) => navigate(`/cross-sell/edit/${item.id}`);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/cross-sells/${id}`);
        if (res?.success) {
            const refreshed = await getDatas("/admin/cross-sells");
            setUpsell(refreshed?.result?.data || []);
            messageApi.open({ type: "success", content: res.msg });
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Cross Sell Offer</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Cross Sell Offer" }]} />
                </div>
            </div>

            <div className="page-head-search">
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns} dataSource={upsell} rowKey="id"/>

            {viewId && (
                <UpsellProducts upsellId={viewId} onClose={() => setViewId(null)}/>
            )}
        </>
    )
}
