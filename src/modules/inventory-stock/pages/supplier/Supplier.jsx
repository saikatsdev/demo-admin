import { DeleteOutlined, EditOutlined, EnvironmentOutlined, EyeOutlined, MailOutlined, PhoneOutlined, PlusOutlined, ReloadOutlined, RollbackOutlined, SearchOutlined, ShopOutlined } from "@ant-design/icons";
import { Alert, Avatar, Breadcrumb, Button, Card, Empty, Input, message, Popconfirm, Result, Segmented, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { deleteSupplier, getSupplier, permanentlyDeleteSupplier, restoreSupplier } from "../../api";
import SupplierDetails from "../../components/supplier/SupplierDetails";
import useSuppliers from "../../hooks/useSuppliers";
import "../../styles/supplier.css";

const { Text } = Typography;
const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;
const formatAmount = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function Supplier() {
    useTitle("Suppliers | Inventory & Stock");
    const { can }                                                         = usePermission();
    const navigate                                                        = useNavigate();
    const canRead                                                         = can("suppliers-read");
    const canCreate                                                       = can("suppliers-create");
    const canUpdate                                                       = can("suppliers-update");
    const canDelete                                                       = can("suppliers-delete");
    const { rows, total, loading, error, filters, changeFilters, reload } = useSuppliers(canRead);
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
        if (trashed) { setDetails(record); return; }
        actionPending.current = true;
        setBusyId(record.id);
        try {
            const response = await getSupplier(record.id);
            if (!response?.success) { messageApi.error(errorMessage(response, "Unable to load supplier")); return; }
            setDetails(response.result);
        } catch { messageApi.error("Unable to load supplier"); }
        finally { setBusyId(null); actionPending.current = false; }
    };

    const handleAction = async (record, action) => {
        if (actionPending.current || (action === "restore" ? !canUpdate : !canDelete)) return;
        actionPending.current = true;
        setBusyId(record.id);
        try {
            const operation = action === "restore" ? restoreSupplier : action === "permanent" ? permanentlyDeleteSupplier : deleteSupplier;

            const response = await operation(record.id);

            if (!response?.success) { messageApi.error(errorMessage(response, "Unable to complete this action")); return; }
            
            messageApi.success(response.msg || "Supplier updated");
            await reload();
        } catch { messageApi.error("Unable to complete this action. Please try again."); }
        finally { setBusyId(null); actionPending.current = false; }
    };

    const columns = 
    [
        {
            title: "SL",
            key: "serial",
            width: 70,
            align: "center",
            render: (_, __, index) => (
                <span className="supplier-serial">
                    {(filters.page - 1) * filters.paginate_size + index + 1}
                </span>
            ),
        },
        { 
            title: "Supplier", 
            key: "supplier", 
            width: 250, 
            render: (_, record) => (
                <Space size={12} align="center">
                    <Avatar shape="square" size={44} className="supplier-avatar" icon={<ShopOutlined />} />
                    <div className="supplier-identity">
                        <Button type="link" className="supplier-name" onClick={() => openRecord(record)} disabled={busyId !== null}>
                            {record.name}
                        </Button>
                        <div className="supplier-code-row">
                            <Tag bordered={false} className="supplier-code">
                                <span className="supplier-code-value">{record.code}</span>
                            </Tag>
                        </div>
                    </div>
                </Space>
            ) 
        },
        { 
            title: "Contact", 
            key: "contact", 
            width: 235, 
            render: (_, record) => (
                <Space direction="vertical" size={3} className="supplier-contact">
                    {record.contact_person && <Text strong>{record.contact_person}</Text>}
                    <Text className="supplier-contact-line"><PhoneOutlined /> {record.phone_number}</Text>
                    {record.email && <Text type="secondary" ellipsis={{ tooltip: record.email }} className="supplier-contact-line"><MailOutlined /> {record.email}</Text>}
                </Space>
            ) 
        },
        { 
            title: "Address", 
            dataIndex: "address", 
            key: "address", 
            width: 220, 
            render: (value) => value ? <Space align="start" size={7} className="supplier-address-wrap"><EnvironmentOutlined /><Text ellipsis={{ tooltip: value }} className="supplier-address">{value}</Text></Space> : <Text type="secondary">Not provided</Text> 
        },
        {
            title: "Opening balance",
            key: "opening_balance",
            width: 185,
            sorter: (a, b) => Number(a.opening_balance || 0) - Number(b.opening_balance || 0),
            render: (_, record) => {
                const receivable = record.opening_balance_type === "receivable";
                return (
                    <div className="supplier-balance-cell">
                        <Text strong className={receivable ? "supplier-amount receivable" : "supplier-amount payable"}>৳ {formatAmount(record.opening_balance)}</Text>
                        <Tag bordered={false} color={receivable ? "green" : "orange"} className="supplier-balance-type">
                            {receivable ? "Receivable" : "Payable"}
                        </Tag>
                    </div>
                );
            }
        },
        { 
            title: "Status", 
            dataIndex: "status", 
            key: "status", 
            width: 105, 
            render: (value) => 
            <Tag color={value === "active" ? "green" : value === "draft" ? "gold" : "default"} className="supplier-status">
                {value}
            </Tag> 
        },
        { 
            title: "Actions", 
            key: "actions", 
            fixed: "right", 
            width: 135, 
            render: (_, record) => (
                <Space size={2}>
                    <Tooltip title="View supplier">
                        <Button type="text" aria-label={`View ${record.name}`} icon={<EyeOutlined />} loading={busyId === record.id} disabled={busyId !== null && busyId !== record.id} onClick={() => openRecord(record)} />
                    </Tooltip>

                    {!trashed && canUpdate && 
                    <Tooltip title="Edit supplier">
                        <Button type="text" aria-label={`Edit ${record.name}`} icon={<EditOutlined />} disabled={busyId !== null} onClick={() => navigate(`/suppliers/${record.id}/edit`)} />
                    </Tooltip>}

                    {trashed && canUpdate && 
                        <Popconfirm title="Restore this supplier?" okText="Restore" onConfirm={() => handleAction(record, "restore")}>
                            <Button type="text" title="Restore supplier" aria-label={`Restore ${record.name}`} icon={<RollbackOutlined />} disabled={busyId !== null} />
                        </Popconfirm>
                    }

                    {canDelete && 
                        <Popconfirm title={trashed ? "Permanently delete this supplier?" : "Move this supplier to trash?"} description={trashed ? "This permanently removes the supplier and cannot be undone." : "You can restore the supplier from Trash."} okText={trashed ? "Delete permanently" : "Move to trash"} okButtonProps={{ danger: true }} onConfirm={() => handleAction(record, trashed ? "permanent" : "delete")}>
                            <Button type="text" danger title={trashed ? "Delete permanently" : "Move to trash"} aria-label={`Delete ${record.name}`} icon={<DeleteOutlined />} disabled={busyId !== null} />
                        </Popconfirm>
                    }
                </Space>
            ) 
        },
    ];

    if (!canRead) return <Result status="403" title="Supplier access required" subTitle="You do not have permission to view suppliers." />;

    return (
        <div className="supplier-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        Suppliers
                    </h1>

                    <p className="supplier-subtitle">
                        Manage supplier contacts, business details and opening balances.
                    </p>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Inventory & Stock" }, { title: "Suppliers" }]} />
                </div>
            </div>

            <Card className="supplier-directory" styles={{ body: { padding: 0 } }}>
                <div className="supplier-directory-header">
                    <div>
                        <Text strong className="supplier-directory-title">
                            Supplier directory
                        </Text>

                        <div>
                            <Text type="secondary">
                                {total} {trashed ? "trashed " : ""}supplier{total === 1 ? "" : "s"}{filters.search_key || filters.status ? " matching your filters" : ""}
                            </Text>
                        </div>
                    </div>

                    {canCreate && !trashed && 
                        <Button type="primary" aria-label="Add supplier" icon={<PlusOutlined />} onClick={() => navigate("/suppliers/create")}>
                            Add supplier
                        </Button>
                    }
                </div>

                <div className="supplier-toolbar">
                    <Space wrap>
                        <Input allowClear prefix={<SearchOutlined />} value={query} onChange={(event) => setQuery(event.target.value)} maxLength={255} placeholder="Search name, code, phone or email" className="supplier-search" aria-label="Search suppliers" />

                        <Select allowClear value={filters.status} onChange={(status) => changeFilters({ status })} placeholder="All statuses" className="supplier-status-filter" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "draft", label: "Draft" }]} aria-label="Filter supplier status" />

                        <Tooltip title="Refresh list">
                            <Button aria-label="Refresh suppliers" icon={<ReloadOutlined />} loading={loading} onClick={reload} />
                        </Tooltip>
                    </Space>

                    <Segmented aria-label="Supplier list view" value={trashed ? "trash" : "suppliers"} onChange={(value) => changeFilters({ trashed: value === "trash" })} options={[{ value: "suppliers", label: "Suppliers" }, { value: "trash", label: "Trash" }]} />
                </div>

                {error && 
                    <Alert type="error" showIcon message={error} action={<Button size="small" onClick={reload}>Retry</Button>} className="supplier-list-error" />
                }

                <Table className="supplier-table" rowKey="id" columns={columns} dataSource={rows} loading={loading} size="middle" scroll={{ x: 1200 }} locale={
                    { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description={error ? "Supplier list unavailable" : trashed ? "No suppliers in trash" : filters.search_key || filters.status ? "No suppliers match your filters" : "No suppliers yet"} /> }} 
                    pagination={{
                              current         : filters.page,
                              pageSize        : filters.paginate_size,
                        total, showSizeChanger: true,
                              pageSizeOptions : [10, 20, 50, 100],
                              showTotal       : (count, range) => `${range[0]}–${range[1]} of ${count}`,
                              onChange        : (page, pageSize) => changeFilters({ 
                            page         : pageSize !== filters.paginate_size ? 1: page,
                            paginate_size: pageSize
                        }),
                    }} 
                />
            </Card>

            <SupplierDetails supplier={details} onClose={() => setDetails(null)} />
        </div>
    );
}
