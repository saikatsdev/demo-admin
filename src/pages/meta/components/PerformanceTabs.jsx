import { Tabs } from 'antd';
import { DatabaseOutlined, BarChartOutlined } from '@ant-design/icons';
import { MetaAdsStatsCards, DecisionCards } from './PerformanceCards';
import CampaignActualTable from './CampaignActualTable';
import PerformanceFilter from './PerformanceFilter';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getDatas } from '../../../api/common/common';
import CampaignTable from './CampaignTable';

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

const PerformanceTabs = ({ selectedAccount }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('meta_data');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedDateRange, setSelectedDateRange] = useState('Today');

    const getCampaigns = useCallback(async (isRefreshing = false) => {
        if (!selectedAccount) return;

        try {
            if (isRefreshing) setRefreshing(true);
            else setLoading(true);

            const res = await getDatas('/admin/meta/campaigns', { ad_account_id: selectedAccount });

            if (res?.success) {
                setCampaigns(normalizeCampaigns(res.result));
            } else {
                setCampaigns([]);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setCampaigns([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedAccount]);

    useEffect(() => {
        if (!selectedAccount) {
            setCampaigns([]);
            setLoading(false);
            return;
        }

        setPagination({ current: 1, pageSize: 10 });
        getCampaigns();
    }, [selectedAccount, getCampaigns]);

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

    const filterProps = {
        searchText,
        setSearchText,
        statusFilter,
        setStatusFilter,
        selectedDateRange,
        setSelectedDateRange,
        refreshing,
        onRefresh: getCampaigns,
    };

    const tabItems = [
        {
            key: 'meta_data',
            label: (
                <span>
                    <DatabaseOutlined />
                    Meta ads Data
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
                        <DecisionCards campaigns={filteredCampaigns} loading={loading} />
                        <CampaignActualTable
                            campaigns={filteredCampaigns}
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
