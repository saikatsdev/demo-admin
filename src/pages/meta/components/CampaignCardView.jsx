import { Card, Row, Col, Tag, Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const CampaignCardView = ({ campaigns, loading }) => {
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <Row gutter={[16, 16]}>
            {(Array.isArray(campaigns) ? campaigns : []).map((campaign) => (
                <Col xs={24} sm={12} lg={8} key={campaign.id}>
                    <Card 
                        hoverable 
                        className="table-card-premium"
                        style={{ height: '100%' }}
                    >
                        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Title level={5} style={{ margin: 0, flex: 1, marginRight: '8px' }}>{campaign.name}</Title>
                            {getStatusTag(campaign.status)}
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>ID: {campaign.id}</Text>
                        
                        <Divider style={{ margin: '12px 0' }} />
                        
                        <Row gutter={[8, 8]}>
                            <Col span={12}>
                                <Text type="secondary" block>Spent</Text>
                                <Text strong style={{ color: '#cf1322' }}>{formatCurrency(campaign.spend)}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary" block>Purchases</Text>
                                <Text strong style={{ color: '#389e0d' }}>{campaign.purchases || 0}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary" block>Budget</Text>
                                <Text strong>{formatCurrency(campaign.daily_budget || campaign.lifetime_budget)}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary" block>CTR</Text>
                                <Text strong>{parseFloat(campaign.ctr || 0).toFixed(2)}%</Text>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default CampaignCardView;
