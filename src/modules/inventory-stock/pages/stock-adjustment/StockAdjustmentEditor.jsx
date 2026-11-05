import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Result, Row, Select, Space, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { searchPurchaseProducts } from "../../api";
import { getRawMaterialList } from "../../api/rawMaterialApi";
import { createStockAdjustment, getStockAdjustment, updateStockAdjustment } from "../../api/stockAdjustmentApi";
import { getStockOverview } from "../../api/stockApi";
import { getWarehouseList } from "../../api/warehouseApi";
import "../../styles/stock-adjustment.css";

const rows= (r) =>r?.result?.data || r?.result || [];

const qty = (v) => Number(v || 0).toLocaleString("en-BD",{minimumFractionDigits:0,maximumFractionDigits:4});

const types = 
[
    {
        value:"adjustment_in",
        label:"Adjustment in"
    },
    {
        value:"adjustment_out",
        label:"Adjustment out"
    },
    {
        value:"damage",
        label:"Damage"
    },
    {
        value:"wastage",label:"Wastage"
    },
    {
        value:"lost",
        label:"Lost"
    },
    {
        value:"opening_stock",
        label:"Opening stock"
    }
];

const productOptions = (products) => {
    return products.flatMap((product) => {
        const base = {
            product_id: product.id,
            item_name: product.name,
            item_code: product.sku || null,
            unit: "pcs",
        };

        if (!product.variations?.length) {
            return [
                {
                    ...base,
                    key: `p:${product.id}:0`,
                    product_variation_id: null,
                    label: `${product.name}${product.sku ? ` — ${product.sku}` : ""}`,
                },
            ];
        }

        return product.variations.map((variation) => {
            const variationName = [
                variation.attribute_value_1?.value,
                variation.attribute_value_2?.value,
                variation.attribute_value_3?.value,
            ]
                .filter(Boolean)
                .join(" / ");

            return {
                ...base,
                key: `p:${product.id}:${variation.id}`,
                product_variation_id: variation.id,
                variation_name: variationName,
                label: `${product.name} — ${variationName}${product.sku ? ` — ${product.sku}` : ""}`,
            };
        });
    });
};

