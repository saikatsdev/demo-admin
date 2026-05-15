import { Card, Row, Col, Statistic, Typography } from 'antd';
import { 
    CheckCircleOutlined, 
    DollarOutlined, 
    EyeOutlined, 
    SelectOutlined, 
    ShoppingOutlined,
    ArrowUpOutlined,
    LineChartOutlined,
    EditOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export const MetaAdsStatsCards = ({ campaigns, loading }) => {
    const data = Array.isArray(campaigns) ? campaigns : [];
    
    const stats = {
        active: data.filter(c => c.status === 'ACTIVE').length,
        spend: data.reduce((acc, c) => acc + parseFloat(c.spend || 0), 0),
        impressions: data.reduce((acc, c) => acc + parseInt(c.impressions || 0), 0),
        clicks: data.reduce((acc, c) => acc + parseInt(c.clicks || 0), 0),
        purchases: data.reduce((acc, c) => acc + parseInt(c.purchases || 0), 0),
    };

    const cards = [
        { title: 'Active Campaigns', value: stats.active, icon: <CheckCircleOutlined />, color: '#52c41a' },
        { title: 'Total Spends', value: stats.spend, icon: <DollarOutlined />, color: '#cf1322', isCurrency: true },
        { title: 'Impressions', value: stats.impressions, icon: <EyeOutlined />, color: '#1890ff', isCompact: true },
        { title: 'Clicks', value: stats.clicks, icon: <SelectOutlined />, color: '#722ed1', isCompact: true },
        { title: 'Purchase', value: stats.purchases, icon: <ShoppingOutlined />, color: '#389e0d' },
    ];

    const formatValue = (card, val) => {
        if (card.isCurrency) return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        if (card.isCompact) return new Intl.NumberFormat('en', { notation: 'compact' }).format(val);
        return val.toLocaleString();
    };

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {cards.map((card, i) => (
                <Col xs={24} sm={12} lg={4} key={i} style={{ flex: '1 0 20%' }}>
                    <Card size="small" bordered={false} className="stat-card-premium" style={{ borderLeft: `4px solid ${card.color}` }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: '12px' }}>{card.icon} {card.title}</Text>}
                            value={card.value}
                            formatter={(val) => formatValue(card, val)}
                            valueStyle={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}
                            loading={loading}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export const DecisionCards = ({ campaigns, loading }) => {
    const data = Array.isArray(campaigns) ? campaigns : [];
    
    // Simple logic for categorization
    const categorized = {
        scale: data.filter(c => (parseFloat(c.purchases) / parseFloat(c.spend || 1) * 100) > 10).length, // Placeholder logic
        monitor: data.filter(c => c.status === 'ACTIVE').length,
        optimize: data.filter(c => parseFloat(c.ctr) < 1.5 && c.status === 'ACTIVE').length,
        kill: data.filter(c => parseFloat(c.spend) > 20 && !c.purchases).length,
    };

    const cards = [
        { title: 'Scale Up', value: categorized.scale, icon: <ArrowUpOutlined />, color: '#52c41a', desc: 'High ROI performing' },
        { title: 'Monitor', value: categorized.monitor, icon: <LineChartOutlined />, color: '#1890ff', desc: 'Stable performance' },
        { title: 'Optimize', value: categorized.optimize, icon: <EditOutlined />, color: '#faad14', desc: 'Low CTR detected' },
        { title: 'Kill', value: categorized.kill, icon: <CloseCircleOutlined />, color: '#f5222d', desc: 'No conversion found' },
    ];

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {cards.map((card, i) => (
                <Col xs={24} sm={12} lg={6} key={i}>
                    <Card size="small" bordered={false} className="stat-card-premium" style={{ background: `${card.color}10`, border: `1px solid ${card.color}30` }}>
                        <Statistic
                            title={<Text strong style={{ color: card.color }}>{card.icon} {card.title}</Text>}
                            value={card.value}
                            valueStyle={{ fontSize: '24px', fontWeight: 800, color: card.color }}
                            loading={loading}
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>{card.desc}</Text>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};
