import { ArrowLeftOutlined } from "@ant-design/icons";
import {Button,Card,Result,Skeleton,message} from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getAccountList } from "../../api/accountApi";
import {createExpense,getExpense,updateExpense} from "../../api/expenseApi";
import { getExpenseCategoryList } from "../../api/expenseCategoryApi";
import ExpenseForm from "../../components/expense/ExpenseForm";
import "../../styles/expense.css";

const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function ExpenseEditor() {
    const { id } = useParams();
    const editing = Boolean(id);

    const navigate                      = useNavigate();
    const { can }                       = usePermission();
    const allowed                       = can(editing ? "expenses-update" : "expenses-create");
    const [messageApi, contextHolder]   = message.useMessage();
    const [expense, setExpense]         = useState(null);
    const [accounts, setAccounts]       = useState([]);
    const [categories, setCategories]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [notFound, setNotFound]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [formError, setFormError]     = useState(null);
    const [fieldErrors, setFieldErrors] = useState(null);
    const savePending                   = useRef(false);

    useTitle(`${editing ? "Edit" : "Add"} Expense | Accounting`);

    useEffect(() => {
        if (!allowed) {
            setLoading(false);
            return;
        }

        let active = true;

        const load = async () => {
            setLoading(true);

            try {
                const requests = [
                    getAccountList(),
                    getExpenseCategoryList(),
                ];

                if (editing) requests.push(getExpense(id));

                const [
                    accountResponse,
                    categoryResponse,
                    expenseResponse,
                ] = await Promise.all(requests);

                if (!active) return;

                setAccounts(accountResponse?.result || []);
                setCategories(categoryResponse?.result || []);

                if (editing) {
                    if (expenseResponse?.success && expenseResponse?.result) {
                        setExpense(expenseResponse.result);
                    } else {
                        setNotFound(true);
                    }
                }
            } catch {
                if (active && editing) setNotFound(true);
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => {
            active = false;
        };
    }, [allowed, editing, id]);

    const clearErrors = () => {
        setFormError(null);
        setFieldErrors(null);
    };

    const save = async (values) => {
        if (savePending.current || !allowed) return;

        savePending.current = true;
        setSaving(true);

        clearErrors();

        const payload = {
            ...values,
            title                : values.title?.trim(),
            amount               : Number(values.amount),
            expense_date         : dayjs(values.expense_date).format("YYYY-MM-DD"),
            payee                : values.payee?.trim() || null,
            transaction_reference: values.transaction_reference?.trim() || null,
            note                 : values.note?.trim() || null,
        };

        try {
            const response = editing
                ? await updateExpense(id, payload)
                : await createExpense(payload);

            if (!response?.success) {
                setFormError(errorMessage(response, "Unable to save expense"));
                setFieldErrors(response?.errors || null);
                return;
            }

            messageApi.success(response.msg || "Expense saved");

            navigate("/expenses", { replace: true });
        } catch {
            setFormError("Unable to save expense. Please try again.");
        } finally {
            setSaving(false);
            savePending.current = false;
        }
    };

    if (!allowed) {
        return (
            <Result status="403" title="Expense access required" subTitle={`You do not have permission to ${editing ? "edit" : "create"} expenses.`}/>
        );
    }

    if (notFound) {
        return (
            <Result status="404" title="Expense not found"
                extra={
                    <Button onClick={() => navigate("/expenses")}>
                        Back to expenses
                    </Button>
                }
            />
        );
    }

    return (
        <div className="expense-page expense-editor-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        {editing ? "Edit expense" : "Add expense"}
                    </h1>

                    <p className="expense-subtitle">
                        {editing ? "Update the expense and keep account balances synchronized." : "Record an operating expense against one of your accounting accounts."}
                    </p>
                </div>

                <div className="head-actions">
                    <Button className="expense-back-button" type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate("/expenses")}>
                        Back to Expenses
                    </Button>
                </div>
            </div>

            {loading ? (
                <Card className="expense-editor-card">
                    <Skeleton active paragraph={{ rows: 9 }} />
                </Card>
            ) : (
                <ExpenseForm
                    expense={expense}
                    accounts={accounts}
                    categories={categories}
                    saving={saving}
                    serverError={formError}
                    fieldErrors={fieldErrors}
                    onSave={save}
                    onCancel={() => navigate("/expenses")}
                    onChange={clearErrors}
                />
            )}
        </div>
    );
}