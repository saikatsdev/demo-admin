import { ArrowLeftOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Result, Skeleton, message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { createPurchase, getPurchase, getSupplierFinancialSummary, getSupplierList, getWarehouseList, searchPurchaseProducts, updatePurchase } from "../../api";
import { getAccountList } from "../../../accounting/api/accountApi";
import PurchaseForm from "../../components/purchase/PurchaseForm";
import "../../styles/purchase.css";

const firstError = (response, fallback) => Object.values(response?.errors || {}).flat()[0] || response?.message || response?.msg || fallback;
const unwrapRows = (response) => response?.result?.data || response?.result || [];
const mergeSuppliers = (current, incoming) => Array.from(new Map([...current, ...incoming].map((supplier) => [supplier.id, supplier])).values());

const productOptions = (products) => products.flatMap((product) => {
    const base = { 
        productId  : product.id,
        productName: product.name,
        sku        : product.sku || null,
        image      : product.image || null,
        buyPrice   : product.buy_price ?? 0
    };

    if (!product.variations?.length) {
        return [{ ...base, value: `${product.id}:0`, variationId: null, variationName: null, label: `${product.name}${product.sku ? ` — ${product.sku}` : ""}` }];
    }

    return product.variations.map((variation) => {
        const variationName = 
        [
            variation.attribute_value_1?.value, 
            variation.attribute_value_2?.value, 
            variation.attribute_value_3?.value
        ].filter(Boolean).join(" / ");

        return { 
            ...base, image: variation.image || product.image || null, 
            buyPrice: variation.buy_price ?? product.buy_price ?? 0, 
            value: `${product.id}:${variation.id}`, 
            variationId: variation.id, 
            variationName, 
            label: `${product.name}${variationName ? ` — ${variationName}` : ""}${product.sku ? ` — ${product.sku}` : ""}` 
        };
    });
});

export default function PurchaseEditor() {
    const { id }                                    = useParams();
    const editing                                   = Boolean(id);
    const navigate                                  = useNavigate();
    const { can }                                   = usePermission();
    const allowed                                   = can(editing ? "purchases-update" : "purchases-create");
    const [messageApi, contextHolder]               = message.useMessage();
    const [purchase, setPurchase]                   = useState(null);
    const [suppliers, setSuppliers]                 = useState([]);
    const [warehouses, setWarehouses]               = useState([]);
    const [products, setProducts]                   = useState([]);
    const [accounts, setAccounts]                   = useState([]);
    const [supplierSummary, setSupplierSummary]     = useState(null);
    const [summaryLoading, setSummaryLoading]       = useState(false);
    const [loading, setLoading]                     = useState(true);
    const [supplierLoading, setSupplierLoading]     = useState(false);
    const [productLoading, setProductLoading]       = useState(false);
    const [productSearchText, setProductSearchText] = useState("");
    const [notFound, setNotFound]                   = useState(false);
    const [saving, setSaving]                       = useState(false);
    const [formError, setFormError]                 = useState(null);
    const [fieldErrors, setFieldErrors]             = useState(null);
    const searchTimer                               = useRef(null);
    const supplierSearchTimer                       = useRef(null);
    const searchId                                  = useRef(0);
    const supplierSearchId                          = useRef(0);
    const savePending                               = useRef(false);

    useTitle(`${editing ? "Edit" : "Add"} Purchase | Inventory & Stock`);

    const loadProducts = useCallback(async (searchKey = "") => {
        if (!searchKey) {
            searchId.current += 1;
            setProducts([]);
            setProductLoading(false);
            return;
        }

        const request = ++searchId.current;

        setProductLoading(true);

        try {
            const response = await searchPurchaseProducts(searchKey);
            if (request === searchId.current && response?.success) setProducts(productOptions(unwrapRows(response)));
        } finally { 
            if (request === searchId.current) {
                setProductLoading(false); 
            }
        }
    }, []);

    const loadSuppliers = useCallback(async (searchKey = "") => {
        const request = ++supplierSearchId.current;
        setSupplierLoading(true);

        try {
            const response = await getSupplierList({ search_key: searchKey || undefined, limit: 20 });

            if (request === supplierSearchId.current && response?.success) {
                const results = unwrapRows(response);
                const selectedSupplier = purchase?.supplier;
                setSuppliers(selectedSupplier ? mergeSuppliers(results, [selectedSupplier]) : results);
            }
        } finally {
            if (request === supplierSearchId.current) {
                setSupplierLoading(false);
            }
        }
    }, [purchase?.supplier]);

    useEffect(() => {
        if (!allowed) return;
        let active = true;
        const load = async () => {
            setLoading(true);
            try {
                const requests = [getSupplierList({ limit: 20 }), getWarehouseList(), getAccountList()];

                if (editing) requests.push(getPurchase(id));

                const [supplierResponse, warehouseResponse, accountResponse, purchaseResponse] = await Promise.all(requests);

                if (!active) return;

                const initialSuppliers = unwrapRows(supplierResponse);
                const selectedSupplier = purchaseResponse?.result?.supplier;

                setSuppliers(selectedSupplier ? mergeSuppliers(initialSuppliers, [selectedSupplier]) : initialSuppliers);

                setWarehouses(unwrapRows(warehouseResponse));
                setAccounts(unwrapRows(accountResponse));

                if (editing) {
                    if (purchaseResponse?.success && purchaseResponse.result) setPurchase(purchaseResponse.result);
                    else setNotFound(true);
                }

            } catch { 
                if (active && editing) setNotFound(true); 
            }finally { 
                if (active) setLoading(false); 
            }
        };

        load();

        return () => {
            active = false;
            window.clearTimeout(searchTimer.current);
            window.clearTimeout(supplierSearchTimer.current);
        };
    }, [allowed, editing, id]);

    const searchProducts = (value) => {
        const searchKey = value.trim();
        setProductSearchText(searchKey);
        window.clearTimeout(searchTimer.current);
        if (!searchKey) {
            loadProducts("");
            return;
        }
        searchTimer.current = window.setTimeout(() => loadProducts(searchKey), 350);
    };

    const searchSuppliers = (value) => {
        const searchKey = value.trim();

        window.clearTimeout(supplierSearchTimer.current);

        if (searchKey.length === 1) {
            setSuppliers(purchase?.supplier ? [purchase.supplier] : []);
            return;
        }

        supplierSearchTimer.current = window.setTimeout(() => loadSuppliers(searchKey), 400);
    };

    const loadSupplierSummary = useCallback(async (supplierId) => {
        if (!supplierId) { setSupplierSummary(null); return; }
        setSummaryLoading(true);
        try {
            const response = await getSupplierFinancialSummary(supplierId);
            setSupplierSummary(response?.success ? response.result : null);
        } finally { setSummaryLoading(false); }
    }, []);

    useEffect(() => {
        if (purchase?.supplier_id) loadSupplierSummary(purchase.supplier_id);
    }, [loadSupplierSummary, purchase?.supplier_id]);

    const clearErrors = () => { setFormError(null); setFieldErrors(null); };

    const save = async (payload) => {
        if (savePending.current) return;
        savePending.current = true; setSaving(true); clearErrors();
        try {
            const response = editing ? await updatePurchase(id, payload) : await createPurchase(payload);

            if (!response?.success) { 
                setFormError(firstError(response, "Unable to save purchase")); setFieldErrors(response?.errors || null); 
                return; 
            }

            messageApi.success(response.msg || "Purchase saved");
            navigate("/purchases", { replace: true });
        } catch { 
            setFormError("Unable to save purchase. Please try again."); 
        }finally { 
            setSaving(false); savePending.current = false; 
        }
    };

    if (!allowed) return <Result status="403" title="Purchase access required" subTitle={`You do not have permission to ${editing ? "edit" : "create"} purchases.`} />;
    if (notFound) return <Result status="404" title="Purchase not found" extra={<Button onClick={() => navigate("/purchases")}>Back to purchases</Button>} />;

    return (
        <div className="purchase-page purchase-editor-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <Button className="purchase-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate("/purchases")}>
                        Back to purchases
                    </Button>

                    <h1 className="title">
                        {editing ? `Edit ${purchase?.purchase_no || "purchase"}` : "Create purchase"}
                    </h1>

                    <p className="purchase-subtitle">
                        Record supplier products and costs as a draft. Stock and payments are handled separately.
                    </p>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[
                        { title: <Link to="/dashboard">Dashboard</Link> }, 
                        { title: <Link to="/purchases">Purchases</Link> }, { title: editing ? "Edit" : "Create" }]} 
                    />
                </div>
            </div>

            {loading ? 
                <Card className="purchase-form-card">
                    <Skeleton active paragraph={{ rows: 10 }} />
                </Card> :
                <PurchaseForm purchase={purchase} suppliers={suppliers} supplierLoading={supplierLoading} supplierSummary={supplierSummary} summaryLoading={summaryLoading} accounts={accounts} warehouses={warehouses} productOptions={products} productLoading={productLoading} productSearchText={productSearchText} saving={saving} serverError={formError} fieldErrors={fieldErrors} onSupplierChange={loadSupplierSummary} onSearchSuppliers={searchSuppliers} onSearchProducts={searchProducts} onSave={save} onCancel={() => navigate("/purchases")} onChange={clearErrors} />
            }
        </div>
    );
}
