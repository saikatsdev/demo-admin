import { Table, Card, Tag, Row, Col, Typography, Space, Tabs, Button, Spin } from 'antd';
import { RightOutlined, DownOutlined, TableOutlined, PartitionOutlined, EllipsisOutlined, } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import PerformanceFilter from './PerformanceFilter';

const { Text } = Typography;

const CampaignTable = ({ campaigns, loading, refreshing, onRefresh, pagination, setPagination, showFilter = true }) => {
    // States
    const [searchText, setSearchText]               = useState('');
    const [statusFilter, setStatusFilter]           = useState('ALL');
    const [selectedDateRange, setSelectedDateRange] = useState('Today');
    const [viewMode, setViewMode]                   = useState('table');
    const [selectedRowKeys, setSelectedRowKeys]     = useState([]);
    const [loadingStates, setLoadingStates]         = useState({});

    const filteredData = useMemo(() => {
        const data = Array.isArray(campaigns) ? campaigns : [];
        if (!showFilter) return data;
        return data.filter(item => {
            const matchesSearch = item.name?.toLowerCase().includes(searchText.toLowerCase()) || item.id?.includes(searchText);
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [campaigns, searchText, statusFilter, showFilter]);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatCompact = (val) => new Intl.NumberFormat('en', { notation: 'compact' }).format(val || 0);

    const getStatusTag = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'ACTIVE': return <Tag color="#10b981" style={{ border: 'none', fontWeight: '600', fontSize: '10px', borderRadius: '4px' }}>ACTIVE</Tag>;
            case 'PAUSED': return <Tag color="#e5e7eb" style={{ border: 'none', color: '#6b7280', fontSize: '10px', fontWeight: '600', borderRadius: '4px' }}>PAUSED</Tag>;
            default: return <Tag color="default" style={{ fontSize: '10px' }}>{status}</Tag>;
        }
    };

    const simulateLoading = (key) => {
        setLoadingStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => setLoadingStates(prev => ({ ...prev, [key]: false })), 400);
    };

    const tableColumns = [
        {
            title: 'Campaign',
            key: 'campaign',
            fixed: 'left',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: '13px' }}>{record.name}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {record.account_name}
                    </Text>
                </Space>
            ),
            width: 280,
        },
        { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag, width: 100 },
        {
            title: 'Budget',
            key: 'budget',
            render: (_, record) => formatCurrency(record.daily_budget || record.lifetime_budget),
            width: 110,
        },
        { title: 'Spent', dataIndex: 'spend', key: 'spend', render: formatCurrency, width: 100 },
        { title: 'Purch.', dataIndex: 'purchases', key: 'purchases', render: v => v || 0, width: 80 },
        { title: 'ROAS', dataIndex: 'roas', key: 'roas', render: v => v ? `${parseFloat(v).toFixed(2)}x` : '—', width: 100 },
        { title: 'Impr.', dataIndex: 'impressions', key: 'impressions', render: formatCompact, width: 100 },
        { title: 'Clicks', dataIndex: 'clicks', key: 'clicks', render: formatCompact, width: 100 },
        { title: '', key: 'actions', fixed: 'right', width: 50, render: () => <Button type="text" icon={<EllipsisOutlined />} /> }
    ];

    const adLevelColumns = [
        {
            title: 'Ad Name',
            key: 'ad_name',
            render: (_, ad) => (
                <Space align="center" style={{ paddingLeft: '48px' }}>
                    <Text strong style={{ fontSize: '12px', color: '#4b5563' }}>{ad.name}</Text>
                    {getStatusTag(ad.status)}
                </Space>
            )
        },
        {
            title: 'Performance',
            align: 'right',
            render: (_, ad) => (
                <Row gutter={16} justify="end" style={{ paddingRight: '24px' }}>
                    <Col><Text style={{ fontSize: '12px' }}>{formatCurrency(ad.spend)}</Text></Col>
                    <Col><Text type="secondary" style={{ fontSize: '12px' }}>{formatCompact(ad.impressions)} impr</Text></Col>
                    <Col><Text type="secondary" style={{ fontSize: '12px' }}>{formatCompact(ad.clicks)} clicks</Text></Col>
                </Row>
            )
        }
    ];

    const adSetLevelColumns = [
        {
            title: 'Ad Set Name',
            key: 'adset_name',
            render: (_, adset) => (
                <Space align="center" style={{ paddingLeft: '24px' }}>
                    <Text strong style={{ fontSize: '13px', color: '#1f2937' }}>{adset.name}</Text>
                    {getStatusTag(adset.status)}
                </Space>
            )
        },
        {
            title: 'Performance',
            align: 'right',
            render: (_, adset) => (
                <Row gutter={16} justify="end" style={{ paddingRight: '24px' }}>
                    <Col><Text strong style={{ fontSize: '13px' }}>{formatCurrency(adset.spend)}</Text></Col>
                    <Col><Text type="secondary" style={{ fontSize: '13px' }}>{formatCompact(adset.impressions)} impr</Text></Col>
                    <Col><Text type="secondary" style={{ fontSize: '13px' }}>{formatCompact(adset.clicks)} clicks</Text></Col>
                </Row>
            )
        }
    ];

    const campaignLevelColumns = [
        {
            title: 'Campaign Details',
            key: 'campaign_info',
            render: (_, record) => (
                <div>
                    <Space align="center">
                        <Text strong style={{ fontSize: '14px' }}>{record.name}</Text>
                        {getStatusTag(record.status)}
                    </Space>
                    <div style={{ paddingLeft: '0px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {record.account_name} • {record.objective?.replace(/_/g, ' ') || 'OUTCOME SALES'}
                        </Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Performance Cluster',
            align: 'right',
            width: 450,
            render: (_, record) => (
                <Row gutter={24} justify="end" style={{ paddingRight: '24px' }}>
                    <Col style={{ textAlign: 'right', minWidth: '85px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{formatCurrency(record.spend)}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Spend</div>
                    </Col>
                    <Col style={{ textAlign: 'right', minWidth: '85px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{formatCompact(record.clicks)}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Clicks</div>
                    </Col>
                    <Col style={{ textAlign: 'right', minWidth: '85px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{record.purchases || 0}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Purchases</div>
                    </Col>
                    <Col style={{ textAlign: 'right', minWidth: '85px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{record.roas ? `${parseFloat(record.roas).toFixed(2)}x` : '—'}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>ROAS</div>
                    </Col>
                </Row>
            )
        }
    ];

    // Nested Expand Logic for Ad Sets (Level 3 render)
    const renderAds = (adset) => {
        if (loadingStates[adset.id]) return <div style={{ padding: '16px 64px' }}><Spin size="small" /> <Text type="secondary">Loading ads...</Text></div>;
        return (
            <Table
                columns={adLevelColumns}
                dataSource={adset.ads || []}
                pagination={false}
                rowKey="id"
                showHeader={false}
                size="small"
                style={{ background: '#fcfcfc' }}
            />
        );
    };

    // Nested Expand Logic for Campaigns (Level 2 render)
    const renderAdSets = (campaign) => {
        if (loadingStates[campaign.id]) return <div style={{ padding: '16px 48px' }}><Spin size="small" /> <Text type="secondary">Loading ad sets...</Text></div>;
        return (
            <Table
                columns={adSetLevelColumns}
                dataSource={campaign.ad_sets || []}
                pagination={false}
                rowKey="id"
                showHeader={false}
                size="small"
                style={{ background: '#f9fafb' }}
                onExpand={(expanded, record) => expanded && simulateLoading(record.id)}
                expandable={{
                    expandedRowRender: renderAds,
                    expandRowByClick: true,
                    expandIcon: ({ expanded, onExpand, record }) => (
                        <div onClick={e => { e.stopPropagation(); onExpand(record, e); }} style={{ cursor: 'pointer', display: 'inline-block', marginRight: '12px', paddingLeft: '24px' }}>
                            {expanded ? <DownOutlined style={{ fontSize: '10px' }} /> : <RightOutlined style={{ fontSize: '10px' }} />}
                        </div>
                    )
                }}
            />
        );
    };

    return (
        <div className="campaign-table-container">
            {showFilter && (
                <PerformanceFilter 
                    searchText={searchText}
                    setSearchText={setSearchText}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    selectedDateRange={selectedDateRange}
                    setSelectedDateRange={setSelectedDateRange}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}

            <Card className="table-card-premium" bordered={false} styles={{ body: { padding: 0 } }}>
                <div style={{ padding: '0 24px' }}>
                    <Tabs 
                        activeKey={viewMode} 
                        onChange={setViewMode} 
                        items={[
                            { key: 'table', label: <span><TableOutlined /> Table View</span> },
                            { key: 'hierarchy', label: <span><PartitionOutlined /> Hierarchy View</span> }
                        ]}
                        className="table-view-tabs"
                    />
                </div>
                
                <Table
                    columns={viewMode === 'table' ? tableColumns : campaignLevelColumns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading && !refreshing}
                    scroll={{ x: 'max-content' }}
                    pagination={pagination}
                    onChange={(p) => setPagination(p)}
                    rowSelection={viewMode === 'table' ? { selectedRowKeys, onChange: setSelectedRowKeys } : null}
                    className={viewMode === 'table' ? "meta-campaign-table-new" : "meta-hierarchy-table"}
                    showHeader={viewMode === 'table'}
                    onExpand={(expanded, record) => expanded && viewMode === 'hierarchy' && simulateLoading(record.id)}
                    expandable={viewMode === 'hierarchy' ? {
                        expandedRowRender: renderAdSets,
                        expandRowByClick: true,
                        expandIcon: ({ expanded, onExpand, record }) => (
                            <div onClick={e => { e.stopPropagation(); onExpand(record, e); }} style={{ cursor: 'pointer', display: 'inline-block', marginRight: '12px' }}>
                                {expanded ? <DownOutlined style={{ fontSize: '12px' }} /> : <RightOutlined style={{ fontSize: '12px' }} />}
                            </div>
                        )
                    } : null}
                />
            </Card>
        </div>
    );
};

export default CampaignTable;
