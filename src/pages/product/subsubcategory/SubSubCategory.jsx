import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from "antd";

const { Text } = Typography;
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function SubSubCategory() {
    // Hooks
    useTitle("All Sub SubCategories");

    // State
    const [query, setQuery]                                 = useState("");
    const [subSubCategories, setSubSubCategories]           = useState([]);
    const [loading, setLoading]                             = useState(false);
    const [pagination, setPagination]                       = useState({ current: 1, pageSize: 10, total: 0});
    const { current, pageSize }                             = pagination;
    const [debouncedQuery, setDebouncedQuery]               = useState("");
    const [messageApi, contextHolder]                       = message.useMessage();

    // Variable
    const navigate = useNavigate();

    const columns = 
    [
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
            title: "Sub Category",
            dataIndex: "sub_category",
            key: "sub_category",
            render: (sub_category) => (
                <Text type="secondary">{sub_category?.name}</Text>
            ),
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
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => onEdit(record)} title="Edit Sub-Sub Category"/>
                    <Popconfirm title="Delete this item?" description="Are you sure you want to delete this sub-sub category?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} title="Delete Sub-Sub Category" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(handle);
    }, [query]);

    useEffect(() => {
        setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }));
    }, [debouncedQuery]);

    useEffect(() => {
        let isMounted = true;
        const fetchCategories = async () => {
            setLoading(true);
            const params = {
                page: current,
                per_page: pageSize,
                search_key: debouncedQuery || undefined,
            };

            const res = await getDatas("/admin/sub-sub-categories", params);

            const list = res?.result?.data || [];
            const meta = res?.result?.meta;
            if (isMounted) {
                setSubSubCategories(list);
                if (meta) {
                    setPagination((p) => {
                        const next = {...p,current: meta.current_page || p.current,pageSize: meta.per_page || p.pageSize,total: meta.total || p.total};
                        const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total;
                        return unchanged ? p : next;
                    });
                }
            }
            setLoading(false);
        };

        fetchCategories();

        return () => {
            isMounted = false;
        };
    }, [current, pageSize, debouncedQuery]);

    const filteredData = useMemo(() => {
        if (!query) return subSubCategories;
        const lowerQuery = query.toLowerCase();
        return subSubCategories.filter((b) => b.name?.toLowerCase().includes(lowerQuery));
    }, [subSubCategories, query]);

    const onEdit = (record) => {
        navigate(`/edit/sub/subcategory/${record.id}`);
    };

    const openCreate = () => {
        navigate("/add/sub/subcategory");
    };

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/sub-sub-categories/${id}`);
        if (res && res?.success) {
            const params = {
                page: current, 
                per_page: pageSize, 
                search_key: debouncedQuery || undefined
            };

            messageApi.open({
                type: "success",
                content: res?.msg,
            });

            const refreshed = await getDatas("/admin/sub-sub-categories", params);

            setSubSubCategories(refreshed?.result?.data || []);

            const meta = refreshed?.result?.meta;

            if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }));
        }else{
            messageApi.open({
                type: "error",
                content: "Something Went Wrong",
            });
        }
    };

    return (
        <div style={{ padding: 16 }}>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Sub-Sub Categories</h1>
                    <p className="subtitle">Manage product sub-sub-categories</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Sub-Sub Categories" },
                        ]}
                    />
                </div>
            </div>

            <Card className="modern-antd-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <AntInput.Search allowClear placeholder="Search Key ..." prefix={<AppstoreOutlined style={{ color: '#bfbfbf' }} />} value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 400, height: 40, borderRadius: 8 }}/>

                    <Space size="middle">
                        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                            Add
                        </Button>

                        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                            Back
                        </Button>
                    </Space>
                </div>

                <Table 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ 
                        current: pagination.current, 
                        pageSize: pagination.pageSize, 
                        total: pagination.total, 
                        showSizeChanger: true,
                        onChange: (page, pageSize) => {
                            setPagination((p) => ({ ...p, current: page, pageSize }));
                        },
                    }} 
                    columns={columns} 
                    dataSource={filteredData} 
                    className="modern-table"
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </div>
    )
}
