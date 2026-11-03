import { DeleteOutlined, EditOutlined, EnvironmentOutlined, EyeOutlined, MailOutlined, PhoneOutlined, PlusOutlined, ReloadOutlined, RollbackOutlined, SearchOutlined, ShopOutlined } from "@ant-design/icons";
import { Alert, Avatar, Breadcrumb, Button, Card, Empty, Input, message, Popconfirm, Result, Segmented, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { deleteWarehouse, getWarehouse, permanentlyDeleteWarehouse, restoreWarehouse } from "../../api";
import WarehouseDetails from "../../components/warehouse/WarehouseDetails";
import useWarehouses from "../../hooks/useWarehouses";
import "../../styles/warehouse.css";

const { Text } = Typography;
const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function Warehouse() {
    useTitle("Warehouses | Inventory & Stock");
    const { can }                                                         = usePermission();
    const navigate                                                        = useNavigate();
    const canRead                                                         = can("warehouses-read");
    const canCreate                                                       = can("warehouses-create");
    const canUpdate                                                       = can("warehouses-update");
    const canDelete                                                       = can("warehouses-delete");
    const { rows, total, loading, error, filters, changeFilters, reload } = useWarehouses(canRead);
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
            const response = await getWarehouse(record.id);
            if (!response?.success) { messageApi.error(errorMessage(response, "Unable to load warehouse")); return; }
            setDetails(response.result);
        } catch { messageApi.error("Unable to load warehouse"); }
        finally { setBusyId(null); actionPending.current = false; }
    };

    const handleAction = async (record, action) => {
        if (actionPending.current || (action === "restore" ? !canUpdate : !canDelete)) return;
        actionPending.current = true;
        setBusyId(record.id);
        try {
            const operation = action === "restore" ? restoreWarehouse : action === "permanent" ? permanentlyDeleteWarehouse : deleteWarehouse;
            const response = await operation(record.id);
            if (!response?.success) { messageApi.error(errorMessage(response, "Unable to complete this action")); return; }
            messageApi.success(response.msg || "Warehouse updated");
            await reload();
        } catch { messageApi.error("Unable to complete this action. Please try again."); }
        finally { setBusyId(null); actionPending.current = false; }
    };

    const columns = 
    [
        { 
            title: "SL", 
            key: "serial", 
            width: 68, 
            align: "center", render: (_, __, index) => <span className="warehouse-serial">{(filters.page - 1) * filters.paginate_size + index + 1}</span> 
        },
        { 
            title: "Warehouse", 
            key: "warehouse", 
            width: 270, render: (_, record) => (
                <Space size={12}>
                    <Avatar shape="square" size={44} className="warehouse-avatar" icon={<ShopOutlined />} />

                    <div className="warehouse-identity">
                        <Button type="link" className="warehouse-name" onClick={() => openRecord(record)} disabled={busyId !== null}>
                            {record.name}
                        </Button>

                        <div>
                            <Tag bordered={false} className="warehouse-code">
                                <strong>{record.code}</strong>
                            </Tag>
                        </div>
                    </div>
                </Space>
            )
        },
        { 
            title: "Contact", 
            key: "contact", 
            width: 230, 
            render: (_, record) => (
                <Space direction="vertical" size={3} className="warehouse-contact">
                    {record.contact_person && 
                        <Text strong>
                            {record.contact_person}
                        </Text>
                    }

                    {record.phone_number ? 
                        <Text>
                            <PhoneOutlined /> {record.phone_number}
                        </Text> : 
                        <Text type="secondary">
                            No phone provided
                        </Text>
                    }
                    {record.email && 
                        <Text type="secondary" ellipsis={{ tooltip: record.email }}>
                            <MailOutlined /> {record.email}
                        </Text>
                    }
                </Space>
            )
        },
        { 
            title: "Location", 
            dataIndex: "address", 
            key: "address", 
            width: 260, 
            render: (value) => 
            <Space align="start" size={7} className="warehouse-address">
                <EnvironmentOutlined />
                <Text ellipsis={{ tooltip: value }}>
                    {value}
                </Text>
            </Space> 
        },
        { 
            title: "Type", 
            dataIndex: "is_default", 
            key: "is_default", 
            width: 130, 
            render: (value) => 
            <Tag bordered={false} color={value ? "blue" : "default"} className="warehouse-type">
                {value ? "Default" : "Regular"}
            </Tag> 
        },
        { 
            title: "Status", 
            dataIndex: "status", 
            key: "status", 
            width: 105, 
            render: (value) => 
            <Tag color={value === "active" ? "green" : value === "draft" ? "gold" : "default"} className="warehouse-status">
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
                    <Tooltip title="View warehouse">
                        <Button type="text" aria-label={`View ${record.name}`} icon={<EyeOutlined />} loading={busyId === record.id} disabled={busyId !== null && busyId !== record.id} onClick={() => openRecord(record)} />
                    </Tooltip>

                    {!trashed && canUpdate && 
                        <Tooltip title="Edit warehouse">
                            <Button type="text" aria-label={`Edit ${record.name}`} icon={<EditOutlined />} disabled={busyId !== null} onClick={() => navigate(`/warehouses/${record.id}/edit`)} />
                        </Tooltip>
                    }

                    {trashed && canUpdate && 
                        <Popconfirm title="Restore this warehouse?" okText="Restore" onConfirm={() => handleAction(record, "restore")}>
                            <Button type="text" title="Restore warehouse" aria-label={`Restore ${record.name}`} icon={<RollbackOutlined />} disabled={busyId !== null} />
                        </Popconfirm>
                    }

                    {canDelete && 
                        <Popconfirm title={trashed ? "Permanently delete this warehouse?" : "Move this warehouse to trash?"} description={trashed ? "This cannot be undone." : record.is_default ? "Another warehouse will become the default." : "You can restore it from Trash."} okText={trashed ? "Delete permanently" : "Move to trash"} okButtonProps={{ danger: true }} onConfirm={() => handleAction(record, trashed ? "permanent" : "delete")}>
                            <Button type="text" danger title={trashed ? "Delete permanently" : "Move to trash"} aria-label={`Delete ${record.name}`} icon={<DeleteOutlined />} disabled={busyId !== null} />
                        </Popconfirm>
                    }
                </Space>
            )
        },
    ];

    if (!canRead) return <Result status="403" title="Warehouse access required" subTitle="You do not have permission to view warehouses." />;

    return (
        <div className="warehouse-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        Warehouses
                    </h1>
                    <p className="warehouse-subtitle">
                        Manage stock locations, responsible contacts and the default warehouse.
                    </p>
                </div>
                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "Inventory & Stock" }, { title: "Warehouses" }]} />
                </div>
            </div>

            <Card className="warehouse-directory" styles={{ body: { padding: 0 } }}>
                <div className="warehouse-directory-header">
                    <div>
                        <Text strong className="warehouse-directory-title">
                            Warehouse directory
                        </Text>

                        <div>
                            <Text type="secondary">
                                {total} {trashed ? "trashed " : ""}warehouse{total === 1 ? "" : "s"}{filters.search_key || filters.status ? " matching your filters" : ""}
                            </Text>
                        </div>
                    </div>

                    {canCreate && !trashed && 
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/warehouses/create")}>
                            Add warehouse
                        </Button>
                    }
                </div>

                <div className="warehouse-toolbar">
                    <Space wrap>
                        <Input allowClear prefix={<SearchOutlined />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, code, contact or address" className="warehouse-search" />

                        <Select allowClear value={filters.status} onChange={(status) => changeFilters({ status })} placeholder="All statuses" className="warehouse-status-filter" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "draft", label: "Draft" }]} />

                        <Tooltip title="Refresh list">
                            <Button icon={<ReloadOutlined />} loading={loading} onClick={reload} />
                        </Tooltip>
                    </Space>

                    <Segmented value={trashed ? "trash" : "warehouses"} onChange={(value) => changeFilters({ trashed: value === "trash" })} options={[{ value: "warehouses", label: "Warehouses" }, { value: "trash", label: "Trash" }]} />
                </div>

                {error && 
                    <Alert type="error" showIcon message={error} action={<Button size="small" onClick={reload}>
                        Retry
                    </Button>} className="warehouse-list-error" />
                }

                <Table className="warehouse-table" rowKey="id" columns={columns} dataSource={rows} loading={loading} size="middle" scroll={{ x: 1200 }} 
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description={error ? "Warehouse list unavailable" : trashed ? "No warehouses in trash" : filters.search_key || filters.status ? "No warehouses match your filters" : "No warehouses yet"} /> }} 
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
            
            <WarehouseDetails warehouse={details} onClose={() => setDetails(null)} />
        </div>
    );
}
