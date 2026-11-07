import { ArrowLeftOutlined } from "@ant-design/icons";
import {Button,Card,Result,Skeleton,message} from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getAccountList } from "../../api/accountApi";
import {createAccountTransfer,getAccountTransfer,updateAccountTransfer} from "../../api/accountTransferApi";
import AccountTransferForm from "../../components/account-transfer/AccountTransferForm";
import "../../styles/account-transfer.css";

const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function AccountTransferEditor() {
    const { id }                        = useParams();
    const editing                       = Boolean(id);
    const navigate                      = useNavigate();
    const { can }                       = usePermission();
    const allowed                       = can(editing ? "account-transfers-update" : "account-transfers-create");
    const [messageApi, contextHolder]   = message.useMessage();
    const [transfer, setTransfer]       = useState(null);
    const [accounts, setAccounts]       = useState([]);
    const [loading, setLoading]         = useState(editing);
    const [notFound, setNotFound]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [formError, setFormError]     = useState(null);
    const [fieldErrors, setFieldErrors] = useState(null);
    const savePending                   = useRef(false);

    useTitle(`${editing ? "Edit" : "New"} Account Transfer | Accounting`);

    useEffect(() => {
        if (!allowed) return;

        let active = true;

        const load = async () => {
            setLoading(true);

            try {
                const [accountResponse, transferResponse] = await Promise.all([
                    getAccountList(),
                    editing ? getAccountTransfer(id) : Promise.resolve(null),
                ]);

                if (!active) return;

                if (accountResponse?.success) {
                    setAccounts(accountResponse.result || []);
                }

                if (editing) {
                    if (transferResponse?.success && transferResponse?.result) {
                        setTransfer(transferResponse.result);
                    } else {
                        setNotFound(true);
                    }
                }
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

    const save = async (payload) => {
        if (savePending.current || !allowed) return;

        savePending.current = true;
        setSaving(true);

        clearErrors();

        try {
            const response = editing ? await updateAccountTransfer(id, payload) : await createAccountTransfer(payload);

            if (!response?.success) {
                setFormError(errorMessage(response, "Unable to save account transfer"));

                setFieldErrors(response?.errors || null);

                return;
            }

            messageApi.success(response.msg || "Account transfer saved");

            navigate("/account-transfers", { replace: true });
        } catch {
            setFormError("Unable to save account transfer. Please try again.");
        } finally {
            setSaving(false);
            savePending.current = false;
        }
    };

    if (!allowed) {
        return (
            <Result status="403" title="Account transfer access required"/>
        );
    }

    if (notFound) {
        return (
            <Result
                status="404"
                title="Account transfer not found"
                extra={
                    <Button onClick={() => navigate("/account-transfers")}>
                        Back to transfers
                    </Button>
                }
            />
        );
    }

    return (
        <div className="transfer-page transfer-editor-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        {editing ? "Edit account transfer" : "New account transfer"}
                    </h1>

                    <p className="transfer-subtitle">
                        Move funds safely between your internal financial accounts.
                    </p>
                </div>

                <div className="head-actions">
                    <Button className="transfer-back-button" type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate("/account-transfers")}>
                        Back to Transfers
                    </Button>
                </div>
            </div>

            {loading ? (
                <Card className="transfer-editor-card">
                    <Skeleton active paragraph={{ rows: 8 }} />
                </Card>
            ) : (
                <AccountTransferForm
                    transfer={transfer}
                    accounts={accounts}
                    saving={saving}
                    serverError={formError}
                    fieldErrors={fieldErrors}
                    onSave={save}
                    onCancel={() => navigate("/account-transfers")}
                    onChange={clearErrors}
                />
            )}
        </div>
    );
}