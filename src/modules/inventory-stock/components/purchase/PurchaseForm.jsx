import { CalculatorOutlined, CheckCircleOutlined, DeleteOutlined, InfoCircleOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Table, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;
const money = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PurchaseForm({ purchase, suppliers, supplierLoading, warehouses, productOptions, productLoading, saving, serverError, fieldErrors, onSearchSuppliers, onSearchProducts, onSave, onCancel, onChange }) {
    const [form]                                = Form.useForm();
    const [items, setItems]                     = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const values                                = Form.useWatch([], form) || {};

    useEffect(() => {
        form.resetFields();
        form.setFieldsValue(purchase ? { ...purchase, purchase_date: dayjs(purchase.purchase_date) } : {
            purchase_date: dayjs(), discount_amount: "0.00", tax_amount: "0.00", shipping_cost: "0.00", other_cost: "0.00",
        });

        setItems((purchase?.items || []).map((item) => ({ ...item, key: `${item.product_id}:${item.product_variation_id || 0}` })));
    }, [form, purchase]);

    useEffect(() => {
        if (purchase || form.getFieldValue("warehouse_id") || warehouses.length === 0) return;

        const defaultWarehouse = warehouses.find((warehouse) => warehouse.is_default) || (warehouses.length === 1 ? warehouses[0] : null);

        if (defaultWarehouse) {
            form.setFieldValue("warehouse_id", defaultWarehouse.id);
        }
    }, [form, purchase, warehouses]);

    useEffect(() => {
        if (!fieldErrors) return;
        form.setFields(Object.entries(fieldErrors).filter(([name]) => !name.startsWith("items.")).map(([name, errors]) => ({ name, errors: Array.isArray(errors) ? errors : [errors] })));
    }, [fieldErrors, form]);

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_cost || 0), 0);

        const itemDiscount = items.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);
        const itemTax = items.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);
        const itemNet = subtotal - itemDiscount + itemTax;

        const grand = itemNet - Number(values.discount_amount || 0) + Number(values.tax_amount || 0) + Number(values.shipping_cost || 0) + Number(values.other_cost || 0);

        const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

        return { subtotal, itemDiscount, itemTax, itemNet, totalQuantity, grand: Math.max(0, grand) };

    }, [items, values.discount_amount, values.other_cost, values.shipping_cost, values.tax_amount]);

    const updateItem = (key, field, value) => {
        setItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value ?? 0 } : item));
        onChange();
    };

    const addItem = () => {
        const option = productOptions.find((item) => item.value === selectedProduct);

        if (!option || items.some((item) => item.key === option.value)) return;

        setItems((current) => [...current, {
            key                 : option.value,
            product_id          : option.productId,
            product_variation_id: option.variationId,
            product_name        : option.productName,
            variation_name      : option.variationName,
            sku                 : option.sku,
            quantity            : 1,
            unit_cost           : "0.00",
            discount_amount     : "0.00",
            tax_amount          : "0.00",
        }]);
        setSelectedProduct(null); onChange();
    };

    const columns = 
    [
        { 
            title: "Product", 
            key: "product", 
            render: (_, item) => 
            <div>
                <Text strong>
                    {item.product_name}
                </Text>

                {item.variation_name && 
                    <div>
                        <Text type="secondary">
                            {item.variation_name}
                        </Text>
                    </div>
                }
                
                {item.sku && 
                    <div className="purchase-item-sku">
                        {item.sku}
                    </div>
                }
            </div> 
        },
        { 
            title: "Qty", 
            width: 105, 
            render: (_, item) => <InputNumber min={1} precision={0} value={item.quantity} onChange={(value) => updateItem(item.key, "quantity", value)} /> 
        },
        { 
            title: "Unit cost", 
            width: 145, 
            render: (_, item) => <InputNumber min="0" precision={2} stringMode value={item.unit_cost} onChange={(value) => updateItem(item.key, "unit_cost", value)} /> 
        },
        { 
            title: "Discount", 
            width: 135, 
            render: (_, item) => <InputNumber min="0" precision={2} stringMode value={item.discount_amount} onChange={(value) => updateItem(item.key, "discount_amount", value)} /> 
        },
        { 
            title: "Tax", 
            width: 125, 
            render: (_, item) => 
            <InputNumber min="0" precision={2} stringMode value={item.tax_amount} onChange={(value) => updateItem(item.key, "tax_amount", value)} /> 
        },
        { 
            title: "Total", 
            width: 125, 
            render: (_, item) => 
            <Text strong>
                ৳ {money(Number(item.quantity || 0) * Number(item.unit_cost || 0) - Number(item.discount_amount || 0) + Number(item.tax_amount || 0))}
            </Text> 
        },
        { 
            title: "", 
            width: 55, 
            render: (_, item) => <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Remove ${item.product_name}`} onClick={() => { setItems((current) => current.filter((row) => row.key !== item.key)); onChange(); }} /> 
        },
    ];

    const submit = (header) => {
        if (!items.length) { form.setFields([{ name: "product_picker", errors: ["Add at least one product"] }]); return; }
        onSave({
            ...header,
            purchase_date: header.purchase_date.format("YYYY-MM-DD"),
            items: items.map((item) => ({
                product_id          : item.product_id,
                product_variation_id: item.product_variation_id,
                quantity            : item.quantity,
                unit_cost           : item.unit_cost,
                discount_amount     : item.discount_amount,
                tax_amount          : item.tax_amount,
            })),
        });
    };

    return (
        <Form form={form} layout="vertical" onFinish={submit} onValuesChange={onChange} disabled={saving} requiredMark="optional">
            {serverError && <Alert type="error" showIcon message={serverError} className="purchase-form-error" />}
            <Card className="purchase-form-card" title="Purchase information">
                <Row gutter={20}>
                    <Col xs={24} md={8}>
                    <Form.Item name="supplier_id" label="Supplier" rules={[{ required: true, message: "Select a supplier" }]}>
                        <Select
                            size="large"
                            showSearch
                            allowClear
                            placeholder="Search supplier by name, code or phone"
                            filterOption={false}
                            onSearch={onSearchSuppliers}
                            loading={supplierLoading}
                            notFoundContent={supplierLoading ? "Searching suppliers..." : "No supplier found"}
                            options={suppliers.map((item) => ({
                                value: item.id,
                                label: `${item.code} — ${item.name}`,
                            }))}
                        />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true, message: "Select a warehouse" }]}>
                            <Select size="large" showSearch optionFilterProp="label" placeholder="Select warehouse" options={warehouses.map((item) => ({ value: item.id, label: `${item.code} — ${item.name}` }))} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item name="purchase_date" label="Purchase date" rules={[{ required: true, message: "Select purchase date" }]}>
                            <DatePicker size="large" className="purchase-full-width" format="DD MMM YYYY" />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.Item name="note" label="Notes">
                            <Input.TextArea size="large" rows={3} maxLength={5000} showCount placeholder="Add an optional note about this purchase" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card className="purchase-form-card" title={<Space><ShoppingCartOutlined />Purchase items</Space>}>
                <Row gutter={12} align="bottom" className="purchase-product-picker">
                    <Col flex="auto">
                        <Form.Item name="product_picker" label="Search product or SKU" required>
                            <Select showSearch allowClear value={selectedProduct} filterOption={false} onSearch={onSearchProducts} onChange={setSelectedProduct} loading={productLoading} placeholder="Type product name or SKU" suffixIcon={<SearchOutlined />} options={productOptions.map(({ value, label }) => ({ value, label }))} />
                        </Form.Item>
                    </Col>

                    <Col>
                        <Form.Item>
                            <Button type="primary" icon={<PlusOutlined />} onClick={addItem} disabled={!selectedProduct}>
                                Add item
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>

                <Table rowKey="key" columns={columns} dataSource={items} pagination={false} scroll={{ x: 980 }} className="purchase-items-table" locale={{ emptyText: "Search and add products to this purchase" }} />
            </Card>

            <div className="purchase-financial-section">
                <Card className="purchase-cost-overview" bordered={false}>
                    <div className="purchase-cost-overview-head">
                        <span className="purchase-cost-overview-icon"><InfoCircleOutlined /></span>
                        <div>
                            <h3>Cost overview</h3>
                            <p>Review item quantities and costs before saving this purchase.</p>
                        </div>
                    </div>

                    <div className="purchase-cost-stats">
                        <div><span>Product lines</span><strong>{items.length}</strong></div>
                        <div><span>Total quantity</span><strong>{totals.totalQuantity}</strong></div>
                        <div><span>Items value</span><strong>৳ {money(totals.subtotal)}</strong></div>
                    </div>

                    <div className="purchase-cost-notice">
                        <CheckCircleOutlined />
                        <span>All totals update automatically as you change item quantities, unit costs or adjustments.</span>
                    </div>
                </Card>

                <Card className="purchase-amount-card" title={<Space><CalculatorOutlined />Amount summary</Space>}>
                    <div className="purchase-amount-readonly">
                        <span>Items subtotal</span>
                        <strong>৳ {money(totals.subtotal)}</strong>
                    </div>

                    {totals.itemDiscount > 0 && <div className="purchase-amount-readonly muted"><span>Item discounts</span><strong>− ৳ {money(totals.itemDiscount)}</strong></div>}
                    {totals.itemTax > 0 && <div className="purchase-amount-readonly muted"><span>Item taxes</span><strong>+ ৳ {money(totals.itemTax)}</strong></div>}

                    <div className="purchase-amount-divider" />

                    {[["discount_amount", "Additional discount", "−"], ["tax_amount", "Additional tax", "+"], ["shipping_cost", "Shipping cost", "+"], ["other_cost", "Other cost", "+"]].map(([name, label, sign]) => (
                        <div className="purchase-amount-input-row" key={name}>
                            <label htmlFor={`purchase-${name}`}><span className={sign === "−" ? "minus" : "plus"}>{sign}</span>{label}</label>
                            <Form.Item name={name} noStyle>
                                <InputNumber id={`purchase-${name}`} min="0" precision={2} stringMode controls={false} prefix="৳" placeholder="0.00" />
                            </Form.Item>
                        </div>
                    ))}

                    <div className="purchase-grand-total">
                        <div><span>Estimated grand total</span><small>Amount payable for this purchase</small></div>
                        <strong>৳ {money(totals.grand)}</strong>
                    </div>

                    <Text type="secondary" className="purchase-server-note">Final totals are calculated and verified by the server.</Text>
                </Card>
            </div>

            <div className="purchase-form-actions">
                <Space>
                    <Button onClick={onCancel} disabled={saving}>
                        Cancel
                    </Button>

                    <Button type="primary" htmlType="submit" loading={saving}>
                        {purchase ? "Save changes" : "Create draft purchase"}
                    </Button>
                </Space>
            </div>
        </Form>
    );
}
