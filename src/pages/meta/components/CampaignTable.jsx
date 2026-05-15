import { Table, Card, Row, Col, Tag, Button,Typography, Space, Input, Select, Divider } from 'antd';
import { 
    SearchOutlined, 
    FilterOutlined, 
    ReloadOutlined, 
    RightOutlined, 
    DownOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';

const { Text, Title } = Typography;
const { Option } = Select;

const CampaignTable = ({ campaigns, loading, refreshing, onRefresh, pagination, setPagination }) => {
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const filteredCampaigns = useMemo(() => {
        const data = Array.isArray(campaigns) ? campaigns : [];
        return data.filter(item => {
            const matchesSearch = item.name?.toLowerCase().includes(searchText.toLowerCase()) || 
                                 item.id?.includes(searchText);
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [campaigns, searchText, statusFilter]);

    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusTag = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'ACTIVE': return <Tag color="success">ACTIVE</Tag>;
            case 'PAUSED': return <Tag color="warning">PAUSED</Tag>;
            default: return <Tag color="default">{status}</Tag>;
        }
    };

    const columns = [
        {
            title: '#',
            width: 50,
            fixed: 'left',
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: 'Campaign Details',
            key: 'campaign',
            fixed: 'left',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: '13px' }}>{record.name}</Text>
                    <Space size={4}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>ID: {record.id}</Text>
                        {getStatusTag(record.status)}
                    </Space>
                </Space>
            ),
            width: 220,
        },
        {
            title: 'Budget',
            key: 'budget',
            render: (_, record) => (
                <Text strong style={{ color: '#1677ff' }}>{formatCurrency(record.daily_budget || record.lifetime_budget)}</Text>
            ),
            width: 110,
        },
        { title: 'Spent', dataIndex: 'spend', key: 'spend', render: (val) => <Text strong style={{ color: '#cf1322' }}>{formatCurrency(val)}</Text> },
        { title: 'Purchase', dataIndex: 'purchases', key: 'purchases', render: (val) => <Text strong style={{ color: '#389e0d' }}>{val || 0}</Text> },
        { 
            title: 'CTR', 
            dataIndex: 'ctr', 
            key: 'ctr', 
            render: (val) => <Tag color="blue">{parseFloat(val || 0).toFixed(2)}%</Tag> 
        },
        { 
            title: 'Impressions', 
            dataIndex: 'impressions', 
            key: 'impressions', 
            render: (val) => new Intl.NumberFormat('en', { notation: 'compact' }).format(val) 
        },
        { 
            title: 'Clicks', 
            dataIndex: 'clicks', 
            key: 'clicks', 
            render: (val) => new Intl.NumberFormat('en', { notation: 'compact' }).format(val) 
        },
    ];

    return (
        <>
            <Card className="table-card-premium" style={{ marginBottom: '16px' }} bordered={false}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={10} lg={8}>
                        <Input
                            placeholder="Search campaigns..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                        <Select defaultValue="ALL" style={{ width: '100%' }} onChange={setStatusFilter}>
                            <Option value="ALL">All Status</Option>
                            <Option value="ACTIVE">Active</Option>
                            <Option value="PAUSED">Paused</Option>
                        </Select>
                    </Col>
                    <Col xs={12} md={4} lg={3}>
                        <Button icon={<ReloadOutlined spin={refreshing} />} onClick={() => onRefresh(true)} block>
                            Refresh
                        </Button>
                    </Col>
                    <Col xs={24} md={4} lg={9} style={{ textAlign: 'right' }}>
                        <Text type="secondary">Found {filteredCampaigns.length} campaigns</Text>
                    </Col>
                </Row>
            </Card>

            <Card className="table-card-premium" bordered={false}>
                <Table
                    columns={columns}
                    dataSource={filteredCampaigns}
                    rowKey="id"
                    loading={loading && !refreshing}
                    scroll={{ x: 'max-content' }}
                    pagination={pagination}
                    onChange={(p) => setPagination(p)}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
                                <Title level={5}><BarChartOutlined /> Full Advanced Data Breakdown</Title>
                                <Divider style={{ margin: '12px 0' }} />
                                <Row gutter={[24, 24]}>
                                    <Col span={24}>
                                        <Text strong>Actions & Performance Insights</Text>
                                        <Row gutter={[8, 8]} style={{ marginTop: '12px' }}>
                                            {record.actions?.map((action, i) => (
                                                <Col key={i} xs={24} sm={12} md={6}>
                                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                                        <Text type="secondary" style={{ fontSize: '11px' }}>{action.action_type?.replace(/_/g, ' ')}</Text>
                                                        <Text strong>{action.value}</Text>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Col>
                                </Row>
                            </div>
                        ),
                        expandIcon: ({ expanded, onExpand, record }) =>
                            expanded ? <DownOutlined onClick={e => onExpand(record, e)} /> : <RightOutlined onClick={e => onExpand(record, e)} />
                    }}
                />
            </Card>
        </>
    );
};

export default CampaignTable;
