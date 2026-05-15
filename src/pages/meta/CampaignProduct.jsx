import { useState, useEffect, useMemo } from 'react';
import { 
    Table, 
    Card, 
    Row, 
    Col, 
    Tag, 
    Button, 
    Typography, 
    Space, 
    Input, 
    Select, 
    Breadcrumb,
    Alert
} from 'antd';
import { 
    ReloadOutlined, 
    SearchOutlined, 
    FilterOutlined, 
    FacebookFilled,
    CheckCircleOutlined,
    PauseCircleOutlined
} from '@ant-design/icons';
import { getDatas } from '../../api/common/common';
import useTitle from '../../hooks/useTitle';
import './MetaAdsReport.css'; // Reusing the same premium styles

const { Title, Text } = Typography;
const { Option } = Select;

const CampaignProduct = () => {
    // Hook
    useTitle("Campaign Product");

    // State
    const [data, setData]             = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [refreshing, setRefreshing] = useState(false);

    // Method
    const fetchProducts = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);
        
        setError(null);
        try {
            const response = await getDatas('admin/facebook-ads/products');
            
            if (response.data) {
                setData(response.data);
            } else if (response.data && response.data.error) {
                setError(response.data.message || 'Failed to fetch campaign products');
            } else {
                setData([]);
            }
        } catch (err) {
            console.error('Error fetching campaign products:', err);
            setError(err.response?.data?.message || 'Failed to connect to the server');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Frontend Filtering Logic
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch = item.name?.toLowerCase().includes(searchText.toLowerCase()) || 
                                 item.id?.includes(searchText);
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [data, searchText, statusFilter]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusTag = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'ACTIVE':
                return <Tag color="success" icon={<CheckCircleOutlined />}>ACTIVE</Tag>;
            case 'PAUSED':
                return <Tag color="warning" icon={<PauseCircleOutlined />}>PAUSED</Tag>;
            default:
                return <Tag color="default">{status}</Tag>;
        }
    };

    const columns = [
        {
            title: 'Product Campaign',
            key: 'name',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: '15px' }}>{record.name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
                </Space>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
        },
        {
            title: 'Objective',
            dataIndex: 'objective',
            key: 'objective',
            render: (objective) => (
                <Tag color="geekblue" style={{ borderRadius: '4px', fontWeight: 500 }}>
                    {objective?.replace(/_/g, ' ')}
                </Tag>
            ),
        },
        {
            title: 'Schedule',
            key: 'schedule',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: '13px' }}>Start: {formatDate(record.start_time)}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Updated: {formatDate(record.updated_time)}</Text>
                </Space>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'created_time',
            key: 'created',
            render: (date) => formatDate(date),
            sorter: (a, b) => new Date(a.created_time) - new Date(b.created_time),
        }
    ];

    return (
        <div className="meta-ads-page">
            {/* Header Section */}
            <div className="page-header-wrapper">
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} md={16}>
                        <Breadcrumb items={[{ title: 'Dashboard' }, { title: 'Meta Ads' }, { title: 'Campaign Products' }]} />
                        <div style={{ marginTop: '12px' }}>
                            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FacebookFilled style={{ color: '#1877F2' }} />
                                Campaign Products
                            </Title>
                            <Text type="secondary">Manage and filter your product-specific Facebook campaigns</Text>
                        </div>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Button 
                            type="primary" 
                            icon={<ReloadOutlined spin={refreshing} />} 
                            onClick={() => fetchProducts(true)}
                            loading={refreshing}
                            size="large"
                            style={{ borderRadius: '8px', fontWeight: 600 }}
                        >
                            {refreshing ? 'Syncing...' : 'Sync Products'}
                        </Button>
                    </Col>
                </Row>
            </div>

            {error && (
                <Alert
                    message="Sync Error"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    style={{ marginBottom: '24px', borderRadius: '12px' }}
                />
            )}

            {/* Filter Section */}
            <Card className="table-card-premium" style={{ marginBottom: '24px' }} bordered={false}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={12} lg={8}>
                        <Input
                            placeholder="Search by name or ID..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            size="large"
                            allowClear
                            style={{ borderRadius: '8px' }}
                        />
                    </Col>
                    <Col xs={24} md={8} lg={6}>
                        <Select
                            defaultValue="ALL"
                            style={{ width: '100%', borderRadius: '8px' }}
                            size="large"
                            onChange={value => setStatusFilter(value)}
                            suffixIcon={<FilterOutlined />}
                        >
                            <Option value="ALL">All Statuses</Option>
                            <Option value="ACTIVE">Active</Option>
                            <Option value="PAUSED">Paused</Option>
                            <Option value="ARCHIVED">Archived</Option>
                        </Select>
                    </Col>
                    <Col xs={24} md={4} lg={10} style={{ textAlign: 'right' }}>
                        <Text type="secondary" strong>
                            Showing {filteredData.length} of {data.length} Results
                        </Text>
                    </Col>
                </Row>
            </Card>

            {/* Table Section */}
            <Card className="table-card-premium" bordered={false}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading && !refreshing}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} products`,
                    }}
                    className="meta-ads-table"
                />
            </Card>
        </div>
    );
};

export default CampaignProduct;