export default function StockAdjustmentEditor() {
    const { id } = useParams();
    const editing = Boolean(id);
    const navigate = useNavigate();
    const { can } = usePermission();
    const allowed = can(editing ? "stock-adjustments-update" : "stock-adjustments-create");
    const [form] = Form.useForm();
    const itemType = Form.useWatch("item_type", form) || "product";
    const warehouseId = Form.useWatch("warehouse_id", form);

    const [warehouses, setWarehouses] = useState([]);
    const [options, setOptions] = useState([]);
    const [items, setItems] = useState([]);
    const [selected, setSelected] = useState();
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [messageApi, contextHolder] = message.useMessage();

    useTitle(`${editing ? "Edit" : "Create"} Stock Adjustment`);

    useEffect(() => {
        if (!allowed) return;

        Promise.all([
            getWarehouseList(),
            editing ? getStockAdjustment(id) : Promise.resolve(null),
        ]).then(([w, a]) => {
            const list = rows(w);
            setWarehouses(list);

            if (a?.result) {
                form.setFieldsValue({
                    ...a.result,
                    adjustment_date: dayjs(a.result.adjustment_date),
                });

                setItems(
                    (a.result.items || []).map((x) => ({
                        ...x,
                        key: a.result.item_type === "product"
                            ? `p:${x.product_id}:${x.product_variation_id || 0}`
                            : `r:${x.raw_material_id}`,
                        quantity: Number(x.quantity || 0),
                        current_stock: x.quantity_before,
                    }))
                );
            } else {
                form.setFieldsValue({
                    item_type: "product",
                    adjustment_date: dayjs(),
                    warehouse_id: list.find((x) => x.is_default)?.id || (list.length === 1 ? list[0].id : undefined),
                });
            }
        });
    }, [allowed, editing, form, id]);

    useEffect(() => {
        if (editing) return;

        setItems([]);
        setSelected();
        setOptions([]);
    }, [itemType, editing]);

    const search = async (value = "") => {
        const key = value.trim();

        if (key.length < 2) {
            setOptions([]);
            return;
        }

        setLoadingOptions(true);

        if (itemType === "product") {
            const r = await searchPurchaseProducts(key);
            setOptions(productOptions(rows(r)));
        } else {
            const r = await getRawMaterialList({
                search_key: key,
                limit: 30,
            });

            setOptions(
                rows(r).map((m) => ({
                    key: `r:${m.id}`,
                    raw_material_id: m.id,
                    item_name: m.name,
                    item_code: m.code,
                    unit: m.unit,
                    label: `${m.code} — ${m.name} (${m.unit})`,
                }))
            );
        }

        setLoadingOptions(false);
    };

    const add = async () => {
        const option = options.find((x) => x.key === selected);

        if (!option || !warehouseId || items.some((x) => x.key === option.key)) return;

        const r = await getStockOverview({
            item_type: itemType,
            warehouse_id: warehouseId,
            search_key: option.item_code || option.item_name,
            paginate_size: 100,
        });

        const stockRows = r?.result?.data || [];

        const stock = stockRows.find((x) =>
            itemType === "product"
                ? x.item_id === option.product_id &&
                  Number(x.variation_id || 0) === Number(option.product_variation_id || 0)
                : x.item_id === option.raw_material_id
        );

        setItems((x) => [
            ...x,
            {
                ...option,
                current_stock: Number(stock?.quantity || 0),
                adjustment_type: "adjustment_in",
                quantity: 1,
                note: null,
            },
        ]);

        setSelected();
    };

    const update = (key, field, value) => {
        setItems((current) =>
            current.map((x) =>
                x.key === key
                    ? { ...x, [field]: value ?? 0 }
                    : x
            )
        );
    };

    const submit = async (values) => {
        if (!items.length) {
            setError("Add at least one item");
            return;
        }

        setSaving(true);
        setError("");

        const payload = {
            ...values,
            adjustment_date: values.adjustment_date.format("YYYY-MM-DD"),
            items: items.map((x) => ({
                product_id: x.product_id || null,
                product_variation_id: x.product_variation_id || null,
                raw_material_id: x.raw_material_id || null,
                adjustment_type: x.adjustment_type,
                quantity: x.quantity,
                note: x.note || null,
            })),
        };

        const r = editing
            ? await updateStockAdjustment(id, payload)
            : await createStockAdjustment(payload);

        setSaving(false);

        if (!r?.success) {
            setError(
                Object.values(r?.errors || {}).flat()[0] ||
                r?.msg ||
                "Unable to save adjustment"
            );
            return;
        }

        messageApi.success(r.msg);
        navigate("/stock-adjustments");
    };

    const total = useMemo(
        () => items.reduce((n, x) => n + Number(x.quantity || 0), 0),
        [items]
    );

    if (!allowed) {
        return <Result status="403" title="Stock adjustment access required" />;
    }

    const columns = 
    [
        {
            title: "Item",
            width: 260,
            render: (_, x) => (
                <div>
                    <b>{x.item_name}</b>
                    {x.variation_name && (
                        <div className="stock-variation">
                            {x.variation_name}
                        </div>
                    )}
                    <div className="stock-muted">
                        {x.item_code} · {x.unit}
                    </div>
                </div>
            ),
        },
        {
            title: "Current stock",
            width: 140,
            align: "right",
            render: (_, x) => (
                <b>
                    {x.current_stock === null || x.current_stock === undefined
                        ? "—"
                        : `${qty(x.current_stock)} ${x.unit}`}
                </b>
            ),
        },
        {
            title: "Adjustment type",
            width: 190,
            render: (_, x) => (
                <Select
                    value={x.adjustment_type}
                    onChange={(v) => update(x.key, "adjustment_type", v)}
                    options={types}
                    style={{ width: "100%" }}
                />
            ),
        },
        {
            title: "Quantity",
            width: 150,
            render: (_, x) => (
                <InputNumber
                    min={itemType === "product" ? 1 : 0.0001}
                    precision={itemType === "product" ? 0 : undefined}
                    value={x.quantity}
                    onChange={(v) => update(x.key, "quantity", v)}
                    style={{ width: "100%" }}
                />
            ),
        },
        {
            title: "Line note",
            render: (_, x) => (
                <Input
                    value={x.note}
                    onChange={(e) => update(x.key, "note", e.target.value)}
                    placeholder="Optional reason"
                />
            ),
        },
        {
            width: 50,
            render: (_, x) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setItems((i) => i.filter((y) => y.key !== x.key))}
                />
            ),
        },
    ];

    return (
        <div className="stock-adjustment-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">
                        {editing ? "Edit" : "Create"} stock adjustment
                    </h1>

                    <p className="stock-subtitle">
                        Save a draft, review it, then complete to update stock and movement history.
                    </p>
                </div>
                <Button className="purchase-back-button" icon={<ArrowLeftOutlined />} type="primary" onClick={() => navigate("/stock-adjustments")}>
                    Back to Adjustments
                </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={submit}>
                <Card className="stock-adjustment-card">
                    {error && (
                        <Alert type="error" showIcon message={error} style={{ marginBottom: 18 }}/>
                    )}

                    <Row gutter={16}>
                        <Col xs={24} md={6}>
                            <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true, message: "Select warehouse" }]}>
                                <Select disabled={items.length > 0}
                                    options={warehouses.map((w) => ({
                                        value: w.id,
                                        label: `${w.code} — ${w.name}`,
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="item_type" label="Item type" rules={[{ required: true }]}>
                                <Select
                                    disabled={editing || items.length > 0}
                                    options={[
                                        { value: "product", label: "Product" },
                                        { value: "raw_material", label: "Raw material" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="adjustment_date" label="Adjustment date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="reason" label="Reason">
                                <Input placeholder="Physical count, correction…" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="adjustment-item-picker">
                        <Select
                            showSearch
                            filterOption={false}
                            value={selected}
                            onChange={setSelected}
                            onSearch={search}
                            notFoundContent={loadingOptions ? "Searching…" : "Type at least 2 characters"}
                            placeholder={`Search ${itemType === "product" ? "product or SKU" : "raw material or code"}`}
                            options={options.map((x) => ({
                                value: x.key,
                                label: x.label,
                            }))}
                        />

                        <Button type="primary" icon={<PlusOutlined />} disabled={!selected || !warehouseId} onClick={add}>
                            Add item
                        </Button>
                    </div>

                    <Table rowKey="key" columns={columns} dataSource={items} pagination={false} scroll={{ x: 1050 }}/>

                    <div className="adjustment-footer-summary">
                        <span>
                            {items.length} item{items.length === 1 ? "" : "s"}
                        </span>

                        <Tag color="blue">
                            Total quantity: {qty(total)}
                        </Tag>
                    </div>

                    <Form.Item name="note" label="Adjustment note">
                        <Input.TextArea rows={3} maxLength={5000} />
                    </Form.Item>
                </Card>

                <div className="purchase-form-actions">
                    <Space>
                        <Button onClick={() => navigate("/stock-adjustments")}>
                            Cancel
                        </Button>

                        <Button type="primary" htmlType="submit" loading={saving}>
                            {editing ? "Save Changes" : "Create Draft Adjustment"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </div>
    );
}
