import { useEffect, useState } from 'react';
import { Table, Input, Button, Row, Col, Card, Dropdown, Typography, Select, Space, Modal } from 'antd';
import { DownloadOutlined, SearchOutlined, DeleteOutlined, FileExcelOutlined, FileTextOutlined, PrinterOutlined, FacebookFilled } from '@ant-design/icons';
import { getDatas } from '../../../api/common/common';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import 'dayjs/locale/en';

dayjs.locale('en');

const { Title, Text } = Typography;
const { Option } = Select;

const AccountExpense = ({ accounts }) => {
    // State
    const [searchText, setSearchText] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [accountExpense, setAccountExpense] = useState([]);

    const currentDate = dayjs().format('MMM D');
    const currentYear = dayjs().format('YYYY');

    const getAccountExpense = async () => {
        try {
            setLoading(true);
            const res = await getDatas('/admin/meta/account-expenses');
            if (res && res?.success) {
                setAccountExpense(res.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAccountExpense();
    }, []);

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this record?',
            content: `Date: ${record.date}, Account: ${record.account}`,
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
                setAccountExpense(prev => prev.filter(item => 
                    !(item.date === record.date && item.account === record.account)
                ));
            },
        });
    };

    const getSelectedData = () => {
        if (selectedRowKeys.length > 0) {
            return accountExpense.filter((_, index) => selectedRowKeys.includes(index));
        }
        return accountExpense;
    };

    const handleDownloadExcel = () => {
        const dataToExport = getSelectedData().map(item => ({
            'Date'   : item.date,
            'Account': item.account,
            'USD'    : item.usd,
            'Rate'   : item.rate,
            'BDT'    : item.bdt
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
        XLSX.writeFile(workbook, "MetaAdsExpenses.xlsx");
    };

    const handleDownloadCSV = () => {
        const dataToExport = getSelectedData();
        const headers = ['Date', 'Account', 'USD', 'Rate', 'BDT'];
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(item => [
                `"${item.date}"`,
                `"${item.account}"`,
                item.usd,
                item.rate,
                item.bdt
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'MetaAdsExpenses.csv');
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
                    <title>Meta Ads Expenses Report</title>
                    <style>
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h2>Meta Ads Expenses</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Account</th>
                                <th>USD</th>
                                <th>Rate</th>
                                <th>BDT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dataToPrint.map(item => `
                                <tr>
                                    <td>${item.date}</td>
                                    <td>${item.account}</td>
                                    <td>${item.usd}</td>
                                    <td>${item.rate}</td>
                                    <td>${item.bdt}</td>
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
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    };

    const downloadMenu = 
    {
        items: [
            { 
                key: 'excel', 
                label: 'Download Excel', 
                icon: <FileExcelOutlined /> 
            },
            { 
                key: 'csv', 
                label: 'Download CSV', 
                icon: <FileTextOutlined /> 
            },
            { 
                key: 'print', 
                label: 'Print', 
                icon: <PrinterOutlined /> 
            },
        ],
        onClick: ({ key }) => {
            if (key === 'excel') handleDownloadExcel();
            if (key === 'csv') handleDownloadCSV();
            if (key === 'print') handlePrint();
        },
    };

    const columns = 
    [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            sorter: (a, b) => new Date(a.date) - new Date(b.date),
        },
        {
            title: 'Account',
            dataIndex: 'account',
            key: 'account',
            sorter: (a, b) => a.account.localeCompare(b.account),
        },
        {
            title: 'USD',
            dataIndex: 'usd',
            key: 'usd',
            render: (text) => <Text strong>${text}</Text>,
            sorter: (a, b) => a.usd - b.usd,
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rate',
            sorter: (a, b) => a.rate - b.rate,
        },
        {
            title: 'BDT',
            dataIndex: 'bdt',
            key: 'bdt',
            render: (text) => <Text strong>{Number(text).toLocaleString()} BDT</Text>,
            sorter: (a, b) => a.bdt - b.bdt,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
            ),
        },
    ];

    const filteredData = accountExpense.filter(item => 
        item.account?.toLowerCase().includes(searchText.toLowerCase())
    );

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    return (
        <div className="account-expense-container">
            <Card bordered={false} className="expense-card">
                <div className="expense-header">
                    <div className="header-left">
                        <Title level={4} style={{ margin: 0 }}>Meta Ads Expenses</Title>
                        <Text type="secondary">{currentDate} - {currentDate}, {currentYear}</Text>
                    </div>
                    <div className="header-right">
                        <Select defaultValue="all" style={{ width: 230 }} className="account-select">
                            <Option value="all">All Accounts</Option>
                            {accounts?.map(acc => (
                                <Option key={acc.ad_account_id} value={acc.ad_account_id}>
                                    <Space>
                                        <FacebookFilled style={{ color: '#1877F2' }} />
                                        {acc.name}
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>

                <Row justify="space-between" align="middle" className="table-actions-row">
                    <Col span={12}>
                        <Input placeholder="Search..." prefix={<SearchOutlined />} className="table-search" onChange={(e) => setSearchText(e.target.value)} />
                    </Col>
                    <Col>
                        <Dropdown menu={downloadMenu}>
                            <Button icon={<DownloadOutlined />} className="download-btn">
                                Download
                            </Button>
                        </Dropdown>
                    </Col>
                </Row>

                <Table columns={columns} dataSource={filteredData} loading={loading} rowSelection={{
                        selectedRowKeys,
                        onChange: onSelectChange,
                    }}
                    rowKey={(record, index) => index}
                    pagination={{
                        total: filteredData.length,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        position: ['bottomRight'],
                        className: 'custom-pagination',
                    }}
                    className="account-expense-table"
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

export default AccountExpense;