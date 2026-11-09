import {Card,Row,Col,Statistic,Typography,Tag,Tooltip,Space} from 'antd';
import {DollarOutlined,GlobalOutlined,WalletOutlined,SafetyCertificateOutlined,CheckCircleOutlined,InfoCircleOutlined} from '@ant-design/icons';

const { Text } = Typography;

const moneyUsd = (value) => `$${Number(value || 0).toLocaleString(undefined, {minimumFractionDigits: 2,maximumFractionDigits: 2})}`;

const moneyBdt = (value) => `৳${Number(value || 0).toLocaleString('en-IN', {maximumFractionDigits: 0,})}`;

const SummaryCards = ({ summary, loading }) => {
    const lifetimeUsd       = Number(summary?.lifetime_ad_spend_usd ?? summary?.total_expense_usd ?? 0);
    const lifetimeBdt       = Number(summary?.lifetime_ad_spend_bdt ?? summary?.total_expense_bdt ?? 0);
    const connectedAccounts = Number(summary?.connected_ad_accounts ?? summary?.accounts ?? 0);
    const financeLoaded     = Number(summary?.finance_loaded_accounts ?? connectedAccounts);
    const financeFailed     = Number(summary?.finance_failed_accounts ?? 0);
    const withLimit         = Number(summary?.accounts_with_spending_limit ?? 0);
    const withoutLimit      = Number(summary?.accounts_without_spending_limit ?? 0);

    const hasAnyLimit       = summary?.has_any_spending_limit ?? (typeof summary?.spending_limits === 'number' && Number.isFinite(summary?.spending_limits));
    const spendingLimitUsd  = hasAnyLimit ? Number(summary?.account_spending_limit_usd ?? summary?.spending_limits ?? 0) : 0;
    const remainingLimitUsd = hasAnyLimit ? Number(summary?.remaining_spending_limit_usd ?? summary?.spending_remaining ?? 0) : 0;
    const rate              = Number(summary?.usd_bdt_rate || 0);

    const cards = 
    [
        {
            title    : 'Lifetime Ad Spend',
            subtitle : 'Cumulative spend across connected ad accounts',
            value    : lifetimeUsd,
            formatter: moneyUsd,
            icon     : <DollarOutlined />,
            color    : '#1677ff',
        },
        {
            title    : 'Lifetime Ad Spend (BDT)',
            subtitle : rate > 0 ? `Converted at approx. ৳${rate.toLocaleString()} per USD`: 'BDT equivalent',
            value    : lifetimeBdt,
            formatter: moneyBdt,
            icon     : <GlobalOutlined />,
            color    : '#52c41a',
        },
        {
            title    : 'Connected Ad Accounts',
            subtitle : financeFailed > 0 ? `${financeLoaded} finance loaded, ${financeFailed} failed`: `${financeLoaded} finance records loaded`,
            value    : connectedAccounts,
            formatter: (val) => Number(val || 0).toLocaleString(),
            icon     : <WalletOutlined />,
            color    : '#722ed1',
        },
        {
            title    : 'Accounts With Spending Limit',
            subtitle : connectedAccounts > 0 ? `${withLimit} limited, ${withoutLimit} without limit`: 'No connected accounts',
            value    : withLimit,
            formatter: () => connectedAccounts > 0 ? `${withLimit} / ${financeLoaded}`              : '0',
            icon     : <CheckCircleOutlined />,
            color    : '#13c2c2',
        },
        {
            title    : 'Account Spending Limit',
            subtitle : hasAnyLimit ? 'Combined real account-level spend caps': 'No account-level spending limit configured',
            value    : spendingLimitUsd,
            formatter: (val) => hasAnyLimit ? moneyUsd(val)                  : 'No limit configured',
            icon     : <SafetyCertificateOutlined />,
            color    : '#faad14',
        },
        {
            title    : 'Remaining Spending Limit',
            subtitle : hasAnyLimit ? 'Remaining capacity across limited accounts': 'Not applicable without an account spending limit',
            value    : remainingLimitUsd,
            formatter: (val) => hasAnyLimit ? moneyUsd(val)                      : 'N/A',
            icon     : <InfoCircleOutlined />,
            color    : '#eb2f96',
        },
    ];

    return (
        <>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                {cards.map((card) => (
                    <Col xs={24} sm={12} xl={8} key={card.title}>
                        <Card
                            className="stat-card-premium"
                            bordered={false}
                            style={{
                                height: '100%',
                                borderTop: `3px solid ${card.color}`,
                            }}
                        >
                            <Statistic
                                title={
                                    <Space size={6}>
                                        <span style={{ color: card.color }}>
                                            {card.icon}
                                        </span>
                                        <Text type="secondary">
                                            {card.title}
                                        </Text>
                                    </Space>
                                }
                                value={card.value}
                                formatter={card.formatter}
                                valueStyle={{
                                    color: '#0f172a',
                                    fontWeight: 700,
                                    fontSize: 24,
                                }}
                                loading={loading}
                            />
                            <Text
                                type="secondary"
                                style={{
                                    display: 'block',
                                    marginTop: 8,
                                    fontSize: 12,
                                    lineHeight: 1.5,
                                }}
                            >
                                {card.subtitle}
                            </Text>
                        </Card>
                    </Col>
                ))}
            </Row>

            {!loading && (
                <Card
                    size="small"
                    bordered={false}
                    style={{
                        background: '#f8fafc',
                        marginBottom: 24,
                    }}
                >
                    <Space size={[8, 8]} wrap>
                        <Text type="secondary">Summary status:</Text>

                        <Tag color="blue">
                            {connectedAccounts} connected
                        </Tag>

                        <Tag color={withLimit > 0 ? 'gold' : 'default'}>
                            {withLimit} with spending limit
                        </Tag>

                        <Tag color={withoutLimit > 0 ? 'green' : 'default'}>
                            {withoutLimit} no spending limit
                        </Tag>

                        {financeFailed > 0 && (
                            <Tooltip title="Meta finance data could not be loaded for these accounts">
                                <Tag color="red">
                                    {financeFailed} finance fetch failed
                                </Tag>
                            </Tooltip>
                        )}

                        {summary?.usd_bdt_rate_source && (
                            <Text type="secondary">
                                FX source: {summary.usd_bdt_rate_source}
                            </Text>
                        )}
                    </Space>
                </Card>
            )}
        </>
    );
};

export default SummaryCards;
