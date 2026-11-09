import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Divider, Spin } from 'antd';
import {DollarOutlined,ShoppingCartOutlined,CreditCardOutlined,RiseOutlined} from '@ant-design/icons';
import { getDatas } from '../../../api/common/common';

const { Title, Text } = Typography;

const formatUSD = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatBDT = (value) => `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;

const AnalysisCard = ({ title, value, subtitle, icon, details }) => (
    <Card className="analysis-metric-card" bordered={false}>
        <div className="card-header-v2">
            <div className="header-text">
                <Text type="secondary" className="metric-title">{title}</Text>
                <Title level={2} className="metric-value">{value}</Title>
                <Text type="secondary" className="metric-subtitle">{subtitle}</Text>
            </div>
            <div className="header-icon">{icon}</div>
        </div>

        {details?.length > 0 && (
            <>
                <Divider className="metric-divider" />
                <div className="metric-details">
                    {details.map((detail, index) => (
                        <div key={index} className="detail-row">
                            <Text type="secondary">{detail.label}</Text>
                            <Text strong>{detail.value}</Text>
                        </div>
                    ))}
                </div>
            </>
        )}
    </Card>
);

const OrderAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [orderAnalysis, setOrderAnalysis] = useState({});

    const getOrderAnalysis = async () => {
        try {
            setLoading(true);
            const res = await getDatas('/admin/meta/order-analysis');
            if (res?.success) setOrderAnalysis(res.result || {});
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getOrderAnalysis();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="order-analysis-container">
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <AnalysisCard
                        title="Meta Ad Spend"
                        value={formatBDT(orderAnalysis.ad_spend_bdt)}
                        subtitle="Today's active Meta account spend"
                        icon={<DollarOutlined className="icon-green" />}
                        details={[
                            { label: 'USD Equivalent', value: formatUSD(orderAnalysis.ad_spend_usd) },
                            { label: 'USD/BDT Rate', value: Number(orderAnalysis.usd_bdt_rate || 0).toFixed(2) },
                        ]}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <AnalysisCard
                        title="Meta Orders"
                        value={orderAnalysis.meta_orders || 0}
                        subtitle="Orders with Meta attribution today"
                        icon={<ShoppingCartOutlined className="icon-green" />}
                        details={[
                            { label: 'All Store Orders', value: orderAnalysis.total_orders || 0 },
                            { label: 'Incomplete Meta Orders', value: orderAnalysis.incomplete_orders || 0 },
                        ]}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <AnalysisCard
                        title="Meta Cost Per Order"
                        value={formatBDT(orderAnalysis.cost_per_order_bdt)}
                        subtitle="Meta spend ÷ Meta-attributed orders"
                        icon={<CreditCardOutlined className="icon-green" />}
                        details={[
                            { label: 'USD CPO', value: formatUSD(orderAnalysis.cost_per_order_usd) },
                            { label: 'Delivered CPO', value: formatBDT(orderAnalysis.cost_per_delivered_order_bdt) },
                        ]}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <AnalysisCard
                        title="Delivery Rate"
                        value={`${Number(orderAnalysis.conversion_rate || 0).toFixed(2)}%`}
                        subtitle="Delivered / partial-returned Meta orders"
                        icon={<RiseOutlined className="icon-green" />}
                        details={[
                            { label: 'Delivered', value: orderAnalysis.completed_orders || 0 },
                            { label: 'Cancelled / Returned', value: orderAnalysis.cancelled_orders || 0 },
                            { label: 'Cancel Rate', value: `${Number(orderAnalysis.cancel_rate || 0).toFixed(2)}%` },
                        ]}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default OrderAnalysis;
