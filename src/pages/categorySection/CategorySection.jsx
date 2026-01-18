import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Popconfirm, Space, Table, Tag, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function CategorySection() {
    // Hook
    useTitle("Category Section | Service Key");

    // Variable
    const navigate = useNavigate();

    // State
    const [categorySections, setCategorySections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // Table Columns
    const columns = [
        {
            title:"SL",
            key:"sl",
            render: (_,__, index) => (
                index + 1
            )
        },
        {
            title: "Title",
            dataIndex: "title",
            key:"title"
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
            title: "Position",
            dataIndex: "position",
            key: "position"
        },
        {
            title: "Categories",
            key: "categories",
            render: (_, record) => (
                <>
                    {record.categories && record.categories.length > 0 ? (
                        record.categories.map((cat, index) => (
                            <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                                {cat.name}
                            </Tag>
                        ))
                    ) : (
                        <span>-</span>
                    )}
                </>
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
                    <Popconfirm title="Delete item?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)} >
                        <Button size="small" danger>
                            <DeleteOutlined />
                        </Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    // Method
    const openCreate = () => {
        navigate("/add/category/section");
    }

    const onEdit = (id) => {
        navigate(`/edit/section-category/${id}`);
    }

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/category-sections/${id}`);

        if(res?.success){
            const resData = await getDatas("/admin/category-sections");

            setCategorySections(resData?.result?.data || []);

            messageApi.open({
              type: "success",
              content: res.msg,
            });
        }
    }

    // Fetched Category & Section
    useEffect(() => {
        let isMounted = true;

        const fetchedCategorySection = async () => {
            setLoading(true);
            const res = await getDatas("/admin/category-sections");

            const list = res?.result?.data || [];

            if(isMounted){
                setCategorySections(list);
                setLoading(false);
            }
        }

        fetchedCategorySection();

        return () => {
            isMounted = false;
        }
    }, []);

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Category Section List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Category Section List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }}/>
                <Space>
                    <Button size="small" icon={<DeleteOutlined />} onClick={openCreate}>Trash</Button>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table rowKey="id" loading={loading} columns={columns} dataSource={categorySections} scroll={{ x: 'max-content' }}/>
        </>
    )
}
