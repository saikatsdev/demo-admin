import { useState, useEffect } from 'react';
import { Table, Card, Typography, Switch, Space, Breadcrumb, Row, Col, Alert, message, Tag } from 'antd';
import { FacebookFilled } from '@ant-design/icons';
import { getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import dayjs from 'dayjs';
import 'dayjs/locale/en';

dayjs.locale('en');

const { Title, Text } = Typography;

const MetaAdAccount = () => {
    // Hook
    useTitle("Meta Ad Account");

    // State
    const [accounts, setAccounts]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    // API
    const getAccounts = async () => {
        try {
            setLoading(true);
            const res = await getDatas('/admin/meta');
            if (res && res.success) {
                setAccounts(res.result || []);
            }
        } catch (err) {
            console.error('Error fetching Meta ad accounts:', err);
            setError('Failed to fetch ad accounts.');
        } finally {
            setLoading(false);
        }
    }

    const [updatingId, setUpdatingId] = useState(null);

    const toggleStatus = async (id, currentStatus) => {
        try {
            setUpdatingId(id);
            const newStatus = currentStatus === "1" ? "0" : "1";
            const res = await postData('/admin/meta/account/status-update', { id, status: newStatus });
            
            if (res && res.success) {
                message.success(res.msg || 'Status updated successfully');
                setAccounts(prev => prev.map(acc => 
                    acc.id === id ? { ...acc, status: newStatus } : acc
                ));
            } else {
                message.error(res?.msg || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            message.error('An error occurred. Please try again.');
        } finally {
            setUpdatingId(null);
        }
    }

    useEffect(() => {
        getAccounts();
    }, []);

    const columns = 
    [
        {
            title: 'SL',
            key: 'sl',
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 70,
        },
        {
            title: 'Account Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <FacebookFilled style={{ color: '#1877F2' }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Ad Account ID',
            dataIndex: 'ad_account_id',
            key: 'ad_account_id',
            render: (text) => <Text code>{text}</Text>,
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => dayjs(text).format('DD MMM YYYY, hh:mm A'),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === "1" ? "success" : "error"}>
                    {status === "1" ? "ACTIVE" : "INACTIVE"}
                </Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Switch checked={record.status === "1"} onChange={() => toggleStatus(record.id, record.status)} loading={updatingId === record.id} />
            ),
        },
    ];

    return (
        <div className="meta-ads-page" style={{ padding: '24px' }}>
            <div className="page-header-wrapper" style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} lg={12}>
                        <Breadcrumb items={[{ title: 'Dashboard' }, { title: 'Meta Ads' }, { title: 'Ad Accounts' }]} />
                        <div style={{ marginTop: '8px' }}>
                            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FacebookFilled style={{ color: '#1877F2' }} />
                                Meta Ad Accounts
                            </Title>
                        </div>
                    </Col>
                </Row>
            </div>

            {error && (
                <Alert message="Error" description={error} type="error" showIcon closable style={{ marginBottom: '24px', borderRadius: '12px' }} />
            )}

            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <Table
                    columns={columns}
                    dataSource={accounts}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        onChange: (page, pageSize) => {
                            setPagination({ current: page, pageSize });
                        },
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} accounts`,
                    }}
                />
            </Card>
        </div>
    );
};

export default MetaAdAccount;