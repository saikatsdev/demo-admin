import { Card, Row, Col, Statistic, Typography } from 'antd';
import {CheckCircleOutlined,DollarOutlined,EyeOutlined,SelectOutlined,ShoppingOutlined,RiseOutlined,CloseCircleOutlined,BarChartOutlined} from '@ant-design/icons';

const { Text } = Typography;

export const MetaAdsStatsCards = ({ campaigns, loading }) => {
    const data = Array.isArray(campaigns) ? campaigns : [];

    const currencies = [...new Set(data.map(c => c.currency).filter(Boolean))];
    const singleCurrency = currencies.length === 1 ? currencies[0] : null;

    const stats = {
        active     : data.filter(c => c.status === 'ACTIVE').length,
        spend      : data.reduce((acc, c) => acc + Number(c.spend || 0), 0),
        impressions: data.reduce((acc, c) => acc + Number(c.impressions || 0), 0),
        clicks     : data.reduce((acc, c) => acc + Number(c.clicks || 0), 0),
        purchases  : data.reduce((acc, c) => acc + Number(c.purchases || 0), 0),
    };

    const formatMoney = (value) => {
        if (!singleCurrency) return data.length ? 'Mixed currencies' : '0.00';

        try {
            return new Intl.NumberFormat('en-US', {
                style                : 'currency',
                currency             : singleCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(Number(value || 0));
        } catch {
            return `${singleCurrency} ${Number(value || 0).toFixed(2)}`;
        }
    };

    const cards = 
    [
        { 
            title: 'Active Campaigns', 
            value: stats.active, 
            icon: <CheckCircleOutlined />, 
            color: '#52c41a' 
        },
        { 
            title: 'Total Spend', 
            value: stats.spend, 
            icon: <DollarOutlined />, 
            color: '#cf1322', 
            isCurrency: true 
        },
        { 
            title: 'Impressions', 
            value: stats.impressions, 
            icon: <EyeOutlined />, 
            color: '#1890ff', 
            isCompact: true 
        },
        { 
            title: 'Clicks', 
            value: stats.clicks, 
            icon: <SelectOutlined />, 
            color: '#722ed1', 
            isCompact: true 
        },
        { 
            title: 'Meta Purchases', 
            value: stats.purchases, 
            icon: <ShoppingOutlined />, 
            color: '#389e0d' 
        },
    ];

    const formatValue = (card, val) => {
        const number = Number(val || 0);
        if (card.isCurrency) return formatMoney(number);
        if (card.isCompact) return new Intl.NumberFormat('en', { notation: 'compact' }).format(number);
        return number.toLocaleString();
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
    const data             = Array.isArray(campaigns) ? campaigns : [];
    const totalOrders      = data.reduce((sum, item) => sum + Number(item.orders || 0), 0);
    const delivered        = data.reduce((sum, item) => sum + Number(item.done || 0), 0);
    const cancelled        = data.reduce((sum, item) => sum + Number(item.cancel || 0), 0);
    const trackedCampaigns = data.length;
    const deliveredRate    = totalOrders > 0 ? (delivered * 100) / totalOrders : 0;
    const cancelRate       = totalOrders > 0 ? (cancelled * 100) / totalOrders : 0;

    const cards = 
    [
        {
            title: 'Tracked Campaigns',
            value: trackedCampaigns,
            icon: <BarChartOutlined />,
            color: '#1677ff',
            desc: 'Campaigns matched with EcomKing orders',
        },
        {
            title: 'Attributed Orders',
            value: totalOrders,
            icon: <ShoppingOutlined />,
            color: '#722ed1',
            desc: 'Orders with Meta attribution',
        },
        {
            title: 'Delivered Rate',
            value: deliveredRate,
            suffix: '%',
            precision: 1,
            icon: <RiseOutlined />,
            color: '#52c41a',
            desc: `${delivered.toLocaleString()} delivered / partial returned`,
        },
        {
            title: 'Cancel / Return Rate',
            value: cancelRate,
            suffix: '%',
            precision: 1,
            icon: <CloseCircleOutlined />,
            color: '#f5222d',
            desc: `${cancelled.toLocaleString()} cancelled / returned / damaged`,
        },
    ];

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {cards.map((card, i) => (
                <Col xs={24} sm={12} lg={6} key={i}>
                    <Card size="small" bordered={false} className="stat-card-premium" style={{ background: `${card.color}10`, border: `1px solid ${card.color}30` }}>
                        <Statistic
                            title={<Text strong style={{ color: card.color }}>{card.icon} {card.title}</Text>}
                            value={card.value}
                            suffix={card.suffix}
                            precision={card.precision}
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
