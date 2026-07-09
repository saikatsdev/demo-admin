import { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Progress, Input, Button, Space, Typography, Row, Col, Card, Dropdown, Tooltip } from 'antd';
import {DownloadOutlined,SearchOutlined,FileExcelOutlined,FileTextOutlined,PrinterOutlined,WalletOutlined,DollarOutlined,BankOutlined,RiseOutlined,FallOutlined,MinusOutlined,ReloadOutlined,} from '@ant-design/icons';
import { getDatas } from '../../../api/common/common';
import * as XLSX from 'xlsx';

const { Text } = Typography;

const STATUS_CONFIG = {
    ACTIVE: {
        bg    : '#f6ffed',
        color : '#389e0d',
        border: '#b7eb8f',
        label : 'Active',
    },
    UNSETTLED: {
        bg    : '#fffbe6',
        color : '#d48806',
        border: '#ffe58f',
        label : 'Unsettled',
    },
    DISABLED: {
        bg    : '#fff1f0',
        color : '#cf1322',
        border: '#ffccc7',
        label : 'Disabled',
    },
};

const normalizeAccountLimits = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    return [];
};

const formatMoney = (amount, currency = 'USD') => {
    const value = Number(amount || 0);
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

    if (currency === 'USD') return `$${formatted}`;
    if (currency === 'BDT') return `৳${formatted}`;
    return `${currency} ${formatted}`;
};

const getStatusTag = (status) => {
    const key = (status || '').toUpperCase();
    const config = STATUS_CONFIG[key] || {
        bg    : '#fafafa',
        color : '#595959',
        border: '#d9d9d9',
        label : key || 'Unknown',
    };

    return (
        <Tag
            bordered={false}
            style={{
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                background: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
                margin: 0,
            }}
        >
            {config.label}
        </Tag>
    );
};

const getSpendTrend = (today, yesterday) => {
    const t = Number(today || 0);
    const y = Number(yesterday || 0);
    if (t > y) return { icon: <RiseOutlined />, color: '#cf1322' };
    if (t < y) return { icon: <FallOutlined />, color: '#389e0d' };
    return { icon: <MinusOutlined />, color: '#9ca3af' };
};

