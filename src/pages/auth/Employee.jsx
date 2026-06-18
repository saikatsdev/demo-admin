import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import {Input as AntInput,Breadcrumb,Button,Popconfirm,Space,Table,Tag, Tooltip, message} from "antd";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import { usePermission } from "../../hooks/usePermission";

export default function Employee() {
    // Hook
    useTitle("Employees");

    // State
    const [query, setQuery]                   = useState("");
    const [users, setUsers]                   = useState([]);
    const [loading, setLoading]               = useState(false);
    const [pagination, setPagination]         = useState({current: 1,pageSize: 10,total: 0});
    const { current, pageSize }               = pagination;
    const [messageApi, contextHolder]         = message.useMessage();
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Variable
    const navigate = useNavigate();
    const {permissions} = usePermission();

    const can = (permission) => permissions?.includes(permission);
    
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const params = {
            user_category_id: 3,
            page            : pagination.current,
            per_page        : pagination.pageSize,
            search_key      : debouncedQuery || undefined,
        };
        const res = await getDatas("/admin/users", params);
        const list = res?.result?.data || [];
        const meta = res?.result?.meta;

        setUsers(list);
        if (meta) {
            setPagination((p) => ({
                ...p,
                current: meta.current_page || p.current,
                pageSize: meta.per_page || p.pageSize,
                total: meta.total || p.total,
            }));
        }
        setLoading(false);
    }, [pagination.current, pagination.pageSize, debouncedQuery]);

    const handleRefresh = () => {
        fetchUsers();
        message.success("Data refreshed");
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 40,
            render: (_, __, index) => (current - 1) * pageSize + index + 1,
        },
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
            render: (text, record) => (
                <Space>
                    <Tag color="green" style={{ fontWeight: 700, fontSize: '13px', padding: '2px 10px', borderRadius: '4px', letterSpacing: '0.5px', textTransform: "capitalize" }}>{text}</Tag>
                </Space>
            ),
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
            title: "OTP",
            dataIndex: "staff_login_otp",
            key: "staff_login_otp",
            render: (text) => text ? (
                 <Space>
                    <Tag color="blue" style={{ fontWeight: 700, fontSize: '13px', padding: '2px 10px', borderRadius: '4px', letterSpacing: '0.5px' }}>{text}</Tag>
                    <Tooltip title="Copy OTP">
                        <Button size="small" type="text" icon={<CopyOutlined style={{ fontSize: '12px' }} />} 
                            onClick={() => {
                                navigator.clipboard.writeText(text);
                                messageApi.open({
                                    type: "success",
                                    content: "OTP copied to clipboard",
                                });
                            }}
                            style={{ color: '#1890ff', padding: '0 4px' }}
                        />
                    </Tooltip>
                </Space>
            ) : <Tag color="default">N/A</Tag>,
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
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Employee">
                        <Button size="small" type="text" style={{ color: '#1890ff', backgroundColor: '#e6f7ff' }} icon={<EditOutlined />} onClick={() => onEdit(record)} disabled={can("users.update")} />
                    </Tooltip>
                    
                    <Tooltip title="Update Password">
                        <Button size="small" type="text" style={{ color: '#faad14', backgroundColor: '#fff7e6' }} icon={<KeyOutlined />} onClick={() => navigate(`/edit/employee/password/${record.id}`)} disabled={can("users.update")} />
                    </Tooltip>
                    <Popconfirm title="Delete user?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Tooltip title="Delete Employee">
                            <Button size="small" type="text" danger style={{ backgroundColor: '#fff2f0' }} icon={<DeleteOutlined />} disabled={can("users.delete")} />
                        </Tooltip>
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
        fetchUsers();
    }, [fetchUsers]);

    const filteredData = useMemo(() => users, [users]);

    const openCreate = () => {
        navigate("/add/employee");
    };

    const onEdit = (record) => {
        navigate(`/edit/employee/${record.id}`);
    };

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/users/${id}`);
        if (res && res?.success) {
            fetchUsers();
            messageApi.success("Employee deleted successfully");
        }
    };

    const totalEmployees = Array.isArray(users) ? users.length : 0;

    const activeEmployees = Array.isArray(users) ? users.filter(u => u.status === "active").length : 0;

    const onLeaveEmployees = Array.isArray(users) ? users.filter(u => u.status !== "active").length : 0;

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Employee</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Employee" },
                        ]}
                    />
                </div>
            </div>

            <div style={{display: "flex",justifyContent: "space-between",alignItems: "*",marginBottom: 16}}>
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate} disabled={can("users.create")}>
                        Add
                    </Button>
                    <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                        Refresh
                    </Button>
                    <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <div class="customer-stats">
                <div>
                    <p>
                        Total Employees  
                    </p>
                    <h2>{totalEmployees}</h2>
                </div>

                <div>
                    <p>
                        Active Employees  
                    </p>
                    <h2 class="blue">{activeEmployees}</h2>
                </div>

                <div>
                    <p>
                        On Leave
                    </p>
                    <h2 class="green">{onLeaveEmployees}</h2>
                </div>
            </div>

            <Table rowKey="id" loading={loading} pagination={{current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true,
            onChange: (page, pageSize) => {setPagination((p) => ({ ...p, current: page, pageSize }));}}} columns={columns} dataSource={filteredData} scroll={{ x: "max-content" }}/>
        </>
    )
}
