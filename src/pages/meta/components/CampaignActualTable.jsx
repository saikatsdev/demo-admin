import { Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ArrowUpOutlined, RightOutlined, DownOutlined, InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Text } = Typography;

const CampaignActualTable = ({ campaigns, loading, pagination, setPagination }) => {
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);
    
    const formatUSD = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return '$0.00';
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const formatBDT = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return '৳0.00';
        return '৳' + new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const getStatusTag = (status) => {
        const s = status?.toUpperCase();
        if (s === 'ACTIVE') {
            return <Tag color="#10b981" style={{ border: 'none', background: '#10b981', color: '#fff', fontWeight: '600', fontSize: '10px', borderRadius: '4px', padding: '0 8px' }}>ACTIVE</Tag>;
        }
        if (s === 'PAUSED') {
            return <Tag style={{ border: 'none', background: '#e5e7eb', color: '#6b7280', fontSize: '10px', fontWeight: '600', borderRadius: '4px', padding: '0 8px' }}>PAUSED</Tag>;
        }
        return <Tag style={{ fontSize: '10px' }}>{status}</Tag>;
    };

    const toggleExpand = (recordId) => {
        setExpandedRowKeys(prev => 
            prev.includes(recordId) ? prev.filter(key => key !== recordId) : [...prev, recordId]
        );
    };

    const columns = 
    [
        {
            title: 'CAMPAIGN',
            key: 'campaign',
            fixed: 'left',
            width: 320,
            render: (_, record) => {
                const isExpanded = expandedRowKeys.includes(record.id);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div onClick={(e) => { e.stopPropagation(); toggleExpand(record.id); }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', color: '#9ca3af' }}
                        >
                            {isExpanded ? <DownOutlined style={{ fontSize: '10px' }} /> : <RightOutlined style={{ fontSize: '10px' }} />}
                        </div>

                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: record.status === 'ACTIVE' ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {record.name}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {record.account_name}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151', fontSize: '12px', background: '#f9fafb', padding: '4px 8px', borderRadius: '6px' }}>
                            <InboxOutlined style={{ fontSize: '14px' }} />
                            <span style={{ fontWeight: '600' }}>{record.ad_count || 0}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => getStatusTag(status)
        },
        {
            title: 'BUDGET ($)',
            key: 'budget',
            width: 110,
            render: (_, record) => (
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                    {formatUSD(record.daily_budget || record.lifetime_budget)}
                </div>
            )
        },
        {
            title: 'SPEND ($)',
            key: 'spend',
            width: 130,
            render: (_, record) => {
                const spend = parseFloat(record.spend || 0);
                const spendBdt = spend * 130;
                return (
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>{formatUSD(spend)}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>{formatBDT(record.spend_bdt || spendBdt)}</div>
                    </div>
                );
            }
        },
        {
            title: 'PURCHASES',
            key: 'purchases',
            width: 110,
            render: (_, record) => (
                <div style={{ lineHeight: '1.4' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        ACTUAL <span style={{ color: '#111827', fontWeight: '600', fontSize: '13px', marginLeft: '4px' }}>{record.actual_purchases || 0}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        META <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>{record.purchases || 0}</span>
                    </div>
                </div>
            )
        },
        {
            title: 'CPP ($)',
            key: 'cpp',
            width: 140,
            render: (_, record) => (
                <div style={{ lineHeight: '1.4' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        ACTUAL <span style={{ color: '#111827', fontWeight: '600', fontSize: '13px', marginLeft: '4px' }}>{formatUSD(record.actual_cpp || 0)}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        META <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>{formatUSD(record.cpp || 0)}</span>
                    </div>
                </div>
            )
        },
        {
            title: 'REVENUE (৳)',
            key: 'revenue',
            width: 150,
            render: (_, record) => (
                <div style={{ lineHeight: '1.4' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        ACTUAL <span style={{ color: '#111827', fontWeight: '600', fontSize: '13px', marginLeft: '4px' }}>{formatBDT(record.actual_revenue || 0)}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        META <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>{formatBDT(record.revenue_meta || 0)}</span>
                    </div>
                </div>
            )
        },
        {
            title: 'COST (৳)',
            key: 'cost',
            width: 150,
            render: (_, record) => (
                <div style={{ lineHeight: '1.4' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        ACTUAL <span style={{ color: '#111827', fontWeight: '600', fontSize: '13px', marginLeft: '4px' }}>{formatBDT(record.actual_cost || 0)}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        META <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>{formatBDT(record.cost_meta || 0)}</span>
                    </div>
                </div>
            )
        },
        {
            title: 'PROFIT',
            key: 'profit',
            width: 120,
            render: (_, record) => {
                const profit = parseFloat(record.actual_profit || 0);
                const isPositive = profit >= 0;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '600', fontSize: '13px' }}>
                        <span>{formatBDT(profit)}</span>
                        {isPositive && <ArrowUpOutlined style={{ fontSize: '12px' }} />}
                    </div>
                );
            }
        },
        {
            title: 'MARGIN %',
            key: 'margin',
            width: 100,
            render: (_, record) => (
                <div style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>
                    {parseFloat(record.margin_percent || 0).toFixed(2)}%
                </div>
            )
        },
        {
            title: 'BREAKEVEN',
            key: 'breakeven',
            width: 100,
            align: 'center',
            render: (_, record) => (
                record.breakeven ? <CheckCircleOutlined style={{ color: '#10b981', fontSize: '18px' }} /> : <span style={{ color: '#d1d5db' }}>—</span>
            )
        },
        {
            title: 'META ROAS',
            key: 'roas',
            width: 140,
            render: (_, record) => (
                <div style={{ lineHeight: '1.4' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        ACTUAL <span style={{ color: '#111827', fontWeight: '600', fontSize: '13px', marginLeft: '4px' }}>{parseFloat(record.actual_roas || 0).toFixed(2)}x</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        META <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>{parseFloat(record.roas || 0).toFixed(2)}x</span>
                    </div>
                </div>
            )
        },
        {
            title: 'TRUE ROAS',
            key: 'roas',
            width: 140,
            render: (_, record) => (
                <div style={{ lineHeight: '1.4' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        ACTUAL <span style={{ color: '#111827', fontWeight: '600', fontSize: '13px', marginLeft: '4px' }}>{parseFloat(record.actual_roas || 0).toFixed(2)}x</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
                        META <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>{parseFloat(record.roas || 0).toFixed(2)}x</span>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="campaign-actual-table-container">
            <Table
                columns={columns}
                dataSource={campaigns}
                loading={loading}
                rowKey="id"
                scroll={{ x: 'max-content' }}
                pagination={pagination}
                onChange={setPagination}
                size="middle"
                className="custom-premium-table"
                expandable={{
                    expandedRowKeys: expandedRowKeys,
                    onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
                    expandIcon: () => null, // Hide default expand icon completely
                    expandRowByClick: true,
                }}
            />

            <style>{`
                .campaign-actual-table-container {
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .custom-premium-table .ant-table-thead > tr > th {
                    background: #ffffff !important;
                    color: #9ca3af !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    padding: 16px !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                }
                .custom-premium-table .ant-table-tbody > tr > td {
                    padding: 8px 16px !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                    vertical-align: middle !important;
                }
                .custom-premium-table .ant-table-row:hover > td {
                    background: #f9fafb !important;
                }
                .custom-premium-table .ant-table-row-expand-icon-cell {
                    display: none !important;
                }
                .custom-premium-table .ant-table-container {
                    border-radius: 12px !important;
                }
            `}</style>
        </div>
    );
};

export default CampaignActualTable;

