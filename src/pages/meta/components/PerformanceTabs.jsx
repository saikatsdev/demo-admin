import { Tabs, Card, Typography } from 'antd';
import { DatabaseOutlined, BarChartOutlined } from '@ant-design/icons';
import CampaignCardView from './CampaignCardView';
import { MetaAdsStatsCards, DecisionCards } from './PerformanceCards';
import CampaignTable from './CampaignTable';

const { Title } = Typography;

const PerformanceTabs = ({ campaigns, loading, refreshing, onRefresh, pagination, setPagination }) => {
    const items = [
        {
            key: 'meta_data',
            label: (
                <span>
                    <DatabaseOutlined />
                    Meta ads Data
                </span>
            ),
            children: (
                <div style={{ marginTop: '16px' }}>
                    <MetaAdsStatsCards campaigns={campaigns} loading={loading} />
                    <CampaignTable 
                        campaigns={campaigns} 
                        loading={loading} 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        pagination={pagination} 
                        setPagination={setPagination} 
                    />
                </div>
            ),
        },
        {
            key: 'actual_results',
            label: (
                <span>
                    <BarChartOutlined />
                    Actual Results
                </span>
            ),
            children: (
                <div style={{ marginTop: '16px' }}>
                    <DecisionCards campaigns={campaigns} loading={loading} />
                    <CampaignTable 
                        campaigns={campaigns} 
                        loading={loading} 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        pagination={pagination} 
                        setPagination={setPagination} 
                    />
                    <div style={{ marginTop: '32px' }}>
                        <Title level={4}>Campaign Visual Cards</Title>
                        <CampaignCardView campaigns={campaigns} loading={loading} />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <Tabs defaultActiveKey="meta_data" items={items} />
    );
};

export default PerformanceTabs;