const AccountLimit = () => {
    const [loading, setLoading] = useState(false);
    const [accountLimit, setAccountLimit] = useState([]);
    const [cachedUntil, setCachedUntil] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [spentSortOrder, setSpentSortOrder] = useState(null);

    const getAccountLimit = async () => {
        try {
            setLoading(true);
            const res = await getDatas('/admin/meta/account-limits');
            if (res?.success) {
                setAccountLimit(normalizeAccountLimits(res.result));
                setCachedUntil(res.result?.cached_until || null);
            }
        } catch (error) {
            console.error('Error fetching account limits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAccountLimit();
    }, []);

    const filteredData = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) return accountLimit;
        return accountLimit.filter(item =>
            item.account?.toLowerCase().includes(query) ||
            item.account_id?.toLowerCase().includes(query) ||
            item.status?.toLowerCase().includes(query)
        );
    }, [accountLimit, searchText]);

    const stats = useMemo(() => {
        const activeCount = accountLimit.filter(a => a.status === 'ACTIVE').length;
        const unsettledCount = accountLimit.filter(a => a.status === 'UNSETTLED').length;
        const usdAccounts = accountLimit.filter(a => a.budget?.currency === 'USD');
        const todayUsd = usdAccounts.reduce((sum, a) => sum + Number(a.today || 0), 0);
        const balanceUsd = usdAccounts.reduce((sum, a) => sum + Number(a.budget?.balance || 0), 0);
        const spentUsd = usdAccounts.reduce((sum, a) => sum + Number(a.budget?.spent || 0), 0);

        return {
            totalAccounts: accountLimit.length,
            activeCount,
            unsettledCount,
            todayUsd,
            balanceUsd,
            spentUsd,
        };
    }, [accountLimit]);

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleTableChange = (_pagination, _filters, sorter) => {
        const active = Array.isArray(sorter) ? sorter[0] : sorter;
        if (active?.columnKey === 'spent') {
            setSpentSortOrder(active.order ?? null);
        } else {
            setSpentSortOrder(null);
        }
    };

    const getSelectedData = () => {
        if (selectedRowKeys.length > 0) {
            return accountLimit.filter(item => selectedRowKeys.includes(item.account_id));
        }
        return accountLimit;
    };

    const exportRow = (item) => ({
        'Account ID'     : item.account_id,
        'Account'        : item.account,
        'Status'         : item.status,
        'Today Spend'    : item.today,
        'Yesterday Spend': item.yesterday,
        'Limit'          : item.budget?.limit,
        'Balance'        : item.budget?.balance,
        'Spent'          : item.budget?.spent,
        'Remaining'      : item.budget?.remaining,
        'Currency'       : item.budget?.currency,
        'Days Left'      : item.days_left ?? '',
        'Last Updated'   : item.last_updated,
    });

    const handleDownloadExcel = () => {
        const dataToExport = getSelectedData().map(exportRow);
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Limits');
        XLSX.writeFile(workbook, 'AccountLimits.xlsx');
    };

    const handleDownloadCSV = () => {
        const dataToExport = getSelectedData();
        const headers = Object.keys(exportRow(dataToExport[0] || {}));
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(item =>
                headers.map(header => {
                    const val = exportRow(item)[header];
                    return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
                }).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'AccountLimits.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const dataToPrint = getSelectedData();
        const printWindow = window.open('', '_blank');

        const html = `
            <html>
                <head>
                    <title>Account Limits Report</title>
                    <style>
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background-color: #f2f2f2; }
                        h2 { text-align: center; }
                    </style>
                </head>
                <body>
                    <h2>Account Expenditure Limits</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Status</th>
                                <th>Today</th>
                                <th>Yesterday</th>
                                <th>Balance</th>
                                <th>Spent</th>
                                <th>Limit</th>
                                <th>Currency</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dataToPrint.map(item => `
                                <tr>
                                    <td>${item.account}</td>
                                    <td>${item.status}</td>
                                    <td>${item.today}</td>
                                    <td>${item.yesterday}</td>
                                    <td>${item.budget?.balance ?? 0}</td>
                                    <td>${item.budget?.spent ?? 0}</td>
                                    <td>${item.budget?.limit ?? 0}</td>
                                    <td>${item.budget?.currency ?? ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const downloadMenu = {
        items: [
            { key: 'excel', label: 'Download Excel', icon: <FileExcelOutlined /> },
            { key: 'csv', label: 'Download CSV', icon: <FileTextOutlined /> },
            { key: 'print', label: 'Print', icon: <PrinterOutlined /> },
        ],
        onClick: ({ key }) => {
            if (key === 'excel') handleDownloadExcel();
            if (key === 'csv') handleDownloadCSV();
            if (key === 'print') handlePrint();
        },
    };

    const columns = [
        {
            title: 'ACCOUNT',
            key: 'account',
            width: 260,
            fixed: 'left',
            render: (_, record) => (
                <div style={{ minWidth: 0 }}>
                    <Text strong style={{ fontSize: '13px', color: '#111827', display: 'block' }}>
                        {record.account?.trim() || '—'}
                    </Text>
                    <Tooltip title={record.account_id}>
                        <Text type="secondary" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            {record.account_id?.replace('act_', '') || '—'}
                        </Text>
                    </Tooltip>
                </div>
            ),
            sorter: (a, b) => (a.account || '').localeCompare(b.account || ''),
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status) => getStatusTag(status),
            filters: [
                { text: 'Active', value: 'ACTIVE' },
                { text: 'Unsettled', value: 'UNSETTLED' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'TODAY',
            key: 'today',
            width: 120,
            align: 'right',
            sorter: (a, b) => Number(a.today || 0) - Number(b.today || 0),
            render: (_, record) => {
                const currency = record.budget?.currency || 'USD';
                const trend = getSpendTrend(record.today, record.yesterday);
                return (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>
                            {formatMoney(record.today, currency)}
                        </div>
                        <span style={{ fontSize: '11px', color: trend.color }}>
                            {trend.icon}
                        </span>
                    </div>
                );
            },
        },
        {
            title: 'YESTERDAY',
            key: 'yesterday',
            width: 120,
            align: 'right',
            sorter: (a, b) => Number(a.yesterday || 0) - Number(b.yesterday || 0),
            render: (_, record) => (
                <Text style={{ fontSize: '13px', color: '#6b7280' }}>
                    {formatMoney(record.yesterday, record.budget?.currency)}
                </Text>
            ),
        },
        {
            title: 'BALANCE',
            key: 'balance',
            width: 120,
            align: 'right',
            sorter: (a, b) => Number(a.budget?.balance || 0) - Number(b.budget?.balance || 0),
            render: (_, record) => (
                <Text strong style={{ fontSize: '13px', color: '#1677ff' }}>
                    {formatMoney(record.budget?.balance, record.budget?.currency)}
                </Text>
            ),
        },
        {
            title: 'SPENT',
            key: 'spent',
            width: 120,
            align: 'right',
            sortDirections: ['descend', 'ascend'],
            sorter: (a, b) => Number(a.budget?.spent || 0) - Number(b.budget?.spent || 0),
            sortOrder: spentSortOrder,
            render: (_, record) => (
                <Text style={{ fontSize: '13px', color: '#374151' }}>
                    {formatMoney(record.budget?.spent, record.budget?.currency)}
                </Text>
            ),
        },
        {
            title: 'LIMIT & USAGE',
            key: 'budget',
            width: 220,
            render: (_, record) => {
                const limit = Number(record.budget?.limit || 0);
                const balance = Number(record.budget?.balance || 0);
                const remaining = Number(record.budget?.remaining || 0);
                const currency = record.budget?.currency || 'USD';

                if (limit <= 0) {
                    return (
                        <div className="budget-balance-info">
                            <Text type="secondary" style={{ fontSize: '11px', fontWeight: 600 }}>
                                No spending limit
                            </Text>
                            {remaining > 0 && (
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: 4 }}>
                                    Remaining: {formatMoney(remaining, currency)}
                                </div>
                            )}
                        </div>
                    );
                }

                const usedPercent = Math.min(100, Math.round(((limit - remaining) / limit) * 100));

                return (
                    <div className="budget-balance-info">
                        <div className="limit-balance">
                            <span>Limit: {formatMoney(limit, currency)}</span>
                            <span>Left: {formatMoney(remaining, currency)}</span>
                        </div>
                        <Progress
                            percent={usedPercent}
                            showInfo={false}
                            strokeColor={usedPercent >= 90 ? '#cf1322' : '#1677ff'}
                            size="small"
                            className="budget-progress"
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            Balance: {formatMoney(balance, currency)}
                        </Text>
                    </div>
                );
            },
        },
        {
            title: 'DAYS LEFT',
            key: 'days_left',
            width: 100,
            align: 'center',
            render: (_, record) => {
                if (record.days_left != null) {
                    return (
                        <Tag color={record.days_left <= 3 ? 'red' : record.days_left <= 7 ? 'orange' : 'blue'}>
                            {record.days_left}d
                        </Tag>
                    );
                }
                const today = Number(record.today || 0);
                const balance = Number(record.budget?.balance || 0);
                if (today > 0 && balance > 0) {
                    const est = Math.floor(balance / today);
                    return (
                        <Tooltip title="Estimated from balance ÷ today spend">
                            <Text type="secondary" style={{ fontSize: '12px' }}>~{est}d</Text>
                        </Tooltip>
                    );
                }
                return <Text type="secondary">—</Text>;
            },
        },
        {
            title: 'LAST UPDATED',
            dataIndex: 'last_updated',
            key: 'last_updated',
            width: 160,
            render: (text) => (
                <Text className="last-updated-text">{text || '—'}</Text>
            ),
        },
    ];

    return (
        <div className="account-limit-container" style={{ padding:10 }}>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small" className="al-stat-card">
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <BankOutlined /> Accounts
                        </Text>
                        <div className="al-stat-value">{stats.totalAccounts}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small" className="al-stat-card al-stat-active">
                        <Text type="secondary" style={{ fontSize: '12px' }}>Active</Text>
                        <div className="al-stat-value">{stats.activeCount}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small" className="al-stat-card al-stat-warning">
                        <Text type="secondary" style={{ fontSize: '12px' }}>Unsettled</Text>
                        <div className="al-stat-value">{stats.unsettledCount}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small" className="al-stat-card">
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <DollarOutlined /> Today (USD)
                        </Text>
                        <div className="al-stat-value">{formatMoney(stats.todayUsd, 'USD')}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small" className="al-stat-card">
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <WalletOutlined /> Balance (USD)
                        </Text>
                        <div className="al-stat-value">{formatMoney(stats.balanceUsd, 'USD')}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small" className="al-stat-card">
                        <Text type="secondary" style={{ fontSize: '12px' }}>Lifetime Spent (USD)</Text>
                        <div className="al-stat-value">{formatMoney(stats.spentUsd, 'USD')}</div>
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="account-limit-card">
                <Row justify="space-between" align="middle" className="table-actions" gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                        <Input
                            placeholder="Search account name or ID..."
                            prefix={<SearchOutlined />}
                            className="table-search"
                            allowClear
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col>
                        <Space>
                            {cachedUntil && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Cached until {cachedUntil}
                                </Text>
                            )}
                            <Button icon={<ReloadOutlined />} onClick={getAccountLimit} loading={loading}>
                                Refresh
                            </Button>
                            <Dropdown menu={downloadMenu}>
                                <Button icon={<DownloadOutlined />} className="download-btn">
                                    Export
                                </Button>
                            </Dropdown>
                        </Space>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    onChange={handleTableChange}
                    showSorterTooltip={{ target: 'sorter-icon' }}
                    pagination={{
                        total: filteredData.length,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        defaultPageSize: 10,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} accounts`,
                        position: ['bottomRight'],
                        className: 'custom-pagination',
                    }}
                    scroll={{ x: 1200 }}
                    className="account-limit-table account-limit-table-premium"
                    rowSelection={rowSelection}
                    rowKey="account_id"
                    footer={() => (
                        <div className="table-footer-info">
                            {selectedRowKeys.length} of {filteredData.length} row(s) selected.
                        </div>
                    )}
                />
            </Card>
        </div>
    );
};

export default AccountLimit;
