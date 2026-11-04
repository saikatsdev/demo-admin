import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Result, Row, Select, Space, Table, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { searchPurchaseProducts } from "../../api";
import { getRawMaterialList } from "../../api/rawMaterialApi";
import { createStockTransfer, getStockTransfer, updateStockTransfer } from "../../api/stockTransferApi";
import { getStockOverview } from "../../api/stockApi";
import { getWarehouseList } from "../../api/warehouseApi";

const unwrapRows = (response) => response?.result?.data || response?.result || [];

const productOptions = (products) => products.flatMap((product) => {
    const base = { 
        product_id: product.id,
        item_name : product.name,
        item_code : product.sku,
        unit      : "pcs"
    };

    if (!product.variations?.length) return [{ ...base, key: `p:${product.id}:0`, product_variation_id: null, label: product.name }];

    return product.variations.map((variation) => {
        const variationName = [variation.attribute_value_1?.value, variation.attribute_value_2?.value, variation.attribute_value_3?.value].filter(Boolean).join(" / ");
        return { ...base, key: `p:${product.id}:${variation.id}`, product_variation_id: variation.id, variation_name: variationName, label: `${product.name} — ${variationName}` };
    });
});

export default function StockTransferEditor() {
    const { id }                      = useParams();
    const editing                     = Boolean(id);
    const navigate                    = useNavigate();
    const { can }                     = usePermission();
    const allowed                     = can(editing ? "stock-transfers-update" : "stock-transfers-create");
    const [form]                      = Form.useForm();
    const itemType                    = Form.useWatch("item_type", form) || "product";
    const sourceWarehouseId           = Form.useWatch("source_warehouse_id", form);
    const [warehouses, setWarehouses] = useState([]);
    const [options, setOptions]       = useState([]);
    const [items, setItems]           = useState([]);
    const [selected, setSelected]     = useState();
    const [searching, setSearching]   = useState(false);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState("");
    const [messageApi, contextHolder] = message.useMessage();

    useTitle(`${editing ? "Edit" : "Create"} Warehouse Transfer`);

    useEffect(() => {
        if (!allowed) return;
        Promise.all([getWarehouseList(), editing ? getStockTransfer(id) : Promise.resolve(null)]).then(([warehouseResponse, transferResponse]) => {
            const warehouseRows = unwrapRows(warehouseResponse);
            setWarehouses(warehouseRows);
            if (!transferResponse?.result) {
                form.setFieldsValue({ item_type: "product", transfer_date: dayjs() });
                return;
            }

            const transfer = transferResponse.result;
            form.setFieldsValue({ ...transfer, transfer_date: dayjs(transfer.transfer_date) });
            setItems((transfer.items || []).map((item) => ({
                ...item,
                key          : transfer.item_type === "product" ? `p:${item.product_id}:${item.product_variation_id || 0}`: `r:${item.raw_material_id}`,
                quantity     : Number(item.quantity),
                current_stock: Number(item.source_quantity_before || 0),
            })));
        });
    }, [allowed, editing, form, id]);

    const searchItems = async (value) => {
        const searchKey = value.trim();

        if (searchKey.length < 2) return setOptions([]);

        setSearching(true);

        const response = itemType === "product" ? await searchPurchaseProducts(searchKey) : await getRawMaterialList({ search_key: searchKey, limit: 30 });

        setOptions(itemType === "product" ? productOptions(unwrapRows(response)) : unwrapRows(response).map((material) => ({
            key            : `r:${material.id}`,
            raw_material_id: material.id,
            item_name      : material.name,
            item_code      : material.code,
            unit           : material.unit,
            label          : `${material.code} — ${material.name}`,
        })));

        setSearching(false);
    };

    const addItem = async () => {
        const option = options.find((row) => row.key === selected);

        if (!option || !sourceWarehouseId || items.some((row) => row.key === option.key)) return;

        const response = await getStockOverview({ item_type: itemType, warehouse_id: sourceWarehouseId, search_key: option.item_code || option.item_name, paginate_size: 100 });
        const stock = (response?.result?.data || []).find((row) => itemType === "product" ? row.item_id === option.product_id && Number(row.variation_id || 0) === Number(option.product_variation_id || 0) : row.item_id === option.raw_material_id);

        setItems((current) => [...current, { ...option, quantity: 1, current_stock: Number(stock?.quantity || 0) }]);

        setSelected(undefined);
    };

    const submit = async (values) => {
        if (!items.length) return setError("Add at least one item");

        setSaving(true); setError("");
        const payload = {
            ...values,
            transfer_date: values.transfer_date.format("YYYY-MM-DD"),
            items: items.map((item) => ({ product_id: item.product_id || null, product_variation_id: item.product_variation_id || null, raw_material_id: item.raw_material_id || null, quantity: item.quantity })),
        };

        const response = editing ? await updateStockTransfer(id, payload) : await createStockTransfer(payload);

        setSaving(false);

        if (!response?.success) {
            return setError(Object.values(response?.errors || {}).flat()[0] || response?.msg || "Unable to save transfer");
        }

        messageApi.success(response.msg); 
        navigate("/stock-transfers");
    };

    if (!allowed) return <Result status="403" title="Stock transfer access required" />;

    const columns = 
    [
        { 
            title: "Item", 
            render: (_, item) => 
            <div>
                <b>{item.item_name}</b>
                <div className="stock-muted">{item.variation_name || item.item_code} · {item.unit}</div>
            </div> 
        },
        { 
            title: "Source stock", 
            render: (_, item) => `${Number(item.current_stock || 0).toLocaleString()} ${item.unit}` 
        },
        { 
            title: "Quantity", 
            render: (_, item) => <InputNumber min={itemType === "product" ? 1 : 0.0001} precision={itemType === "product" ? 0 : undefined} value={item.quantity} onChange={(value) => setItems((current) => current.map((row) => row.key === item.key ? { ...row, quantity: value } : row))} /> 
        },
        { 
            width: 50, 
            render: (_, item) => 
            <Button danger type="text" icon={<DeleteOutlined />} onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))} /> 
        },
    ];

    return (
        <div className="stock-adjustment-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <Button className="purchase-back-button" icon={<ArrowLeftOutlined />} onClick={() => navigate("/stock-transfers")}>
                        Back to transfers
                    </Button>

                    <h1 className="title">
                        {editing ? "Edit" : "Create"} warehouse transfer
                    </h1>
                </div>
            </div>

            <Form form={form} layout="vertical" onFinish={submit}>
                <Card className="stock-adjustment-card">
                    {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 18 }} />}

                    <Row gutter={16}>
                        <Col xs={24} md={6}>
                            <Form.Item name="source_warehouse_id" label="Source warehouse" rules={[{ required: true }]}>
                                <Select disabled={items.length > 0} options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="destination_warehouse_id" label="Destination warehouse" dependencies={["source_warehouse_id"]} rules={[{ required: true }, { validator: (_, value) => value === sourceWarehouseId ? Promise.reject(new Error("Choose a different warehouse")) : Promise.resolve() }]}>
                                <Select options={warehouses.filter((warehouse) => warehouse.id !== sourceWarehouseId).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="item_type" label="Item type" rules={[{ required: true }]}>
                                <Select disabled={editing || items.length > 0} options={[{ value: "product", label: "Product" }, { value: "raw_material", label: "Raw material" }]} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="transfer_date" label="Transfer date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
                        <Select showSearch filterOption={false} value={selected} onSearch={searchItems} onChange={setSelected} loading={searching} options={options.map((row) => ({ value: row.key, label: row.label }))} placeholder="Type at least 2 characters to search" style={{ flex: 1 }} />

                        <Button type="primary" icon={<PlusOutlined />} disabled={!selected || !sourceWarehouseId} onClick={addItem}>
                            Add item
                        </Button>
                    </Space.Compact>

                    <Table rowKey="key" columns={columns} dataSource={items} pagination={false} />

                    <Form.Item name="note" label="Note" style={{ marginTop: 18 }}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Card>

                <div className="purchase-form-actions">
                    <Button onClick={() => navigate("/stock-transfers")}>
                        Cancel
                    </Button>

                    <Button type="primary" htmlType="submit" loading={saving}>
                        {editing ? "Save changes" : "Save draft transfer"}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
