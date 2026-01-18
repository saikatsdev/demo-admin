import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, EditOutlined  } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Popconfirm, Space, Table, Tag, message,Modal } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import DescriptionCell from "../../components/helper/DescriptionCell";

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

export default function Blog() {
    //Hook
    useTitle("All Blogs");

    //Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]                               = useState("");
    const [loading, setLoading]                           = useState(false);
    const [blogPosts, setBlogPosts]                       = useState([]);
    const [messageApi, contextHolder]                     = message.useMessage();
    const [filteredData, setFilteredData]                 = useState(blogPosts);
    const [isPermalinkModalOpen, setIsPermalinkModalOpen] = useState(false);
    const [currentSlug, setCurrentSlug]                   = useState("");
    const [currentRecord, setCurrentRecord]               = useState(null);
    const [checking, setChecking]                         = useState(false);
    const [isAvailable, setIsAvailable]                   = useState(true);

    // Table Columns
    const columns = [
        {
            title: "SL",
            key: 'sl',
            width: 10,
            render: (_,__, index) => (
                index + 1
            )
        },
        {
            title: "Image",
            dataIndex: 'image',
            key: 'image',
            render: (src, record) => (
                <img src={src} alt={record.title} style={{width:"40px", height:"40px", borderRadius:"4px", objectFit:"cover"}}/>
            )
        },
        {
            title: "Title",
            dataIndex: 'title',
            key: 'title',
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
            title: "Category",
            dataIndex: 'category',
            key: 'category',
            render: (category) => (
                <p style={{marginBottom:0, textTransform:"capitalize"}}>
                    {category.name}
                </p>
            )
        },
        {
            title: "Status",
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag style={{textTransform:"capitalize"}} color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
            )
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (description) => <DescriptionCell html={description} />
        },
        {
            title: "Action",
            key: "operation",
            width: 170,
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onEdit(record.id)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete Courier?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)} >
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
        setIsPermalinkModalOpen(true);
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
                const res = await getDatas(`/admin/check/blog?slug=${slug}`);
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
        const res = await postData(`/admin/update/blog/${currentRecord.id}`, {
            slug: currentSlug
        });

        if(res && res?.success){
            const refreshed = await getDatas("/admin/blog-posts");
            setBlogPosts(refreshed?.result?.data || []);
            
            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }

        setIsPermalinkModalOpen(false);
    };

    // Method
    const openCreate = () => {
        navigate("/add/blog");
    }

    const onEdit = (id) => {
        navigate(`/edit/blog/${id}`);
    }

    useEffect(() => {
        if(!query){
            setFilteredData(blogPosts);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = blogPosts.filter(item => 
            item.title.toLowerCase().includes(lowerQuery) || item?.status.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, blogPosts]);
    
    useEffect(() => {
        let isMounted = true;

        const fetchBlogPosts = async () => {
            setLoading(true);
            const res = await getDatas("/admin/blog-posts");

            const list = res?.result?.data || [];

            if(isMounted){
                setBlogPosts(list);
            }

            setLoading(false);
        }

        fetchBlogPosts();
    }, []);

    // Delete Method
    const onDelete = async (id) => {
        const res = await deleteData(`/admin/blog-posts/${id}`);

        if(res?.success){
            const refreshed = await getDatas("/admin/blog-posts");

            setBlogPosts(refreshed?.result?.data || []);

            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }else{
            messageApi.open({
                type: "error",
                content: res.message,
            });
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Blog Posts</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Blog Posts" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>
                <Space>
                    <Button size="small" icon={<DeleteOutlined />}>Trash</Button>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>Back</Button>
                </Space>
            </div>

            <Table bordered loading={loading} columns={columns}  dataSource={filteredData} scroll={{ x: "max-content" }} rowKey="id"/>

            <Modal title="Update Permalink" open={isPermalinkModalOpen} onOk={handleSave} onCancel={() => setIsPermalinkModalOpen(false)} okButtonProps={{disabled: checking || !isAvailable}}>
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
    )
}
