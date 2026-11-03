import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, RollbackOutlined, SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { Alert, Avatar, Breadcrumb, Button, Card, Empty, Input, message, Popconfirm, Result, Segmented, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { deleteAccount, getAccount, permanentlyDeleteAccount, restoreAccount } from "../../api/accountApi";
import AccountDetails from "../../components/account/AccountDetails";
import { accountTypes } from "../../constants";
import useAccounts from "../../hooks/useAccounts";
import "../../styles/account.css";

const { Text }     = Typography;
const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;
const money        = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const typeLabel    = (value) => accountTypes.find((type) => type.value === value)?.label || value;

export default function Account() {
    useTitle("Accounts | Accounting");

    const { can }                                                         = usePermission();
    const navigate                                                        = useNavigate();
    const canRead                                                         = can("accounts-read");
    const canCreate                                                       = can("accounts-create");
    const canUpdate                                                       = can("accounts-update");
    const canDelete                                                       = can("accounts-delete");
    const { rows, total, loading, error, filters, changeFilters, reload } = useAccounts(canRead);
    const [messageApi, contextHolder]                                     = message.useMessage();
    const [query, setQuery]                                               = useState("");
    const [details, setDetails]                                           = useState(null);
    const [busyId, setBusyId]                                             = useState(null);
    const actionPending                                                   = useRef(false);
    const { trashed }                                                     = filters;

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (query.trim() !== filters.search_key) changeFilters({ search_key: query.trim() });
        }, 400);
        return () => window.clearTimeout(timer);
    }, [changeFilters, filters.search_key, query]);

    const openRecord = async (record) => {
        if (actionPending.current || !canRead) return;

        if (trashed) { 
            setDetails(record); return; 
        }

        actionPending.current = true;

        setBusyId(record.id);

        try {
            const response = await getAccount(record.id);

            if (!response?.success) { 
                messageApi.error(errorMessage(response, "Unable to load account")); 
                return; 
            }

            setDetails(response.result);
        } catch { 
            messageApi.error("Unable to load account"); 
        }finally { 
            setBusyId(null); actionPending.current = false; 
        }
    };

    const handleAction = async (record, action) => {
        if (actionPending.current || (action === "restore" ? !canUpdate : !canDelete)) return;

        actionPending.current = true;

        setBusyId(record.id);

        try {
            const operation = action === "restore" ? restoreAccount : action === "permanent" ? permanentlyDeleteAccount : deleteAccount;

            const response = await operation(record.id);

            if (!response?.success) { 
                messageApi.error(errorMessage(response, "Unable to complete this action")); 
                return; 
            }
            messageApi.success(response.msg || "Account updated");
            await reload();
        } catch { 
            messageApi.error("Unable to complete this action. Please try again."); 
        }finally { 
            setBusyId(null); actionPending.current = false; 
        }
    };

    const columns = [
        { 
            title: "SL", 
            key: "serial", 
            width: 68, 
            align: "center", 
            render: (_, __, index) => 
            <span className="account-serial">
                {(filters.page - 1) * filters.paginate_size + index + 1}
            </span> 
        },
        { 
            title: "Account", 
            key: "account", 
            width: 290, 
            render: (_, record) => 
            <Space size={12}>
                <Avatar shape="square" size={44} className="account-avatar" icon={<WalletOutlined />} />

                <div className="account-identity">
                    <Button type="link" className="account-name" onClick={() => openRecord(record)} disabled={busyId !== null}>
                        {record.name}
                    </Button>

                    <div>
                        <Tag bordered={false} className="account-code">
                            <strong>{record.code}</strong>
                        </Tag>
                    </div>
                </div>
            </Space> 
        },
        { 
            title: "Type", 
            dataIndex: "type", 
            key: "type", 
            width: 145, 
            render: (value) => 
            <Tag bordered={false} color="blue" className="account-type">
                {typeLabel(value)}
            </Tag> 
        },
        { 
            title: "Financial details", 
            key: "details", 
            width: 240, 
            render: (_, record) => 
            <div className="account-financial">
                <strong>
                    {record.bank_name || "No provider specified"}
                </strong>

                <Text type="secondary">
                    {record.account_number || record.account_holder_name || "No account details"}
                </Text>
            </div> 
        },
        { 
            title: "Opening balance", 
            dataIndex: "opening_balance", 
            key: "opening_balance", 
            align: "right", 
            width: 155, 
            render: (value) => 
            <Text className="account-opening">
                {money(value)}
            </Text> 
        },
        { 
            title: "Current balance", 
            dataIndex: "current_balance", 
            key: "current_balance", 
            align: "right", 
            width: 165, 
            render: (value) => 
            <strong className="account-balance">
                {money(value)}
            </strong> 
        },
        { 
            title: "Status", 
            dataIndex: "status", 
            key: "status", 
            width: 110, 
            render: (value) => 
            <Tag color={value === "active" ? "green" : value === "draft" ? "gold" : "default"} className="account-status">
                {value}
            </Tag> 
        },
        { 
            title: "Actions", 
            key: "actions", 
            fixed: "right", 
            width: 135, 
            render: (_, record) => 
            <Space size={2}>
                <Tooltip title="View account">
                    <Button type="text" aria-label={`View ${record.name}`} icon={<EyeOutlined />} loading={busyId === record.id} disabled={busyId !== null && busyId !== record.id} onClick={() => openRecord(record)} />
                </Tooltip>

                {!trashed && canUpdate && 
                    <Tooltip title="Edit account">
                        <Button type="text" aria-label={`Edit ${record.name}`} icon={<EditOutlined />} disabled={busyId !== null} onClick={() => navigate(`/accounts/${record.id}/edit`)} />
                    </Tooltip>
                }

                {trashed && canUpdate && 
                    <Popconfirm title="Restore this account?" okText="Restore" onConfirm={() => handleAction(record, "restore")}>
                        <Button type="text" aria-label={`Restore ${record.name}`} icon={<RollbackOutlined />} disabled={busyId !== null} />
                    </Popconfirm>
                }

                {canDelete && 
                    <Popconfirm title={trashed ? "Permanently delete this account?" : "Move this account to trash?"} description={trashed ? "Accounts with payment history cannot be deleted. This action cannot be undone." : "You can restore it from Trash."} okText={trashed ? "Delete permanently" : "Move to trash"} okButtonProps={{ danger: true }} onConfirm={() => handleAction(record, trashed ? "permanent" : "delete")}>
                        <Button type="text" danger aria-label={`Delete ${record.name}`} icon={<DeleteOutlined />} disabled={busyId !== null} />
                    </Popconfirm>
                }
            </Space> 
        },
    ];

    if (!canRead) return <Result status="403" title="Account access required" subTitle="You do not have permission to view accounts." />;

    return (
        <div className="account-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Accounts</h1>
                    <p className="account-subtitle">Manage cash, bank, mobile banking, courier and operational accounts.</p>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Accounting" }, { title: "Accounts" }]} />
                </div>
            </div>

            <Card className="account-directory" styles={{ body: { padding: 0 } }}>
                <div className="account-directory-header">
                    <div>
                        <Text strong className="account-directory-title">
                            Chart of accounts
                        </Text>

                        <div>
                            <Text type="secondary">
                                {total} {trashed ? "trashed " : ""}account{total === 1 ? "" : "s"}{filters.search_key || filters.type || filters.status ? " matching your filters" : ""}
                            </Text>
                        </div>
                    </div>
                    {canCreate && !trashed && 
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/accounts/create")}>
                            Add account
                        </Button>
                    }
                </div>

                <div className="account-toolbar">
                    <Space wrap>
                        <Input allowClear prefix={<SearchOutlined />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, code or account number" className="account-search" />
                        <Select allowClear value={filters.type} onChange={(type) => changeFilters({ type })} placeholder="All account types" className="account-type-filter" options={accountTypes} />

                        <Select allowClear value={filters.status} onChange={(status) => changeFilters({ status })} placeholder="All statuses" className="account-status-filter" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "draft", label: "Draft" }]} />

                        <Tooltip title="Refresh list">
                            <Button icon={<ReloadOutlined />} loading={loading} onClick={reload} />
                        </Tooltip>
                    </Space>

                    <Segmented value={trashed ? "trash" : "accounts"} onChange={(value) => changeFilters({ trashed: value === "trash" })} options={[{ value: "accounts", label: "Accounts" }, { value: "trash", label: "Trash" }]} />
                </div>

                {error && 
                    <Alert type="error" showIcon message={error} action={<Button size="small" onClick={reload}>Retry</Button>} className="account-list-error" />
                }

                <Table className="account-table" rowKey="id" columns={columns} dataSource={rows} loading={loading} size="middle" scroll={{ x: 1320 }} 
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description={error ? "Account list unavailable" : trashed ? "No accounts in trash" : "No accounts found"} /> }} 
                pagination={{ 
                    current : filters.page,
                    pageSize: filters.paginate_size,
                    total, 
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50, 100],
                    showTotal      : (count, range) => `${range[0]}–${range[1]} of ${count}`,
                    onChange       : (page, pageSize) => changeFilters({ page: pageSize !== filters.paginate_size ? 1 : page, paginate_size: pageSize })
                }} 
                />
            </Card>

            <AccountDetails account={details} onClose={() => setDetails(null)} />
        </div>
    );
}
