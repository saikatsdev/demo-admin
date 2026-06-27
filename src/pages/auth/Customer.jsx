import { ArrowLeftOutlined, SearchOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, ShoppingOutlined, WalletOutlined, CheckCircleOutlined, TeamOutlined, UserAddOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Space, Table, Tag, Typography, Card, Row, Col } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function Customer() {
    // Hook
    useTitle("All Customer");

    // State
    const [users, setUsers]                     = useState(null);
    const [loading, setLoading]                 = useState(false);
    const [customerSummary, setCustomerSummary] = useState(null);
    const [currentPage, setCurrentPage]         = useState(1);
    const [pageSize, setPageSize]               = useState(25);
    const [searchTerm, setSearchTerm]           = useState("");
    const [activeFilter, setActiveFilter]       = useState("all");

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

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: 'center',
            render: (_, __, index) => (
                <Text type="secondary" style={{ fontWeight: 600 }}>
                    {(currentPage - 1) * (users?.per_page || 10) + index + 1}
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

    const fetchUsers = async (page = 1, limit = pageSize, search = searchTerm, type = activeFilter) => {
        try {
            setLoading(true);

            let url = `/admin/customers?page=${page}&paginate_size=${limit}`;
            if (search) url += `&search=${search}`;
            if (type && type !== "all") url += `&type=${type}`;

            const res = await getDatas(url);

            if (res && res?.success) {
                setUsers(res?.result?.customers);
                setCustomerSummary(res?.result?.summary || null);
                setCurrentPage(res?.result?.customers?.current_page || 1);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(1, pageSize, searchTerm, activeFilter);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (!searchTerm) {
            fetchUsers(1, pageSize, "", activeFilter);
        }
    }, [activeFilter]);

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
                    <Card 
                        onClick={() => setActiveFilter("all")}
                        style={{ 
                            ...styles.statCard, 
                            background: activeFilter === "all" ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#fff',
                            border: activeFilter === "all" ? 'none' : '1px solid #e2e8f0',
                            transform: activeFilter === "all" ? 'scale(1.02)' : 'scale(1)'
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Text style={{ color: activeFilter === "all" ? 'rgba(255,255,255,0.8)' : '#64748b', fontSize: '14px', fontWeight: 500 }}>Total Registered Customers</Text>
                            <Title level={2} style={{ color: activeFilter === "all" ? '#fff' : '#1e293b', margin: '8px 0', fontWeight: 800 }}>
                                {Number(customerSummary?.total_customers) || 0}
                            </Title>
                            <Space style={{ color: activeFilter === "all" ? '#fff' : '#6366f1', fontSize: '12px', opacity: activeFilter === "all" ? 0.9 : 1 }}>
                                <TeamOutlined />
                                <span>Global Lifetime Base</span>
                            </Space>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card 
                        onClick={() => setActiveFilter("new")}
                        style={{ 
                            ...styles.statCard,
                            background: activeFilter === "new" ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#fff',
                            border: activeFilter === "new" ? 'none' : '1px solid #e2e8f0',
                            transform: activeFilter === "new" ? 'scale(1.02)' : 'scale(1)'
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Text style={{ color: activeFilter === "new" ? 'rgba(255,255,255,0.8)' : '#64748b', fontSize: '14px', fontWeight: 500 }}>New This Month</Text>
                            <Title level={2} style={{ color: activeFilter === "new" ? '#fff' : '#6366f1', margin: '8px 0', fontWeight: 800 }}>
                                {Number(customerSummary?.current_month_customers) || 0}
                            </Title>
                            <Space style={{ color: activeFilter === "new" ? '#fff' : '#6366f1', fontSize: '12px', opacity: activeFilter === "new" ? 0.9 : 1 }}>
                                <UserAddOutlined />
                                <span>Recent Acquisitions</span>
                            </Space>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card 
                        onClick={() => setActiveFilter("active")}
                        style={{ 
                            ...styles.statCard,
                            background: activeFilter === "active" ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : '#fff',
                            border: activeFilter === "active" ? 'none' : '1px solid #e2e8f0',
                            transform: activeFilter === "active" ? 'scale(1.02)' : 'scale(1)'
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Text style={{ color: activeFilter === "active" ? 'rgba(255,255,255,0.8)' : '#64748b', fontSize: '14px', fontWeight: 500 }}>Active Accounts</Text>
                            <Title level={2} style={{ color: activeFilter === "active" ? '#fff' : '#16a34a', margin: '8px 0', fontWeight: 800 }}>
                                {Number(customerSummary?.active_customers) || 0}
                            </Title>
                            <Space style={{ color: activeFilter === "active" ? '#fff' : '#16a34a', fontSize: '12px', opacity: activeFilter === "active" ? 0.9 : 1 }}>
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
                        style={styles.searchInput} 
                        allowClear
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Table 
                    rowKey={(record) => record.phone_number || record.last_order_id} 
                    loading={loading} 
                    columns={columns} 
                    dataSource={users?.data || []} 
                    scroll={{ x: "max-content" }}
                    style={{ padding: '0 8px' }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: users?.total || 0,
                        onChange: (page, size) => {
                            setPageSize(size);
                            fetchUsers(page, size);
                        },
                        showSizeChanger: true,
                        pageSizeOptions: ['15', '25', '50', '75', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
                        position: ['bottomRight'],
                        style: { padding: '16px 24px' }
                    }}
                />
            </Card>
        </div>
    );
}
