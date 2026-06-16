import { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Space, Select, Badge, Button, Dropdown, DatePicker } from 'antd';
import { LineChartOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, FilterOutlined, StarOutlined, CalendarOutlined, FolderOutlined, ApartmentOutlined, PlaySquareOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { getDatas } from '../../../api/common/common';
import dayjs from 'dayjs';
import CampaignQualityHelpModal from './CampaignQualityHelpModal';

const { Title, Text } = Typography;
const { Option } = Select;

const CampaignQuality = ({ selectedAccount }) => {
    // States
    const [loading, setLoading]                 = useState(false);
    const [campaigns, setCampaigns]             = useState([]);
    const [dateRange, setDateRange]             = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
    const [helpModalOpen, setHelpModalOpen]     = useState(false);
    const [sources, setSources]                 = useState([]);
    const [selectedSource, setSelectedSource]   = useState('all');
    const [dateLabel, setDateLabel]             = useState('Today');
    const [datePickerMode, setDatePickerMode]   = useState(null);
    const [dropdownOpen, setDropdownOpen]       = useState(false);

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
                const dataArray = Array.isArray(res.result) ? res.result : (res.result?.result || []);

                const formattedData = dataArray.map(campaign => ({
                    ...campaign,
                    key: campaign.campaign_id,
                    displayName: campaign.campaign_name,
                    displayId: campaign.campaign_id,
                    type: 'campaign',
                    children: (campaign.adsets || []).map(adset => ({
                        ...adset,
                        key        : adset.adset_id,
                        displayName: adset.adset_name,
                        displayId  : adset.adset_id,
                        type       : 'adset',
                        children   : (adset.ads || []).map(ad => ({
                            ...ad,
                            key        : ad.ad_id,
                            displayName: ad.ad_name,
                            displayId  : ad.ad_id,
                            type       : 'ad'
                        }))
                    }))
                }));
                setCampaigns(formattedData);
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
            setDateLabel(date.format('MMM D, YYYY'));
            setDateRange([date.startOf('day'), date.endOf('day')]);
            setDatePickerMode(null);
            setDropdownOpen(false);
        }
    };

    const handleRangeChange = (dates) => {
        if (dates && dates.length === 2) {
            setDateLabel(dates[0].format('MMM D') + ' - ' + dates[1].format('MMM D'));
            setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
            setDatePickerMode(null);
            setDropdownOpen(false);
        }
    };

    const formatCurrency = (val) => {
        return '৳' + new Intl.NumberFormat('en-IN').format(Math.round(val || 0));
    };

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const totalOrders = campaigns.reduce((acc, c) => acc + (c.orders || 0), 0);
        const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);
        const totalActive = campaigns.reduce((acc, c) => acc + (c.active || 0), 0);
        const totalDone = campaigns.reduce((acc, c) => acc + (c.done || 0), 0);
        const totalCancel = campaigns.reduce((acc, c) => acc + (c.cancel || 0), 0);
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            totalOrders,
            campaignCount: campaigns.length,
            totalRevenue,
            totalActive,
            totalDone,
            totalCancel,
            aov,
            completedRate: totalOrders > 0 ? (totalDone / totalOrders * 100).toFixed(1) : '0.0',
            cancelledRate: totalOrders > 0 ? (totalCancel / totalOrders * 100).toFixed(1) : '0.0'
        };
    }, [campaigns]);
    
    const columns = [
        {
            title: 'NAME',
            key: 'name',
            width: 350,
            render: (_, record) => {
                const isCampaign = record.type === 'campaign';
                const isAdSet = record.type === 'adset';
                const isAd = record.type === 'ad';
                const hasChildren = record.children && record.children.length > 0;
                
                // Indentation logic
                let paddingLeft = 0;
                if (isAdSet) paddingLeft = 24;
                if (isAd) paddingLeft = 48;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: `${paddingLeft}px` }}>
                        <div style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {hasChildren ? (
                                <div className="expand-trigger">
                                    {/* The expansion is handled by expandRowByClick in Table props */}
                                    <RightOutlined className={`expand-icon ${record.key}`} style={{ fontSize: '10px', color: '#9ca3af', transition: 'transform 0.2s' }} />
                                </div>
                            ) : (
                                <div style={{ width: '16px' }} />
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div style={{ 
                                fontWeight: isCampaign ? '600' : '400', 
                                fontSize: isCampaign ? '13px' : '12px',
                                color: isCampaign ? '#111827' : (isAdSet ? '#374151' : '#6b7280'),
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {record.displayName}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>{record.displayId}</div>
                        </div>
                        {isCampaign && (
                            <Tag bordered={false} style={{ borderRadius: '4px', fontSize: '10px', height: '18px', lineHeight: '18px', padding: '0 6px', background: '#e6f4ff', color: '#0958d9' }}>
                                {record.children?.length || 0} Sets
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
            width: 100,
            render: (val) => <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{val || 0}</span>
        },
        {
            title: 'REVENUE',
            dataIndex: 'revenue',
            key: 'revenue',
            align: 'right',
            width: 120,
            render: (val) => <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{formatCurrency(val)}</span>
        },
        {
            title: 'AOV',
            key: 'aov',
            align: 'right',
            width: 120,
            render: (_, record) => (
                <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '12px' }}>
                    {formatCurrency(record.aov || (record.orders > 0 ? record.revenue / record.orders : 0))}
                </span>
            )
        },
        {
            title: 'ACTIVE',
            dataIndex: 'active',
            key: 'active',
            align: 'right',
            width: 100,
            render: (val, record) => <span style={{ color: record.active > 0 ? '#1677ff' : '#9ca3af', fontWeight: record.active > 0 ? '600' : '400', fontSize: '13px' }}>{val || 0}</span>
        },
        {
            title: 'DONE',
            dataIndex: 'done',
            key: 'done',
            align: 'right',
            width: 100,
            render: (val, record) => <span style={{ color: record.done > 0 ? '#52c41a' : '#9ca3af', fontWeight: record.done > 0 ? '600' : '400', fontSize: '13px' }}>{val || 0}</span>
        },
        {
            title: 'CANCEL',
            dataIndex: 'cancel',
            key: 'cancel',
            align: 'right',
            width: 100,
            render: (val, record) => <span style={{ color: record.cancel > 0 ? '#ff4d4f' : '#9ca3af', fontWeight: record.cancel > 0 ? '600' : '400', fontSize: '13px' }}>{val || 0}</span>
        },
        {
            title: 'CANCEL %',
            key: 'cancel_percent',
            align: 'center',
            width: 120,
            render: (_, record) => {
                const rate = record.cancel_percent !== undefined ? record.cancel_percent : (record.orders > 0 ? (record.cancel / record.orders * 100) : 0);
                return (
                    <Tag bordered={false}
                        style={{ borderRadius: '4px', minWidth: '55px', fontWeight: '600', fontSize: '12px', background: rate > 20 ? '#fff1f0' : '#f6ffed', color: rate > 20 ? '#cf1322' : '#389e0d' }}
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
        <div className="custom-date-selector-menu">
            {datePickerMode === 'single' ? (
                <div style={{ padding: 12 }}>
                    <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#8c8c8c' }}>SELECT A DATE</div>
                    <DatePicker inline style={{ width: '100%' }} onChange={handleSingleDateChange} autoFocus/>
                    <Button size="small" type="text" style={{ marginTop: 8, color: '#8c8c8c' }} onClick={() => setDatePickerMode(null)}>
                        ← Back
                    </Button>
                </div>
            ) : datePickerMode === 'range' ? (
                <div style={{ padding: 12 }}>
                    <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#8c8c8c' }}>SELECT DATE RANGE</div>
                    <DatePicker.RangePicker
                        inline
                        style={{ width: '100%' }}
                        onChange={handleRangeChange}
                        autoFocus
                    />
                    <Button size="small" type="text" style={{ marginTop: 8, color: '#8c8c8c' }} onClick={() => setDatePickerMode(null)}>
                        ← Back
                    </Button>
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
                                <ClockCircleOutlined /> {p.label}
                                {dateLabel === p.label && <CheckCircleOutlined className="check-icon" />}
                            </div>
                        ))}
                    </div>
                    <div className="menu-divider" />
                    <div className="menu-section">
                        <div className="menu-group-title">EXTENDED RANGE</div>
                        {presets.slice(4).map(p => (
                            <div
                                key={p.label}
                                className={`menu-item${dateLabel === p.label ? ' active' : ''}`}
                                onClick={() => applyDatePreset(p.label, p.start, p.end)}
                            >
                                <CalendarOutlined /> {p.label}
                                {dateLabel === p.label && <CheckCircleOutlined className="check-icon" />}
                            </div>
                        ))}
                    </div>
                    <div className="menu-divider" />
                    <div className="menu-section">
                        <div className="menu-group-title">CUSTOM</div>
                        <div className="menu-item" onClick={() => setDatePickerMode('single')}>
                            <CalendarOutlined /> Select a date
                        </div>
                        <div className="menu-item" onClick={() => setDatePickerMode('range')}>
                            <CalendarOutlined /> Custom range
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
                    dataSource={campaigns}
                    rowKey="key"
                    loading={loading}
                    pagination={false}
                    className="quality-table-premium"
                    expandable={{
                        expandIconColumnIndex: -1, // Hide the default expand column
                        expandRowByClick: true
                    }}
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row style={{ background: '#f9fafb', fontWeight: 'bold', borderTop: '2px solid #f0f0f0' }}>

                                <Table.Summary.Cell index={0} className="summary-cell-title">
                                    <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '700', paddingLeft: '24px' }}>GRAND TOTAL</span>
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

                                <Table.Summary.Cell index={7} align="center">
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
                .quality-table-premium .ant-table-row-level-1 {
                    background: #fbfcfd;
                }
                .quality-table-premium .ant-table-row-level-2 {
                    background: #f8fafc;
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
                /* Rotate expand icon when row is expanded */
                .quality-table-premium .ant-table-row-expanded .expand-icon {
                    transform: rotate(90deg);
                    color: #1677ff !important;
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
