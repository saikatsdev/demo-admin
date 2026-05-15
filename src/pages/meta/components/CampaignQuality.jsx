import { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Spin, Alert, Progress, Space, Tooltip } from 'antd';
import { DashboardOutlined, FireOutlined,ShoppingOutlined,DollarOutlined,RiseOutlined,InfoCircleOutlined,ProjectOutlined} from '@ant-design/icons';
import { getDatas } from '../../../api/common/common';

const { Title, Text } = Typography;

const CampaignQuality = () => {
    // State
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getDatas('admin/facebook-ads/analytics');
            if (response && response.result) {
                setCampaigns(response.result);
            } else if (Array.isArray(response)) {
                setCampaigns(response);
            } else {
                setCampaigns([]);
            }
        } catch (err) {
            console.error('Error fetching quality analytics:', err);
            setError('Failed to load campaign quality analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Aggregate Stats
    const stats = useMemo(() => {
        if (!Array.isArray(campaigns)) return null;
        
        let totalSpend = 0;
        let totalOrders = 0;
        let totalRevenue = 0;
        let totalImpressions = 0;

        campaigns.forEach(campaign => {
            campaign.ads?.forEach(ad => {
                totalSpend += parseFloat(ad.spend || 0);
                totalOrders += parseInt(ad.orders || 0);
                totalRevenue += parseFloat(ad.revenue || 0);
                totalImpressions += parseInt(ad.impressions || 0);
            });
        });

        const roas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;

        return { totalSpend, totalOrders, totalRevenue, totalImpressions, roas };
    }, [campaigns]);

    const formatCurrency = (val) => `$${parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const columns = 
    [
        {
            title: 'Campaign',
            key: 'campaign',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.campaign_name}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>ID: {record.campaign_id}</Text>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'campaign_status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'ACTIVE' ? 'success' : 'warning'}>{status}</Tag>
            ),
        },
        {
            title: 'Ads',
            dataIndex: 'ads_count',
            key: 'ads_count',
            align: 'center',
            render: (count) => <Tag color="blue">{count} Ads</Tag>
        },
        {
            title: 'Perf. Metrics',
            key: 'metrics',
            render: (_, record) => {
                const campaignSpend = record.ads?.reduce((acc, ad) => acc + parseFloat(ad.spend || 0), 0) || 0;
                const campaignRevenue = record.ads?.reduce((acc, ad) => acc + parseFloat(ad.revenue || 0), 0) || 0;
                return (
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ color: '#cf1322' }}>{formatCurrency(campaignSpend)}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Revenue: {formatCurrency(campaignRevenue)}</Text>
                    </Space>
                );
            }
        },
        {
            title: 'ROAS',
            key: 'roas',
            render: (_, record) => {
                const spend = record.ads?.reduce((acc, ad) => acc + parseFloat(ad.spend || 0), 0) || 0;
                const revenue = record.ads?.reduce((acc, ad) => acc + parseFloat(ad.revenue || 0), 0) || 0;
                const roas = spend > 0 ? (revenue / spend).toFixed(2) : '0.00';
                return <Tag color={parseFloat(roas) > 2 ? 'green' : 'orange'}>{roas}x</Tag>;
            }
        }
    ];

    const adColumns = 
    [
        {
            title: 'Ad Name',
            dataIndex: 'ad_name',
            key: 'ad_name',
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '10px' }}>ID: {record.ad_id}</Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'ad_status',
            key: 'ad_status',
            render: (status) => <Tag color={status === 'ACTIVE' ? 'success' : 'default'} style={{ fontSize: '10px' }}>{status}</Tag>
        },
        { title: 'Spend', dataIndex: 'spend', key: 'spend', render: (val) => <Text strong>{formatCurrency(val)}</Text> },
        { title: 'Orders', dataIndex: 'orders', key: 'orders', render: (val) => <Text strong color="green">{val}</Text> },
        { 
            title: 'Conv. Health', 
            key: 'health',
            render: (_, record) => (
                <Tooltip title={`Completed: ${record.completed_orders} | Cancelled: ${record.cancelled_orders}`}>
                    <Space direction="vertical" size={0}>
                        <Progress 
                            percent={100 - parseFloat(record.cancel_rate || 0)} 
                            size="small" 
                            status={parseFloat(record.cancel_rate || 0) > 20 ? 'exception' : 'active'}
                            format={() => `${record.cancel_rate || '0%'}`}
                        />
                        <Text type="secondary" style={{ fontSize: '9px' }}>Cancel Rate</Text>
                    </Space>
                </Tooltip>
            )
        },
        { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (val) => <Text strong style={{ color: '#389e0d' }}>{formatCurrency(val)}</Text> },
        { title: 'AOV', dataIndex: 'aov', key: 'aov', render: (val) => <Text>{formatCurrency(val)}</Text> }
    ];

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="Processing Advanced Analytics..." />
        </div>
    );

    if (error) return (
        <Alert message="Analysis Error" description={error} type="error" showIcon style={{ margin: '24px', borderRadius: '12px' }} />
    );

    return (
        <div style={{ padding: '24px 0' }}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="stat-card-premium" style={{ borderLeft: '4px solid #cf1322' }}>
                        <Statistic title="Total Ad Spend" value={stats?.totalSpend} formatter={formatCurrency} prefix={<DollarOutlined />} valueStyle={{ fontSize: '20px', fontWeight: 700 }} />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="stat-card-premium" style={{ borderLeft: '4px solid #389e0d' }}>
                        <Statistic title="Total Revenue" value={stats?.totalRevenue} formatter={formatCurrency} prefix={<RiseOutlined />} valueStyle={{ fontSize: '20px', fontWeight: 700 }} />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="stat-card-premium" style={{ borderLeft: '4px solid #1677ff' }}>
                        <Statistic title="Total Orders" value={stats?.totalOrders} prefix={<ShoppingOutlined />} valueStyle={{ fontSize: '20px', fontWeight: 700 }} />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" className="stat-card-premium" style={{ borderLeft: '4px solid #722ed1' }}>
                        <Statistic title="Average ROAS" value={stats?.roas} suffix="x" prefix={<ProjectOutlined />} valueStyle={{ fontSize: '20px', fontWeight: 700 }} />
                    </Card>
                </Col>
            </Row>

            <Card className="table-card-premium" 
                title={<span><DashboardOutlined /> Campaign Quality Analytics <Tooltip title="Detailed breakdown of ad performance and order health per campaign"><InfoCircleOutlined style={{ fontSize: '14px', marginLeft: '8px', cursor: 'pointer' }} /></Tooltip></span>}
                bordered={false}
            >
                <Table 
                    dataSource={campaigns} 
                    columns={columns} 
                    rowKey="campaign_id"
                    expandable={{
                        expandedRowRender: (record) => (
                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                                <Title level={5} style={{ marginBottom: '16px', fontSize: '14px' }}>
                                    <FireOutlined /> Ads Performance Breakdown for {record.campaign_name}
                                </Title>
                                <Table 
                                    columns={adColumns} 
                                    dataSource={record.ads} 
                                    pagination={false} 
                                    rowKey="ad_id" 
                                    size="small"
                                    className="inner-table-premium"
                                />
                            </div>
                        )
                    }}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default CampaignQuality;
