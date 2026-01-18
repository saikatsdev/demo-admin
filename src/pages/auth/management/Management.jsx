import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import {Input as AntInput,Breadcrumb,Button,Popconfirm,Space,Table,Tag} from "antd";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { deleteData, getDatas } from "../../../api/common/common";
import { useEffect, useMemo, useState } from "react";

export default function Management() {
    // Hook
    useTitle("Management");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery]                     = useState("");
    const [users, setUsers]                     = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [pagination, setPagination]           = useState({current: 1,pageSize: 10,total: 0});
    const { current, pageSize }                 = pagination;
    const [debouncedQuery, setDebouncedQuery]   = useState("");

    // Table Columns
    const columns = 
    [
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 70,
            render: (src, record) => (
                <img src={src} alt={record.username} style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}/>
            ),
        },
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Phone",
            dataIndex: "phone_number",
            key: "phone_number",
        },
        {
            title: "Category",
            dataIndex: ["category", "name"],
            key: "category",
            render: (_, record) => record?.category?.name || "",
        },
        {
            title: "Roles",
            dataIndex: "roles",
            key: "roles",
            render: (roles) => (
                <Space size={[4, 4]} wrap>
                    {(roles || []).map((r) => (
                        <Tag key={r.id}>{r.display_name || r.name}</Tag>
                    ))}
                </Space>
            ),
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
            title: "Last Login",
            dataIndex: "login_at",
            key: "login_at",
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
                    <Popconfirm title="Delete this?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
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
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(handle);
    }, [query]);
    
    useEffect(() => {
        setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }));
    }, [debouncedQuery]);

    useEffect(() => {
        let isMounted = true;
        const fetchUsers = async () => {
            setLoading(true);

            const params = {user_category_id:2,page: current,per_page: pageSize,search_key: debouncedQuery || undefined};
            const res = await getDatas("/admin/users", params);
            const list = res?.result?.data || [];
            const meta = res?.result?.meta;

            if (isMounted) {
                setUsers(list);
                
                if (meta) {
                    setPagination((p) => {
                        const next = {...p,current: meta.current_page || p.current,pageSize: meta.per_page || p.pageSize,total: meta.total || p.total,};
                        const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total;
                        return unchanged ? p : next;
                    });
                }
            }
          setLoading(false);
        };
        fetchUsers();
        return () => {
          isMounted = false;
        };
    }, [current, pageSize, debouncedQuery]);
    
    
    const filteredData = useMemo(() => users, [users]);
    
    const openCreate = () => {
        navigate("/add/management");
    };
    
    const onEdit = (record) => {
        navigate(`/edit/management/${record.id}`);
    };
    
    const onDelete = async (id) => {
        const res = await deleteData(`/admin/users/${id}`);
        if (res && res?.success) {
            const params = { user_category_id:2, page: current,per_page: pageSize,search_key: debouncedQuery || undefined};
            const refreshed = await getDatas("/admin/users", params);
            setUsers(refreshed?.result?.data || []);
            const meta = refreshed?.result?.meta;
            if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }));
        }
    };

    const totalManagement = Array.isArray(users) ? users.length : 0;

    const activeManagement = Array.isArray(users) ? users.filter(u => u.status === "active").length : 0;

    const pendingManagement = Array.isArray(users) ? users.filter(u => u.status !== "active").length : 0;

    return (
        <>
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Management</h1>
                </div>

                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Management" },
                        ]}
                    />
                </div>
            </div>

            <div style={{display: "flex",justifyContent: "space-between",alignItems: "*",marginBottom: 16}}>
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                        Add
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <div class="customer-stats">
                <div>
                    <p>
                        Total Managers 
                    </p>
                    <h2>{totalManagement}</h2>
                </div>
                <div>
                    <p>
                        Active Managers 
                    </p>
                    <h2 class="blue">{activeManagement}</h2>
                </div>
                <div>
                    <p>
                        Pending Approvals
                    </p>
                    <h2 class="green">{pendingManagement}</h2>
                </div>
            </div>

            <Table rowKey="id" loading={loading} pagination={{current: pagination.current,pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true,
            onChange: (page, pageSize) => {setPagination((p) => ({ ...p, current: page, pageSize }));},}} columns={columns} dataSource={filteredData} scroll={{ x: "max-content" }}/>
        </>
    )
}
