import { ArrowLeftOutlined, BackwardOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button,Popconfirm, Space, Table, Tag, message } from "antd";
import { useEffect, useState } from 'react'
import { deleteData, getDatas, postData } from '../../../api/common/common';
import useTitle from "../../../hooks/useTitle";
import { Link, useNavigate } from "react-router-dom";

export default function TrashCourierList() {
    // Hook
    useTitle("All Courier List");
    // State
    const [trashList, setTrashList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // Variable
    const navigate = useNavigate();

    const columns = 
    [
        {
            title: "SL",
            key:"sl",
            width:50,
            render: (_,__, index) => index + 1
        },
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 70,
            render: (src, record) => (
                <img src={src} alt={record.name} style={{width: 32,height: 32,borderRadius: 4,objectFit: "cover"}}/>
            ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (name, record) => (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {name}

                    {Number(record.is_default) === 1 && (
                        <sup style={{background: "#52c41a",color: "#fff",padding: "2px 6px",borderRadius: 6,fontSize: 10,lineHeight: 1,fontWeight: 600}}>
                            DEFAULT
                        </sup>
                    )}
                </span>
            ),
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render:(status) => (
                <Tag style={{textTransform:"capitalize"}} color={status === "active" ? "green" : "#f50"}>
                    {status}
                </Tag>
            )
        },
        {
            title: "Action",
            key:"operation",
            width: 160,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => restoreData(record.id)}>
                        Restore
                    </Button>
                    <Popconfirm title="Permanent Delete Courier?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const fetchedTrashedList = async () => {
        try {
            setLoading(true);

            const res = await getDatas('/admin/couriers/trash');

            if(res && res?.success){
                setTrashList(res?.result?.data || []);
            }

        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchedTrashedList();
    }, []);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/couriers/${id}/permanent-delete`);

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            fetchedTrashedList();
        }
    }

    const restoreData = async (id) => {
        const res = await postData(`/admin/couriers/${id}/restore`, {_method: "PUT"});

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res.msg,
            });
            fetchedTrashedList();
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Courier List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Courier List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }}/>
                <Space>
                    <Button size="small" icon={<BackwardOutlined />} onClick={() => navigate('/couriers')}>Back To List</Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table loading={loading} columns={columns} dataSource={trashList} />
        </>
    )
}
