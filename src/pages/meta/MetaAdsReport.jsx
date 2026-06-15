import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Typography, Space, Alert, Breadcrumb, Tabs } from 'antd';
import { 
    ReloadOutlined, 
    FacebookFilled 
} from '@ant-design/icons';
import './MetaAdsReport.css';
import { getDatas } from '../../api/common/common';
import useTitle from '../../hooks/useTitle';
import SummaryCards from './components/SummaryCards';
import PerformanceTabs from './components/PerformanceTabs';
import CampaignQuality from './components/CampaignQuality';

const { Title, Text } = Typography;

const MetaAdsReport = () => {
    // Hook
    useTitle("Meta Ads Report");

    // State
    const [campaigns, setCampaigns]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const connectMeta = async () => {
        const res = await getDatas('/admin/meta/connect');
        if(res){
            window.location.href = res.result;
        }
    }

    // Method
    const fetchCampaigns = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);
        
        setError(null);
        try {
            const response = await getDatas('admin/facebook-ads');
            if (response && response.result && Array.isArray(response.result)) {
                setCampaigns(response.result);
            } else if (response && Array.isArray(response)) {
                setCampaigns(response);
            } else {
                setCampaigns([]);
            }
        } catch (err) {
            console.error('Error fetching Meta campaigns:', err);
            setError('Failed to connect to the server. Please try again.');
            setCampaigns([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    return (
        <div className="meta-ads-page">
            <div className="page-header-wrapper">
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} md={16}>
                        <Breadcrumb items={[{ title: 'Dashboard' }, { title: 'Meta Ads' }, { title: 'Report' }]} />
                        <div style={{ marginTop: '12px' }}>
                            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FacebookFilled style={{ color: '#1877F2' }} />
                                Meta Ads Campaigns
                            </Title>
                            <Text type="secondary">Real-time performance monitoring for your Facebook advertising account</Text>
                        </div>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button type="primary" icon={<ReloadOutlined spin={refreshing} />} onClick={() => fetchCampaigns(true)} loading={refreshing} size="medium">
                                {refreshing ? 'Syncing...' : 'Sync with Meta'}
                            </Button>

                            <Button type="default" icon={<FacebookFilled style={{ color: '#1877F2' }} />} onClick={() => connectMeta()}>
                                Connect Meta
                            </Button>
                        </Space>
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

            <div className="meta-tabs-wrapper">
                <Tabs
                    defaultActiveKey="summary"
                    type="card"
                    items={[
                        {
                            key: 'summary',
                            label: 'Summary',
                            children: <SummaryCards campaigns={campaigns} loading={loading} />,
                        },
                        { 
                            key: 'performance', 
                            label: 'Performance', 
                            children: (
                                <PerformanceTabs 
                                    campaigns={campaigns} 
                                    loading={loading} 
                                    refreshing={refreshing}
                                    onRefresh={fetchCampaigns}
                                    pagination={pagination}
                                    setPagination={setPagination}
                                />
                            )
                        },
                        { 
                            key: 'quality_v2', 
                            label: 'Campaign Quality', 
                            children: <CampaignQuality /> 
                        },
                        { key: 'limits', label: 'Account Limits', children: <Card bordered={false}>Account Expenditure Limits coming soon...</Card> },
                        { key: 'expenses', label: 'Expenses', children: <Card bordered={false}>Detailed Expense Report coming soon...</Card> },
                        { key: 'orders', label: 'Order Analysis', children: <Card bordered={false}>Order Conversion Analysis coming soon...</Card> },
                        { key: 'hourly', label: 'Hourly Analysis', children: <Card bordered={false}>Hourly Performance Breakdown coming soon...</Card> },
                        { key: 'profit', label: 'Estimated Profit', children: <Card bordered={false}>ROI & Profit Estimation coming soon...</Card> },
                        { key: 'settings', label: 'Settings', children: <Card bordered={false}>Meta Ads Configuration coming soon...</Card> },
                    ]}
                />
            </div>
        </div>
    );
};

export default MetaAdsReport;
