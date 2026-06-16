import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Space, Alert, Breadcrumb, Tabs, Select } from 'antd';
import { ReloadOutlined, FacebookFilled } from '@ant-design/icons';
import { getDatas } from '../../api/common/common';
import useTitle from '../../hooks/useTitle';
import SummaryCards from './components/SummaryCards';
import PerformanceTabs from './components/PerformanceTabs';
import CampaignQuality from './components/CampaignQuality';
import SettingCard from './components/SettingCard';
import AccountLimit from './components/AccountLimit';
import AccountExpense from './components/AccountExpense';
import OrderAnalysis from './components/OrderAnalysis';
import './MetaAdsReport.css';
import HourlyAnalysis from './components/HourlyAnalysis';

const { Title } = Typography;

const MetaAdsReport = () => {
    // Hook
    useTitle("Meta Ads Report");

    // State
    const [summary, setSummary]                 = useState(null);
    const [loadingSummary, setLoadingSummary]   = useState(true);
    const [accounts, setAccounts]               = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [error, setError]                     = useState(null);

    const getAccounts = async () => {
        try {
            const res = await getDatas('/admin/meta/list');
            if (res && res.success) {
                setAccounts(res?.result || []);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const getSummary = async () => {
        try {
            setLoadingSummary(true);
            const res = await getDatas('/admin/meta/summary');
            if (res && res.success) {
                setSummary(res.result);
            }
        } catch (err) {
            console.error('Error fetching Meta summary:', err);
            setError('Failed to fetch summary data.');
        } finally {
            setLoadingSummary(false);
        }
    }

    const connectMeta = async () => {
        const res = await getDatas('/admin/meta/connect');
        if (res) {
            window.location.href = res.result;
        }
    }

    useEffect(() => {
        getAccounts();
        getSummary();
    }, []);

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount('all');
        }
    }, [accounts]);

    return (
        <div className="meta-ads-page">
            <div className="page-header-wrapper">
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} lg={10}>
                        <Breadcrumb items={[{ title: 'Dashboard' }, { title: 'Meta Ads' }, { title: 'Report' }]} />
                        <div style={{ marginTop: '8px' }}>
                            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FacebookFilled style={{ color: '#1877F2' }} />
                                Meta Ads Campaigns
                            </Title>
                        </div>
                    </Col>
                    <Col xs={24} lg={14} style={{ textAlign: 'right' }}>
                        <Space wrap={false} style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Select
                                placeholder="Select Ad Account"
                                style={{ width: 180, textAlign: 'left' }}
                                dropdownStyle={{ borderRadius: '8px' }}
                                options={[
                                    { label: 'All Accounts', value: 'all' },
                                    ...(accounts?.map(acc => ({ 
                                        label: (
                                            <Space>
                                                <FacebookFilled style={{ color: '#1877F2' }} />
                                                {acc.name}
                                            </Space>
                                        ), 
                                        value: acc.ad_account_id 
                                    })) || [])
                                ]}
                                value={selectedAccount}
                                onChange={setSelectedAccount}
                                className="account-select"
                            />

                            <Button type="primary" icon={<ReloadOutlined />} onClick={() => getSummary()} loading={loadingSummary} >
                                Refresh
                            </Button>

                            <Button type="default" icon={<FacebookFilled style={{ color: '#1877F2' }} />} onClick={() => connectMeta()} >
                                Connect
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            {error && (
                <Alert message="Error" description={error} type="error" showIcon closable style={{ marginBottom: '24px', borderRadius: '12px' }} />
            )}

            <div className="meta-tabs-wrapper">
                <Tabs
                    defaultActiveKey="summary"
                    type="card"
                    items={[
                        {
                            key: 'summary',
                            label: 'Summary',
                            children: <SummaryCards summary={summary} loading={loadingSummary} />,
                        },
                        { 
                            key: 'performance', 
                            label: 'Ad Performance', 
                            children: (
                                <PerformanceTabs selectedAccount={selectedAccount}/>
                            )
                        },
                        { 
                            key: 'quality_v2', 
                            label: 'Campaign Quality', 
                            children: <CampaignQuality selectedAccount={selectedAccount} /> 
                        },
                        { 
                            key: 'limits', 
                            label: 'Account Limits', 
                            children: (
                                <AccountLimit/>
                            )
                        },
                        { 
                            key: 'expenses', 
                            label: 'Expenses', 
                            children: (
                                <AccountExpense accounts={accounts}/>
                            ) 
                        },
                        { 
                            key: 'orders', 
                            label: 'Order Analysis', 
                            children: (
                                <OrderAnalysis/>
                            )
                        },
                        { 
                            key: 'hourly', 
                            label: 'Hourly Analysis', 
                            children: (
                                <HourlyAnalysis/>
                            )
                        },
                        { 
                            key: 'profit', 
                            label: 'Estimated Profit', 
                            children: <Card bordered={false}>ROI & Profit Estimation coming soon...</Card> 
                        },
                        { 
                            key: 'settings', 
                            label: 'Settings', 
                            children: (
                                <SettingCard/>
                            )
                        },
                    ]}
                />
            </div>
        </div>
    );
};

export default MetaAdsReport;
