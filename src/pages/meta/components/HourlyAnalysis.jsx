import { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Select, Button, Space, Spin } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, RiseOutlined, FallOutlined, EllipsisOutlined, LineChartOutlined } from '@ant-design/icons';
import { getDatas } from '../../../api/common/common';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const HourlyAnalysis = ({ selectedAccount }) => {
    // States
    const [loading, setLoading]     = useState(false);
    const [data, setData]           = useState(null);
    const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [dateLabel, setDateLabel] = useState('Today');
    const [sources, setSources]     = useState([]);
    const [selectedSource, setSelectedSource] = useState('all');

    const getSources = async () => {
        try {
            const res = await getDatas('/admin/order-froms/list');
            if (res && res.success) setSources(res.result);
        } catch (e) { console.error(e); }
    };

    const fetchHourlyData = async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            const params = {
                ad_account_id: selectedAccount,
                start_date: dateRange[0].format('YYYY-MM-DD'),
                end_date: dateRange[1].format('YYYY-MM-DD')
            };
            if (selectedSource !== 'all') params.source_id = selectedSource;

            const res = await getDatas('/admin/meta/hourly-analysis', params);
            if (res && res.success) {
                setData(res.result);
            }
        } catch (error) {
            console.error('Error fetching hourly analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getSources();
    }, []);

    useEffect(() => {
        fetchHourlyData();
    }, [selectedAccount, dateRange, selectedSource]);

    const applyPreset = (label, start, end) => {
        setDateLabel(label);
        setDateRange([start, end]);
    };

    const formatCurrency = (val, symbol = '৳') => {
        return symbol + new Intl.NumberFormat('en-IN').format(Math.round(val || 0));
    };

    const formatRate = (val) => (val ? Number(val).toFixed(3) : '0.000') + '%';
    const formatSmallCurrency = (val) => '$' + Number(val || 0).toFixed(2);

    const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

    const MetricCard = ({ title, value, subText, trend, prefix }) => (
        <Card size="small" className="hourly-metric-card" bordered={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text type="secondary" style={{ fontSize: '11px', fontWeight: 600, color: '#4b5563' }}>{title}</Text>
                {trend === 'up' ? <RiseOutlined style={{ color: '#059669', fontSize: '16px' }} /> : <FallOutlined style={{ color: '#dc2626', fontSize: '16px' }} />}
            </div>
            <div style={{ margin: '4px 0' }}>
                <Title level={3} style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {prefix}{typeof value === 'number' ? formatNumber(value) : value}
                </Title>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '11px', color: '#9ca3af' }}>{subText}</Text>
                <div className="mini-trend-line" />
            </div>
        </Card>
    );

    const InsightBox = ({ title, value, subText }) => (
        <div className="insight-box">
            <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{title}</Text>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>{subText}</div>
        </div>
    );

    return (
        <Card bordered={false} className="hourly-main-card" styles={{ body: { padding: '20px' } }}>
            <div className="hourly-analysis-container">
                <div style={{ marginBottom: '20px' }}>
                    <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Meta Ads vs WooCommerce Orders - Hourly Analysis</Title>
                    <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                        Analyze correlation between Meta ad spending and WooCommerce order volume by hour
                    </Paragraph>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Select defaultValue="all" style={{ width: 150 }} className="hourly-select">
                            <Option value="all">All Accounts</Option>
                        </Select>
                        <Select value={selectedSource} onChange={setSelectedSource} style={{ width: 180 }} className="hourly-select">
                            <Option value="all">WooCommerce Orders</Option>
                            {sources.map(s => (
                                <Option key={s.id} value={s.id}>{s.name} ({s.orders_count || 0})</Option>
                            ))}
                        </Select>
                    </div>
                    <div className="pill-group">
                        <button className={`pill-btn ${dateLabel === 'Today' ? 'active' : ''}`} onClick={() => applyPreset('Today', dayjs().startOf('day'), dayjs().endOf('day'))}>Today</button>
                        <button className={`pill-btn ${dateLabel === 'Yesterday' ? 'active' : ''}`} onClick={() => applyPreset('Yesterday', dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day'))}>Yesterday</button>
                        <button className="pill-btn"><EllipsisOutlined /></button>
                    </div>
                </div>

                {/* Cache Info Bar */}
                <Card size="small" className="info-bar" bordered={false}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size={8}>
                            <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: '13px' }} />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Data cached: <Text strong style={{ color: '#4b5563', fontSize: '12px' }}>{dayjs().format('MMM D, hh:mm A')}</Text>
                            </Text>
                        </Space>
                        <Button type="text" icon={<ReloadOutlined />} onClick={fetchHourlyData} loading={loading} size="small" style={{ fontWeight: 600, color: '#111827' }}>
                            Refresh Data
                        </Button>
                    </div>
                </Card>

                {/* Sub Banner */}
                <div className="viewing-banner">
                    <Space align="start">
                        <ClockCircleOutlined style={{ marginTop: '2px', fontSize: '14px' }} />
                        <Paragraph style={{ margin: 0, fontSize: '12px' }}>
                            <Text strong>Viewing today's data:</Text> Showing all available hourly data. Current time in Bangladesh: {dayjs().format('HH:mm')}. Data includes all hours with Meta ad activity.
                        </Paragraph>
                    </Space>
                </div>

                {/* Metrics Grid */}
                <Spin spinning={loading}>
                    <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                        <Col span={4}>
                            <MetricCard 
                                title="Total Impressions" 
                                value={data?.total_impressions || 0} 
                                subText="All accounts"
                                trend="up"
                            />
                        </Col>
                        <Col span={4}>
                            <MetricCard 
                                title="Total Clicks" 
                                value={data?.total_clicks || 0} 
                                subText={`CTR: ${formatRate(data?.average_ctr)}`}
                                trend="up"
                            />
                        </Col>
                        <Col span={4}>
                            <MetricCard 
                                title="Total Spend" 
                                value={data?.total_spend || 0} 
                                subText={`CPC: ${formatSmallCurrency(data?.avg_cpc)}`}
                                trend="down"
                                prefix="$"
                            />
                        </Col>
                        <Col span={4}>
                            <MetricCard 
                                title="Total Orders" 
                                value={data?.total_orders || 0} 
                                subText="WooCommerce orders"
                                trend="up"
                            />
                        </Col>
                        <Col span={4}>
                            <MetricCard 
                                title="Order Amount" 
                                value={data?.order_amount || 0} 
                                subText="Total order value"
                                trend="up"
                                prefix="৳"
                            />
                        </Col>
                        <Col span={4}>
                            <MetricCard 
                                title="Cost Per Order" 
                                value={data?.cost_per_order || 0} 
                                subText="Ad spend efficiency"
                                trend="down"
                                prefix="$"
                            />
                        </Col>
                    </Row>
                </Spin>

                {/* Insights Section */}
                <Card bordered={false} className="insights-card">
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClockCircleOutlined style={{ fontSize: '16px', color: '#111827' }} />
                            <Title level={5} style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Peak Performance Insights</Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Best performing hours for ad spend and order volume</Text>
                    </div>
                    
                    <Row gutter={40}>
                        <Col flex="1">
                            <InsightBox title="Peak Ad Spend Hour" value={data?.peak_ad_spend_hour || 'N/A'} subText={formatSmallCurrency(data?.peak_ad_spend)} />
                        </Col>
                        <Col flex="1">
                            <InsightBox title="Peak Order Hour" value={data?.peak_order_hour || 'N/A'} subText={`${data?.peak_order_count || 0} orders`} />
                        </Col>
                        <Col flex="1">
                            <InsightBox title="Best Cost/Order Hour" value={data?.best_cost_per_order_hour || 'N/A'} subText={formatSmallCurrency(data?.best_cost_per_order)} />
                        </Col>
                        <Col flex="1">
                            <InsightBox title="Average CTR" value={formatRate(data?.average_ctr)} subText="Click-through rate" />
                        </Col>
                        <Col flex="1">
                            <InsightBox title="Avg CPC" value={formatSmallCurrency(data?.avg_cpc)} subText="Cost per click" />
                        </Col>
                        <Col flex="1">
                            <InsightBox title="Conversion Rate" value={formatRate(data?.conversion_rate)} subText="Orders per impression" />
                        </Col>
                    </Row>
                </Card>
            </div>
            <style>{`
                .hourly-analysis-container {
                    padding: 4px;
                }
                .hourly-select .ant-select-selector {
                    border-radius: 6px !important;
                    background: #fff !important;
                    height: 36px !important;
                    display: flex !important;
                    align-items: center !important;
                }
                .pill-group {
                    display: flex;
                    background: #f1f5f9;
                    padding: 3px;
                    border-radius: 8px;
                    gap: 2px;
                }
                .pill-btn {
                    border: none;
                    background: transparent;
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .pill-btn.active {
                    background: #108a78;
                    color: #fff;
                }
                .mini-trend-line {
                    width: 30px;
                    height: 16px;
                    background: linear-gradient(135deg, transparent 0%, transparent 40%, #e2e8f0 40%, #e2e8f0 100%);
                    background-size: 4px 4px;
                    mask-image: linear-gradient(to right, transparent, black);
                }
                .info-bar {
                    background: #fff;
                    border: 1px solid #f1f5f9;
                    border-radius: 10px;
                    margin-bottom: 16px;
                }
                .viewing-banner {
                    background: #fff;
                    border: 1px solid #f3f4f6;
                    padding: 8px 16px;
                    border-radius: 8px;
                    color: #92400e;
                    margin-bottom: 16px;
                }
                .hourly-metric-card {
                    background: #fff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    border: 1px solid #f1f5f9;
                    border-radius: 8px;
                    height: 100%;
                }
                .insights-card {
                    background: #fff;
                    border: 1px solid #f1f5f9;
                    border-radius: 12px;
                }
                .insight-box {
                    padding: 4px 0;
                }
            `}</style>
        </Card>
    );
};

export default HourlyAnalysis;