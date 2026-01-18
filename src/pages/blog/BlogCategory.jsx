import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined,EditOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, message, Popconfirm, Space, Table, Tag, Modal } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

export default function BlogCategory() {
    // Hook
    useTitle("All Blog Category");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]                   = useState("");
    const [blogCategories, setBlogCategories] = useState([]);
    const [filteredData, setFilteredData]     = useState([]);
    const [loading, setLoading]               = useState(false);
    const [messageApi, contextHolder]         = message.useMessage();
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [currentSlug, setCurrentSlug]       = useState("");
    const [currentRecord, setCurrentRecord]   = useState(null);
    const [checking, setChecking]             = useState(false);
    const [isAvailable, setIsAvailable]       = useState(true);

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 10,
            render: (_, __, index) => index + 1
        },
        {
            title: "Image",
            dataIndex: 'image',
            key: "image",
            width: 100,
            render: (src, record) => (
                <img src={src} alt={record.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}/>
            )
        },
        {
            title: "Name",
            dataIndex: 'name',
            key: "name"
        },
        {
            title: "Permalink",
            dataIndex: 'slug',
            key: "slug",
            render: (text, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{text}</span>
                    <EditOutlined style={{ color: "#1890ff", cursor: "pointer" }} onClick={() => handleEditClick(record)}/>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: 'status',
            key: "status",
            render: (status) => (
                <Tag color={status === "active" ? "green" : "red"} style={{ textTransform: "capitalize" }}>
                    {status}
                </Tag>
            )
        },
        {
            title: "Action",
            key: "operation",
            width: 170,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete Category?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const handleEditClick = (record) => {
        setCurrentRecord(record);
        setCurrentSlug(record.slug);
        setIsModalOpen(true);
        setIsAvailable(true);
    };

    const handleSlugTyping = (value) => {
        setCurrentSlug(value);
        setIsAvailable(true);

        // call debounce function
        checkSlugDebounced(value);
    };

    const checkSlugDebounced = useRef(
        debounce(async (slug) => {
            if (!slug.trim()) return;
            setChecking(true);
            try {
                const res = await getDatas(`/admin/category/check?slug=${slug}`);
                setIsAvailable(res?.success && res.available);
            } catch (err) {
                console.error(err);
                setIsAvailable(false);
            }
            setChecking(false);
        }, 500)
    ).current;

    const handleSave = async () => {
        if (!isAvailable) return;

        // your update API here
        const res = await postData(`/admin/slug/category/update/${currentRecord.id}`, {
            slug: currentSlug
        });

        if(res && res?.success){
            const refreshed = await getDatas("/admin/blog-post-categories");
            setBlogCategories(refreshed?.result?.data || []);
            setFilteredData(refreshed?.result?.data || []);
            
            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }

        setIsModalOpen(false);
    };

    // Fetch Categories
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const res = await getDatas("/admin/blog-post-categories");
            const list = res?.result?.data || [];
            setBlogCategories(list);
            setFilteredData(list);
            setLoading(false);
        };
        fetchData();
    }, []);

    // Search Filter
    useEffect(() => {
        if (!query) {
            setFilteredData(blogCategories);
            return;
        }

        const key = query.toLowerCase();
        const filtered = blogCategories.filter(item =>
            item.name.toLowerCase().includes(key) ||
            item.status.toLowerCase().includes(key)
        );
        setFilteredData(filtered);
    }, [query, blogCategories]);

    const onEdit = (record) => {
        navigate(`/edit/blog/category/${record.id}`);
    };

    const openCreate = () => {
        navigate("/create/blog/category");
    };

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/blog-post-categories/${id}`);

        if (res && res?.success) {
            const refreshed = await getDatas("/admin/blog-post-categories");
            setBlogCategories(refreshed?.result?.data || []);
            setFilteredData(refreshed?.result?.data || []);
            messageApi.success(res.msg);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Blog Categories</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Blog Categories" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>

                <Space>
                    <Button size="small" icon={<DeleteOutlined />}>Trash</Button>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
                        Add
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns} dataSource={filteredData} rowKey="id"/>

            <Modal title="Update Permalink" open={isModalOpen} onOk={handleSave} onCancel={() => setIsModalOpen(false)} okButtonProps={{disabled: checking || !isAvailable}}>
                <AntInput value={currentSlug} onChange={(e) => handleSlugTyping(e.target.value)} placeholder="Enter new slug"/>

                {checking && (
                    <p style={{ color: "#1677ff", marginTop: 8 }}>Checking availability...</p>
                )}

                {!isAvailable && !checking && (
                    <p style={{ color: "red", marginTop: 8 }}>❌ This slug is already taken</p>
                )}

                {isAvailable && !checking && currentSlug && (
                    <p style={{ color: "green", marginTop: 8 }}>✅ This slug is available</p>
                )}
            </Modal>
        </>
    );
}
