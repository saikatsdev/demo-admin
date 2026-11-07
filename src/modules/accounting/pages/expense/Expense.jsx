import {DeleteOutlined,EditOutlined,EyeOutlined,PlusOutlined,ReloadOutlined,RollbackOutlined,SearchOutlined} from "@ant-design/icons";
import {Alert,Breadcrumb,Button,Card,Col,DatePicker,Empty,Input,message,Popconfirm,Result,Row,Segmented,Select,Space,Statistic,Table,Tag,Tooltip,Typography} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getAccountList } from "../../api/accountApi";
import {deleteExpense,getExpense,permanentlyDeleteExpense,restoreExpense} from "../../api/expenseApi";
import { getExpenseCategoryList } from "../../api/expenseCategoryApi";
import ExpenseDetails from "../../components/expense/ExpenseDetails";
import useExpenses from "../../hooks/useExpenses";
import "../../styles/expense.css";

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

export default function Expense() {
    useTitle("Expenses | Accounting");

    const { can }                                                         = usePermission();
    const navigate                                                        = useNavigate();
    const canRead                                                         = can("expenses-read");
    const canCreate                                                       = can("expenses-create");
    const canUpdate                                                       = can("expenses-update");
    const canDelete                                                       = can("expenses-delete");
    const {rows,total,summary,loading,error,filters,changeFilters,reload} = useExpenses(canRead);
    const [messageApi, contextHolder]                                     = message.useMessage();
    const [query, setQuery]                                               = useState("");
    const [details, setDetails]                                           = useState(null);
    const [busyId, setBusyId]                                             = useState(null);
    const [accounts, setAccounts]                                         = useState([]);
    const [categories, setCategories]                                     = useState([]);
    const actionPending                                                   = useRef(false);
    const { trashed }                                                     = filters;

    useEffect(() => {
        if (!canRead) return;

        Promise.all([
            getAccountList(),
            getExpenseCategoryList(),
        ]).then(([accountResponse, categoryResponse]) => {
            if (accountResponse?.success) {
                setAccounts(accountResponse.result || []);
            }

            if (categoryResponse?.success) {
                setCategories(categoryResponse.result || []);
            }
        });
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
            const response = await getExpense(record.id);

            if (!response?.success) {
                messageApi.error(errorMessage(response, "Unable to load expense"));
                return;
            }

            setDetails(response.result);
        } catch {
            messageApi.error("Unable to load expense");
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
            const operation = action === "restore" ? restoreExpense : action === "permanent" ? permanentlyDeleteExpense : deleteExpense;

            const response = await operation(record.id);

            if (!response?.success) {
                messageApi.error(errorMessage(response, "Unable to complete this action"));
                return;
            }

            messageApi.success(response.msg || "Expense updated");

            await reload();
        } catch {
            messageApi.error(
                "Unable to complete this action. Please try again."
            );
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
            render: (_, __, index) => (
                <span className="expense-serial">
                    {(filters.page - 1) * filters.paginate_size + index + 1}
                </span>
            ),
        },
        {
            title: "Expense",
            key: "expense",
            width: 310,
            render: (_, record) => (
                <div className="expense-identity">
                    <Button type="link" className="expense-title" onClick={() => openRecord(record)}>
                        {record.title}
                    </Button>

                    <Space size={6} wrap>
                        <Tag bordered={false}>
                            {record.expense_no}
                        </Tag>

                        <Tag bordered={false} color="blue">
                            {record.category?.name || "Uncategorized"}
                        </Tag>
                    </Space>
                </div>
            ),
        },
        {
            title: "Date",
            dataIndex: "expense_date",
            key: "expense_date",
            width: 130,
            render: (value) =>
                value ? dayjs(value).format("DD MMM YYYY") : "-",
        },
        {
            title: "Account",
            key: "account",
            width: 190,
            render: (_, record) => (
                <div className="expense-account">
                    <strong>
                        {record.account?.name || "-"}
                    </strong>

                    <Text type="secondary">
                        {record.account?.code || ""}
                    </Text>
                </div>
            ),
        },
        {
            title: "Payee",
            dataIndex: "payee",
            key: "payee",
            width: 180,
            render: (value) => value || "-",
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            width: 150,
            align: "right",
            render: (value) => (
                <strong className="expense-amount">
                    {money(value)}
                </strong>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 115,
            render: (value) => (
                <Tag color={statusColor[value] || "default"} style={{textTransform:"capitalize"}}>
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
                    <Tooltip title="View expense">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            loading={busyId === record.id}
                            disabled={
                                busyId !== null && busyId !== record.id
                            }
                            onClick={() => openRecord(record)}
                        />
                    </Tooltip>

                    {!trashed && canUpdate && (
                        <Tooltip title="Edit expense">
                            <Button type="text" icon={<EditOutlined />} disabled={busyId !== null} onClick={() => navigate(`/expenses/${record.id}/edit`)}/>
                        </Tooltip>
                    )}

                    {trashed && canUpdate && (
                        <Popconfirm title="Restore this expense?" okText="Restore" onConfirm={() => handleAction(record, "restore")}>
                            <Button type="text" icon={<RollbackOutlined />} disabled={busyId !== null}/>
                        </Popconfirm>
                    )}

                    {canDelete && (
                        <Popconfirm
                            title={
                                trashed
                                    ? "Permanently delete this expense?"
                                    : "Move this expense to trash?"
                            }
                            description={
                                trashed
                                    ? "This action cannot be undone."
                                    : "Posted expense impact will be reversed and it can be restored later."
                            }
                            okText={
                                trashed
                                    ? "Delete permanently"
                                    : "Move to trash"
                            }
                            okButtonProps={{ danger: true }}
                            onConfirm={() =>
                                handleAction(
                                    record,
                                    trashed ? "permanent" : "delete"
                                )
                            }
                        >
                            <Button type="text" danger icon={<DeleteOutlined />} disabled={busyId !== null}/>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    if (!canRead) {
        return (
            <Result status="403" title="Expense access required" subTitle="You do not have permission to view expenses."/>
        );
    }

    return (
        <div className="expense-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Expenses</h1>

                    <p className="expense-subtitle">
                        Track operating expenses and keep account balances synchronized.
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
                                title: "Expenses",
                            },
                        ]}
                    />
                </div>
            </div>

            {!trashed && (
                <Row gutter={[16, 16]} className="expense-summary-row">
                    <Col xs={24} sm={8}>
                        <Card className="expense-summary-card expense-total-card">
                            <Statistic
                                title="Total posted expense"
                                value={Number(summary.total_expense || 0)}
                                precision={2}
                                prefix="৳"
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Card className="expense-summary-card">
                            <Statistic
                                title="Posted expense count"
                                value={Number(summary.expense_count || 0)}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Card className="expense-summary-card">
                            <Statistic
                                title="Average expense"
                                value={Number(summary.average_expense || 0)}
                                precision={2}
                                prefix="৳"
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Card className="expense-directory" styles={{ body: { padding: 0 } }}>
                <div className="expense-directory-header">
                    <div>
                        <Text strong className="expense-directory-title">
                            Expense Register
                        </Text>

                        <div>
                            <Text type="secondary">
                                {total} {trashed ? "trashed " : ""}expense
                                {total === 1 ? "" : "s"}
                            </Text>
                        </div>
                    </div>

                    {canCreate && !trashed && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/expenses/create")}>
                            Add Expense
                        </Button>
                    )}
                </div>

                <div className="expense-toolbar">
                    <div className="expense-filter-group">
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search no., title, category, payee or reference"
                            className="expense-search"
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
                            value={filters.expense_category_id}
                            onChange={(expense_category_id) =>
                                changeFilters({ expense_category_id })
                            }
                            placeholder="All categories"
                            className="expense-category-filter"
                            options={categories.map((category) => ({
                                value: category.id,
                                label: category.name,
                            }))}
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
                            className="expense-account-filter"
                            options={accounts.map((account) => ({
                                value: account.id,
                                label: account.name,
                            }))}
                        />

                        <Select
                            allowClear
                            value={filters.status}
                            onChange={(status) =>
                                changeFilters({ status })
                            }
                            placeholder="All statuses"
                            className="expense-status-filter"
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

                        <Tooltip title="Refresh list">
                            <Button icon={<ReloadOutlined />} loading={loading} onClick={reload}/>
                        </Tooltip>
                    </div>

                    <Segmented
                        value={trashed ? "trash" : "expenses"}
                        onChange={(value) =>
                            changeFilters({ trashed: value === "trash" })
                        }
                        options={[
                            {
                                value: "expenses",
                                label: "Expenses",
                            },
                            {
                                value: "trash",
                                label: "Trash",
                            },
                        ]}
                    />
                </div>

                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={error}
                        action={
                            <Button size="small" onClick={reload}>
                                Retry
                            </Button>
                        }
                        className="expense-list-error"
                    />
                )}

                <Table
                    className="expense-table"
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    size="middle"
                    scroll={{ x: 1320 }}
                    locale={{
                        emptyText: (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error ? "Expense list unavailable" : trashed ? "No expenses in trash" : "No expenses found"}/>
                        ),
                    }}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.paginate_size,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        showTotal: (count, range) =>
                            `${range[0]}–${range[1]} of ${count}`,
                        onChange: (page, pageSize) =>
                            changeFilters({
                                page:
                                    pageSize !== filters.paginate_size
                                        ? 1
                                        : page,
                                paginate_size: pageSize,
                            }),
                    }}
                />
            </Card>

            <ExpenseDetails expense={details} onClose={() => setDetails(null)}/>
        </div>
    );
}