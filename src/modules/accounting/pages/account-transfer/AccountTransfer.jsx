import {DeleteOutlined,EditOutlined,EyeOutlined,PlusOutlined,ReloadOutlined,RollbackOutlined,SearchOutlined} from "@ant-design/icons";
import {Alert,Breadcrumb,Button,Card,Col,DatePicker,Input,message,Popconfirm,Result,Row,Segmented,Select,Space,Statistic,Table,Tag,Tooltip,Typography} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getAccountList } from "../../api/accountApi";
import {deleteAccountTransfer,getAccountTransfer,permanentlyDeleteAccountTransfer,restoreAccountTransfer} from "../../api/accountTransferApi";
import AccountTransferDetails from "../../components/account-transfer/AccountTransferDetails";
import useAccountTransfers from "../../hooks/useAccountTransfers";
import "../../styles/account-transfer.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

const statusColor = {
    posted   : "green",
    draft    : "gold",
    cancelled: "default",
};

export default function AccountTransfer() {
    useTitle("Account Transfers | Accounting");

    const { can }                                                         = usePermission();
    const navigate                                                        = useNavigate();
    const canRead                                                         = can("account-transfers-read");
    const canCreate                                                       = can("account-transfers-create");
    const canUpdate                                                       = can("account-transfers-update");
    const canDelete                                                       = can("account-transfers-delete");
    const {rows,total,summary,loading,error,filters,changeFilters,reload} = useAccountTransfers(canRead);
    const [messageApi, contextHolder]                                     = message.useMessage();
    const [query, setQuery]                                               = useState("");
    const [accounts, setAccounts]                                         = useState([]);
    const [details, setDetails]                                           = useState(null);
    const [busyId, setBusyId]                                             = useState(null);
    const actionPending                                                   = useRef(false);
    const { trashed }                                                     = filters;

    useEffect(() => {
        if (canRead) {
            getAccountList().then((response) => {
                if (response?.success) {
                    setAccounts(response.result || []);
                }
            });
        }
    }, [canRead]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (query.trim() !== filters.search_key) {
                changeFilters({ search_key: query.trim() });
            }
        }, 400);

        return () => window.clearTimeout(timer);
    }, [changeFilters, filters.search_key, query]);

    const dateValue = useMemo(
        () =>
            filters.date_from && filters.date_to
                ? [
                    dayjs(filters.date_from),
                    dayjs(filters.date_to),
                ]
                : null,
        [filters.date_from, filters.date_to]
    );

    const openRecord = async (record) => {
        if (actionPending.current || !canRead) return;

        if (trashed) {
            setDetails(record);
            return;
        }

        actionPending.current = true;
        setBusyId(record.id);

        try {
            const response = await getAccountTransfer(record.id);

            if (!response?.success) {
                messageApi.error(errorMessage(response, "Unable to load transfer"));
                return;
            }

            setDetails(response.result);
        } catch {
            messageApi.error("Unable to load transfer");
        } finally {
            setBusyId(null);
            actionPending.current = false;
        }
    };

    const handleAction = async (record, action) => {
        if (actionPending.current || (action === "restore" ? !canUpdate : !canDelete)) {
            return;
        }

        actionPending.current = true;
        setBusyId(record.id);

        try {
            const operation = action === "restore" ? restoreAccountTransfer : action === "permanent" ? permanentlyDeleteAccountTransfer : deleteAccountTransfer;

            const response = await operation(record.id);

            if (!response?.success) {
                messageApi.error(errorMessage(response, "Unable to complete this action"));
                return;
            }

            messageApi.success(response.msg || "Account transfer updated");

            await reload();
        } catch {
            messageApi.error("Unable to complete this action. Please try again.");
        } finally {
            setBusyId(null);
            actionPending.current = false;
        }
    };

    const columns = 
    [
        {
            title: "SL",
            key: "serial",
            width: 64,
            align: "center",
            render: (_, __, index) =>
                (filters.page - 1) * filters.paginate_size + index + 1,
        },
        {
            title: "Transfer",
            key: "transfer",
            width: 180,
            render: (_, record) => (
                <div className="transfer-identity">
                    <Button type="link" onClick={() => openRecord(record)}>
                        {record.transfer_no}
                    </Button>

                    {record.transaction_reference && (
                        <Text type="secondary">
                            {record.transaction_reference}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: "Date",
            dataIndex: "transfer_date",
            width: 140,
            render: (value) =>
                value ? dayjs(value).format("DD MMM YYYY") : "-",
        },
        {
            title: "From",
            key: "from",
            width: 180,
            render: (_, record) => (
                <div className="transfer-account-cell">
                    <strong>
                        {record.from_account?.name || "-"}
                    </strong>

                    <Text type="secondary">
                        {record.from_account?.code || ""}
                    </Text>
                </div>
            ),
        },
        {
            title: "To",
            key: "to",
            width: 180,
            render: (_, record) => (
                <div className="transfer-account-cell">
                    <strong>
                        {record.to_account?.name || "-"}
                    </strong>

                    <Text type="secondary">
                        {record.to_account?.code || ""}
                    </Text>
                </div>
            ),
        },
        {
            title: "Amount",
            dataIndex: "amount",
            width: 150,
            align: "right",
            render: (value) => (
                <strong className="transfer-amount">
                    {money(value)}
                </strong>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 110,
            render: (value) => (
                <Tag color={statusColor[value] || "default"} style={{textTransform: "capitalize"}}>
                    {value}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 135,
            render: (_, record) => (
                <Space size={2}>
                    <Tooltip title="View transfer">
                        <Button type="text" icon={<EyeOutlined />} loading={busyId === record.id} onClick={() => openRecord(record)}/>
                    </Tooltip>

                    {!trashed && canUpdate && (
                        <Tooltip title="Edit transfer">
                            <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/account-transfers/${record.id}/edit`)}/>
                        </Tooltip>
                    )}

                    {trashed && canUpdate && (
                        <Popconfirm
                            title="Restore this transfer?"
                            description={
                                record.status === "posted"
                                    ? "The amount will be transferred again."
                                    : undefined
                            }
                            onConfirm={() =>
                                handleAction(record, "restore")
                            }
                        >
                            <Button type="text" icon={<RollbackOutlined />}/>
                        </Popconfirm>
                    )}

                    {canDelete && (
                        <Popconfirm
                            title={trashed ? "Permanently delete this transfer?" : "Move this transfer to trash?"}
                            description={trashed ? "This action cannot be undone." : record.status === "posted" ? "The posted transfer will be reversed first." : undefined}
                            okButtonProps={{ danger: true }}
                            onConfirm={() =>
                                handleAction(record, trashed ? "permanent" : "delete")
                            }
                        >
                            <Button type="text" danger icon={<DeleteOutlined />}/>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    if (!canRead) {
        return (
            <Result status="403" title="Account transfer access required"/>
        );
    }

    return (
        <div className="transfer-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Account Transfers</h1>

                    <p className="transfer-subtitle">
                        Move funds between internal accounts with a complete accounting trail.
                    </p>
                </div>

                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            {
                                title: <Link to="/dashboard">Dashboard</Link>,
                            },
                            {
                                title: "Accounting",
                            },
                            {
                                title: "Account Transfers",
                            },
                        ]}
                    />
                </div>
            </div>

            {!trashed && (
                <Row gutter={[16, 16]} className="transfer-summary-row">
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="transfer-summary-card transfer-total-card">
                            <Statistic
                                title="Total posted transfer"
                                value={Number(summary.total_transferred || 0)}
                                precision={2}
                                prefix="৳"
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className="transfer-summary-card">
                            <Statistic title="Posted" value={Number(summary.posted_count || 0)}/>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className="transfer-summary-card">
                            <Statistic title="Draft" value={Number(summary.draft_count || 0)}/>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card className="transfer-summary-card">
                            <Statistic title="Cancelled" value={Number(summary.cancelled_count || 0)}/>
                        </Card>
                    </Col>
                </Row>
            )}

            <Card className="transfer-directory" styles={{ body: { padding: 0 } }}>
                <div className="transfer-directory-header">
                    <div>
                        <Text strong className="transfer-directory-title">
                            Transfer Register
                        </Text>

                        <div>
                            <Text type="secondary">
                                {total} {trashed ? "trashed " : ""}Transfer
                                {total === 1 ? "" : "s"}
                            </Text>
                        </div>
                    </div>

                    {canCreate && !trashed && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/account-transfers/create")}>
                            New Transfer
                        </Button>
                    )}
                </div>

                <div className="transfer-toolbar">
                    <div className="transfer-filter-group">
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search transfer no., account or reference"
                            className="transfer-search"
                        />

                        <RangePicker
                            value={dateValue}
                            format="DD MMM YYYY"
                            onChange={(dates) =>
                                changeFilters({
                                    date_from: dates?.[0]?.format("YYYY-MM-DD"),
                                    date_to: dates?.[1]?.format("YYYY-MM-DD"),
                                })
                            }
                        />

                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={filters.account_id}
                            onChange={(account_id) =>
                                changeFilters({ account_id })
                            }
                            placeholder="All accounts"
                            className="transfer-account-filter"
                            options={accounts.map((account) => ({
                                value: account.id,
                                label: `${account.name} (${account.code})`,
                            }))}
                        />

                        <Select
                            allowClear
                            value={filters.status}
                            onChange={(status) =>
                                changeFilters({ status })
                            }
                            placeholder="All status"
                            className="transfer-status-filter"
                            options={[
                                {
                                    value: "posted",
                                    label: "Posted",
                                },
                                {
                                    value: "draft",
                                    label: "Draft",
                                },
                                {
                                    value: "cancelled",
                                    label: "Cancelled",
                                },
                            ]}
                        />

                        <Button icon={<ReloadOutlined />} onClick={() => reload()}/>
                    </div>

                    <Segmented
                        value={trashed ? "trash" : "active"}
                        onChange={(value) =>
                            changeFilters({ trashed: value === "trash" })
                        }
                        options={[
                            {
                                label: "Active",
                                value: "active",
                            },
                            {
                                label: "Trash",
                                value: "trash",
                            },
                        ]}
                    />
                </div>

                {error && (
                    <Alert type="error" showIcon message={error} className="transfer-list-alert"/>
                )}

                <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={rows}
                    scroll={{ x: 1120 }}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.paginate_size,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 25, 50, 100],
                        onChange: (page, paginate_size) =>
                            changeFilters({ page, paginate_size }),
                        showTotal: (value) => `${value} transfers`,
                    }}
                />
            </Card>

            <AccountTransferDetails
                transfer={details}
                open={Boolean(details)}
                onClose={() => setDetails(null)}
            />
        </div>
    );
}