import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Space, Select, Badge, Button, Dropdown, DatePicker, Tooltip } from 'antd';
import { LineChartOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, FilterOutlined, CalendarOutlined, RightOutlined, DownOutlined, ShoppingOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getDatas } from '../../../api/common/common';
import dayjs from 'dayjs';
import CampaignQualityHelpModal from './CampaignQualityHelpModal';

const { Title, Text } = Typography;
const { Option } = Select;

const COLUMN_WIDTHS = {
    name         : 320,
    orders       : 90,
    revenue      : 120,
    aov          : 110,
    active       : 80,
    done         : 80,
    cancel       : 80,
    other        : 80,
    cancelPercent: 100,
};

const SCROLL_X = Object.values(COLUMN_WIDTHS).reduce((sum, w) => sum + w, 0);

const STATUS_COLORS = {
    active: { 
        bg    : '#e6f4ff',
        color : '#1677ff',
        border: '#91caff'
    },
    done  : { 
        bg    : '#f6ffed',
        color : '#389e0d',
        border: '#b7eb8f'
    },
    cancel: { 
        bg    : '#fff1f0',
        color : '#cf1322',
        border: '#ffccc7'
    },
    other : { 
        bg    : '#fafafa',
        color : '#595959',
        border: '#d9d9d9'
    },
};

const formatDisplayName = (name, id, fallbackLabel) => {
    if (name) return name;
    const shortId = id ? String(id).slice(-8) : '—';
    return `${fallbackLabel} · ${shortId}`;
};

const getOtherCount = (record) => {
    if (record.orders_by_status?.other) {
        return record.orders_by_status.other.length;
    }
    const total = Number(record.orders || 0);
    const accounted = Number(record.active || 0) + Number(record.done || 0) + Number(record.cancel || 0);
    return Math.max(0, total - accounted);
};

const normalizeAnalyticsCampaigns = (result) => {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== 'object') return [];
    if (Array.isArray(result.result)) return result.result;
    return Object.values(result).filter(
        (item) => item && typeof item === 'object' && item.campaign_id != null
    );
};

