import { ArrowLeftOutlined, BackwardOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, message, Popconfirm, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function TrashPaymentGatewayList() {
    //Hook
    useTitle("Payment Gateway Trash List");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]                     = useState("");
    const [loading, setLoading]                 = useState(false);
    const [paymentGateways, setPaymentGateways] = useState([]);
    const [messageApi, contextHolder]           = message.useMessage();

    //Table Columns
    const columns = 
    [
        {
            title: "SL",
            key:"sl",
            width: 10,
            render: (_,__, index) => (
                index + 1
            )
        },
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            render: (src, record) => (
                <img src={src} alt={record.title} style={{width:"40px", height:"40px", borderRadius:"4px", objectFit:"cover"}}/>
            )
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name"
        },
        {
            title: "Phone Number",
            dataIndex: "phone_number",
            key: "phone_number"
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag style={{textTransform:"capitalize"}} color={status === 'active' ? 'green' : 'danger'}>{status}</Tag>
            )
        },
        {
            title: "Action",
            key: "operation",
            width:170,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onRestore(record)}>
                        Restore
                    </Button>
                    <Popconfirm title="Delete Item?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    const fetchedTrashList = async () => {
        try {
            setLoading(true);

            const res = await getDatas('/admin/payment/gateways/trash');

            if(res && res?.success){
                setPaymentGateways(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchedTrashList();
    }, []);

    const onRestore = async (id) => {
        const res = await postData(`/admin/payment/gateways/${id}/restore`, {_method: "PUT"});

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            fetchedTrashList();
        }
    }

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/payment/gateways/${id}/permanent-delete`);

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            fetchedTrashList();
        }
    }

    return (
        <>
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Payment Gateway</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Payment Gateway" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>
                <Space>
                    <Button size="small" icon={<BackwardOutlined />} onClick={() => navigate('/payment-gateways')}>Back To List</Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns} dataSource={paymentGateways}/>
        </>
    )
}
