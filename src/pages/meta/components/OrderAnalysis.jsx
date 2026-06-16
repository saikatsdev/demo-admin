import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Divider, Spin } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, CreditCardOutlined, RiseOutlined } from '@ant-design/icons';
import { getDatas } from '../../../api/common/common';

const { Title, Text } = Typography;

const AnalysisCard = ({ title, value, subtitle, icon, details }) => (
    <Card className="analysis-metric-card" bordered={false}>
        <div className="card-header-v2">
            <div className="header-text">
                <Text type="secondary" className="metric-title">{title}</Text>
                <Title level={2} className="metric-value">{value}</Title>
                <Text type="secondary" className="metric-subtitle">{subtitle}</Text>
            </div>
            <div className="header-icon">
                {icon}
            </div>
        </div>
        
        {details && details.length > 0 && (
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
    // State
    const [loading, setLoading]             = useState(false);
    const [orderAnalysis, setOrderAnalysis] = useState({});

    const getOrderAnalysis = async () => {
        try {
            setLoading(true);
            const res = await getDatas('/admin/meta/order-analysis');
            if (res && res?.success) {
                setOrderAnalysis(res.result || {});
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getOrderAnalysis();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <Spin size="large" tip="Loading analysis..." />
            </div>
        );
    }

    return (
        <div className="order-analysis-container">
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <AnalysisCard 
                        title="Ad Spend"
                        value={`$${orderAnalysis.ad_spend || 0}`}
                        subtitle="Total Meta Ads expense"
                        icon={<DollarOutlined className="icon-green" />}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <AnalysisCard 
                        title="Total Orders"
                        value={orderAnalysis.total_orders || 0}
                        subtitle="Placed during this period"
                        icon={<ShoppingCartOutlined className="icon-green" />}
                        details={[
                            { label: 'Web Orders', value: orderAnalysis.web_orders || 0 },
                            { label: 'Incomplete Orders', value: orderAnalysis.incomplete_orders || 0 }
                        ]}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <AnalysisCard 
                        title="Cost Per Order"
                        value={`$${(orderAnalysis.cost_per_order || 0).toFixed(2)}`}
                        subtitle="Average acquisition cost"
                        icon={<CreditCardOutlined className="icon-green" />}
                        details={[
                            { label: 'Cost Per Web Order', value: `$${(orderAnalysis.cost_per_web_order || 0).toFixed(2)}` },
                            { label: 'Cost Per Incomplete Order', value: `$${(orderAnalysis.cost_per_incomplete_order || 0).toFixed(2)}` }
                        ]}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <AnalysisCard 
                        title="Conversion Rate"
                        value={`${(orderAnalysis.conversion_rate || 0).toFixed(2)}%`}
                        subtitle="Orders completed successfully"
                        icon={<RiseOutlined className="icon-green" />}
                        details={[
                            { label: 'Completed Orders', value: orderAnalysis.completed_orders || 0 },
                            { label: 'Cancelled Orders', value: orderAnalysis.cancelled_orders || 0 }
                        ]}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default OrderAnalysis;