const CampaignQuality = ({ selectedAccount }) => {
    // States
    const [loading, setLoading]                           = useState(false);
    const [campaigns, setCampaigns]                       = useState([]);
    const [dateRange, setDateRange]                       = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [helpModalOpen, setHelpModalOpen]               = useState(false);
    const [sources, setSources]                           = useState([]);
    const [selectedSource, setSelectedSource]             = useState('all');
    const [dateLabel, setDateLabel]                       = useState('Today');
    const [datePickerMode, setDatePickerMode]             = useState(null);
    const [dropdownOpen, setDropdownOpen]                 = useState(false);
    const [expandedCampaignKeys, setExpandedCampaignKeys] = useState([]);
    const [expandedAdSetKeys, setExpandedAdSetKeys]       = useState([]);
    const [expandedOrderKeys, setExpandedOrderKeys]       = useState([]);

    const getSource = async () => {
        try {
            const res = await getDatas('/admin/order-froms/list');
            if (res && res.success) {
                setSources(res.result);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const fetchQualityData = async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            const params = { ad_account_id: selectedAccount };
            if (selectedSource !== 'all') params.source_id = selectedSource;

            params.start_date = dateRange[0].format('YYYY-MM-DD');

            params.end_date = dateRange[1].format('YYYY-MM-DD');

            const res = await getDatas('/admin/meta/analytics', params);

            if (res && res.success) {
                setCampaigns(normalizeAnalyticsCampaigns(res.result));
                setExpandedCampaignKeys([]);
                setExpandedAdSetKeys([]);
                setExpandedOrderKeys([]);
            }
        } catch (error) {
            console.error('Error fetching quality data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQualityData();
        getSource();
    }, [selectedAccount, dateRange, selectedSource]);

    const applyDatePreset = (label, start, end) => {
        setDateLabel(label);
        setDateRange([start, end]);
        setDatePickerMode(null);
        setDropdownOpen(false);
    };

    const handleSingleDateChange = (date) => {
        if (date) {
            const label = date.format('MMM D, YYYY');
            setDateLabel(label);
            setDateRange([date.startOf('day'), date.endOf('day')]);
            setDatePickerMode(null);
            setDropdownOpen(false);
        }
    };

    const handleRangeChange = (dates) => {
        if (dates && dates.length === 2) {
            const label = dates[0].format('MMM D') + ' - ' + dates[1].format('MMM D');
            setDateLabel(label);
            setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
            setDatePickerMode(null);
            setDropdownOpen(false);
        }
    };

    const formatCurrency = (val) => {
        return '৳' + new Intl.NumberFormat('en-IN').format(Math.round(val || 0));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return dayjs(dateStr).format('DD MMM YYYY, hh:mm A');
    };

    const getStatusTag = (statusType, statusName) => {
        const type = statusType || 'other';
        const colors = STATUS_COLORS[type] || STATUS_COLORS.other;
        return (
            <Tag
                bordered={false}
                style={{
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: colors.bg,
                    color: colors.color,
                    border: `1px solid ${colors.border}`,
                    margin: 0,
                }}
            >
                {statusName || type}
            </Tag>
        );
    };

    const toggleCampaignExpand = useCallback((id) => {
        setExpandedCampaignKeys(prev =>
            prev.includes(id) ? prev.filter(key => key !== id) : [...prev, id]
        );
    }, []);

    const toggleAdSetExpand = useCallback((id) => {
        setExpandedAdSetKeys(prev =>
            prev.includes(id) ? prev.filter(key => key !== id) : [...prev, id]
        );
    }, []);

    const toggleOrderExpand = useCallback((rowKey) => {
        setExpandedOrderKeys(prev =>
            prev.includes(rowKey) ? prev.filter(key => key !== rowKey) : [...prev, rowKey]
        );
    }, []);

    const tableData = useMemo(() => {
        const rows = [];
        (campaigns || []).forEach(campaign => {
            const campaignKey = `campaign-${campaign.campaign_id}`;
            rows.push({
                ...campaign,
                rowType: 'campaign',
                rowKey: campaignKey,
                displayName: formatDisplayName(campaign.campaign_name, campaign.campaign_id, 'Campaign'),
                displayId: campaign.campaign_id,
                otherCount: getOtherCount(campaign),
            });

            if (!expandedCampaignKeys.includes(campaign.campaign_id)) return;

            (campaign.adsets || []).forEach(adset => {
                const adsetKey = `adset-${adset.adset_id}`;
                rows.push({
                    ...adset,
                    rowType: 'adset',
                    rowKey: adsetKey,
                    displayName: formatDisplayName(adset.adset_name, adset.adset_id, 'Ad Set'),
                    displayId: adset.adset_id,
                    otherCount: getOtherCount(adset),
                });

                if (!expandedAdSetKeys.includes(adset.adset_id)) return;

                (adset.ads || []).forEach(ad => {
                    rows.push({
                        ...ad,
                        rowType: 'ad',
                        rowKey: `ad-${ad.ad_id}`,
                        displayName: formatDisplayName(ad.ad_name, ad.ad_id, 'Ad'),
                        displayId: ad.ad_id,
                        otherCount: getOtherCount(ad),
                    });
                });
            });
        });
        return rows;
    }, [campaigns, expandedCampaignKeys, expandedAdSetKeys]);

    const renderOrderList = (record) => {
        const orders = record.order_list || [];
        if (!orders.length) {
            return (
                <div style={{ padding: '16px 24px', color: '#9ca3af', fontSize: '13px' }}>
                    No orders in this period.
                </div>
            );
        }

        const orderColumns = [
            {
                title: 'ORDER',
                key: 'order_id',
                width: 90,
                render: (_, item) => (
                    <Link to={`/order-edit/${item.order?.id}`} style={{ fontWeight: 600, color: '#1677ff' }}>
                        #{item.order?.id}
                    </Link>
                ),
            },
            {
                title: 'CUSTOMER',
                key: 'customer',
                width: 200,
                render: (_, item) => (
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '12px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <UserOutlined style={{ marginRight: 4, color: '#9ca3af' }} />
                            {item.order?.customer_name || '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>
                            <PhoneOutlined style={{ marginRight: 4 }} />
                            {item.order?.phone_number || '—'}
                        </div>
                    </div>
                ),
            },
            {
                title: 'STATUS',
                key: 'status',
                width: 120,
                render: (_, item) => getStatusTag(item.status_type, item.current_status?.name),
            },
            {
                title: 'AMOUNT',
                key: 'amount',
                width: 100,
                align: 'right',
                render: (_, item) => (
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>
                        {formatCurrency(item.order?.net_order_price)}
                    </span>
                ),
            },
            {
                title: 'ITEMS',
                key: 'items',
                width: 70,
                align: 'center',
                render: (_, item) => {
                    const qty = (item.order_details || []).reduce((sum, d) => sum + Number(d.quantity || 0), 0);
                    return <span style={{ color: '#6b7280', fontSize: '12px' }}>{qty || '—'}</span>;
                },
            },
            {
                title: 'DATE',
                key: 'date',
                width: 160,
                render: (_, item) => (
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{formatDate(item.order?.created_at)}</span>
                ),
            },
        ];

        return (
            <div className="quality-order-expand">
                <div className="quality-order-expand-header">
                    <ShoppingOutlined />
                    <span>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                    <div className="quality-order-expand-badges">
                        {record.active > 0 && <Tag bordered={false} color="processing">{record.active} Active</Tag>}
                        {record.done > 0 && <Tag bordered={false} color="success">{record.done} Done</Tag>}
                        {record.cancel > 0 && <Tag bordered={false} color="error">{record.cancel} Cancel</Tag>}
                        {record.otherCount > 0 && <Tag bordered={false}>{record.otherCount} Other</Tag>}
                    </div>
                </div>
                <Table
                    columns={orderColumns}
                    dataSource={orders.map((item, idx) => ({ ...item, key: item.order?.id || idx }))}
                    pagination={orders.length > 10 ? { pageSize: 10, size: 'small' } : false}
                    size="small"
                    scroll={{ x: 740 }}
                />
            </div>
        );
    };

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const totalOrders = campaigns.reduce((acc, c) => acc + (c.orders || 0), 0);
        const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);
        const totalActive = campaigns.reduce((acc, c) => acc + (c.active || 0), 0);
        const totalDone = campaigns.reduce((acc, c) => acc + (c.done || 0), 0);
        const totalCancel = campaigns.reduce((acc, c) => acc + (c.cancel || 0), 0);
        const totalOther = campaigns.reduce((acc, c) => acc + getOtherCount(c), 0);
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            totalOrders,
            campaignCount: campaigns.length,
            totalRevenue,
            totalActive,
            totalDone,
            totalCancel,
            totalOther,
            aov,
            completedRate: totalOrders > 0 ? (totalDone / totalOrders * 100).toFixed(1) : '0.0',
            cancelledRate: totalOrders > 0 ? (totalCancel / totalOrders * 100).toFixed(1) : '0.0'
        };
    }, [campaigns]);
    
    const columns = [
        {
            title: 'NAME',
            key: 'name',
            width: COLUMN_WIDTHS.name,
            fixed: 'left',
            render: (_, record) => {
                const { rowType } = record;
                const isCampaign = rowType === 'campaign';
                const isAdSet = rowType === 'adset';

                const hasHierarchyChildren =
                    (isCampaign && (record.adsets?.length > 0)) ||
                    (isAdSet && (record.ads?.length > 0));

                const isHierarchyExpanded =
                    isCampaign
                        ? expandedCampaignKeys.includes(record.campaign_id)
                        : isAdSet
                            ? expandedAdSetKeys.includes(record.adset_id)
                            : false;

                const handleHierarchyExpand = (e) => {
                    e.stopPropagation();
                    if (isCampaign) toggleCampaignExpand(record.campaign_id);
                    else if (isAdSet) toggleAdSetExpand(record.adset_id);
                };

                const typeStyles = {
                    campaign: { fontWeight: 600, fontSize: '13px', color: '#111827' },
                    adset: { fontWeight: 500, fontSize: '12px', color: '#374151' },
                    ad: { fontWeight: 400, fontSize: '12px', color: '#6b7280' },
                };

                const typeBadge = {
                    campaign: { label: 'Campaign', bg: '#e6f4ff', color: '#0958d9' },
                    adset: { label: 'Ad Set', bg: '#f9f0ff', color: '#722ed1' },
                    ad: { label: 'Ad', bg: '#f6ffed', color: '#389e0d' },
                };

                const badge = typeBadge[rowType];

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                            onClick={hasHierarchyChildren ? handleHierarchyExpand : undefined}
                            style={{
                                cursor: hasHierarchyChildren ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                flexShrink: 0,
                                color: '#9ca3af',
                                visibility: hasHierarchyChildren ? 'visible' : 'hidden',
                            }}
                        >
                            {isHierarchyExpanded
                                ? <DownOutlined style={{ fontSize: isAdSet ? '9px' : '10px' }} />
                                : <RightOutlined style={{ fontSize: isAdSet ? '9px' : '10px' }} />}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                    ...typeStyles[rowType],
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {record.displayName}
                                </span>
                                <Tag
                                    bordered={false}
                                    style={{
                                        borderRadius: '4px',
                                        fontSize: '9px',
                                        height: '16px',
                                        lineHeight: '16px',
                                        padding: '0 5px',
                                        background: badge.bg,
                                        color: badge.color,
                                        flexShrink: 0,
                                    }}
                                >
                                    {badge.label}
                                </Tag>
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                                {record.displayId}
                            </div>
                        </div>

                        {isCampaign && record.adsets?.length > 0 && (
                            <Tag bordered={false} style={{ borderRadius: '4px', fontSize: '10px', height: '18px', lineHeight: '18px', padding: '0 6px', background: '#f3f4f6', color: '#6b7280', flexShrink: 0 }}>
                                {record.adsets.length} Sets
                            </Tag>
                        )}
                        {isAdSet && record.ads?.length > 0 && (
                            <Tag bordered={false} style={{ borderRadius: '4px', fontSize: '10px', height: '18px', lineHeight: '18px', padding: '0 6px', background: '#f3f4f6', color: '#6b7280', flexShrink: 0 }}>
                                {record.ads.length} Ads
                            </Tag>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'ORDERS',
            dataIndex: 'orders',
            key: 'orders',
            align: 'right',
            width: COLUMN_WIDTHS.orders,
            render: (val, record) => {
                const count = val || 0;
                const hasOrders = count > 0 && (record.order_list?.length > 0);
                const isExpanded = expandedOrderKeys.includes(record.rowKey);

                if (!hasOrders) {
                    return <span style={{ fontWeight: 600, fontSize: '14px', color: '#9ca3af' }}>{count}</span>;
                }

                return (
                    <Tooltip title={isExpanded ? 'Hide orders' : 'View orders'}>
                        <Button
                            type="text"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderExpand(record.rowKey);
                            }}
                            style={{
                                fontWeight: 700,
                                fontSize: '14px',
                                color: isExpanded ? '#1677ff' : '#111827',
                                padding: '0 4px',
                                height: 'auto',
                            }}
                        >
                            {count}
                            {isExpanded ? <DownOutlined style={{ fontSize: '9px', marginLeft: 4 }} /> : <RightOutlined style={{ fontSize: '9px', marginLeft: 4 }} />}
                        </Button>
                    </Tooltip>
                );
            }
        },
        {
            title: 'REVENUE',
            dataIndex: 'revenue',
            key: 'revenue',
            align: 'right',
            width: COLUMN_WIDTHS.revenue,
            render: (val) => <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{formatCurrency(val)}</span>
        },
        {
            title: 'AOV',
            key: 'aov',
            align: 'right',
            width: COLUMN_WIDTHS.aov,
            render: (_, record) => (
                <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '12px' }}>
                    {formatCurrency(record.aov ?? (record.orders > 0 ? record.revenue / record.orders : 0))}
                </span>
            )
        },
        {
            title: 'ACTIVE',
            dataIndex: 'active',
            key: 'active',
            align: 'right',
            width: COLUMN_WIDTHS.active,
            render: (val) => <span style={{ color: val > 0 ? '#1677ff' : '#9ca3af', fontWeight: val > 0 ? '600' : '400', fontSize: '13px' }}>{val || 0}</span>
        },
        {
            title: 'DONE',
            dataIndex: 'done',
            key: 'done',
            align: 'right',
            width: COLUMN_WIDTHS.done,
            render: (val) => <span style={{ color: val > 0 ? '#52c41a' : '#9ca3af', fontWeight: val > 0 ? '600' : '400', fontSize: '13px' }}>{val || 0}</span>
        },
        {
            title: 'CANCEL',
            dataIndex: 'cancel',
            key: 'cancel',
            align: 'right',
            width: COLUMN_WIDTHS.cancel,
            render: (val) => <span style={{ color: val > 0 ? '#ff4d4f' : '#9ca3af', fontWeight: val > 0 ? '600' : '400', fontSize: '13px' }}>{val || 0}</span>
        },
        {
            title: 'OTHER',
            key: 'other',
            align: 'right',
            width: COLUMN_WIDTHS.other,
            render: (_, record) => (
                <span style={{ color: record.otherCount > 0 ? '#595959' : '#9ca3af', fontWeight: record.otherCount > 0 ? '600' : '400', fontSize: '13px' }}>
                    {record.otherCount || 0}
                </span>
            )
        },
        {
            title: 'CANCEL %',
            key: 'cancel_percent',
            align: 'center',
            width: COLUMN_WIDTHS.cancelPercent,
            render: (_, record) => {
                const rate = record.cancel_percent ?? (record.orders > 0 ? (record.cancel / record.orders * 100) : 0);
                const isHigh = rate > 20;
                return (
                    <Tag bordered={false}
                        style={{ borderRadius: '4px', minWidth: '55px', fontWeight: '600', fontSize: '12px', background: isHigh ? '#fff1f0' : '#f6ffed', color: isHigh ? '#cf1322' : '#389e0d' }}
                    >
                        {Number(rate).toFixed(1)}%
                    </Tag>
                );
            }
        }
    ];

    const presets = [
        { 
            label: 'Today', 
            start: dayjs().startOf('day'), 
            end: dayjs().endOf('day') 
        },
        { 
            label: 'Yesterday', 
            start: dayjs().subtract(1, 'day').startOf('day'), 
            end: dayjs().subtract(1, 'day').endOf('day') 
        },
        { 
            label: 'Last 7 days', 
            start: dayjs().subtract(6, 'day').startOf('day'), 
            end: dayjs().endOf('day') 
        },
        { 
            label: 'Last 30 days', 
            start: dayjs().subtract(29, 'day').startOf('day'), 
            end: dayjs().endOf('day') 
        },
        { 
            label: 'This month', 
            start: dayjs().startOf('month'), 
            end: dayjs().endOf('day') 
        },
        { 
            label: 'Last month', 
            start: dayjs().subtract(1, 'month').startOf('month'), 
            end: dayjs().subtract(1, 'month').endOf('month') 
        },
        { 
            label: 'This year', 
            start: dayjs().startOf('year'), 
            end: dayjs().endOf('day') 
        },
        { 
            label: 'Last year', 
            start: dayjs().subtract(1, 'year').startOf('year'), 
            end: dayjs().subtract(1, 'year').endOf('year') 
        },
        { 
            label: 'Lifetime', 
            start: dayjs('2020-01-01'), 
            end: dayjs().endOf('day') 
        },
    ];

    const dateSelectorMenu = (
        <div className="custom-date-selector-menu" onClick={(e) => e.stopPropagation()}>
            {datePickerMode === 'single' ? (
                <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 12, fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select a Date</div>
                    <DatePicker 
                        open
                        getPopupContainer={trigger => trigger.parentNode}
                        style={{ width: '100%', visibility: 'hidden', height: 0, padding: 0 }}
                        onChange={handleSingleDateChange}
                    />
                    <div style={{ marginTop: 280 }}> {/* Spacer for absolute positioned picker */}
                        <Button size="small" type="text" style={{ color: '#9ca3af', fontWeight: '600' }} onClick={() => setDatePickerMode(null)}>
                            ← Back to Presets
                        </Button>
                    </div>
                </div>
            ) : datePickerMode === 'range' ? (
                <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 12, fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Range</div>
                    <DatePicker.RangePicker
                        open
                        getPopupContainer={trigger => trigger.parentNode}
                        style={{ width: '100%', visibility: 'hidden', height: 0, padding: 0 }}
                        onChange={handleRangeChange}
                    />
                    <div style={{ marginTop: 280 }}>
                        <Button size="small" type="text" style={{ color: '#9ca3af', fontWeight: '600' }} onClick={() => setDatePickerMode(null)}>
                            ← Back to Presets
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="menu-section">
                        <div className="menu-group-title">QUICK SELECT</div>
                        {presets.slice(0, 4).map(p => (
                            <div
                                key={p.label}
                                className={`menu-item${dateLabel === p.label ? ' active' : ''}`}
                                onClick={() => applyDatePreset(p.label, p.start, p.end)}
                            >
                                <ClockCircleOutlined style={{ fontSize: '14px', opacity: 0.7 }} /> 
                                <span style={{ flex: 1 }}>{p.label}</span>
                                {dateLabel === p.label && <CheckCircleOutlined className="check-icon" />}
                            </div>
                        ))}
                    </div>
                    <div className="menu-divider" />
                    <div className="menu-section">
                        <div className="menu-group-title">EXTENDED RANGE</div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {presets.slice(4).map(p => (
                                <div
                                    key={p.label}
                                    className={`menu-item${dateLabel === p.label ? ' active' : ''}`}
                                    onClick={() => applyDatePreset(p.label, p.start, p.end)}
                                >
                                    <CalendarOutlined style={{ fontSize: '14px', opacity: 0.7 }} /> 
                                    <span style={{ flex: 1 }}>{p.label}</span>
                                    {dateLabel === p.label && <CheckCircleOutlined className="check-icon" />}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="menu-divider" />
                    <div className="menu-section" style={{ padding: '4px 0' }}>
                        <div className="menu-item custom-trigger" onClick={() => setDatePickerMode('single')}>
                            <CalendarOutlined style={{ color: '#1677ff' }} /> 
                            <span style={{ flex: 1 }}>Specific Date</span>
                            <RightOutlined style={{ fontSize: '10px', opacity: 0.5 }} />
                        </div>
                        <div className="menu-item custom-trigger" onClick={() => setDatePickerMode('range')}>
                            <CalendarOutlined style={{ color: '#1677ff' }} /> 
                            <span style={{ flex: 1 }}>Custom Range</span>
                            <RightOutlined style={{ fontSize: '10px', opacity: 0.5 }} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="campaign-quality-report">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Campaign Quality Report</Title>
                    <Badge count="Beta" style={{ backgroundColor: '#e6f4ff', color: '#1677ff', fontSize: '10px' }} />
                    <Button type="text" icon={<InfoCircleOutlined />} size="small" style={{ color: '#9ca3af' }} onClick={() => setHelpModalOpen(true)}>Help</Button>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <FilterOutlined style={{ color: '#9ca3af' }} />
                    <Select value={selectedSource} onChange={setSelectedSource} style={{ width: 140 }} variant="borderless" className="quality-select">
                        <Option value="all">All Sources</Option>
                        {sources.map(source => (
                            <Option key={source.id} value={source.id}>
                                {source.name} ({source.orders_count || 0})
                            </Option>
                        ))}
                    </Select>
                    
                    <Dropdown
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
                        overlay={dateSelectorMenu}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button className="date-selector-btn">
                            <Space>
                                <CalendarOutlined />
                                <span style={{ fontWeight: '600' }}>{dateLabel}</span>
                                <DownOutlined style={{ fontSize: '10px' }} />
                            </Space>
                        </Button>
                    </Dropdown>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col flex="1 0 15%">
                    <Card size="small" className="q-stat-card">
                        <Text type="secondary" style={{ fontSize: '12px' }}><LineChartOutlined /> Total Orders</Text>
                        <div className="q-stat-value">{stats.totalOrders}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{stats.campaignCount} campaigns</Text>
                    </Card>
                </Col>
                <Col flex="1 0 15%">
                    <Card size="small" className="q-stat-card">
                        <Text type="secondary" style={{ fontSize: '12px' }}><DollarOutlined /> Revenue</Text>
                        <div className="q-stat-value">{formatCurrency(stats.totalRevenue)}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>AOV: {formatCurrency(stats.aov)}</Text>
                    </Card>
                </Col>
                <Col flex="1 0 15%">
                    <Card size="small" className="q-stat-card q-processing">
                        <Text type="secondary" style={{ fontSize: '12px' }}><ClockCircleOutlined /> Active</Text>
                        <div className="q-stat-value">{stats.totalActive}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Active orders</Text>
                    </Card>
                </Col>
                <Col flex="1 0 15%">
                    <Card size="small" className="q-stat-card q-completed">
                        <Text type="secondary" style={{ fontSize: '12px' }}><CheckCircleOutlined /> Done</Text>
                        <div className="q-stat-value">{stats.totalDone}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{stats.completedRate}%</Text>
                    </Card>
                </Col>
                <Col flex="1 0 15%">
                    <Card size="small" className="q-stat-card q-cancelled">
                        <Text type="secondary" style={{ fontSize: '12px' }}><CloseCircleOutlined /> Cancel</Text>
                        <div className="q-stat-value">{stats.totalCancel}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{stats.cancelledRate}%</Text>
                    </Card>
                </Col>
                <Col flex="1 0 15%">
                    <Card size="small" className="q-stat-card">
                        <Text type="secondary" style={{ fontSize: '12px' }}><DollarOutlined /> AOV</Text>
                        <div className="q-stat-value">{formatCurrency(stats.aov)}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Avg order value</Text>
                    </Card>
                </Col>
            </Row>

            <Card className="q-table-card" styles={{ body: { padding: 0 } }}>
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Space size={12}>
                        <LineChartOutlined style={{ fontSize: '16px', color: '#111827' }} />
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>Performance Breakdown</span>
                        <Badge count={stats.totalOrders + " orders"} style={{ backgroundColor: '#f3f4f6', color: '#4b5563', boxShadow: 'none' }} />
                    </Space>
                </div>

                <Table 
                    columns={columns}
                    dataSource={tableData}
                    rowKey="rowKey"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: SCROLL_X }}
                    className="quality-table-premium"
                    rowClassName={(record) => {
                        if (record.rowType === 'adset') return 'quality-row-adset';
                        if (record.rowType === 'ad') return 'quality-row-ad';
                        return 'quality-row-campaign';
                    }}
                    expandable={{
                        expandedRowKeys: expandedOrderKeys,
                        onExpandedRowsChange: setExpandedOrderKeys,
                        expandIconColumnIndex: -1,
                        expandedRowRender: renderOrderList,
                        rowExpandable: (record) => (record.order_list?.length > 0),
                    }}
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row style={{ background: '#f9fafb', fontWeight: 'bold', borderTop: '2px solid #f0f0f0' }}>

                                <Table.Summary.Cell index={0} className="summary-cell-title">
                                    <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '700' }}>GRAND TOTAL</span>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={1} align="right">
                                    <span style={{ fontSize: '15px', color: '#111827', fontWeight: '800' }}>{stats.totalOrders}</span>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={2} align="right">
                                    <span style={{ fontSize: '13px', color: '#111827', fontWeight: '700' }}>{formatCurrency(stats.totalRevenue)}</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3} align="right">
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{formatCurrency(stats.aov)}</span>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={4} align="right">
                                    <span style={{ color: '#1677ff', fontWeight: '700', fontSize: '14px' }}>{stats.totalActive}</span>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={5} align="right">
                                    <span style={{ color: '#52c41a', fontWeight: '700', fontSize: '14px' }}>{stats.totalDone}</span>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={6} align="right">
                                    <span style={{ color: '#ff4d4f', fontWeight: '700', fontSize: '14px' }}>{stats.totalCancel}</span>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={7} align="right">
                                    <span style={{ color: '#595959', fontWeight: '700', fontSize: '14px' }}>{stats.totalOther}</span>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={8} align="center">
                                     <Tag bordered={false}
                                        style={{ borderRadius: '4px', minWidth: '55px', fontWeight: '700', fontSize: '12px', background: parseFloat(stats.cancelledRate) > 20 ? '#fff1f0' : '#f6ffed', color: parseFloat(stats.cancelledRate) > 20 ? '#cf1322' : '#389e0d' }}
                                    >
                                        {stats.cancelledRate}%
                                    </Tag>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </Card>

            <style>{`
                .campaign-quality-report {
                    background: #f8fafc;
                    min-height: 100vh;
                    padding: 24px;
                }
                .q-stat-card {
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    height: 100%;
                    transition: all 0.3s;
                    padding: 8px;
                }
                .q-stat-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .q-stat-value {
                    font-size: 22px;
                    font-weight: 700;
                    color: #111827;
                    margin: 4px 0;
                }
                .q-processing {
                    background-color: #f0f7ff;
                    border-color: #bae0ff;
                }
                .q-completed {
                    background-color: #f6ffed;
                    border-color: #b7eb8f;
                }
                .q-cancelled {
                    background-color: #fff1f0;
                    border-color: #ffccc7;
                }
                .q-table-card {
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    overflow: hidden;
                }
                .quality-table-premium .ant-table-row-level-0 {
                    background: #ffffff;
                }
                .quality-table-premium .quality-row-campaign {
                    background: #ffffff;
                }
                .quality-table-premium .quality-row-adset {
                    background: #fbfcfd;
                }
                .quality-table-premium .quality-row-ad {
                    background: #f8fafc;
                }
                .quality-table-premium .ant-table-expanded-row > td {
                    background: #f8fafc !important;
                    padding: 0 !important;
                }
                .quality-order-expand {
                    padding: 12px 16px 16px 40px;
                    background: #f8fafc;
                    border-top: 1px dashed #e5e7eb;
                }
                .quality-order-expand-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                }
                .quality-order-expand-badges {
                    margin-left: auto;
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .quality-order-expand .ant-table {
                    background: #fff;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    overflow: hidden;
                }
                .quality-order-expand .ant-table-thead > tr > th {
                    background: #fafafa !important;
                    font-size: 10px !important;
                    padding: 6px 10px !important;
                }
                .quality-order-expand .ant-table-tbody > tr > td {
                    padding: 8px 10px !important;
                    font-size: 12px;
                }
                .quality-table-premium .ant-table-thead > tr > th {
                    background: #fcfcfd !important;
                    color: #64748b !important;
                    font-size: 10px !important;
                    font-weight: 700 !important;
                    border-bottom: 2px solid #f1f5f9 !important;
                    padding: 8px 12px !important;
                    letter-spacing: 0.08em !important;
                    text-transform: uppercase !important;
                }
                .quality-table-premium .ant-table-tbody > tr > td {
                    padding: 8px 12px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .quality-table-premium .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .quality-table-premium .ant-table-selection-column {
                    padding: 8px !important;
                    text-align: center !important;
                    width: 40px !important;
                }
                .summary-cell-title {
                    padding-left: 12px !important;
                }
                .quality-select .ant-select-selector {
                    padding-left: 0 !important;
                    font-weight: 500 !important;
                    color: #4b5563 !important;
                }
                .date-selector-btn {
                    border-radius: 6px !important;
                    border: 1px solid #e5e7eb !important;
                    height: 32px !important;
                    display: flex !important;
                    align-items: center !important;
                    box-shadow: none !important;
                }
                .custom-date-selector-menu {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    width: 240px;
                    padding: 8px 0;
                    border: 1px solid #f0f0f0;
                }
                .menu-group-title {
                    padding: 8px 16px 4px;
                    font-size: 10px;
                    color: #8c8c8c;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
                .menu-item {
                    padding: 10px 16px;
                    font-size: 13px;
                    color: #4b5563;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s;
                }
                .menu-item:hover {
                    background: #f3f4f6;
                }
                .menu-item.active {
                    background: #f0fdf9;
                    color: #059669;
                    font-weight: 500;
                }
                .menu-item .anticon {
                    font-size: 16px;
                }
                .check-icon {
                    margin-left: auto;
                    color: #059669;
                }
                .menu-divider {
                    height: 1px;
                    background: #f0f0f0;
                    margin: 4px 0;
                }
            `}</style>

            <CampaignQualityHelpModal open={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
        </div>
    );
};

export default CampaignQuality;
