import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Form, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function Brand() {
    // Hook
    useTitle("All Brand");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]                   = useState("");
    const [brands, setBrands]                 = useState([]);
    const [loading, setLoading]               = useState(false);
    const [pagination, setPagination]         = useState({ current: 1, pageSize: 10, total: 0 })
    const { current, pageSize }               = pagination;
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [messageApi, contextHolder]         = message.useMessage();

    const columns = 
    [
        {
            title:"SL",
            key:"sl",
            width:50,
            render: (_,__,index) => index + 1 + (pagination.current - 1) * pagination.pageSize,
        },
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 70,
            render: (src, record) => (
                <img src={src} alt={record.name} style={{width: 32,height: 32,borderRadius: 4,objectFit: "cover",}}
            />
            ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "active" ? "green" : "red"} style={{textTransform:"capitalize"}}>{status}</Tag>
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
                    <Popconfirm title="Delete brand?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500)
        return () => clearTimeout(handle)
    }, [query]);

    useEffect(() => {
        setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }))
    }, [debouncedQuery])

    useEffect(() => {
        let isMounted = true;

        const fetchBrands = async () => {
            setLoading(true)
            const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
            const res = await getDatas('/admin/brands', params)
            const list = res?.result?.data || []
            const meta = res?.result?.meta
            if (isMounted) {
                setBrands(list);
                if (meta) {
                    setPagination((p) => {
                        const next = {...p, current: meta.current_page || p.current, pageSize: meta.per_page || p.pageSize, total: meta.total || p.total}
                        const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total
                        return unchanged ? p : next
                    })
                }
            }
            setLoading(false)
        }
        fetchBrands();
        return () => {
          isMounted = false
        }
    }, [current, pageSize, debouncedQuery]);

    const filteredData = useMemo(() => {
        if (!query) return brands;
        const lowerQuery = query.toLowerCase();
        return brands.filter(
            (b) => b.name?.toLowerCase().includes(lowerQuery)
        );
    }, [brands, query]);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/brands/${id}`);
        if (res && res?.success) {
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
            const refreshed = await getDatas("/admin/brands", params);
            setBrands(refreshed?.result?.data || [])
            const meta = refreshed?.result?.meta
            if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }))
        }
    }

    const onEdit = (record) => {
        navigate(`/edit/brand/${record.id}`);
    };

    const openCreate = () => {
        navigate("/add/brand");
    };

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Brands</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Brands" },
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

            <Table rowKey="id" loading={loading} pagination={{current: pagination.current,pageSize: pagination.pageSize,total: pagination.total,showSizeChanger: true,onChange: (page, pageSize) => {setPagination((p) => ({ ...p, current: page, pageSize }))}}} columns={columns} dataSource={filteredData} scroll={{ x: 'max-content' }}/>
        </>
    )
}
