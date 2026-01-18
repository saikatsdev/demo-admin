import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput,Breadcrumb, Table, Button,Space,message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function BlockList() {
    // Hooks
    useTitle("All Block List");

    // Variable
    const navigate = useNavigate();

    // State
    const [loading, setLoading]       = useState(false);
    const [blockData, setBlockData]   = useState([]);
    const [query, setQuery]           = useState("");
    const [messageApi, contextHolder] = message.useMessage();

    // Table Columns
    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            render: (_, __, index) => index + 1,
        },
        {
            title: "User Token",
            dataIndex: "user_token",
            key: "user_token",
            render: (value) => value ? value : "N/A",
        },
        {
            title: "Details",
            key: "details",
            render: (_, record) => (
            <div>
                {record.details?.map((item) => (
                <div key={item.id} style={{marginBottom: "8px",padding: "6px 10px"}}>
                    <div><strong>Phone:</strong> {item.phone_number}</div>
                    <div><strong>IP:</strong> {item.ip_address}</div>
                </div>
                ))}
            </div>
            ),
        },
        {
            title: "Block/Unblock",
            dataIndex: "is_block",
            key: "is_block",
            render: (value) => (
                <Button type={value ? "primary" : "default"} danger={value}>
                    {value ? "Block" : "Block"}
                </Button>
            ),
        },
        {
            title: "Permanent Block",
            key: "is_permanent_block",
            render: (_, record) => (
                <Button type={record.is_permanent_block ? "primary" : "default"} danger={record.is_permanent_block} onClick={() => handlePermanentBlock(record)}>
                    {record.is_permanent_block ? "Permanent Block True" : "Permanent Block False"}
                </Button>
            ),
        },
        {
            title: "Is Permanent Unblock",
            dataIndex: "is_permanent_unblock",
            key: "is_permanent_unblock",
            render: (_, record) => (
                <Button type={record.is_permanent_unblock ? "primary" : "default"} danger={record.is_permanent_unblock} onClick={() => handlePermanentUnBlock(record)}>
                    {record.is_permanent_unblock ? "Permanent Unblock" : "Permanent Unblock"}
                </Button>
            ),
        },
    ];

    useEffect(() => {
        let isMounted = true;

        const fetchedBlockUsers = async () => {
            setLoading(true);

            const res = await getDatas("/admin/block-users");

            const list = res?.result?.data || [];

            if(isMounted){
                setBlockData(list);

                setLoading(false);
            }
        }

        fetchedBlockUsers();

        return () => {
            isMounted = false;
        }
    }, []);

    const filteredData = blockData.filter(record => {
        const tokenMatch = record.user_token?.toLowerCase().includes(query.toLowerCase());

        const detailsMatch = record?.details?.some(item => item.phone_number?.toLowerCase().includes(query.toLowerCase()) ||item.ip_address?.toLowerCase().includes(query.toLowerCase()));

        return tokenMatch || detailsMatch;
    });

    const handlePermanentBlock = (record) => {
        const payload = {
            is_block            : 1,
            is_permanent_block  : 1,
            is_permanent_unblock: 0,
        };

        updateUserBlock(record.id, payload);

        setBlockData(prev =>
            prev.map(item =>
                item.id === record.id ? { ...item, ...payload } : item
            )
        );
    };

    const handlePermanentUnBlock = (record) => {
        const payload = {
            is_block            : 0,
            is_permanent_block  : 0,
            is_permanent_unblock: 1,
        };

        updateUserBlock(record.id, payload);

        setBlockData(prev =>
            prev.map(item =>
                item.id === record.id ? { ...item, ...payload } : item
            )
        );
    };

    const openCreate = () => {
        navigate("/add-block-user");
    }

    const updateUserBlock = async (id, payload) => {
        const res = await postData(`/admin/block-users/${id}`, { ...payload, _method: "PUT" });

        if (res?.success) {
            messageApi.open({ type: "success", content: res.msg });
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Block User List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Block User List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns}  dataSource={filteredData}/>
        </>
    )
}
