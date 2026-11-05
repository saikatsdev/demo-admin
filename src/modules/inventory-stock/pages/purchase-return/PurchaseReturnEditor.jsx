import { ArrowLeftOutlined } from "@ant-design/icons";

import {Alert,Button,Card,Col,DatePicker,Form,Input,InputNumber,Result,Space,Row,Select,Table,message,} from "antd";

import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";

import { getPurchases } from "../../api/purchaseApi";
import { getRawMaterialPurchases } from "../../api/rawMaterialApi";

import {createPurchaseReturn,getPurchaseReturn,getReturnSource,updatePurchaseReturn} from "../../api/purchaseReturnApi";

import "../../styles/stock-adjustment.css";

const rows = (r) => r?.result?.data || r?.result || [];

const money = (v) => Number(v || 0).toLocaleString("en-BD", {maximumFractionDigits: 2});

export default function PurchaseReturnEditor() {
    const { id }                    = useParams();
    const editing                   = Boolean(id);
    const nav                       = useNavigate();
    const { can }                   = usePermission();
    const ok                        = can(editing ? "purchase-returns-update" : "purchase-returns-create");
    const [form]                    = Form.useForm();
    const type                      = Form.useWatch("return_type", form) || "product";
    const [purchases, setPurchases] = useState([]);
    const [source, setSource]       = useState(null);
    const [items, setItems]         = useState([]);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState("");
    const [api, holder]             = message.useMessage();

    useTitle(`${editing ? "Edit" : "Create"} Purchase Return`);

    useEffect(() => {
        if (!ok) return;

        Promise.all([
            getPurchases({
                status: "completed",
                paginate_size: 100,
            }),
            getRawMaterialPurchases({
                status: "completed",
                paginate_size: 100,
            }),
            editing ? getPurchaseReturn(id) : null,
        ]).then(async ([p, r, x]) => {
            setPurchases(type === "product" ? rows(p) : rows(r));

            if (x?.result) {
                const ret = x.result;

                form.setFieldsValue({
                    ...ret,
                    return_date: dayjs(ret.return_date),
                    source_id: ret.purchase_id || ret.raw_material_purchase_id,
                });

                const s = await getReturnSource(
                    ret.return_type,
                    ret.purchase_id || ret.raw_material_purchase_id
                );

                setSource(s.result);

                setItems(
                    (ret.items || []).map((i) => ({
                        ...i,
                        source_detail_id:
                            ret.return_type === "product"
                                ? i.purchase_detail_id
                                : i.raw_material_purchase_detail_id,
                        quantity: Number(i.quantity),
                    }))
                );
            } else {
                form.setFieldsValue({
                    return_type: "product",
                    return_date: dayjs(),
                });
            }
        });
    }, [ok, editing, id, form]);

    useEffect(() => {
        if (editing) return;

        const fn = type === "product" ? getPurchases : getRawMaterialPurchases;

        fn({
            status: "completed",
            paginate_size: 100,
        }).then((r) => setPurchases(rows(r)));

        setSource(null);
        setItems([]);
        form.setFieldValue("source_id", undefined);
    }, [type, editing, form]);

    const choose = async (sourceId) => {
        const r = await getReturnSource(type, sourceId);

        if (!r?.success) {
            setError(r?.message || r?.msg);
            return;
        }

        setSource(r.result);

        setItems(
            r.result.items
                .filter((i) => Number(i.returnable_quantity) > 0)
                .map((i) => ({
                    ...i,
                    quantity: 0,
                }))
        );
    };

    const total = useMemo(
        () => items.reduce((n, i) => n + Number(i.quantity || 0) * Number(i.unit_cost || 0), 0),
        [items]
    );

    const submit = async (v) => {
        const selected = items.filter((i) => Number(i.quantity) > 0);

        if (!selected.length) {
            return setError("Enter a return quantity for at least one item");
        }

        setSaving(true);

        const payload = {
            return_type             : type,
            purchase_id             : type === "product" ? v.source_id     : null,
            raw_material_purchase_id: type === "raw_material" ? v.source_id: null,
            return_date             : v.return_date.format("YYYY-MM-DD"),
            note                    : v.note || null,
            items                   : selected.map((i) => ({
                purchase_detail_id             : type === "product" ? i.source_detail_id     : null,
                raw_material_purchase_detail_id: type === "raw_material" ? i.source_detail_id: null,
                quantity                       : i.quantity,
            })),
        };

        const r = editing ? await updatePurchaseReturn(id, payload) : await createPurchaseReturn(payload);

        setSaving(false);

        if (!r?.success) {
            return setError(
                Object.values(r?.errors || {}).flat()[0] ||
                r?.message ||
                r?.msg
            );
        }

        api.success(r.msg);
        nav("/purchase-returns");
    };

    if (!ok) {
        return <Result status="403" title="Purchase return access required" />;
    }

    const cols = 
    [
        {
            title: "Item",
            render: (_, i) => (
                <div>
                    <b>{i.name || i.item_name}</b>
                    <div className="stock-muted">
                        {i.variation_name || i.code || i.item_code} · {i.unit}
                    </div>
                </div>
            ),
        },
        {
            title: "Purchased",
            render: (_, i) => i.purchased_quantity ?? "—",
        },
        {
            title: "Already returned",
            render: (_, i) => i.returned_quantity ?? "—",
        },
        {
            title: "Returnable",
            render: (_, i) => <b>{i.returnable_quantity ?? "—"}</b>,
        },
        {
            title: "Unit value",
            render: (_, i) => `৳ ${money(i.unit_cost)}`,
        },
        {
            title: "Return quantity",
            render: (_, i) => (
                <InputNumber
                    min={0}
                    max={i.returnable_quantity}
                    precision={type === "product" ? 0 : undefined}
                    value={i.quantity}
                    onChange={(v) => setItems((a) => a.map((x) => x.source_detail_id === i.source_detail_id ? { ...x, quantity: v || 0 } : x))}
                />
            ),
        },
        {
            title: "Line total",
            render: (_, i) => `৳ ${money(Number(i.quantity) * Number(i.unit_cost))}`,
        },
    ];

    return (
        <div className="stock-adjustment-page">
            {holder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        {editing ? "Edit" : "Create"} purchase return
                    </h1>
                </div>
                <Button icon={<ArrowLeftOutlined />} type="primary" onClick={() => nav("/purchase-returns")}>
                    Back to Returns
                </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={submit}>
                <Card className="stock-adjustment-card">
                    {error && (
                        <Alert type="error" showIcon message={error}/>
                    )}

                    <Row gutter={16}>
                        <Col xs={24} md={6}>
                            <Form.Item name="return_type" label="Return type" rules={[{ required: true }]}>
                                <Select
                                    disabled={editing}
                                    options={[
                                        { value: "product", label: "Product purchase" },
                                        { value: "raw_material", label: "Raw material purchase" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={10}>
                            <Form.Item name="source_id" label="Completed purchase" rules={[{ required: true }]}>
                                <Select
                                    showSearch
                                    optionFilterProp="label"
                                    disabled={editing}
                                    onChange={choose}
                                    options={purchases.map((p) => ({
                                        value: p.id,
                                        label: `${p.purchase_no} — ${p.supplier?.name || "Supplier"} — ৳${money(p.grand_total)}`,
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item name="return_date" label="Return date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {source && (
                        <Alert type="info" showIcon message={`${source.purchase_no} · Warehouse and supplier are inherited from the purchase.`} style={{ marginBottom: 16 }}/>
                    )}

                    <Table
                        rowKey="source_detail_id"
                        columns={cols}
                        dataSource={items}
                        pagination={false}
                        scroll={{ x: 1000 }}
                    />

                    <div className="purchase-grand-total" style={{ marginTop: 18 }}>
                        <span>Estimated return value</span>
                        <strong>৳ {money(total)}</strong>
                    </div>

                    <Form.Item name="note" label="Return note">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Card>

                <div className="purchase-form-actions">
                    <Space>
                        <Button onClick={() => nav("/purchase-returns")}>
                            Cancel
                        </Button>

                        <Button type="primary" htmlType="submit" loading={saving}>
                            {editing ? "Save changes" : "Create Draft Return"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </div>
    );
}