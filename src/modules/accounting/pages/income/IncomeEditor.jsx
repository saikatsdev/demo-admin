import { ArrowLeftOutlined } from "@ant-design/icons";
import {Breadcrumb,Button,Card,Result,Skeleton,message} from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getAccountList } from "../../api/accountApi";
import {createIncome,getIncome,updateIncome} from "../../api/incomeApi";
import { getIncomeCategoryList } from "../../api/incomeCategoryApi";
import IncomeForm from "../../components/income/IncomeForm";
import "../../styles/income.css";

const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function IncomeEditor() {
    const { id }                        = useParams();
    const editing                       = Boolean(id);
    const navigate                      = useNavigate();
    const { can }                       = usePermission();
    const allowed                       = can(editing ? "incomes-update" : "incomes-create");
    const [messageApi, contextHolder]   = message.useMessage();
    const [income, setIncome]           = useState(null);
    const [accounts, setAccounts]       = useState([]);
    const [categories, setCategories]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [notFound, setNotFound]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [formError, setFormError]     = useState(null);
    const [fieldErrors, setFieldErrors] = useState(null);
    const savePending                   = useRef(false);

    useTitle(`${editing ? "Edit" : "Add"} Income | Accounting`);

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
                    getIncomeCategoryList(),
                ];

                if (editing) requests.push(getIncome(id));

                const [
                    accountResponse,
                    categoryResponse,
                    incomeResponse,
                ] = await Promise.all(requests);

                if (!active) return;

                setAccounts(accountResponse?.result || []);
                setCategories(categoryResponse?.result || []);

                if (editing) {
                    if (incomeResponse?.success && incomeResponse?.result) {
                        setIncome(incomeResponse.result);
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
            income_date          : dayjs(values.income_date).format("YYYY-MM-DD"),
            payer                : values.payer?.trim() || null,
            transaction_reference: values.transaction_reference?.trim() || null,
            note                 : values.note?.trim() || null,
        };

        try {
            const response = editing ? await updateIncome(id, payload) : await createIncome(payload);

            if (!response?.success) {
                setFormError(errorMessage(response, "Unable to save income"));
                setFieldErrors(response?.errors || null);
                return;
            }

            messageApi.success(response.msg || "Income saved");

            navigate("/incomes", { replace: true });
        } catch {
            setFormError("Unable to save income. Please try again.");
        } finally {
            setSaving(false);
            savePending.current = false;
        }
    };

    if (!allowed) {
        return (
            <Result status="403" title="Income access required" subTitle={`You do not have permission to ${editing ? "edit" : "create"} income.`}/>
        );
    }

    if (notFound) {
        return (
            <Result
                status="404"
                title="Income not found"
                extra={
                    <Button onClick={() => navigate("/incomes")}>
                        Back to Income
                    </Button>
                }
            />
        );
    }

    return (
        <div className="income-page income-editor-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        {editing ? "Edit income" : "Add income"}
                    </h1>

                    <p className="income-subtitle">
                        {editing ? "Update the income and keep account balances synchronized." : "Record non-order business income against one of your accounting accounts."}
                    </p>
                </div>

                <div className="head-actions">
                    <Button className="income-back-button" type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate("/incomes")}>
                        Back to Income
                    </Button>
                </div>
            </div>

            {loading ? (
                <Card className="income-editor-card">
                    <Skeleton active paragraph={{ rows: 9 }} />
                </Card>
            ) : (
                <IncomeForm
                    income={income}
                    accounts={accounts}
                    categories={categories}
                    saving={saving}
                    serverError={formError}
                    fieldErrors={fieldErrors}
                    onSave={save}
                    onCancel={() => navigate("/incomes")}
                    onChange={clearErrors}
                />
            )}
        </div>
    );
}