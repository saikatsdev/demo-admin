import React, { useEffect, useState } from 'react';
import { Table, Tag, Progress, Input, Button, Space, Typography, Row, Col, Card, Dropdown } from 'antd';
import { DownloadOutlined, SearchOutlined, FileExcelOutlined, FileTextOutlined, PrinterOutlined } from '@ant-design/icons';
import { getDatas } from '../../../api/common/common';
import * as XLSX from 'xlsx';

const { Text } = Typography;

const AccountLimit = () => {
    // State
    const [loading, setLoading]                 = useState(false);
    const [accountLimit, setAccountLimit]       = useState([]);
    const [searchText, setSearchText]           = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const getAccountLimit = async () => {
        try {
            setLoading(true);
            const res = await getDatas('/admin/meta/account-limits');
            if (res && res?.success) {
                setAccountLimit(res.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAccountLimit();
    }, []);

    // Selection logic
    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const getSelectedData = () => {
        if (selectedRowKeys.length > 0) {
            return accountLimit.filter(item => selectedRowKeys.includes(item.account));
        }
        return accountLimit;
    };

    const handleDownloadExcel = () => {
        const dataToExport = getSelectedData().map(item => ({
            'Account'        : item.account,
            'Status'         : item.status,
            'Today Spend'    : item.today,
            'Yesterday Spend': item.yesterday,
            'Limit'          : item.budget?.limit,
            'Balance'        : item.budget?.balance,
            'Currency'       : item.budget?.currency,
            'Days Left'      : item.days_left,
            'Last Updated'   : item.last_updated
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Account Limits");

        XLSX.writeFile(workbook, "AccountLimits.xlsx");
    };

    const handleDownloadCSV = () => {
        const dataToExport = getSelectedData();
        const headers = ['Account', 'Status', 'Today Spend', 'Yesterday Spend', 'Limit', 'Balance', 'Currency', 'Days Left', 'Last Updated'];
        
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(item => [
                `"${item.account}"`,
                item.status,
                item.today,
                item.yesterday,
                item.budget?.limit,
                item.budget?.balance,
                item.budget?.currency,
                item.days_left,
                `"${item.last_updated}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');

        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);

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
                                <th>Limit</th>
                                <th>Balance</th>
                                <th>Currency</th>
                                <th>Days Left</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dataToPrint.map(item => `
                                <tr>
                                    <td>${item.account}</td>
                                    <td>${item.status}</td>
                                    <td>${item.today}</td>
                                    <td>${item.yesterday}</td>
                                    <td>${item.budget?.limit}</td>
                                    <td>${item.budget?.balance}</td>
                                    <td>${item.budget?.currency}</td>
                                    <td>${item.days_left || 'N/A'}</td>
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

    const downloadMenu = 
    {
        items: [
            {
                key: 'excel',
                label: 'Download Excel',
                icon: <FileExcelOutlined />,
            },
            {
                key: 'csv',
                label: 'Download CSV',
                icon: <FileTextOutlined />,
            },
            {
                key: 'print',
                label: 'Print',
                icon: <PrinterOutlined />,
            },
        ],
        onClick: ({ key }) => {
            if (key === 'excel') handleDownloadExcel();
            if (key === 'csv') handleDownloadCSV();
            if (key === 'print') handlePrint();
        },
    };

    const columns = [
        {
            title: 'Account',
            dataIndex: 'account',
            key: 'account',
            render: (text) => <Text strong>{text}</Text>,
            sorter: (a, b) => a.account.localeCompare(b.account),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color="default" className="status-tag">
                    {status ? status.toUpperCase() : 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Today/Yesterday',
            key: 'spend',
            render: (_, record) => (
                <div className="spend-info">
                    <p><strong>Today: {record.budget?.currency === 'USD' ? '$' : record.budget?.currency + ' '}{record.today}</strong></p>
                    <p className="yesterday-spend">Yesterday: {record.budget?.currency === 'USD' ? '$' : record.budget?.currency + ' '}{record.yesterday}</p>
                </div>
            ),
        },
        {
            title: 'Budget & Balance',
            key: 'budget',
            render: (_, record) => {
                const limit = record.budget?.limit || 0;
                const balance = record.budget?.balance || 0;
                const currency = record.budget?.currency === 'USD' ? '$' : (record.budget?.currency || '') + ' ';
                
                let percent = 0;
                if (limit > 0) {
                    percent = Math.min(100, (balance / limit) * 100);
                } else if (balance > 0) {
                    percent = 100;
                }

                return (
                    <div className="budget-balance-info">
                        <div className="limit-balance">
                            <span>Limit: {currency}{limit}</span>
                            <span>Balance: {currency}{balance}</span>
                        </div>

                        <Progress percent={percent} showInfo={false} strokeColor="#e91e63" size="small" className="budget-progress"/>

                        <Text type="danger" className="days-left">
                            {record.days_left !== null && record.days_left !== undefined ? `${record.days_left} days left` : ''}
                        </Text>
                    </div>
                );
            },
        },
        {
            title: 'Last Updated',
            dataIndex: 'last_updated',
            key: 'last_updated',
            render: (text) => <Text className="last-updated-text">{text}</Text>,
        },
    ];

    const filteredData = accountLimit.filter(item => 
        item.account?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="account-limit-container">
            <Card bordered={false} className="account-limit-card">
                <Row justify="space-between" align="middle" className="table-actions">
                    <Col span={12}>
                        <Input placeholder="Search..." prefix={<SearchOutlined />} className="table-search" onChange={(e) => setSearchText(e.target.value)}/>
                    </Col>
                    <Col>
                        <Dropdown menu={downloadMenu}>
                            <Button icon={<DownloadOutlined />} className="download-btn">
                                Download
                            </Button>
                        </Dropdown>
                    </Col>
                </Row>

                <Table columns={columns} dataSource={filteredData} loading={loading} pagination={{
                        total          : filteredData.length,
                        showSizeChanger: true,
                        showTotal      : (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        position       : ['bottomRight'],
                        className      : 'custom-pagination',
                    }}
                    className="account-limit-table"
                    rowSelection={rowSelection}
                    rowKey={(record) => record.account}
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