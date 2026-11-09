import { Tabs } from 'antd';
import { DatabaseOutlined, BarChartOutlined } from '@ant-design/icons';
import { MetaAdsStatsCards, DecisionCards } from './PerformanceCards';
import CampaignActualTable from './CampaignActualTable';
import PerformanceFilter from './PerformanceFilter';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getDatas } from '../../../api/common/common';
import CampaignTable from './CampaignTable';
import dayjs from 'dayjs';

const normalizeCampaigns = (result) => {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== 'object') return [];
    if (Array.isArray(result.campaigns)) return result.campaigns;
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result.result)) return result.result;
    return Object.values(result).filter(
        (item) => item && typeof item === 'object' && (item.id != null || item.campaign_id != null)
    );
};

const normalizeAnalytics = (result) => {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== 'object') return [];
    if (Array.isArray(result.result)) return result.result;
    return Object.values(result).filter(
        (item) => item && typeof item === 'object' && item.campaign_id != null
    );
};

const resolvePresetRange = (label) => {
    const now = dayjs();

    switch (label) {
        case 'Yesterday':
            return {
                start_date: now.subtract(1, 'day').format('YYYY-MM-DD'),
                end_date: now.subtract(1, 'day').format('YYYY-MM-DD'),
            };
        case 'Last 7 days':
            return {
                start_date: now.subtract(6, 'day').format('YYYY-MM-DD'),
                end_date: now.format('YYYY-MM-DD'),
            };
        case 'Last 30 days':
            return {
                start_date: now.subtract(29, 'day').format('YYYY-MM-DD'),
                end_date: now.format('YYYY-MM-DD'),
            };
        case 'This month':
            return {
                start_date: now.startOf('month').format('YYYY-MM-DD'),
                end_date: now.format('YYYY-MM-DD'),
            };
        case 'Last month': {
            const lastMonth = now.subtract(1, 'month');
            return {
                start_date: lastMonth.startOf('month').format('YYYY-MM-DD'),
                end_date: lastMonth.endOf('month').format('YYYY-MM-DD'),
            };
        }
        case 'This year':
            return {
                start_date: now.startOf('year').format('YYYY-MM-DD'),
                end_date: now.format('YYYY-MM-DD'),
            };
        case 'Last year': {
            const lastYear = now.subtract(1, 'year');
            return {
                start_date: lastYear.startOf('year').format('YYYY-MM-DD'),
                end_date: lastYear.endOf('year').format('YYYY-MM-DD'),
            };
        }
        case 'Lifetime':
            return {
                start_date: '2000-01-01',
                end_date: now.format('YYYY-MM-DD'),
            };
        case 'Today':
        default:
            return {
                start_date: now.format('YYYY-MM-DD'),
                end_date: now.format('YYYY-MM-DD'),
            };
    }
};

const PerformanceTabs = ({ selectedAccount }) => {
    const [campaigns, setCampaigns]                 = useState([]);
    const [actualCampaigns, setActualCampaigns]     = useState([]);
    const [loading, setLoading]                     = useState(false);
    const [refreshing, setRefreshing]               = useState(false);
    const [activeTab, setActiveTab]                 = useState('meta_data');
    const [pagination, setPagination]               = useState({ current: 1, pageSize: 10 });
    const [searchText, setSearchText]               = useState('');
    const [statusFilter, setStatusFilter]           = useState('ALL');
    const [selectedDateRange, setSelectedDateRange] = useState('Today');

    const loadData = useCallback(async (isRefreshing = false) => {
        if (!selectedAccount) return;

        try {
            if (isRefreshing) setRefreshing(true);
            else setLoading(true);

            const range = resolvePresetRange(selectedDateRange);
            const params = {
                ad_account_id: selectedAccount,
                ...range,
            };

            const [campaignRes, analyticsRes] = await Promise.all([
                getDatas('/admin/meta/campaigns', params),
                getDatas('/admin/meta/analytics', params),
            ]);

            setCampaigns(campaignRes?.success ? normalizeCampaigns(campaignRes.result) : []);
            setActualCampaigns(analyticsRes?.success ? normalizeAnalytics(analyticsRes.result) : []);
        } catch (error) {
            console.error('Error fetching Meta campaign data:', error);
            setCampaigns([]);
            setActualCampaigns([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedAccount, selectedDateRange]);

    useEffect(() => {
        if (!selectedAccount) {
            setCampaigns([]);
            setActualCampaigns([]);
            setLoading(false);
            return;
        }

        setPagination({ current: 1, pageSize: 10 });
        loadData();
    }, [selectedAccount, selectedDateRange, loadData]);

    const filteredCampaigns = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return campaigns.filter((item) => {
            const name = item.name?.toLowerCase() || '';
            const id = String(item.id ?? '');
            const matchesSearch = !query || name.includes(query) || id.includes(query);
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [campaigns, searchText, statusFilter]);

    const filteredActualCampaigns = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return actualCampaigns.filter((item) => {
            const name = item.campaign_name?.toLowerCase() || '';
            const id = String(item.campaign_id ?? '');
            return !query || name.includes(query) || id.includes(query);
        });
    }, [actualCampaigns, searchText]);

    const filterProps = {
        searchText,
        setSearchText,
        statusFilter,
        setStatusFilter,
        selectedDateRange,
        setSelectedDateRange,
        refreshing,
        onRefresh: loadData,
    };

    const tabItems = [
        {
            key: 'meta_data',
            label: (
                <span>
                    <DatabaseOutlined />
                    Meta Ads Data
                </span>
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
        },
    ];

    return (
        <>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

            <div style={{ marginTop: '16px' }}>
                <PerformanceFilter {...filterProps} />

                {activeTab === 'meta_data' ? (
                    <>
                        <MetaAdsStatsCards campaigns={filteredCampaigns} loading={loading} />
                        <CampaignTable
                            campaigns={filteredCampaigns}
                            loading={loading}
                            refreshing={refreshing}
                            pagination={pagination}
                            setPagination={setPagination}
                            showFilter={false}
                        />
                    </>
                ) : (
                    <>
                        <DecisionCards campaigns={filteredActualCampaigns} loading={loading} />
                        <CampaignActualTable
                            campaigns={filteredActualCampaigns}
                            loading={loading}
                            pagination={pagination}
                            setPagination={setPagination}
                        />
                    </>
                )}
            </div>
        </>
    );
};

export default PerformanceTabs;
