import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, message, Popconfirm, Space, Table } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function Contact() {
    //Hook
    useTitle("Contacts");

    const navigate = useNavigate();

    // State
    const [query, setQuery]                   = useState("");
    const [loading, setLoading]               = useState(false);
    const [contacts, setContact]              = useState([]);
    const [messageApi, contextHolder]         = message.useMessage();
    const [filteredData, setFilteredData]     = useState(contacts);

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
            title: "Name",
            dataIndex: "name",
            key: "name"
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone"
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email"
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text) => {
                const plainText = text?.replace(/<[^>]+>/g, '');
                return plainText;
            }
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
                    <Popconfirm title="Delete Courier?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
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
        navigate("/add/contact");
    }

    const onEdit = (record) => {
        navigate(`/edit/contact/${record.id}`);
    }

    useEffect(() => {
        if(!query){
            setFilteredData(contacts);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = contacts.filter(item => 
            item.name.toLowerCase().includes(lowerQuery) || item.phone.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, contacts]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/contacts");

            const list = res?.result?.data;

            if(isMounted){
                setContact(list);
            }

            setLoading(false);
        }

        fetchContactList();

        return () => {
            isMounted = false;
        }
    }, []);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/contacts/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/contacts");

            setContact(refreshed?.result?.data);

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
                    <h1 className="title">All Contact List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Contact List" },
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
