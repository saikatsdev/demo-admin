import { ArrowLeftOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Result, Skeleton, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { createSupplier, getSupplier, updateSupplier } from "../../api";
import SupplierForm from "../../components/supplier/SupplierForm";
import "../../styles/supplier.css";

const optionalFields = ["contact_person", "alternate_phone_number", "email", "address", "note"];
const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function SupplierEditor() {
    const { id }                        = useParams();
    const editing                       = Boolean(id);
    const navigate                      = useNavigate();
    const { can }                       = usePermission();
    const allowed                       = can(editing ? "suppliers-update" : "suppliers-create");
    const [messageApi, contextHolder]   = message.useMessage();
    const [supplier, setSupplier]       = useState(null);
    const [loading, setLoading]         = useState(editing);
    const [notFound, setNotFound]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [formError, setFormError]     = useState(null);
    const [fieldErrors, setFieldErrors] = useState(null);
    const savePending                   = useRef(false);

    useTitle(`${editing ? "Edit" : "Add"} Supplier | Inventory & Stock`);

    useEffect(() => {
        if (!editing || !allowed) return;
        let active = true;
        const loadSupplier = async () => {
            setLoading(true);
            try {
                const response = await getSupplier(id);
                if (!active) return;
                if (response?.success && response?.result) setSupplier(response.result);
                else setNotFound(true);
            } catch {
                if (active) setNotFound(true);
            } finally {
                if (active) setLoading(false);
            }
        };
        loadSupplier();
        return () => { active = false; };
    }, [allowed, editing, id]);

    const clearErrors = () => { setFormError(null); setFieldErrors(null); };

    const handleSave = async (values) => {
        if (savePending.current || !allowed) return;

        savePending.current = true;

        setSaving(true);

        clearErrors();
        
        const payload = { 
            ...values, 
            name: values.name.trim(), 
            phone_number: values.phone_number.trim() 
        };

        delete payload.code;

        optionalFields.forEach((field) => { payload[field] = values[field]?.trim() || null; });

        payload.opening_balance = String(values.opening_balance ?? "0.00");

        try {
            const response = editing ? await updateSupplier(id, payload) : await createSupplier(payload);
            if (!response?.success) {
                setFormError(errorMessage(response, "Unable to save supplier"));
                setFieldErrors(response?.errors || null);
                return;
            }
            messageApi.success(response.msg || "Supplier saved");
            navigate("/suppliers", { replace: true });
        } catch {
            setFormError("Unable to save supplier. Please try again.");
        } finally {
            setSaving(false);
            savePending.current = false;
        }
    };

    if (!allowed) return <Result status="403" title="Supplier access required" subTitle={`You do not have permission to ${editing ? "edit" : "create"} suppliers.`} />;
    if (notFound) return <Result status="404" title="Supplier not found" extra={<Button onClick={() => navigate("/suppliers")}>Back to suppliers</Button>} />;

    return (
        <div className="supplier-page supplier-editor-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <Button className="supplier-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate("/suppliers")}>Back to suppliers</Button>
                    <h1 className="title">
                        {editing ? "Edit supplier" : "Add supplier"}
                    </h1>
                    <p className="supplier-subtitle">
                        {editing ? "Update supplier contact details and opening balance." : "Create a supplier for purchasing and inventory operations."}
                    </p>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> },
                        { title: <Link to="/suppliers">Suppliers</Link> },
                        { title: editing ? "Edit" : "Add" },
                    ]} />
                </div>
            </div>

            {loading ? 
                <Card className="supplier-editor-card">
                    <Skeleton active paragraph={{ rows: 8 }} />
                </Card> : (
                <SupplierForm supplier={supplier} saving={saving} serverError={formError} fieldErrors={fieldErrors} onSave={handleSave} onChange={clearErrors} onCancel={() => navigate("/suppliers")} />
            )}
        </div>
    );
}
