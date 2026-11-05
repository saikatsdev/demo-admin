import { ArrowLeftOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Result, Skeleton, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { createWarehouse, getWarehouse, updateWarehouse } from "../../api";
import WarehouseForm from "../../components/warehouse/WarehouseForm";
import "../../styles/warehouse.css";

const optionalFields = ["contact_person", "phone_number", "email", "note"];
const errorMessage = (response, fallback) => Object.values(response?.errors || {})?.flat()?.[0] || response?.message || response?.msg || fallback;

export default function WarehouseEditor() {
    const { id }                        = useParams();
    const editing                       = Boolean(id);
    const navigate                      = useNavigate();
    const { can }                       = usePermission();
    const allowed                       = can(editing ? "warehouses-update" : "warehouses-create");
    const [messageApi, contextHolder]   = message.useMessage();
    const [warehouse, setWarehouse]     = useState(null);
    const [loading, setLoading]         = useState(editing);
    const [notFound, setNotFound]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [formError, setFormError]     = useState(null);
    const [fieldErrors, setFieldErrors] = useState(null);
    const savePending                   = useRef(false);

    useTitle(`${editing ? "Edit" : "Add"} Warehouse | Inventory & Stock`);

    useEffect(() => {
        if (!editing || !allowed) return;
        let active = true;
        const loadWarehouse = async () => {
            setLoading(true);
            try {
                const response = await getWarehouse(id);
                if (!active) return;
                if (response?.success && response?.result) setWarehouse(response.result);
                else setNotFound(true);
            } catch { if (active) setNotFound(true); }
            finally { if (active) setLoading(false); }
        };
        loadWarehouse();
        return () => { active = false; };
    }, [allowed, editing, id]);

    const clearErrors = () => { setFormError(null); setFieldErrors(null); };

    const handleSave = async (values) => {
        if (savePending.current || !allowed) return;

        savePending.current = true;

        setSaving(true);

        clearErrors();

        const payload = { ...values, name: values.name.trim(), address: values.address.trim(), is_default: Boolean(values.is_default) };

        optionalFields.forEach((field) => { payload[field] = values[field]?.trim() || null; });

        try {
            const response = editing ? await updateWarehouse(id, payload) : await createWarehouse(payload);
            if (!response?.success) {
                setFormError(errorMessage(response, "Unable to save warehouse"));
                setFieldErrors(response?.errors || null);
                return;
            }
            messageApi.success(response.msg || "Warehouse saved");
            navigate("/warehouses", { replace: true });
        } catch { setFormError("Unable to save warehouse. Please try again."); }
        finally { setSaving(false); savePending.current = false; }
    };

    if (!allowed) return <Result status="403" title="Warehouse access required" subTitle={`You do not have permission to ${editing ? "edit" : "create"} warehouses.`} />;
    if (notFound) return <Result status="404" title="Warehouse not found" extra={<Button onClick={() => navigate("/warehouses")}>Back to warehouses</Button>} />;

    return (
        <div className="warehouse-page warehouse-editor-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        {editing ? "Edit warehouse" : "Add warehouse"}
                    </h1>

                    <p className="warehouse-subtitle">
                        {editing ? "Update warehouse location and operational details." : "Create a location for receiving, storing and dispatching stock."}
                    </p>
                </div>

                <div className="head-actions">
                    <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate("/warehouses")}>
                        Back to warehouses
                    </Button>
                </div>
            </div>

            {loading ? 
                <Card className="warehouse-editor-card">
                    <Skeleton active paragraph={{ rows: 8 }} />
                </Card> : (
                <WarehouseForm warehouse={warehouse} saving={saving} serverError={formError} fieldErrors={fieldErrors} onSave={handleSave} onChange={clearErrors} onCancel={() => navigate("/warehouses")} />
            )}
        </div>
    );
}
