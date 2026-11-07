import { CalculatorOutlined, CheckCircleOutlined, DeleteOutlined, InfoCircleOutlined, PlusOutlined, SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Table, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;
const money = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const amountFields = ["discount_amount", "vat_amount", "transport_cost", "other_cost", "paid_amount"];
const normalizePurchase = (purchase) => amountFields.reduce((result, field) => ({ ...result, [field]: Number(purchase[field] || 0) }), { ...purchase });

export default function PurchaseForm({ purchase, suppliers, supplierLoading, supplierSummary, summaryLoading, accounts, warehouses, productOptions, productLoading, productSearchText, saving, serverError, fieldErrors, onSupplierChange, onSearchSuppliers, onSearchProducts, onSave, onCancel, onChange }) {
    const [form]                                = Form.useForm();
    const [items, setItems]                     = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const values                                = Form.useWatch([], form) || {};

    useEffect(() => {
        form.resetFields();
        form.setFieldsValue(purchase ? { ...normalizePurchase(purchase), purchase_date: dayjs(purchase.purchase_date), payment_date: purchase.payment_date ? dayjs(purchase.payment_date) : dayjs() } : {
            purchase_date: dayjs(), payment_date: dayjs(), paid_amount: 0, discount_amount: 0, vat_amount: 0, transport_cost: 0, other_cost: 0,
        });

        setItems((purchase?.items || []).map((item) => ({ ...item, key: `${item.product_id}:${item.product_variation_id || 0}`, quantity: Number(item.quantity || 0), unit_cost: Number(item.unit_cost || 0), discount_amount: Number(item.discount_amount || 0), tax_amount: Number(item.tax_amount || 0) })));
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

        const grand = itemNet - Number(values.discount_amount || 0) + Number(values.vat_amount || 0) + Number(values.transport_cost || 0) + Number(values.other_cost || 0);

        const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

        return { subtotal, itemDiscount, itemTax, itemNet, totalQuantity, grand: Math.max(0, grand) };

    }, [items, values.discount_amount, values.other_cost, values.transport_cost, values.vat_amount]);

    const currentSupplierBalance   = Number(supplierSummary?.signed_balance || 0);
    const balanceBeforePayment     = currentSupplierBalance + totals.grand;
    const paidAmount               = Number(values.paid_amount || 0);
    const balanceAfterPayment      = balanceBeforePayment - paidAmount;
    const balanceAfterPaymentType  = balanceAfterPayment > 0 ? "payable" : balanceAfterPayment < 0 ? "receivable" : "settled";

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
            unit_cost           : Number(Number(option.buyPrice || 0).toFixed(2)),
            discount_amount     : 0,
            tax_amount          : 0,
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
            title: "Buy price", 
            width: 145, 
            render: (_, item) => <InputNumber min={0} precision={2} value={item.unit_cost} onChange={(value) => updateItem(item.key, "unit_cost", value)} /> 
        },
        { 
            title: "Discount", 
            width: 135, 
            render: (_, item) => <InputNumber min={0} precision={2} value={item.discount_amount} onChange={(value) => updateItem(item.key, "discount_amount", value)} /> 
        },
        { 
            title: "Tax", 
            width: 125, 
            render: (_, item) => 
            <InputNumber min={0} precision={2} value={item.tax_amount} onChange={(value) => updateItem(item.key, "tax_amount", value)} /> 
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
            payment_date: header.payment_date?.format("YYYY-MM-DD HH:mm:ss") || null,
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
                            onClear={() => onSearchSuppliers("")}
                            onChange={onSupplierChange}
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
                            <Select
                                showSearch
                                allowClear
                                value={selectedProduct}
                                filterOption={false}
                                onSearch={onSearchProducts}
                                onClear={() => onSearchProducts("")}
                                onChange={setSelectedProduct}
                                loading={productLoading}
                                placeholder="Type product name or SKU"
                                suffixIcon={<SearchOutlined />}
                                notFoundContent={productLoading ? "Searching products..." : productSearchText ? "No matching product found" : "Type a product name or SKU to search"}
                                options={productOptions}
                                optionRender={(option) => (
                                    <div className="purchase-product-option">
                                        <Avatar shape="square" size={42} src={option.data.image} icon={<ShoppingCartOutlined />} />
                                        <div>
                                            <strong>{option.data.productName}</strong>
                                            <span>{[option.data.variationName, option.data.sku ? `SKU: ${option.data.sku}` : null, `Buy: ৳${money(option.data.buyPrice)}`].filter(Boolean).join(" • ")}</span>
                                        </div>
                                    </div>
                                )}
                            />
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
                        <span className="purchase-cost-overview-icon">
                            <InfoCircleOutlined />
                        </span>

                        <div>
                            <h3>Cost overview</h3>
                            <p>Review item quantities and costs before saving this purchase.</p>
                        </div>
                    </div>

                    <div className="purchase-cost-stats">
                        <div>
                            <span>Product lines</span>
                            <strong>{items.length}</strong>
                        </div>

                        <div>
                            <span>Total quantity</span>
                            <strong>{totals.totalQuantity}</strong>
                        </div>

                        <div>
                            <span>Items value</span>
                            <strong>৳ {money(totals.subtotal)}</strong>
                        </div>
                    </div>

                    <div className="purchase-cost-notice">
                        <CheckCircleOutlined />
                        <span>All totals update automatically as you change item quantities, buy prices or adjustments.</span>
                    </div>
                </Card>

                <Card className="purchase-amount-card" title={<Space><CalculatorOutlined />Amount summary</Space>}>
                    <div className="purchase-amount-readonly">
                        <span>Items subtotal</span>
                        <strong>৳ {money(totals.subtotal)}</strong>
                    </div>

                    {totals.itemDiscount > 0 && 
                        <div className="purchase-amount-readonly muted">
                            <span>Item discounts</span>
                            <strong>− ৳ {money(totals.itemDiscount)}</strong>
                        </div>
                    }

                    {totals.itemTax > 0 && 
                        <div className="purchase-amount-readonly muted">
                            <span>Item taxes</span>
                            <strong>+ ৳ {money(totals.itemTax)}</strong>
                        </div>
                    }

                    <div className="purchase-amount-divider" />

                    {[["discount_amount", "Additional discount", "−"], ["vat_amount", "VAT amount", "+"], ["transport_cost", "Transport cost", "+"], ["other_cost", "Other cost", "+"]].map(([name, label, sign]) => (
                        <div className="purchase-amount-input-row" key={name}>
                            <label htmlFor={`purchase-${name}`}><span className={sign === "−" ? "minus" : "plus"}>{sign}</span>{label}</label>
                            <Form.Item name={name} noStyle>
                                <InputNumber id={`purchase-${name}`} min={0} precision={2} controls={false} prefix="৳" placeholder="0" />
                            </Form.Item>
                        </div>
                    ))}

                    <div className="purchase-grand-total">
                        <div><span>Estimated grand total</span><small>Amount payable for this purchase</small></div>
                        <strong>৳ {money(totals.grand)}</strong>
                    </div>

                    {values.supplier_id && <div className="purchase-supplier-reconciliation">
                        {summaryLoading ? <div className="purchase-balance-loading">Loading supplier balance…</div> : supplierSummary && <>
                            <div className="purchase-balance-title">
                                <div>
                                    <strong>Supplier balance overview</strong>
                                    <span>Live balance after this purchase and entered payment.</span>
                                </div>

                                <span className={`supplier-balance-badge ${balanceAfterPaymentType}`}>
                                    {balanceAfterPaymentType}
                                </span>
                            </div>

                            <div className="purchase-balance-equation raw-material-balance-equation">
                                <div>
                                    <span>Current balance</span>
                                    <strong className={supplierSummary.balance_type}>৳ {money(supplierSummary.current_balance)}</strong>
                                    <small>{supplierSummary.balance_type}</small>
                                </div>

                                <b>+</b>

                                <div>
                                    <span>This purchase</span>
                                    <strong>৳ {money(totals.grand)}</strong>
                                    <small>Grand total</small>
                                </div>

                                <b>−</b>

                                <div>
                                    <span>Amount paid</span>
                                    <strong>৳ {money(paidAmount)}</strong>
                                    <small>Entered below</small>
                                </div>
                            </div>

                            <div className={`raw-material-final-balance ${balanceAfterPaymentType}`}>
                                <div>
                                    <span>Balance after payment</span>
                                    <small>{balanceAfterPaymentType === "payable" ? "You will owe the supplier" : balanceAfterPaymentType === "receivable" ? "Supplier will owe you" : "Supplier account will be settled"}</small>
                                </div>

                                <strong>৳ {money(Math.abs(balanceAfterPayment))}</strong>

                                <span className={`supplier-balance-badge ${balanceAfterPaymentType}`}>
                                    {balanceAfterPaymentType}
                                </span>
                            </div>
                            {balanceBeforePayment > 0 && 
                                <Button block className="purchase-pay-full-button" onClick={() => { form.setFieldValue("paid_amount", Number(balanceBeforePayment.toFixed(2))); onChange(); }}>
                                    Pay full supplier balance · ৳ {money(balanceBeforePayment)}
                                </Button>
                            }
                        </>}
                    </div>}

                    <div className="purchase-payment-inline">
                        <div className="purchase-payment-inline-title">
                            <strong>Payment at purchase</strong>
                            <span>Posted only when this purchase is completed.</span>
                        </div>

                        <Form.Item name="paid_amount" label="Amount paid" rules={[{ required: true, message: "Enter paid amount" }]}>
                            <InputNumber min={0} controls={false} prefix="৳" placeholder="0" style={{ width: "100%" }} />
                        </Form.Item>

                        <Form.Item name="payment_account_id" label="Payment account" required={Number(values.paid_amount || 0) > 0} extra={Number(values.paid_amount || 0) > 0 ? "Required because a payment amount has been entered." : "Not required when no payment is made."} dependencies={["paid_amount"]} rules={[({ getFieldValue }) => ({ validator(_, value) { return Number(getFieldValue("paid_amount") || 0) <= 0 || value ? Promise.resolve() : Promise.reject(new Error("Select the account used for this payment")); } })]}>
                            <Select allowClear showSearch optionFilterProp="label" placeholder="Select account" options={accounts.map((account) => ({ value: account.id, label: `${account.code} — ${account.name}` }))} />
                        </Form.Item>

                        <Form.Item name="payment_date" label="Payment date" required={Number(values.paid_amount || 0) > 0}>
                            <DatePicker showTime className="purchase-full-width" format="DD MMM YYYY, hh:mm A" />
                        </Form.Item>

                        <Form.Item name="transaction_reference" label="Transaction reference">
                            <Input maxLength={255} placeholder="Cheque, bank or MFS reference" />
                        </Form.Item>

                        <Form.Item name="payment_note" label="Payment note">
                            <Input.TextArea rows={2} maxLength={5000} placeholder="Optional payment details" />
                        </Form.Item>
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
                        {purchase ? "Save Changes" : "Create Draft Purchase"}
                    </Button>
                </Space>
            </div>
        </Form>
    );
}
