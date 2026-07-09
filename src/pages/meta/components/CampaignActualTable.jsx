import { Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ArrowUpOutlined, RightOutlined, DownOutlined, InboxOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';

const { Text } = Typography;

const COLUMN_WIDTHS = {
    name: 320,
    status: 100,
    budget: 110,
    spend: 130,
    purchases: 110,
    cpp: 140,
    revenue: 150,
    cost: 150,
    profit: 120,
    margin: 100,
    breakeven: 100,
    metaRoas: 140,
    trueRoas: 140,
};

const SCROLL_X = Object.values(COLUMN_WIDTHS).reduce((sum, w) => sum + w, 0);

const CampaignActualTable = ({ campaigns, loading, pagination, setPagination }) => {
    const [expandedCampaignKeys, setExpandedCampaignKeys] = useState([]);
    const [expandedAdSetKeys, setExpandedAdSetKeys] = useState([]);
    const [spendSortOrder, setSpendSortOrder] = useState(null);

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

    const toggleCampaignExpand = (id) => {
        setExpandedCampaignKeys(prev =>
            prev.includes(id) ? prev.filter(key => key !== id) : [...prev, id]
        );
    };

    const toggleAdSetExpand = (id) => {
        setExpandedAdSetKeys(prev =>
            prev.includes(id) ? prev.filter(key => key !== id) : [...prev, id]
        );
    };

    const sortedCampaigns = useMemo(() => {
        const list = [...(campaigns || [])];
        if (!spendSortOrder) return list;

        const dir = spendSortOrder === 'ascend' ? 1 : -1;
        return list.sort(
            (a, b) => dir * (parseFloat(a.spend || 0) - parseFloat(b.spend || 0)),
        );
    }, [campaigns, spendSortOrder]);

    const tableData = useMemo(() => {
        const rows = [];
        sortedCampaigns.forEach(campaign => {
            rows.push({ ...campaign, rowType: 'campaign', rowKey: `campaign-${campaign.id}` });

            if (!expandedCampaignKeys.includes(campaign.id)) return;

            (campaign.ad_sets || []).forEach(adSet => {
                rows.push({
                    ...adSet,
                    rowType: 'adset',
                    rowKey: `adset-${adSet.id}`,
                    campaignId: campaign.id,
                });

                if (!expandedAdSetKeys.includes(adSet.id)) return;

                (adSet.ads || []).forEach(ad => {
                    rows.push({
                        ...ad,
                        rowType: 'ad',
                        rowKey: `ad-${ad.id}`,
                        adSetId: adSet.id,
                        campaignId: campaign.id,
                    });
                });
            });
        });
        return rows;
    }, [sortedCampaigns, expandedCampaignKeys, expandedAdSetKeys]);

    const handleTableChange = (pag, _filters, sorter) => {
        setPagination(pag);

        const active = Array.isArray(sorter) ? sorter[0] : sorter;
        if (active?.columnKey === 'spend') {
            setSpendSortOrder(active.order ?? null);
        } else {
            setSpendSortOrder(null);
        }
    };

    const renderNameCell = (_, record) => {
        const { rowType } = record;
        const hasChildren =
            (rowType === 'campaign' && (record.ad_sets?.length > 0)) ||
            (rowType === 'adset' && (record.ads?.length > 0));

        const isExpanded =
            rowType === 'campaign'
                ? expandedCampaignKeys.includes(record.id)
                : rowType === 'adset'
                    ? expandedAdSetKeys.includes(record.id)
                    : false;

        const handleExpandClick = (e) => {
            e.stopPropagation();
            if (rowType === 'campaign') toggleCampaignExpand(record.id);
            else if (rowType === 'adset') toggleAdSetExpand(record.id);
        };

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                    onClick={hasChildren ? handleExpandClick : undefined}
                    style={{
                        cursor: hasChildren ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        flexShrink: 0,
                        color: '#9ca3af',
                        visibility: hasChildren ? 'visible' : 'hidden',
                    }}
                >
                    {isExpanded
                        ? <DownOutlined style={{ fontSize: rowType === 'adset' ? '9px' : '10px' }} />
                        : <RightOutlined style={{ fontSize: rowType === 'adset' ? '9px' : '10px' }} />}
                </div>

                {rowType === 'campaign' && (
                    <>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: record.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                            flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontWeight: '600',
                                fontSize: '13px',
                                color: '#111827',
                                marginBottom: '1px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {record.name}
                            </div>
                            <div style={{
                                fontSize: '10px',
                                color: '#9ca3af',
                                fontWeight: '500',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                {record.account_name}
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#374151',
                            fontSize: '12px',
                            background: '#f9fafb',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            flexShrink: 0,
                        }}>
                            <InboxOutlined style={{ fontSize: '14px' }} />
                            <span style={{ fontWeight: '600' }}>
                                {record.ad_sets?.reduce((sum, adSet) => sum + (adSet.ads?.length ?? adSet.ads_count ?? 0), 0)
                                    ?? record.ad_sets_count
                                    ?? 0}
                            </span>
                        </div>
                    </>
                )}

                {rowType === 'adset' && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontWeight: '600',
                            fontSize: '12px',
                            color: '#4b5563',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {record.name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#9ca3af' }}>AD SET · ID: {record.id}</div>
                    </div>
                )}

                {rowType === 'ad' && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontWeight: '500',
                            fontSize: '11px',
                            color: '#6b7280',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {record.name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#9ca3af' }}>AD · ID: {record.id}</div>
                    </div>
                )}
            </div>
        );
    };

    const renderMetricPair = (actualValue, metaValue, { isNested = false } = {}) => {
        const labelStyle = {
            fontSize: isNested ? '9px' : '10px',
            color: '#9ca3af',
            fontWeight: isNested ? '400' : '500',
        };
        const actualStyle = {
            color: isNested ? '#d1d5db' : '#111827',
            fontWeight: '600',
            fontSize: isNested ? '9px' : '13px',
            marginLeft: '4px',
        };
        const metaValStyle = {
            color: '#6b7280',
            fontSize: isNested ? '9px' : '12px',
            marginLeft: '4px',
        };

        return (
            <div style={{ lineHeight: '1.4' }}>
                <div style={labelStyle}>
                    ACTUAL <span style={actualStyle}>{actualValue ?? '—'}</span>
                </div>
                <div style={labelStyle}>
                    META <span style={metaValStyle}>{metaValue ?? '—'}</span>
                </div>
            </div>
        );
    };

    const columns = [
        {
            title: 'CAMPAIGN',
            key: 'campaign',
            fixed: 'left',
            width: COLUMN_WIDTHS.name,
            render: renderNameCell,
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            width: COLUMN_WIDTHS.status,
            render: (status) => getStatusTag(status),
        },
        {
            title: 'BUDGET ($)',
            key: 'budget',
            width: COLUMN_WIDTHS.budget,
            render: (_, record) => {
                const budget = record.daily_budget || record.lifetime_budget;
                const isNested = record.rowType !== 'campaign';
                return (
                    <div style={{
                        fontWeight: isNested ? '400' : '600',
                        fontSize: isNested ? '12px' : '13px',
                        color: isNested ? '#d1d5db' : '#374151',
                    }}>
                        {budget ? formatUSD(budget) : '—'}
                    </div>
                );
            },
        },
        {
            title: 'SPEND ($)',
            key: 'spend',
            width: COLUMN_WIDTHS.spend,
            sortDirections: ['descend', 'ascend'],
            sorter: (a, b) => parseFloat(a.spend || 0) - parseFloat(b.spend || 0),
            sortOrder: spendSortOrder,
            render: (_, record) => {
                const spend = parseFloat(record.spend || 0);
                const isNested = record.rowType !== 'campaign';
                return (
                    <div>
                        <div style={{
                            fontWeight: isNested ? '500' : '600',
                            fontSize: isNested ? '12px' : '13px',
                            color: isNested ? '#4b5563' : '#374151',
                        }}>
                            {formatUSD(spend)}
                        </div>
                        <div style={{ fontSize: isNested ? '9px' : '10px', color: '#9ca3af' }}>
                            {formatBDT(record.spend_bdt || spend * 130)}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'PURCHASES',
            key: 'purchases',
            width: COLUMN_WIDTHS.purchases,
            render: (_, record) => {
                const isNested = record.rowType !== 'campaign';
                return renderMetricPair(
                    isNested ? '—' : (record.actual_purchases || 0),
                    record.purchases || 0,
                    { isNested },
                );
            },
        },
        {
            title: 'CPP ($)',
            key: 'cpp',
            width: COLUMN_WIDTHS.cpp,
            render: (_, record) => {
                const isNested = record.rowType !== 'campaign';
                return renderMetricPair(
                    isNested ? '—' : formatUSD(record.actual_cpp || 0),
                    formatUSD(record.cpp || 0),
                    { isNested },
                );
            },
        },
        {
            title: 'REVENUE (৳)',
            key: 'revenue',
            width: COLUMN_WIDTHS.revenue,
            render: (_, record) => {
                const isNested = record.rowType !== 'campaign';
                return renderMetricPair(
                    isNested ? '—' : formatBDT(record.actual_revenue || 0),
                    formatBDT(record.revenue_meta || 0),
                    { isNested },
                );
            },
        },
        {
            title: 'COST (৳)',
            key: 'cost',
            width: COLUMN_WIDTHS.cost,
            render: (_, record) => {
                const isNested = record.rowType !== 'campaign';
                return renderMetricPair(
                    isNested ? '—' : formatBDT(record.actual_cost || 0),
                    formatBDT(record.cost_meta || 0),
                    { isNested },
                );
            },
        },
        {
            title: 'PROFIT',
            key: 'profit',
            width: COLUMN_WIDTHS.profit,
            render: (_, record) => {
                if (record.rowType !== 'campaign') {
                    return <span style={{ color: '#d1d5db' }}>—</span>;
                }
                const profit = parseFloat(record.actual_profit || 0);
                const isPositive = profit >= 0;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '600', fontSize: '13px' }}>
                        <span>{formatBDT(profit)}</span>
                        {isPositive && <ArrowUpOutlined style={{ fontSize: '12px' }} />}
                    </div>
                );
            },
        },
        {
            title: 'MARGIN %',
            key: 'margin',
            width: COLUMN_WIDTHS.margin,
            render: (_, record) => {
                if (record.rowType !== 'campaign') {
                    return <span style={{ color: '#d1d5db' }}>—</span>;
                }
                return (
                    <div style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>
                        {parseFloat(record.margin_percent || 0).toFixed(2)}%
                    </div>
                );
            },
        },
        {
            title: 'BREAKEVEN',
            key: 'breakeven',
            width: COLUMN_WIDTHS.breakeven,
            align: 'center',
            render: (_, record) => {
                if (record.rowType !== 'campaign') {
                    return <span style={{ color: '#d1d5db' }}>—</span>;
                }
                return record.breakeven
                    ? <CheckCircleOutlined style={{ color: '#10b981', fontSize: '18px' }} />
                    : <span style={{ color: '#d1d5db' }}>—</span>;
            },
        },
        {
            title: 'META ROAS',
            key: 'metaRoas',
            width: COLUMN_WIDTHS.metaRoas,
            render: (_, record) => {
                const isNested = record.rowType !== 'campaign';
                return renderMetricPair(
                    isNested ? '—' : `${parseFloat(record.actual_roas || 0).toFixed(2)}x`,
                    `${parseFloat(record.roas || 0).toFixed(2)}x`,
                    { isNested },
                );
            },
        },
        {
            title: 'TRUE ROAS',
            key: 'trueRoas',
            width: COLUMN_WIDTHS.trueRoas,
            render: (_, record) => {
                const isNested = record.rowType !== 'campaign';
                return renderMetricPair(
                    isNested ? '—' : `${parseFloat(record.actual_roas || 0).toFixed(2)}x`,
                    `${parseFloat(record.roas || 0).toFixed(2)}x`,
                    { isNested },
                );
            },
        },
    ];

    return (
        <div className="campaign-actual-table-container">
            <Table
                columns={columns}
                dataSource={tableData}
                loading={loading}
                rowKey="rowKey"
                scroll={{ x: SCROLL_X }}
                pagination={pagination}
                onChange={handleTableChange}
                showSorterTooltip={{ target: 'sorter-icon' }}
                size="middle"
                className="custom-premium-table"
                onRow={(record) => ({
                    onClick: () => {
                        if (record.rowType === 'campaign' && record.ad_sets?.length > 0) {
                            toggleCampaignExpand(record.id);
                        } else if (record.rowType === 'adset' && record.ads?.length > 0) {
                            toggleAdSetExpand(record.id);
                        }
                    },
                    style: {
                        cursor:
                            (record.rowType === 'campaign' && record.ad_sets?.length > 0) ||
                            (record.rowType === 'adset' && record.ads?.length > 0)
                                ? 'pointer'
                                : 'default',
                    },
                })}
                rowClassName={(record) => {
                    if (record.rowType === 'adset') return 'row-adset';
                    if (record.rowType === 'ad') return 'row-ad';
                    return 'row-campaign';
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
                .custom-premium-table .ant-table-container {
                    border-radius: 12px !important;
                }
                .custom-premium-table .row-adset > td {
                    background: #fafafa !important;
                }
                .custom-premium-table .row-adset:hover > td {
                    background: #f3f4f6 !important;
                }
                .custom-premium-table .row-ad > td {
                    background: #fefefe !important;
                }
                .custom-premium-table .row-ad:hover > td {
                    background: #f9fafb !important;
                }
            `}</style>
        </div>
    );
};

export default CampaignActualTable;
