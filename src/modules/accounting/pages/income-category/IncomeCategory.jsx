import {DeleteOutlined,EditOutlined,PlusOutlined,ReloadOutlined,SearchOutlined} from "@ant-design/icons";
import {Breadcrumb,Button,Card,Empty,Input,message,Popconfirm,Result,Select,Space,Table,Tag,Tooltip,Typography} from "antd";
import {useCallback,useEffect,useRef,useState} from "react";
import { Link } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import {createIncomeCategory,deleteIncomeCategory,getIncomeCategories,updateIncomeCategory} from "../../api/incomeCategoryApi";
import IncomeCategoryForm from "../../components/income-category/IncomeCategoryForm";
import "../../styles/income.css";

const { Text } = Typography;

const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function IncomeCategory() {
    useTitle("Income Categories | Accounting");

    const { can }                       = usePermission();
    const canRead                       = can("income-categories-read");
    const canCreate                     = can("income-categories-create");
    const canUpdate                     = can("income-categories-update");
    const canDelete                     = can("income-categories-delete");
    const [messageApi, contextHolder]   = message.useMessage();
    const [rows, setRows]               = useState([]);
    const [total, setTotal]             = useState(0);
    const [loading, setLoading]         = useState(false);
    const [filters, setFilters]         = useState({page: 1,paginate_size: 20,search_key: "",status: undefined});
    const [query, setQuery]             = useState("");
    const [editing, setEditing]         = useState(null);
    const [formOpen, setFormOpen]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [formError, setFormError]     = useState(null);
    const [fieldErrors, setFieldErrors] = useState(null);
    const requestId                     = useRef(0);

    const load = useCallback(async () => {
        if (!canRead) return;

        const current = ++requestId.current;

        setLoading(true);

        try {
            const response = await getIncomeCategories(filters);

            if (current !== requestId.current) return;

            if (!response?.success) {
                throw new Error(response?.message || "Unable to load income categories");
            }

            setRows(response.result?.data || response.result || []);

            setTotal(response.result?.meta?.total ?? response.result?.length ?? 0);
        } catch (error) {
            if (current === requestId.current) {
                messageApi.error(error.message || "Unable to load income categories");
            }
        } finally {
            if (current === requestId.current) {
                setLoading(false);
            }
        }
    }, [canRead, filters, messageApi]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== filters.search_key) {
                setFilters((current) => ({
                    ...current,
                    page: 1,
                    search_key: query,
                }));
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    const openForm = (category = null) => {
        setEditing(category);
        setFormError(null);
        setFieldErrors(null);
        setFormOpen(true);
    };

    const save = async (values) => {
        setSaving(true);
        setFormError(null);
        setFieldErrors(null);

        const payload = {
            ...values,
            name: values.name?.trim(),
            description: values.description?.trim() || null,
            status: Boolean(values.status),
        };

        try {
            const response = editing ? await updateIncomeCategory(editing.id, payload) : await createIncomeCategory(payload);

            if (!response?.success) {
                setFormError(
                    errorMessage(response, "Unable to save category")
                );

                setFieldErrors(response?.errors || null);

                return;
            }

            messageApi.success(response.msg || "Income category saved");

            setFormOpen(false);
            setEditing(null);

            await load();
        } catch {
            setFormError("Unable to save category. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (record) => {
        const response = await deleteIncomeCategory(record.id);

        if (!response?.success) {
            messageApi.error(errorMessage(response, "Unable to delete category"));
            return;
        }

        messageApi.success(response.msg || "Income category deleted");

        await load();
    };

    if (!canRead) {
        return (
            <Result status="403" title="Income category access required" subTitle="You do not have permission to manage income categories."/>
        );
    }

    const columns = 
    [
        {
            title: "SL",
            width: 70,
            align: "center",
            render: (_, __, index) => (filters.page - 1) * filters.paginate_size + index + 1,
        },
        {
            title: "Category",
            key: "name",
            render: (_, record) => (
                <div>
                    <strong>{record.name}</strong>

                    <div>
                        <Text type="secondary">
                            {record.description || "No description"}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Used by",
            dataIndex: "incomes_count",
            width: 120,
            align: "center",
            render: (value) =>
                `${Number(value || 0)} income entr${Number(value || 0) === 1 ? "y" : "ies"}`,
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 110,
            render: (value) => (
                <Tag color={value ? "green" : "default"}>
                    {value ? "Active" : "Inactive"}
                </Tag>
            ),
        },
        {
            title: "Actions",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space size={2}>
                    {canUpdate && (
                        <Tooltip title="Edit category">
                            <Button type="text" icon={<EditOutlined />} onClick={() => openForm(record)}/>
                        </Tooltip>
                    )}

                    {canDelete && (
                        <Popconfirm
                            title="Delete this category?"
                            description={
                                Number(record.incomes_count || 0) > 0 ? "Used categories cannot be deleted. Deactivate it instead." : "This category will be removed."
                            }
                            okButtonProps={{ danger: true }}
                            onConfirm={() => remove(record)}
                        >
                            <Button type="text" danger icon={<DeleteOutlined />}/>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="income-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Income Categories</h1>

                    <p className="income-subtitle">
                        Manage reusable categories for non-order business income and profit reporting.
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
                                title: "Income Categories",
                            },
                        ]}
                    />
                </div>
            </div>

            <Card className="income-directory" styles={{ body: { padding: 0 } }}>
                <div className="income-directory-header">
                    <div>
                        <Text strong className="income-directory-title">
                            Category Directory
                        </Text>

                        <div>
                            <Text type="secondary">
                                {total} categor{total === 1 ? "y" : "ies"}
                            </Text>
                        </div>
                    </div>

                    {canCreate && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
                            Add Category
                        </Button>
                    )}
                </div>

                <div className="income-toolbar">
                    <div className="income-filter-group">
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search category"
                            className="income-search"
                        />

                        <Select
                            allowClear
                            value={filters.status}
                            onChange={(status) =>
                                setFilters((current) => ({
                                    ...current,
                                    page: 1,
                                    status,
                                }))
                            }
                            placeholder="All statuses"
                            style={{ width: 150 }}
                            options={[
                                { value: 1, label: "Active" },
                                { value: 0, label: "Inactive" },
                            ]}
                        />

                        <Tooltip title="Refresh">
                            <Button icon={<ReloadOutlined />} loading={loading} onClick={load}/>
                        </Tooltip>
                    </div>
                </div>

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    scroll={{ x: 760 }}
                    locale={{
                        emptyText: (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No income categories found"/>
                        ),
                    }}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.paginate_size,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        onChange: (page, paginate_size) =>
                            setFilters((current) => ({
                                ...current,
                                page,
                                paginate_size,
                            })),
                    }}
                />
            </Card>

            <IncomeCategoryForm
                open={formOpen}
                category={editing}
                saving={saving}
                error={formError}
                fieldErrors={fieldErrors}
                onCancel={() => {
                    if (!saving) {
                        setFormOpen(false);
                        setEditing(null);
                    }
                }}
                onSave={save}
            />
        </div>
    );
}