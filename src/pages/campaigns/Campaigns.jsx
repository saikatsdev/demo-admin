import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Popconfirm, Space, Table, Tag, Tooltip, message } from "antd";
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
    const [messageApi, contextHolder] = message.useMessage();
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
            key:'title'
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
        </>
    );
}
