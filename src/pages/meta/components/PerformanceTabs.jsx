import { Tabs, Typography } from 'antd';
import { DatabaseOutlined, BarChartOutlined } from '@ant-design/icons';
import { MetaAdsStatsCards, DecisionCards } from './PerformanceCards';
import CampaignActualTable from './CampaignActualTable';
import PerformanceFilter from './PerformanceFilter';
import { useEffect, useState, useMemo } from 'react';
import { getDatas } from '../../../api/common/common';
import CampaignTable from './CampaignTable';

const { Title } = Typography;

const PerformanceTabs = ({ selectedAccount }) => {
    // State
    const [campaigns, setCampaigns]             = useState([]);
    const [loading, setLoading]                 = useState(true);
    const [refreshing, setRefreshing]           = useState(false);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 10 });
    
    // Filter State
    const [searchText, setSearchText]               = useState('');
    const [statusFilter, setStatusFilter]           = useState('ALL');
    const [selectedDateRange, setSelectedDateRange] = useState('Today');

    const getCampaigns = async (isRefreshing = false) => {
        try {
            if (isRefreshing) setRefreshing(true);
            else setLoading(true);
            
            const res = await getDatas('/admin/meta/campaigns', { ad_account_id: selectedAccount });
            if (res && res.success) {
                setCampaigns(res?.result || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        if (selectedAccount) {
            getCampaigns();
        }
    }, [selectedAccount]);

    const filteredCampaigns = useMemo(() => {
        const data = Array.isArray(campaigns) ? campaigns : [];
        return data.filter(item => {
            const matchesSearch = item.name?.toLowerCase().includes(searchText.toLowerCase()) || 
                                 item.id?.includes(searchText);
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [campaigns, searchText, statusFilter]);

    const items = [
        {
            key: 'meta_data',
            label: (
                <span>
                    <DatabaseOutlined />
                    Meta ads Data
                </span>
            ),
            children: (
                <div style={{ marginTop: '16px' }}>
                    <PerformanceFilter 
                        searchText={searchText}
                        setSearchText={setSearchText}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        selectedDateRange={selectedDateRange}
                        setSelectedDateRange={setSelectedDateRange}
                        refreshing={refreshing}
                        onRefresh={getCampaigns}
                    />

                    <MetaAdsStatsCards campaigns={filteredCampaigns} loading={loading} />
                    
                    <CampaignTable 
                        campaigns={filteredCampaigns} 
                        loading={loading} 
                        refreshing={refreshing} 
                        pagination={pagination} 
                        setPagination={setPagination} 
                        showFilter={false} 
                    />
                </div>
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
            children: (
                <div style={{ marginTop: '16px' }}>
                    <PerformanceFilter 
                        searchText={searchText}
                        setSearchText={setSearchText}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        selectedDateRange={selectedDateRange}
                        setSelectedDateRange={setSelectedDateRange}
                        refreshing={refreshing}
                        onRefresh={getCampaigns}
                    />

                    <DecisionCards campaigns={filteredCampaigns} loading={loading} />
                    
                    <CampaignActualTable 
                        campaigns={filteredCampaigns} 
                        loading={loading} 
                        pagination={pagination} 
                        setPagination={setPagination} 
                    />
                </div>
            ),
        },
    ];

    return (
        <Tabs defaultActiveKey="meta_data" items={items} />
    );
};

export default PerformanceTabs;
