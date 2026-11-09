import { Table, Tag, Typography, Tooltip } from 'antd';
import { useMemo, useState } from 'react';

const { Text } = Typography;

const formatBDT = (value) => {
    const n = Number(value || 0);
    return `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`;
};

const formatAdCost = (value, currency = 'USD') => {
    const n = Number(value || 0);

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return `${currency || ''} ${n.toFixed(2)}`.trim();
    }
};

const CampaignActualTable = ({ campaigns, loading, pagination, setPagination }) => {
    const [spendSortOrder, setSpendSortOrder] = useState(null);

    const data = useMemo(
        () => (Array.isArray(campaigns) ? campaigns : []).map(item => ({
            ...item,
            key: item.campaign_id,
        })),
        [campaigns],
    );

    const sortedData = useMemo(() => {
        if (!spendSortOrder) return data;

        const dir = spendSortOrder === 'ascend' ? 1 : -1;
        return [...data].sort(
            (a, b) => dir * (Number(a.spend || 0) - Number(b.spend || 0)),
        );
    }, [data, spendSortOrder]);

    const columns = [
        {
            title: 'CAMPAIGN',
            key: 'campaign',
            width: 300,
            fixed: 'left',
            render: (_, record) => (
                <div>
                    <Text strong style={{ display: 'block' }}>
                        {record.campaign_name || `Campaign · ${String(record.campaign_id || '').slice(-8)}`}
                    </Text>
                    <Tooltip title={record.campaign_id}>
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            {record.campaign_id || '-'}
                        </Text>
                    </Tooltip>
                    {record.ad_account_name && (
                        <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                            {record.ad_account_name}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: 'AD SPEND',
            dataIndex: 'spend',
            key: 'spend',
            width: 120,
            align: 'right',
            sorter: true,
            sortOrder: spendSortOrder,
            render: (_, record) => formatAdCost(record.spend, record.currency),
        },
        {
            title: 'ORDERS',
            dataIndex: 'orders',
            key: 'orders',
            width: 90,
            align: 'right',
            render: v => Number(v || 0).toLocaleString(),
        },
        {
            title: 'DELIVERED',
            dataIndex: 'done',
            key: 'done',
            width: 100,
            align: 'right',
            render: v => <Tag color="success">{Number(v || 0).toLocaleString()}</Tag>,
        },
        {
            title: 'ACTIVE',
            dataIndex: 'active',
            key: 'active',
            width: 90,
            align: 'right',
            render: v => <Tag color="processing">{Number(v || 0).toLocaleString()}</Tag>,
        },
        {
            title: 'CANCEL / RETURN',
            dataIndex: 'cancel',
            key: 'cancel',
            width: 130,
            align: 'right',
            render: v => <Tag color="error">{Number(v || 0).toLocaleString()}</Tag>,
        },
        {
            title: 'CANCEL %',
            dataIndex: 'cancel_percent',
            key: 'cancel_percent',
            width: 100,
            align: 'right',
            render: v => `${Number(v || 0).toFixed(2)}%`,
        },
        {
            title: 'REVENUE',
            dataIndex: 'revenue',
            key: 'revenue',
            width: 130,
            align: 'right',
            render: formatBDT,
        },
        {
            title: 'AOV',
            dataIndex: 'aov',
            key: 'aov',
            width: 110,
            align: 'right',
            render: formatBDT,
        },
        {
            title: 'CPO',
            dataIndex: 'cost_per_order',
            key: 'cost_per_order',
            width: 110,
            align: 'right',
            render: (_, record) => formatAdCost(record.cost_per_order, record.currency),
        },
        {
            title: 'DELIVERED CPO',
            dataIndex: 'cost_per_delivered_order',
            key: 'cost_per_delivered_order',
            width: 140,
            align: 'right',
            render: (_, record) => formatAdCost(record.cost_per_delivered_order, record.currency),
        },
    ];

    const handleChange = (pag, _filters, sorter) => {
        setPagination?.(pag);
        const active = Array.isArray(sorter) ? sorter[0] : sorter;
        setSpendSortOrder(active?.columnKey === 'spend' ? active.order ?? null : null);
    };

    return (
        <Table
            columns={columns}
            dataSource={sortedData}
            rowKey="campaign_id"
            loading={loading}
            pagination={pagination}
            onChange={handleChange}
            scroll={{ x: 1400 }}
        />
    );
};

export default CampaignActualTable;
