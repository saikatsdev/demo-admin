import { Card, Row, Col, Statistic, Typography } from 'antd';
import { DollarOutlined, GlobalOutlined, WalletOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Text } = Typography;

const SummaryCards = ({ summary, loading }) => {
    const cardData = [
        {
            title: 'Total Expense (USD)',
            value: summary?.total_expense_usd || 0,
            prefix: <DollarOutlined />,
            color: '#1677ff',
            format: (val) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        },
        {
            title: 'Total Expense (BDT)',
            value: summary?.total_expense_bdt || 0,
            prefix: <GlobalOutlined />,
            color: '#52c41a',
            format: (val) => `${val.toLocaleString(undefined, { minimumFractionDigits: 0 })} BDT`
        },
        {
            title: 'Accounts',
            value: summary?.accounts || 0,
            prefix: <WalletOutlined />,
            color: '#722ed1',
            format: (val) => val
        },
        {
            title: 'Spending Limits',
            value: summary?.spending_limits || 0,
            prefix: <SafetyCertificateOutlined />,
            color: '#faad14',
            format: (val) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        }
    ];

    return (
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            {cardData.map((card, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                    <Card className="stat-card-premium" bordered={false} style={{ borderBottom: `4px solid ${card.color}` }}>
                        <Statistic
                            title={<Text type="secondary">{card.prefix} {card.title}</Text>}
                            value={card.value}
                            formatter={card.format}
                            valueStyle={{ color: '#1e293b', fontWeight: 700 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default SummaryCards;
