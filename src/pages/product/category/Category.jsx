import { ArrowLeftOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Modal, Popconfirm, Space, Table, Tag, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

export default function Category() {
    // Hook
    useTitle("All Category");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]                     = useState("");
    const [categories, setCategories]           = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 10, total: 0 })
    const { current, pageSize }                 = pagination;
    const [debouncedQuery, setDebouncedQuery]   = useState("");
    const [messageApi, contextHolder]           = message.useMessage();
    const [isPermalinkModalOpen, setIsPermalinkModalOpen]         = useState(false);
    const [currentSlug, setCurrentSlug]         = useState("");
    const [currentRecord, setCurrentRecord]     = useState(null);
    const [checking, setChecking]               = useState(false);
    const [isAvailable, setIsAvailable]         = useState(true);

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 50,
            render: (_, __, index) => index + 1 + (pagination.current - 1) * pagination.pageSize,
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
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag style={{textTransform:"capitalize"}} color={status === "active" ? "green" : "red"}>{status}</Tag>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 160,
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
            ),
        },
    ];

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
                const res = await getDatas(`/admin/check/categories?slug=${slug}`);
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
        const res = await postData(`/admin/update/categories/${currentRecord.id}`, {slug: currentSlug});

        if(res && res?.success){
            const refreshed = await getDatas("/admin/categories");
            setCategories(refreshed?.result?.data || []);
            
            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }

        setIsPermalinkModalOpen(false);
    };

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500)
        return () => clearTimeout(handle)
    }, [query])

    useEffect(() => {
        setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }))
    }, [debouncedQuery])

    useEffect(() => {
        let isMounted = true
        const fetchCategories = async () => {
            setLoading(true)
            const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
            const res = await getDatas("/admin/categories", params);
            const list = res?.result?.data || [];
            const meta = res?.result?.meta;

            if (isMounted) {
                setCategories(list);
                if (meta) {
                    setPagination((p) => {
                        const next = {...p,current: meta.current_page || p.current,pageSize: meta.per_page || p.pageSize,total: meta.total || p.total}
                        const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total
                        return unchanged ? p : next
                    })
                }
          }
          setLoading(false)
        }

        fetchCategories();

        return () => {
          isMounted = false
        }
    }, [current, pageSize, debouncedQuery])

    const filteredData = useMemo(() => {
        if (!query) return categories;
        const lowerQuery = query.toLowerCase();
        return categories.filter(
          (b) => b.name?.toLowerCase().includes(lowerQuery)
        );
    }, [categories, query]);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/categories/${id}`);
        if (res && res?.success) {

            messageApi.open({
                type: "success",
                content: res.msg,
            });

            const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
            const refreshed = await getDatas("/admin/categories", params);

            setCategories(refreshed?.result?.data || []);

            const meta = refreshed?.result?.meta;
            
            if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }));
        }
    }

    const handleEditClick = (record) => {
        setCurrentRecord(record);
        setCurrentSlug(record.slug);
        setIsPermalinkModalOpen(true);
        setIsAvailable(true);
    };

    const onEdit = (record) => {
        navigate(`/edit/category/${record.id}`);
    };

    const openCreate = () => {
        navigate("/add/category");
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Categories</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Category" },
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

            <Table rowKey="id" loading={loading} pagination={{current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, onChange: (page, pageSize) => {setPagination((p) => ({ ...p, current: page, pageSize }))},}} columns={columns} dataSource={filteredData} scroll={{ x: 'max-content' }}/>

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
