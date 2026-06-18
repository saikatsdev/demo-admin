import { Breadcrumb, message, Table, Tag, Card, Typography, Space, Button, Tooltip, Row, Col, Statistic, Select } from "antd";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle";
import { Link, useNavigate } from "react-router-dom";
import { getDatas } from "../../api/common/common";
import { EyeOutlined, ReloadOutlined, UserOutlined, PhoneOutlined, InfoCircleOutlined, ShoppingCartOutlined,DollarCircleOutlined,CopyOutlined} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export default function UnpreparedOrderList() {
    // Hook
    useTitle("Unprepared Order List");
    const navigate = useNavigate();

    // States
    const [loading, setLoading]       = useState(false);
    const [orders, setOrders]         = useState([]);
    const [summary, setSummary]       = useState({orders_count: 0,duplicate_orders_count: 0,total_amount: "0.00"});
    const [pagination, setPagination] = useState({current: 1,pageSize: 25,total: 0});
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleBatchAction = (value) => {
        if (value === 'assign_prepare') {
            messageApi.info("Assign Prepare action triggered for " + selectedRowKeys.length + " items");
        } else if (value === 'remove_assign_prepare') {
            messageApi.info("Remove Assign Prepare action triggered for " + selectedRowKeys.length + " items");
        }
    };

    const getUnpreparedOrders = async (page = 1, pageSize = 25) => {
        try {
            setLoading(true);
            const res = await getDatas('/admin/team/unprepared/list', {page,paginate_size: pageSize});

            if (res && res?.success) {
                setOrders(res?.result?.data || []);
                setSummary({
                    orders_count          : res.result.orders_count,
                    duplicate_orders_count: res.result.duplicate_orders_count,
                    total_amount          : res.result.total_amount
                });
                setPagination({
                    current : res.result.meta.current_page,
                    pageSize: res.result.meta.per_page,
                    total   : res.result.meta.total,
                });
            }
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to fetch unprepared orders");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getUnpreparedOrders();
    }, []);

    const handleTableChange = (pagination) => {
        getUnpreparedOrders(pagination.current, pagination.pageSize);
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: 'center',
            render: (_, __, index) => (
                <Text type="secondary">
                    {(pagination.current - 1) * pagination.pageSize + index + 1}
                </Text>
            ),
        },
        {
            title: "Invoice & Date",
            key: "invoice",
            width: 180,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: '#1890ff' }}>{record.invoice_number}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(record.created_at).format("DD MMM YYYY, hh:mm A")}
                    </Text>
                    {record.is_duplicate === 1 && (
                        <Tag color="error" icon={<CopyOutlined />} style={{ fontSize: '10px', marginTop: '4px' }}>
                            DUPLICATE
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: "Customer Info",
            key: "customer",
            width: 220,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong><UserOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />{record.customer_name}</Text>
                    <Text type="secondary"><PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />{record.phone_number}</Text>
                </Space>
            ),
        },
        {
            title: "Location Details",
            dataIndex: "address_details",
            key: "address",
            width: 250,
            ellipsis: {
                showTitle: false,
            },
            render: (address) => (
                <Tooltip placement="topLeft" title={address}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>{address}</Text>
                </Tooltip>
            ),
        },
        {
            title: "Amounts",
            key: "amounts",
            width: 150,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <Text type="secondary">Net:</Text>
                        <Text strong>৳{parseFloat(record.net_order_price).toLocaleString()}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <Text type="secondary">Payable:</Text>
                        <Text strong style={{ color: '#52c41a' }}>৳{parseFloat(record.payable_price).toLocaleString()}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 150,
            render: (_, record) => (
                <Space direction="vertical" size={4}>
                    <Tag color={record.paid_status === 'paid' ? 'success' : 'warning'} style={{ textTransform: 'capitalize', margin: 0, width: '100%', textAlign: 'center' }}>
                        {record.paid_status}
                    </Tag>
                    <Tag color="blue" bordered={false} style={{ margin: 0, width: '100%', textAlign: 'center' }}>
                        {record.current_status?.name}
                    </Tag>
                </Space>
            ),
        },
        {
            title: "Assigned To",
            key: "assignee",
            width: 120,
            render: (_, record) => (
                <Tag icon={<UserOutlined />} color="default" style={{textTransform: 'capitalize'}}>
                    {record.assign_user?.username || 'Unassigned'}
                </Tag>
            ),
        },
        {
            title: "Action",
            key: "action",
            fixed: 'right',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="View Details">
                        <Button type="primary" ghost shape="circle" icon={<EyeOutlined />} onClick={() => navigate(`/admin/order/details/${record.id}`)}/>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '0 4px' }}>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: 24 }}>
                <div className="head-left">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Team Management" },
                            { title: "Unprepared Order List" },
                        ]}
                        style={{ marginBottom: 8 }}
                    />
                    <Title level={2} style={{ margin: 0, fontWeight: "700" }}>
                        Unprepared Orders
                    </Title>
                </div>
                <div className="head-actions">
                    <Button icon={<ReloadOutlined />} onClick={() => getUnpreparedOrders(pagination.current, pagination.pageSize)} loading={loading}>
                        Refresh List
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic title="Total Unprepared" value={summary.orders_count} prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}/>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic title="Duplicate Orders" value={summary.duplicate_orders_count} valueStyle={{ color: '#cf1322' }} prefix={<InfoCircleOutlined />}/>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Statistic title="Total Value" value={parseFloat(summary.total_amount)} precision={2} prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />} suffix="৳"/>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
                {selectedRowKeys.length > 0 && (
                    <Space style={{ backgroundColor: '#e6f7ff', padding: '12px 20px', borderRadius: '12px', border: '1px solid #91d5ff', width: '100%', justifyContent: 'space-between' }}>
                        <Space size="large">
                            <Text strong><InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />{selectedRowKeys.length} orders selected</Text>
                            <Select 
                                placeholder="Bulk Actions" 
                                style={{ width: 220 }} 
                                onChange={handleBatchAction}
                                size="middle"
                            >
                                <Select.Option value="assign_prepare">Assign Prepare</Select.Option>
                                <Select.Option value="remove_assign_prepare">Remove Assign Prepare</Select.Option>
                            </Select>
                        </Space>
                        <Space>
                            <Button type="primary" size="middle" ghost icon={<ShoppingCartOutlined />}>Print Selected</Button>
                            <Button type="link" size="small" danger onClick={() => setSelectedRowKeys([])}>Clear Selection</Button>
                        </Space>
                    </Space>
                )}
            </div>


            <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',border: 'none'}}>
                <Table 
                    rowSelection={rowSelection}
                    columns={columns} 
                    dataSource={orders} 
                    rowKey="id" 
                    loading={loading} 
                    pagination={{...pagination,showSizeChanger: true,
                        pageSizeOptions: ['20', '50', '100', '200'],
                        showTotal: (total, range) => (
                            <Text type="secondary">
                                Showing {range[0]}-{range[1]} of {total} orders
                            </Text>
                        ),
                        position: ['bottomRight']
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    style={{ borderRadius: 0 }}
                />
            </Card>
        </div>
    )
}


