import { CheckCircleOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined,FileTextOutlined, ReloadOutlined, RollbackOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, Breadcrumb, Button, Card, Empty, Input, message, Popconfirm, Result, Segmented, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import PurchaseInvoice from "../../components/purchase/PurchaseInvoice";
import { completePurchase, deletePurchase, getPurchase, permanentlyDeletePurchase, restorePurchase } from "../../api";
import PurchaseDetails from "../../components/purchase/PurchaseDetails";
import usePurchases from "../../hooks/usePurchases";
import "../../styles/purchase.css";

const { Text }   = Typography;
const firstError = (response, fallback) => Object.values(response?.errors || {}).flat()[0] || response?.message || response?.msg || fallback;
const money      = (value) => `৳ ${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tagColor   = (status) => ({ draft: "gold", completed: "green", paid: "green", partial: "blue", unpaid: "red" }[status] || "default");

export default function Purchase() {
    useTitle("Purchases | Inventory & Stock");

    const { can }                                                         = usePermission();
    const navigate                                                        = useNavigate();
    const canRead                                                         = can("purchases-read");
    const canCreate                                                       = can("purchases-create");
    const canUpdate                                                       = can("purchases-update");
    const canDelete                                                       = can("purchases-delete");
    const { rows, total, loading, error, filters, changeFilters, reload } = usePurchases(canRead);
    const [messageApi, contextHolder]                                     = message.useMessage();
    const [query, setQuery]                                               = useState("");
    const [details, setDetails]                                           = useState(null);
    const [busy, setBusy]                                                 = useState(null);
    const isBusy                                                          = (record, type) => busy?.id === record.id && busy?.type === type;
    const pending                                                         = useRef(false);
    const [invoice, setInvoice]                                           = useState(null);
    const { trashed }                                                     = filters;

    useEffect(() => {
        const timer = window.setTimeout(() => { if (query.trim() !== filters.search_key) changeFilters({ search_key: query.trim() }); }, 400);
        return () => window.clearTimeout(timer);
    }, [changeFilters, filters.search_key, query]);

    const view = async (record) => {
        if (pending.current) return;

        pending.current = true; setBusy({ id: record.id, type: "view" });

        try {
            const response = await getPurchase(record.id);

            if (!response?.success) { 
                messageApi.error(firstError(response, "Unable to load purchase")); 
                return; 
            }

            setDetails(response.result);
        } catch {
            messageApi.error("Unable to load purchase"); 
        }finally { 
            pending.current = false; setBusy(null); 
        }
    };

    const viewInvoice = async (record) => {
        if (pending.current) return;

        pending.current = true; setBusy({ id: record.id, type: "invoice" });

        try {
            const response = await getPurchase(record.id);

            if (!response?.success) {
                messageApi.error(firstError(response, "Unable to load purchase invoice"));
                return;
            }

            setInvoice(response.result);
        } catch {
            messageApi.error("Unable to load purchase invoice");
        } finally {
            pending.current = false; setBusy(null);
        }
    };

    const act = async (record, action) => {
        if (pending.current) return;

        pending.current = true; setBusy({ id: record.id, type: action });

        try {
            const operation = action === "complete" ? completePurchase : action === "restore" ? restorePurchase : action === "permanent" ? permanentlyDeletePurchase : deletePurchase;

            const response = await operation(record.id);

            if (!response?.success) { 
                messageApi.error(firstError(response, "Unable to complete action")); 
                return; 
            }
            messageApi.success(response.msg || "Purchase updated"); await reload();

        } catch { 
            messageApi.error("Unable to complete action. Please try again."); 
        }finally { 
            pending.current = false; setBusy(null); 
        }
    };

    const columns = 
    [
        { 
            title: "SL", 
            width: 64, 
            align: "center", 
            render: (_, __, index) => 
            <span className="purchase-serial">
                {(filters.page - 1) * filters.paginate_size + index + 1}
            </span> 
        },
        { 
            title: "Purchase", 
            width: 190, 
            render: (_, record) => 
            <div>
                <Button type="link" className="purchase-number" onClick={() => view(record)}>
                    {record.purchase_no}
                </Button>
            </div> 
        },
        { 
            title: "Date", 
            dataIndex: "purchase_date", 
            width: 120, 
            render: (value) => value ? dayjs(value).format("DD MMM YYYY") : "—" 
        },
        { 
            title: "Supplier", 
            width: 220, 
            render: (_, record) => 
            <div>
                <Text strong>
                    {record.supplier?.name || "—"}
                </Text>

                {record.supplier?.code && 
                    <div className="purchase-entity-code">
                        {record.supplier.code}
                    </div>
                }
            </div> 
        },
        { 
            title: "Warehouse", 
            width: 190, 
            render: (_, record) => 
            <div>
                <Text strong>
                    {record.warehouse?.name || "—"}
                </Text>

                {record.warehouse?.code && 
                    <div>
                        <Text type="secondary">
                            {record.warehouse.code}
                        </Text>
                    </div>
                }
            </div> 
        },
        { 
            title: "Total", 
            dataIndex: "grand_total", 
            width: 135, 
            align: "right", 
            render: (value) => 
            <Text strong>
                {money(value)}
            </Text> 
        },
        { 
            title: "Due", 
            dataIndex: "due_amount", 
            width: 165, 
            align: "right", 
            render: (value) => 
            <Text className={Number(value) > 0 ? "purchase-due" : ""}>
                {money(value)}
            </Text> 
        },
        { 
            title: "Status", 
            width: 160, 
            render: (_, record) => 
            <Space size={4} wrap>
                <Tag style={{textTransform:"capitalize"}} color={tagColor(record.status)}>
                    {record.status}
                </Tag>

                <Tag style={{textTransform:"capitalize"}} color={tagColor(record.payment_status)}>
                    {record.payment_status}
                </Tag>
            </Space> 
        },
        { 
            title: "Actions", 
            fixed: "right", 
            width: 125, 
            render: (_, record) => 
            <Space size={2}>
                <Tooltip title="View purchase">
                    <Button type="text" icon={<EyeOutlined />} loading={isBusy(record, "view")} disabled={busy !== null && !isBusy(record, "view")} onClick={() => view(record)} />
                </Tooltip>

                {!trashed &&
                    <Tooltip title="Purchase invoice">
                        <Button type="text" className="purchase-invoice-action" icon={<FileTextOutlined />} loading={isBusy(record, "invoice")} disabled={busy !== null && !isBusy(record, "invoice")} onClick={() => viewInvoice(record)} />
                    </Tooltip>
                }

                {!trashed && canUpdate && record.status === "draft" && 
                    <Tooltip title="Edit purchase">
                        <Button type="text" icon={<EditOutlined />} disabled={busy !== null} onClick={() => navigate(`/purchases/${record.id}/edit`)} />
                    </Tooltip>
                }

                {!trashed && canUpdate && record.status === "draft" &&
                    <Popconfirm title="Complete this purchase?" description="Stock, supplier ledger and any planned payment will be posted. A completed purchase cannot be edited or deleted." okText="Complete purchase" onConfirm={() => act(record, "complete")}>
                        <Tooltip title="Complete purchase"><Button type="text" className="purchase-complete-action" icon={<CheckCircleOutlined />} disabled={busy !== null} /></Tooltip>
                    </Popconfirm>
                }

                {trashed && canUpdate && 
                    <Popconfirm title="Restore this purchase?" okText="Restore" onConfirm={() => act(record, "restore")}>
                        <Button type="text" icon={<RollbackOutlined />} disabled={busy !== null} />
                    </Popconfirm>
                }

                {canDelete && 
                    <Popconfirm title={trashed ? "Permanently delete this purchase?" : "Move this purchase to trash?"} description={trashed ? "This action cannot be undone." : "Only draft purchases can be deleted."} okText={trashed ? "Delete permanently" : "Move to trash"} okButtonProps={{ danger: true }} onConfirm={() => act(record, trashed ? "permanent" : "delete")}>
                        <Button type="text" danger icon={<DeleteOutlined />} disabled={busy !== null || (!trashed && record.status !== "draft")} />
                    </Popconfirm>
                }
            </Space> 
        },
    ];

    if (!canRead) return <Result status="403" title="Purchase access required" subTitle="You do not have permission to view purchases." />;

    return <div className="purchase-page">
        {contextHolder}
        <div className="pagehead">
            <div className="head-left">
                <h1 className="title">Purchases</h1>
                <p className="purchase-subtitle">Create and manage supplier purchase drafts before stock and payment processing.</p>
            </div>

            <div className="head-actions">
                <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Inventory & Stock" }, { title: "Purchases" }]} />
            </div>
        </div>

        <Card className="purchase-directory" styles={{ body: { padding: 0 } }}>
            <div className="purchase-directory-header">
                <div>
                    <Text strong className="purchase-directory-title">
                        Purchase register
                    </Text>

                    <div>
                        <Text type="secondary">
                            {total} {trashed ? "trashed " : ""}purchase{total === 1 ? "" : "s"}
                        </Text>
                    </div>
                </div>

                {canCreate && !trashed && 
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/purchases/create")}>
                        Create Purchase
                    </Button>
                }
            </div>

            <div className="purchase-toolbar">
                <Space wrap>
                    <Input allowClear prefix={<SearchOutlined />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search purchase number or supplier" className="purchase-search" />

                    <Select allowClear value={filters.status} onChange={(status) => changeFilters({ status })} placeholder="All statuses" className="purchase-status-filter" options={[{ value: "draft", label: "Draft" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]} />

                    <Tooltip title="Refresh list">
                        <Button icon={<ReloadOutlined />} loading={loading} onClick={reload} />
                    </Tooltip>
                </Space>

                <Segmented value={trashed ? "trash" : "purchases"} onChange={(value) => changeFilters({ trashed: value === "trash" })} options={[{ value: "purchases", label: "Purchases" }, { value: "trash", label: "Trash" }]} />
            </div>

            {error && 
                <Alert type="error" showIcon message={error} action={<Button size="small" onClick={reload}>Retry</Button>} className="purchase-list-error" />
            }

            <Table rowKey="id" className="purchase-table" columns={columns} dataSource={rows} loading={loading} scroll={{ x: 1320 }} 
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description={error ? "Purchase list unavailable" : trashed ? "No purchases in trash" : "No purchases found"} /> }} 
            pagination={{ 
                current: filters.page, 
                pageSize: filters.paginate_size, 
                total, 
                showSizeChanger: true, 
                pageSizeOptions: [10, 20, 50, 100], 
                showTotal: (count, range) => `${range[0]}–${range[1]} of ${count}`, 
                onChange: (page, pageSize) => changeFilters({ page: pageSize !== filters.paginate_size ? 1 : page, paginate_size: pageSize }) }} 
            />
        </Card>
        
        <PurchaseDetails purchase={details} onClose={() => setDetails(null)} />
        <PurchaseInvoice purchase={invoice} onClose={() => setInvoice(null)} />
    </div>;
}
