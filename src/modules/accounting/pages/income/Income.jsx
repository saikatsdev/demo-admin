import {DeleteOutlined,EditOutlined,EyeOutlined,PlusOutlined,ReloadOutlined,SearchOutlined,UndoOutlined} from "@ant-design/icons";
import {Alert,Breadcrumb,Button,Card,Col,DatePicker,Empty,Input,message,Popconfirm,Result,Row,Segmented,Select,Space,Statistic,Table,Tag,Tooltip,Typography,} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getAccountList } from "../../api/accountApi";
import {deleteIncome,getIncome,permanentlyDeleteIncome,restoreIncome} from "../../api/incomeApi";
import { getIncomeCategoryList } from "../../api/incomeCategoryApi";
import IncomeDetails from "../../components/income/IncomeDetails";
import useIncomes from "../../hooks/useIncomes";
import "../../styles/income.css";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const money = (value) =>
`৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

const statusColor = {
    posted   : "green",
    draft    : "gold",
    cancelled: "default",
};

const apiError = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function Income() {
    useTitle("Other Income | Accounting");

    const navigate                                                        = useNavigate();
    const { can }                                                         = usePermission();
    const canRead                                                         = can("incomes-read");
    const canCreate                                                       = can("incomes-create");
    const canUpdate                                                       = can("incomes-update");
    const canDelete                                                       = can("incomes-delete");
    const {rows,total,summary,loading,error,filters,changeFilters,reload} = useIncomes(canRead);
    const [messageApi, contextHolder]                                     = message.useMessage();
    const [query, setQuery]                                               = useState("");
    const [accounts, setAccounts]                                         = useState([]);
    const [categories, setCategories]                                     = useState([]);
    const [details, setDetails]                                           = useState(null);

    useEffect(() => {
        if (!canRead) return;

        Promise.all([
            getAccountList(),
            getIncomeCategoryList(),
        ])
        .then(([accountResponse, categoryResponse]) => {
            setAccounts(accountResponse?.result || []);
            setCategories(categoryResponse?.result || []);
        })
        .catch(() => {});
    }, [canRead]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== filters.search_key) {
                changeFilters({ search_key: query });
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    const openDetails = async (id) => {
        const response = await getIncome(id);

        if (!response?.success) {
            messageApi.error(apiError(response, "Unable to load income"));
            return;
        }

        setDetails(response.result);
    };

    const remove = async (record) => {
        const response = filters.trashed ? await permanentlyDeleteIncome(record.id) : await deleteIncome(record.id);

        if (!response?.success) {
            messageApi.error(apiError(response, "Unable to delete income"));
            return;
        }

        messageApi.success(response.msg || (filters.trashed ? "Income permanently deleted" : "Income moved to trash"));

        await reload();
    };

    const restore = async (record) => {
        const response = await restoreIncome(record.id);

        if (!response?.success) {
            messageApi.error(
                apiError(response, "Unable to restore income")
            );
            return;
        }

        messageApi.success(response.msg || "Income restored");

        await reload();
    };

    if (!canRead) {
        return (
            <Result status="403" title="Income access required" subTitle="You do not have permission to view Other Income."/>
        );
    }

    const columns = 
    [
        {
            title: "SL",
            width: 70,
            align: "center",
            render: (_, __, index) =>
                (filters.page - 1) * filters.paginate_size + index + 1,
        },
        {
            title: "Income",
            key: "income",
            width: 260,
            render: (_, record) => (
                <div>
                    <strong>{record.title}</strong>

                    <div>
                        <Text type="secondary">
                            {record.income_no}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Category",
            key: "category",
            width: 170,
            render: (_, record) => record.category?.name || "-",
        },
        {
            title: "Account",
            key: "account",
            width: 180,
            render: (_, record) => (
                <div>
                    <strong>
                        {record.account?.name || "-"}
                    </strong>

                    <div>
                        <Text type="secondary">
                            {record.account?.code || ""}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Payer / Source",
            dataIndex: "payer",
            width: 180,
            render: (value) => value || "-",
        },
        {
            title: "Date",
            dataIndex: "income_date",
            width: 130,
            render: (value) =>
                value ? dayjs(value).format("DD MMM YYYY") : "-",
        },
        {
            title: "Amount",
            dataIndex: "amount",
            width: 140,
            align: "right",
            render: (value) => (
                <strong className="income-money-positive">
                    {money(value)}
                </strong>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 110,
            render: (value) => (
                <Tag color={statusColor[value]} style={{textTransform: "capitalize"}}>
                    {value}
                </Tag>
            ),
        },
        {
            title: "Actions",
            fixed: "right",
            width: 150,
            align: "center",
            render: (_, record) => (
                <Space size={2}>
                    {!filters.trashed && (
                        <Tooltip title="View">
                            <Button type="text" icon={<EyeOutlined />} onClick={() => openDetails(record.id)}/>
                        </Tooltip>
                    )}

                    {!filters.trashed && canUpdate && (
                        <Tooltip title="Edit">
                            <Button type="text" icon={<EditOutlined />}
                                onClick={() =>
                                    navigate(`/incomes/${record.id}/edit`)
                                }
                            />
                        </Tooltip>
                    )}

                    {filters.trashed && canUpdate && (
                        <Tooltip title="Restore">
                            <Button type="text" icon={<UndoOutlined />} onClick={() => restore(record)}/>
                        </Tooltip>
                    )}

                    {canDelete && (
                        <Popconfirm
                            title={
                                filters.trashed ? "Permanently delete this income?" : "Move this income to trash?"
                            }
                            description={
                                record.status === "posted" && !filters.trashed ? "Its account balance impact will be reversed." : undefined
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

    const dateValue =
    filters.date_from && filters.date_to
        ? [
            dayjs(filters.date_from),
            dayjs(filters.date_to),
        ]
        : null;

    return (
        <div className="income-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Other Income</h1>

                    <p className="income-subtitle">
                        Track non-order income without mixing it with e-commerce sales revenue.
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
                                title: "Other Income",
                            },
                        ]}
                    />
                </div>
            </div>

            {!filters.trashed && (
                <Row gutter={[16, 16]} className="income-summary-row">
                    <Col xs={24} sm={8}>
                        <Card className="income-summary-card income-summary-total">
                            <Statistic
                                title="Posted Income"
                                value={summary.total_income || 0}
                                precision={2}
                                prefix="৳"
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Card className="income-summary-card">
                            <Statistic title="Income Entries" value={summary.income_count || 0}/>
                        </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Card className="income-summary-card">
                            <Statistic
                                title="Average Income"
                                value={summary.average_income || 0}
                                precision={2}
                                prefix="৳"
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Card className="income-directory" styles={{ body: { padding: 0 } }}>
                <div className="income-directory-header">
                    <div>
                        <Text strong className="income-directory-title">
                            {filters.trashed ? "Income trash" : "Income directory"}
                        </Text>

                        <div>
                            <Text type="secondary">
                                {total} entr{total === 1 ? "y" : "ies"}
                            </Text>
                        </div>
                    </div>

                    {canCreate && !filters.trashed && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/incomes/create")}>
                            Add Income
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
                            placeholder="Search no., title, payer or reference"
                            className="income-search"
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
                            value={filters.income_category_id}
                            onChange={(income_category_id) =>
                                changeFilters({ income_category_id })
                            }
                            placeholder="All categories"
                            className="income-category-filter"
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
                            className="income-account-filter"
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
                            className="income-status-filter"
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
                        value={filters.trashed ? "trash" : "income"}
                        onChange={(value) =>
                            changeFilters({ trashed: value === "trash" })
                        }
                        options={[
                            {
                                value: "income",
                                label: "Income",
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
                        className="income-list-error"
                    />
                )}

                <Table
                    className="income-table"
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    size="middle"
                    scroll={{ x: 1450 }}
                    locale={{
                        emptyText: (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error ? "Income list unavailable" : filters.trashed ? "No income in trash" : "No income found"}/>
                        ),
                    }}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.paginate_size,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        showTotal: (count, range) => `${range[0]}–${range[1]} of ${count}`,
                        onChange: (page, pageSize) =>
                            changeFilters({
                                page: pageSize !== filters.paginate_size ? 1 : page,
                                paginate_size: pageSize,
                            }),
                    }}
                />
            </Card>

            <IncomeDetails income={details} onClose={() => setDetails(null)}/>
        </div>
    );
}