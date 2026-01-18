import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, message, Tag, Popconfirm, Space, Table } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function FAQ() {
    //Hook
    useTitle("FAQ");

    const navigate = useNavigate();

    // State
    const [query, setQuery]                   = useState("");
    const [loading, setLoading]               = useState(false);
    const [faqs, setFaqs]              = useState([]);
    const [messageApi, contextHolder]         = message.useMessage();
    const [filteredData, setFilteredData]     = useState(faqs);

    //Table Columns
    const columns = [
        {
            title: "SL",
            key:"sl",
            width: 10,
            render: (_,__, index) => (
                index + 1
            )
        },
        {
            title: "Question",
            dataIndex: "question",
            key: "question"
        },
        {
            title: "Answer",
            dataIndex: "answer",
            key: "answer",
            render: (text) => {
                const plainText = text?.replace(/<[^>]+>/g, '');
                return plainText;
            }
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag style={{textTransform:"capitalize"}} color={status === "active" ? "green" : "red"}>{status}</Tag>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width:170,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete Faq?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    //Method
    const openCreate = () => {
        navigate("/add/faq");
    }

    const onEdit = (record) => {
        navigate(`/edit/faq/${record.id}`);
    }

    useEffect(() => {
        if(!query){
            setFilteredData(faqs);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = faqs.filter(item => 
            item.question.toLowerCase().includes(lowerQuery) || item.status.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, faqs]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/faqs");

            const list = res?.result?.data;

            if(isMounted){
                setFaqs(list);
            }

            setLoading(false);
        }

        fetchContactList();

        return () => {
            isMounted = false;
        }
    }, []);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/faqs/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/faqs");

            setFaqs(refreshed?.result?.data);

            messageApi.open({
              type: "success",
              content: res.msg,
            });
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All FAQ List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All FAQ List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>
                <Space>
                    <Button type="primary" danger ghost size="small" icon={<DeleteOutlined />}>Trash</Button>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns}  dataSource={filteredData}/>
        </>
    )
}
