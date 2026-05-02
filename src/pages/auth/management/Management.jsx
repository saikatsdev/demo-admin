import { ArrowLeftOutlined, PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, CalendarOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Popconfirm, Space, Table, Tag, Card, Row, Col, Typography, Avatar, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { deleteData, getDatas } from "../../../api/common/common";
import { useEffect, useMemo, useState } from "react";

const { Title, Text } = Typography;

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

    // Local Styles for Professional Look
    const styles = {
        container: {
            padding: '24px',
            background: '#f8fafc',
            minHeight: '100vh',
        },
        header: {
            background: '#ffffff',
            padding: '24px 30px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            border: '1px solid #e2e8f0',
        },
        statCard: {
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            transition: 'transform 0.2s ease',
            cursor: 'pointer',
        },
        tableCard: {
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
        },
        searchInput: {
            borderRadius: '10px',
            width: 320,
            height: '42px',
        },
        actionBtn: {
            borderRadius: '8px',
            height: '42px',
            fontWeight: 500,
        },
        addBtn: {
            borderRadius: '8px',
            height: '42px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            fontWeight: 600,
        }
    };

    // Table Columns
    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: 'center',
            render: (_, __, index) => (
                <Text type="secondary" style={{ fontWeight: 600 }}>
                    {(current - 1) * pageSize + index + 1}
                </Text>
            ),
        },
        {
            title: "Member",
            dataIndex: "username",
            key: "member",
            width: 250,
            render: (text, record) => (
                <Space size="middle">
                    <Avatar 
                        src={record.image} 
                        size={44} 
                        icon={<UserOutlined />} 
                        style={{ border: '2px solid #e2e8f0' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px', color: '#1e293b' }}>{text}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <MailOutlined style={{ marginRight: 4 }} />
                            {record.email || "No email provided"}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "Contact",
            dataIndex: "phone_number",
            key: "phone_number",
            width: 180,
            render: (phone) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px', display: 'flex' }}>
                        <PhoneOutlined style={{ color: '#64748b' }} />
                    </div>
                    <Text style={{ color: '#475569' }}>{phone}</Text>
                </div>
            ),
        },
        {
            title: "Category",
            dataIndex: ["category", "name"],
            key: "category",
            width: 150,
            render: (cat) => (
                <Tag color="blue" style={{ borderRadius: '6px', fontWeight: 500, padding: '2px 10px', border: 'none' }}>
                    {cat || "General"}
                </Tag>
            ),
        },
        {
            title: "Roles",
            dataIndex: "roles",
            key: "roles",
            width: 200,
            render: (roles) => (
                <Space size={[4, 4]} wrap>
                    {(roles || []).map((r) => (
                        <Tag 
                            key={r.id} 
                            style={{ 
                                borderRadius: '6px', 
                                background: '#f8fafc', 
                                color: '#6366f1', 
                                border: '1px solid #e2e8f0',
                                fontWeight: 500
                            }}
                        >
                            <SafetyOutlined style={{ marginRight: 4 }} />
                            {r.display_name || r.name}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => {
                const isActive = status === "active";
                return (
                    <Tag 
                        color={isActive ? "success" : "error"} 
                        style={{ 
                            borderRadius: '20px', 
                            padding: '2px 12px', 
                            fontWeight: 600,
                            textTransform: 'capitalize'
                        }}
                    >
                        <span style={{ marginRight: 6 }}>●</span>
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: "Activity",
            dataIndex: "login_at",
            key: "login_at",
            width: 180,
            render: (date) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: '13px', color: '#475569' }}>
                        <CalendarOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
                        {date ? date.split(' ')[0] : "Never"}
                    </Text>
                    {date && <Text type="secondary" style={{ fontSize: '11px' }}>{date.split(' ')[1]}</Text>}
                </Space>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 120,
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Profile">
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={() => onEdit(record)}
                            style={{ borderRadius: '8px', color: '#4f46e5', borderColor: '#4f46e5' }}
                        />
                    </Tooltip>
                    <Popconfirm 
                        title="Delete Member" 
                        description="Are you sure you want to remove this member?"
                        okText="Yes, Delete" 
                        cancelText="No" 
                        onConfirm={() => onDelete(record.id)}
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Remove Member">
                            <Button 
                                danger 
                                icon={<DeleteOutlined />} 
                                style={{ borderRadius: '8px' }}
                            />
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
        <div style={styles.container}>
            <div style={styles.header}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>
                        <TeamOutlined style={{ marginRight: 12, color: '#6366f1' }} />
                        Management Team
                    </Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <span style={{ color: '#64748b' }}>Management List</span> },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space size="middle">
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => window.history.back()}
                            style={styles.actionBtn}
                        >
                            Back
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={openCreate}
                            style={styles.addBtn}
                        >
                            Add New Member
                        </Button>
                    </Space>
                </div>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card style={{ ...styles.statCard, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                        <Space direction="vertical" size={0}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500 }}>Total Team Members</Text>
                            <Title level={2} style={{ color: '#fff', margin: '8px 0', fontWeight: 800 }}>{totalManagement}</Title>
                            <Space style={{ color: '#fff', fontSize: '12px', opacity: 0.9 }}>
                                <TeamOutlined />
                                <span>Global Management</span>
                            </Space>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={styles.statCard}>
                        <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>Active Profiles</Text>
                            <Title level={2} style={{ color: '#16a34a', margin: '8px 0', fontWeight: 800 }}>{activeManagement}</Title>
                            <Space style={{ color: '#16a34a', fontSize: '12px' }}>
                                <CheckCircleOutlined />
                                <span>Verified & Online</span>
                            </Space>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={styles.statCard}>
                        <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>Pending / Inactive</Text>
                            <Title level={2} style={{ color: '#f59e0b', margin: '8px 0', fontWeight: 800 }}>{pendingManagement}</Title>
                            <Space style={{ color: '#f59e0b', fontSize: '12px' }}>
                                <ClockCircleOutlined />
                                <span>Awaiting Review</span>
                            </Space>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Card style={styles.tableCard} bodyStyle={{ padding: 0 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0, color: '#334155' }}>Member Directory</Title>
                    <AntInput 
                        placeholder="Search by name, email or phone..." 
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)}
                        style={styles.searchInput}
                        allowClear
                    />
                </div>
                <Table 
                    rowKey="id" 
                    loading={loading} 
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize, 
                        total: pagination.total, 
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total) => `Total ${total} members`,
                        onChange: (page, pageSize) => {
                            setPagination((p) => ({ ...p, current: page, pageSize }));
                        },
                    }} 
                    columns={columns} 
                    dataSource={filteredData} 
                    scroll={{ x: "max-content" }}
                    style={{ padding: '0 8px' }}
                />
            </Card>
        </div>
    );
}
