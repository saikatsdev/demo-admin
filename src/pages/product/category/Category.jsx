import { ArrowLeftOutlined, MenuOutlined, PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Card, Modal, Popconfirm, Space, Table, Tag, Typography, message } from "antd";

const { Text } = Typography;
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

const RowContext = createContext({});

const DragHandle = () => {
    const { setActivatorNodeRef, listeners } = useContext(RowContext);

    return (
        <MenuOutlined ref={setActivatorNodeRef} style={{ cursor: 'move', color: '#999' }} {...listeners} />
    );
};

const Row = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key'],
    });

    const style = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        ...(isDragging ? { position: 'relative', zIndex: 9999, background: '#fafafa' } : {}),
    };

    const contextValue = useMemo(
        () => ({ setActivatorNodeRef, listeners }),
        [setActivatorNodeRef, listeners],
    );

    return (
        <RowContext.Provider value={contextValue}>
            <tr {...props} ref={setNodeRef} style={style} {...attributes} />
        </RowContext.Provider>
    );
};

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
    const [filteredData, setFilteredData]       = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        }),
    );

    const onDragEnd = ({ active, over }) => {
        if (active.id !== over?.id) {
            const activeIndex = filteredData.findIndex((i) => i.id === active.id);
            const overIndex = filteredData.findIndex((i) => i.id === over?.id);

            const newFilteredData = arrayMove(filteredData, activeIndex, overIndex);

            const basePosition = (pagination.current - 1) * pagination.pageSize;
            const updatedItems = newFilteredData.map((item, index) => ({
                id: item.id,
                position: basePosition + index + 1
            }));

            setFilteredData(newFilteredData);
            setCategories(prevItems => {
                const newItems = [...prevItems];
                updatedItems.forEach(u => {
                    const idx = newItems.findIndex(i => i.id === u.id);
                    if (idx !== -1) newItems[idx].position = u.position;
                });
                return newItems.sort((a, b) => a.position - b.position);
            });

            postData('/admin/categories/position', { items: updatedItems }).then(res => {
                if (res?.success) {
                    messageApi.open({
                        type: "success",
                        content: res.msg || "Category position updated successfully",
                    });
                } else {
                    messageApi.open({
                        type: "error",
                        content: res.message || "Failed to update category position",
                    });
                }
            });
        }
    };

    const columns = [
        {
            key: "sort",
            width: 50,
            align: 'center',
            render: () => !query ? <DragHandle /> : null,
        },
        {
            title: "SL",
            key: "sl",
            width: 60,
            render: (_, __, index) => <Text type="secondary">{index + 1 + (pagination.current - 1) * pagination.pageSize}</Text>,
        },
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 90,
            render: (src, record) => src ? (
                <div style={{ padding: 4, border: '1px solid #f0f0f0', borderRadius: 8, display: 'inline-block', background: '#fff' }}>
                    <img src={src} alt={record.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}/>
                </div>
            ) : (
                <Tag color="default">No Image</Tag>
            ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <Text strong style={{ fontSize: 15 }}>{text}</Text>,
        },
        {
            title: "Permalink",
            dataIndex: 'slug',
            key: "slug",
            render: (text, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Text type="secondary">{text}</Text>
                    <EditOutlined style={{ color: "#1890ff", cursor: "pointer" }} onClick={() => handleEditClick(record)}/>
                </div>
            ),
        },
        {
            title : "Position",
            dataIndex: "position",
            key : "position"
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (status) => (
                <Tag style={{textTransform:"capitalize", borderRadius: 12, padding: '2px 10px'}} color={status === "active" ? "success" : "default"}>{status}</Tag>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 120,
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => onEdit(record)} title="Edit Category"/>
                    <Popconfirm title="Delete Category?" description="Are you sure you want to delete this category?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} title="Delete Category" />
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
        }else{
            messageApi.open({
                type: "error",
                content: "Something Went Wrong",
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

    useEffect(() => {
        if (!query) {
            setFilteredData(categories);
            return;
        }

        const lowerQuery = query.toLowerCase();

        const filtered = categories?.filter(item =>
            item.name?.toLowerCase().includes(lowerQuery)
        );

        setFilteredData(filtered);
    }, [query, categories]);

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
        }else{
            messageApi.open({
                type: "error",
                content: "Something Went Wrong",
            });
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
        <div style={{ padding: 16 }}>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Categories</h1>
                    <p className="subtitle">Manage product categories and sub-categories</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Categories" },
                        ]}
                    />
                </div>
            </div>

            <Card className="modern-antd-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <AntInput.Search allowClear placeholder="Search Key ..." prefix={<AppstoreOutlined style={{ color: '#bfbfbf' }} />} value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 400, height: 40, borderRadius: 8 }}/>

                    <Space size="middle">
                        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
                        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                    </Space>
                </div>

            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                <SortableContext
                    items={filteredData.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <Table 
                        rowKey="id" 
                        loading={loading} 
                        pagination={{
                            current: pagination.current, 
                            pageSize: pagination.pageSize, 
                            total: pagination.total, 
                            showSizeChanger: true, 
                            onChange: (page, pageSize) => {setPagination((p) => ({ ...p, current: page, pageSize }))},
                        }} 
                        columns={columns} 
                        dataSource={filteredData} 
                        className="modern-table"
                        scroll={{ x: 'max-content' }}
                        components={{
                            body: {
                                row: Row,
                            },
                        }}
                    />
                </SortableContext>
            </DndContext>
            </Card>

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
        </div>
    )
}
