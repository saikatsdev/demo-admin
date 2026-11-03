import { ArrowLeftOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Result, Skeleton, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { createAccount, getAccount, updateAccount } from "../../api/accountApi";
import AccountForm from "../../components/account/AccountForm";
import "../../styles/account.css";

const optionalFields = ["account_number", "account_holder_name", "bank_name", "branch_name", "note"];
const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function AccountEditor() {
    const { id }                        = useParams();
    const editing                       = Boolean(id);
    const navigate                      = useNavigate();
    const { can }                       = usePermission();
    const allowed                       = can(editing ? "accounts-update" : "accounts-create");
    const [messageApi, contextHolder]   = message.useMessage();
    const [account, setAccount]         = useState(null);
    const [loading, setLoading]         = useState(editing);
    const [notFound, setNotFound]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [formError, setFormError]     = useState(null);
    const [fieldErrors, setFieldErrors] = useState(null);
    const savePending                   = useRef(false);

    useTitle(`${editing ? "Edit" : "Add"} Account | Accounting`);

    useEffect(() => {
        if (!editing || !allowed) return;
        let active = true;
        const loadAccount = async () => {
            setLoading(true);
            try {
                const response = await getAccount(id);

                if (!active) return;

                if (response?.success && response?.result) {
                    setAccount(response.result);
                }else {
                    setNotFound(true);
                }

            } catch { 
                if (active) {
                    setNotFound(true); 
                }
            }finally { 
                if (active) {
                    setLoading(false); 
                }
            }
        };

        loadAccount();

        return () => { active = false; };
    }, [allowed, editing, id]);

    const clearErrors = () => { setFormError(null); setFieldErrors(null); };

    const save = async (values) => {
        if (savePending.current || !allowed) return;

        savePending.current = true;

        setSaving(true);

        clearErrors();

        const payload = { 
            ...values, 
            name: values.name.trim(), 
            opening_balance: Number(values.opening_balance) 
        };

        optionalFields.forEach((field) => { payload[field] = values[field]?.trim() || null; });

        try {
            const response = editing ? await updateAccount(id, payload) : await createAccount(payload);

            if (!response?.success) {
                setFormError(errorMessage(response, "Unable to save account"));
                setFieldErrors(response?.errors || null);
                return;
            }

            messageApi.success(response.msg || "Account saved");

            navigate("/accounts", { replace: true });

        } catch { 
            setFormError("Unable to save account. Please try again."); 
        }finally { 
            setSaving(false); savePending.current = false; 
        }
    };

    if (!allowed) return <Result status="403" title="Account access required" subTitle={`You do not have permission to ${editing ? "edit" : "create"} accounts.`} />;

    if (notFound) return <Result status="404" title="Account not found" extra={<Button onClick={() => navigate("/accounts")}>Back to accounts</Button>} />;

    return (
        <div className="account-page account-editor-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <Button className="account-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate("/accounts")}>
                        Back to accounts
                    </Button>

                    <h1 className="title">
                        {editing ? "Edit account" : "Add account"}
                    </h1>

                    <p className="account-subtitle">
                        {editing ? "Update account identity, financial details and opening balance." : "Create a cash, bank, mobile banking or operational account."}
                    </p>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> }, 
                        { title: <Link to="/accounts">Accounts</Link> }, 
                        { title: editing ? "Edit" : "Add" }
                    ]} />
                </div>
            </div>
            {loading ? 
                <Card className="account-editor-card">
                    <Skeleton active paragraph={{ rows: 9 }} />
                </Card> : 
                <AccountForm account={account} saving={saving} serverError={formError} fieldErrors={fieldErrors} onSave={save} onCancel={() => navigate("/accounts")} onChange={clearErrors} />
            }
        </div>
    );
}
