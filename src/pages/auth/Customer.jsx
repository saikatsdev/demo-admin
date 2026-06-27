import { ArrowLeftOutlined, SearchOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, ShoppingOutlined, WalletOutlined, CheckCircleOutlined, TeamOutlined, UserAddOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Space, Table, Tag, Typography, Card, Row, Col } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function Customer() {
    // Hook
    useTitle("All Customer");

    // State
    const [query, setQuery]                     = useState("");
    const [users, setUsers]                     = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [pagination, setPagination]           = useState({current: 1,pageSize: 20,total: 0});
    const { current, pageSize }                 = pagination;
    const [debouncedQuery, setDebouncedQuery]   = useState("");
    const [customerSummary, setCustomerSummary] = useState(null);

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
            height: '35px',
            fontWeight: 500,
        },
        addBtn: {
            borderRadius: '8px',
            height: '35px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            fontWeight: 600,
        }
    };

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
            title: "Customer",
            dataIndex: "customer_name",
            key: "customer",
            width: 300,
            render: (text, record) => (
                <Space size="middle">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px', color: '#1e293b', textTransform: 'capitalize' }}>{text}</Text>
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
            width: 160,
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
            title: "Financials",
            key: "financials",
            width: 200,
            render: (record) => (
                <Space direction="vertical" size={2}>
                    <Text style={{ fontSize: '13px' }}>
                        <ShoppingOutlined style={{ marginRight: 6, color: '#6366f1' }} />
                        Orders: <Text strong>{record.total_orders || 0}</Text>
                    </Text>
                    <Text style={{ fontSize: '13px' }}>
                        <WalletOutlined style={{ marginRight: 6, color: '#16a34a' }} />
                        Spent: <Text strong style={{ color: '#16a34a' }}>৳{Number(record.total_spent || 0).toLocaleString()}</Text>
                    </Text>
                </Space>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => {
                const isActive = (status || "active") === "active";
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
                        {status || "active"}
                    </Tag>
                );
            },
        },
        {
            title: "Recent Activity",
            key: "last_order",
            width: 220,
            render: (record) => {
                const date = record.last_order_date ? dayjs(record.last_order_date).format("DD-MMM-YYYY") : null;
                const time = record.last_order_date ? dayjs(record.last_order_date).format("hh:mm A") : null;
                const invoice = record.last_invoice_number;

                if (!date) return <Text type="secondary">No orders yet</Text>;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Space size={4}>
                            <CalendarOutlined style={{ color: '#94a3b8' }} />
                            <Text style={{ fontSize: '13px', color: '#475569' }}>{date}</Text>
                            <Text type="secondary" style={{ fontSize: '11px' }}>{time}</Text>
                        </Space>
                        {invoice && (
                            <Space size={4}>
                                <Text type="secondary" style={{ fontSize: '11px' }}>Invoice:</Text>
                                <Tag color="blue" style={{ borderRadius: '4px', fontSize: '10px', margin: 0 }}>#{invoice}</Tag>
                            </Space>
                        )}
                    </div>
                );
            }
        },
    ];

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }));
    }, [debouncedQuery]);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            const params = {user_category_id: 1,page: current,paginate_size: pageSize,...(debouncedQuery ? { search_key: debouncedQuery } : {})};

            const res = await getDatas("/admin/customers", params);

            if (res && res?.success) {
                setUsers(res?.result?.customers);

                setCustomerSummary(res?.result?.summary || []);

                setPagination((p) => {
                    const next = {
                    ...p,
                        current: res?.result?.customers?.current_page ?? p.current,
                        pageSize: res?.result?.customers?.per_page ?? p.pageSize,
                        total: res?.result?.customers?.total ?? p.total,
                    };

                    const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total;

                    return unchanged ? p : next;
                });
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [current, pageSize, debouncedQuery]);

    const filteredData = useMemo(() => {
        if (!debouncedQuery) return users;
        return users.filter(u =>
            u.customer_name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            u.phone_number.includes(debouncedQuery)
        );
    }, [users, debouncedQuery]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>
                        <TeamOutlined style={{ marginRight: 12, color: '#6366f1' }} />
                        Customer Directory
                    </Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <span style={{ color: '#64748b' }}>All Customers</span> },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space size="middle">
                        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={styles.actionBtn}>
                            Back
                        </Button>
                    </Space>
                </div>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card style={{ ...styles.statCard, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                        <Space direction="vertical" size={0}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500 }}>Total Registered Customers</Text>
                            <Title level={2} style={{ color: '#fff', margin: '8px 0', fontWeight: 800 }}>
                                {Number(customerSummary?.total_customers) || 0}
                            </Title>
                            <Space style={{ color: '#fff', fontSize: '12px', opacity: 0.9 }}>
                                <TeamOutlined />
                                <span>Global Lifetime Base</span>
                            </Space>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={styles.statCard}>
                        <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>New This Month</Text>
                            <Title level={2} style={{ color: '#6366f1', margin: '8px 0', fontWeight: 800 }}>
                                {Number(customerSummary?.current_month_customers) || 0}
                            </Title>
                            <Space style={{ color: '#6366f1', fontSize: '12px' }}>
                                <UserAddOutlined />
                                <span>Recent Acquisitions</span>
                            </Space>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={styles.statCard}>
                        <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>Active Accounts</Text>
                            <Title level={2} style={{ color: '#16a34a', margin: '8px 0', fontWeight: 800 }}>
                                {Number(customerSummary?.active_customers) || 0}
                            </Title>
                            <Space style={{ color: '#16a34a', fontSize: '12px' }}>
                                <CheckCircleOutlined />
                                <span>Verified & Active</span>
                            </Space>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Card style={styles.tableCard} bodyStyle={{ padding: 0 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0, color: '#334155' }}>Customer Base</Title>
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
                        showTotal: (total) => `Total ${total} customers`,
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
