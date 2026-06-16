import {Breadcrumb, message, Table, Tag, Row, Col, Card, Space, Typography, Tooltip} from "antd";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle"
import { Link } from "react-router-dom";
import { getDatas } from "../../api/common/common";
import { ClockCircleOutlined, UserOutlined, DollarCircleOutlined, FileTextOutlined,CheckCircleOutlined,WarningOutlined} from "@ant-design/icons";

const { Text, Title } = Typography;

export default function AssignList() {
    // Hook
    useTitle("Assigned Order List");

    // States
    const [loading, setLoading]       = useState(false);
    const [orders, setOrders]         = useState([]);
    const [summary, setSummary]       = useState({orders_count: 0,duplicate_orders_count: 0,total_amount: "0.00"});
    const [pagination, setPagination] = useState({current: 1,pageSize: 25,total: 0});
    const [messageApi, contextHolder] = message.useMessage();

    const getAssignedOrders = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getDatas('/admin/team/assign-by-list', { page, paginate_size: 25 });

            if (res && res?.success) {
                setOrders(res?.result?.data || []);
                setSummary({
                    orders_count          : res?.result?.orders_count || 0,
                    duplicate_orders_count: res?.result?.duplicate_orders_count || 0,
                    total_amount          : res?.result?.total_amount || "0.00"
                });
                setPagination({
                    current : res?.result?.meta?.current_page || 1,
                    pageSize: res?.result?.meta?.per_page || 50,
                    total   : res?.result?.meta?.total || 0,
                });
            }
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to fetch assigned orders");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAssignedOrders();
    }, []);

    const handleTableChange = (pagination) => {
        getAssignedOrders(pagination.current);
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: "center",
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: "Invoice & Date",
            key: "invoice",
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: "#1C558B" }}>{record.invoice_number}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(record.created_at).toLocaleString()}
                    </Text>
                </Space>
            )
        },
        {
            title: "Customer",
            key: "customer",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.customer_name}</Text>
                    <Text type="secondary">{record.phone_number}</Text>
                </Space>
            )
        },
        {
            title: "Prices",
            key: "prices",
            align: "right",
            render: (_, record) => (
                <Space direction="vertical" align="end" size={0}>
                    <Text>MRP: ৳{record.mrp}</Text>
                    <Text strong type="success">Payable: ৳{record.payable_price}</Text>
                </Space>
            )
        },
        {
            title: "Status",
            key: "status",
            align: "center",
            render: (_, record) => (
                <Space direction="vertical" size={4}>
                    <Tag color={record.paid_status === 'paid' ? 'success' : 'error'}>
                        {record.paid_status?.toUpperCase()}
                    </Tag>
                    {record.current_status && (
                        <Tag 
                            style={{ 
                                backgroundColor: record.current_status.bg_color + '1A',
                                color          : record.current_status.bg_color,
                                borderColor    : record.current_status.bg_color
                            }}
                        >
                            {record.current_status.name}
                        </Tag>
                    )}
                </Space>
            )
        },
        {
            title: "Prepared By",
            key: "prepared_by",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space size={4}>
                        <UserOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                        <Text>{record.prepared_by?.username}</Text>
                    </Space>

                    <Space size={4}>
                        <ClockCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                        <Text type="secondary" style={{ fontSize: '11px' }}>{record.prepared_at}</Text>
                    </Space>
                </Space>
            )
        },
        {
            title: "Other",
            key: "other",
            render: (_, record) => (
                <Space size={8}>
                    {record.is_duplicate === 1 && (
                        <Tooltip title="Duplicate Order">
                            <Tag color="warning" icon={<WarningOutlined />}>DUP</Tag>
                        </Tooltip>
                    )}
                    
                    {record.is_invoice_printed === 1 && (
                        <Tooltip title="Invoice Printed">
                            <Tag color="blue" icon={<CheckCircleOutlined />}>PRN</Tag>
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    return (
        <>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: '24px' }}>
                <div className="head-left">
                    <Title level={3} style={{ margin: 0, fontWeight: "600" }}>
                        Assigned Order List
                    </Title>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Assigned Order List" },
                        ]}
                    />
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Space align="start">
                            <div style={{ backgroundColor: '#e6f7ff', padding: '12px', borderRadius: '10px' }}>
                                <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                            </div>
                            <div>
                                <Text type="secondary">Total Orders</Text>
                                <Title level={4} style={{ margin: 0 }}>{summary.orders_count}</Title>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Space align="start">
                            <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '10px' }}>
                                <WarningOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                            </div>
                            <div>
                                <Text type="secondary">Duplicates</Text>
                                <Title level={4} style={{ margin: 0 }}>{summary.duplicate_orders_count}</Title>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Space align="start">
                            <div style={{ backgroundColor: '#f6ffed', padding: '12px', borderRadius: '10px' }}>
                                <DollarCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                            </div>
                            <div>
                                <Text type="secondary">Total Amount</Text>
                                <Title level={4} style={{ margin: 0 }}>৳ {Number(summary.total_amount).toLocaleString()}</Title>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}
                    pagination={{
                        ...pagination,
                        showSizeChanger: false,
                        showTotal: (total) => `Total ${total} orders`,
                        position: ['bottomRight']
                    }}
                    style={{ borderRadius: '12px' }}
                />
            </Card>
        </>
    )
}
