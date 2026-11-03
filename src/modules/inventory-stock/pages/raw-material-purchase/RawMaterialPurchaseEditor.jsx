import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Result, Row, Select, Space, Table, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { getAccountList } from "../../../accounting/api/accountApi";
import { getSupplierFinancialSummary, getSupplierList, getWarehouseList } from "../../api";
import { createRawMaterialPurchase, getRawMaterialList, getRawMaterialPurchase, updateRawMaterialPurchase } from "../../api/rawMaterialApi";

const rows              = (r) => r?.result?.data || r?.result || [];
const money             = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const amountFields      = ["discount_amount", "vat_amount", "transport_cost", "other_cost", "paid_amount"];
const normalizePurchase = (purchase) => amountFields.reduce((result, field) => ({ ...result, [field]: Number(purchase[field] || 0) }), { ...purchase });

export default function RawMaterialPurchaseEditor(){
    const {id}                                 = useParams();
    const editing                              = Boolean(id);
    const navigate                             = useNavigate();
    const {can}                                = usePermission();
    const allowed                              = can(editing?"raw-material-purchases-update":"raw-material-purchases-create");
    const [form]                               = Form.useForm();
    const [materials,setMaterials]             = useState([]);
    const [suppliers,setSuppliers]             = useState([]);
    const [warehouses,setWarehouses]           = useState([]);
    const [accounts,setAccounts]               = useState([]);
    const [items,setItems]                     = useState([]);
    const [selected,setSelected]               = useState();
    const [supplierSummary,setSupplierSummary] = useState(null);
    const [summaryLoading,setSummaryLoading]   = useState(false);
    const [saving,setSaving]                   = useState(false);
    const [error,setError]                     = useState("");
    const [messageApi,contextHolder]           = message.useMessage();
    const values                               = Form.useWatch([],form)||{};

    useTitle(`${editing?"Edit":"Create"} Raw Material Purchase`);

    useEffect(() => {
        if(!allowed){
            return;
        }

        Promise.all([
            getSupplierList({limit:50}),
            getWarehouseList(),
            getAccountList(),
            getRawMaterialList({limit:50}),
            editing ? getRawMaterialPurchase(id) : Promise.resolve(null)
        ]).then(([s,w,a,m,p]) => {
            setSuppliers(rows(s));
            setWarehouses(rows(w));
            setAccounts(rows(a));
            setMaterials(rows(m));

            if(p?.result){
                form.setFieldsValue({
                    ...normalizePurchase(p.result),
                    purchase_date:dayjs(p.result.purchase_date),
                    payment_date:p.result.payment_date ? dayjs(p.result.payment_date):dayjs()
                });

                setItems((p.result.items||[]).map(x=>({...x,key:x.raw_material_id,quantity:Number(x.quantity||0),
                    unit_cost:Number(x.unit_cost||0),
                    discount_amount:Number(x.discount_amount||0),
                    tax_amount:Number(x.tax_amount||0)})));
            }else{
                const ws = rows(w);
                form.setFieldsValue({
                    purchase_date:dayjs(),
                    payment_date:dayjs(),
                    paid_amount:0,
                    discount_amount:0,
                    vat_amount:0,
                    transport_cost:0,
                    other_cost:0,
                    warehouse_id:ws.find(x=>x.is_default)?.id||(ws.length===1?ws[0].id:undefined)
                });
            }
        }
    )},[allowed,editing,form,id]);

    useEffect(() => {
        const supplierId = values.supplier_id;
        if(!supplierId){
            setSupplierSummary(null);
            return;
        }

        let active = true;

        setSummaryLoading(true);

        getSupplierFinancialSummary(supplierId).then(r => {
            if(active){
                setSupplierSummary(r?.success?r.result:null)
            }
        }).finally(() => {
            if(active){
                setSummaryLoading(false);
            }
        });

        return() => {active = false}
    },[values.supplier_id]);

    const totals = useMemo(()=>{
        const subtotal = items.reduce((n,x) => n + Number(x.quantity) * Number(x.unit_cost),0);
        const net = items.reduce((n,x) => n + Number(x.quantity) * Number(x.unit_cost) - Number(x.discount_amount||0) + Number(x.tax_amount||0),0);
        return{
            subtotal,
            grand:Math.max(0,net-Number(values.discount_amount||0) + Number(values.vat_amount||0) + Number(values.transport_cost||0) + Number(values.other_cost||0))
        }
    },[items,values]);

    const currentSigned = Number(supplierSummary?.signed_balance||0);
    const paidAmount    = Number(values.paid_amount || 0);
    const beforePayment = currentSigned + totals.grand;
    const finalBalance  = beforePayment - paidAmount;
    const finalType     = finalBalance > 0 ? "payable" : finalBalance < 0 ? "receivable" : "settled";

    const add=() => {
        const m = materials.find(x=>x.id === selected);
        if(!m || items.some(x => x.raw_material_id === m.id)) return;
        setItems(x => [
            ...x,{
                key            : m.id,
                raw_material_id: m.id,
                material_name  : m.name,
                material_code  : m.code,
                unit           : m.unit,
                quantity       : 1,
                unit_cost      : Number(Number(m.buy_price||0).toFixed(2)),
                discount_amount: 0,
                tax_amount     : 0
            }
        ]);
        setSelected();
    };

    const update = (key,k,v) => setItems(x => x.map(i => i.key === key ? {...i,[k] : v ?? 0} : i));

    const submit = async(v) => {
        if(!items.length){
            setError("Add at least one raw material");
            return;
        }

        setSaving(true);
        setError("");
        const payload={
            ...v,
            purchase_date:v.purchase_date.format("YYYY-MM-DD"),
            payment_date:v.payment_date?.format("YYYY-MM-DD HH:mm:ss"),
            items
        };

        const r = editing ? await updateRawMaterialPurchase(id,payload) : await createRawMaterialPurchase(payload);
        setSaving(false);

        if(!r?.success){
            setError(Object.values(r?.errors||{}).flat()[0]||r?.msg||"Unable to save purchase");
            return;
        }

        messageApi.success(r.msg);

        navigate("/raw-material-purchases");
    };

    if(!allowed){
        return <Result status="403" title="Raw material purchase access required"/>;
    }

    const columns = 
    [
        {
            title : "Raw material",
            render:(_,x) => 
            <div>
                <b>
                    {x.material_name}
                </b>

                <div className="purchase-entity-code">
                    {x.material_code} · {x.unit}
                </div>
            </div>
        },
        {
            title : "Quantity",
            width : 150,
            render : (_,x) => <InputNumber min={0.0001} value={x.quantity} onChange={v=>update(x.key,"quantity",v)} style={{width:"100%"}}/>
        },
        {
            title : "Buy price",
            width : 150,
            render : (_,x) => <InputNumber min={0} prefix="৳" value={x.unit_cost} onChange={v=>update(x.key,"unit_cost",v)} style={{width:"100%"}}/>
        },
        {
            title : "Total",
            width : 130,
            align : "right",
            render:(_,x) => `৳ ${money(Number(x.quantity) * Number(x.unit_cost))}`
        },
        {
            width : 50,
            render:(_,x) => <Button type="text" danger icon={<DeleteOutlined/>} onClick={()=>setItems(i=>i.filter(y=>y.key!==x.key))}/>
        }
    ];

    return (
        <div className="purchase-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <Button className="purchase-back-button" icon={<ArrowLeftOutlined/>} onClick={()=>navigate("/raw-material-purchases")}>
                        Back to purchases
                    </Button>

                    <h1 className="title">
                        {editing?"Edit":"Create"} raw material purchase
                    </h1>

                    <p className="purchase-subtitle">
                        Save a draft first. Complete it from the register to post stock, ledger and payment.
                    </p>
                </div>
            </div>

            <Form form={form} layout="vertical" onFinish={submit}>
                <Row gutter={20}>
                    <Col xs={24} xl={16}>
                        <Card className="purchase-form-card" title="Purchase information">
                            {error && 
                                <Alert type="error" showIcon message = {error} style={{marginBottom:16}}/>
                            }

                            <Row gutter={16}>
                                <Col xs={24} md={8}>
                                    <Form.Item name="supplier_id" label="Supplier" rules={[{required:true}]}>
                                        <Select showSearch optionFilterProp="label" options={suppliers.map(x=>({value:x.id,label:`${x.code} — ${x.name}`}))}/>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item name="warehouse_id" label="Warehouse" rules={[{required:true}]}>
                                        <Select options={warehouses.map(x=>({value:x.id,label:`${x.code} — ${x.name}`}))}/>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item name="purchase_date" label="Purchase date" rules={[{required:true}]}>
                                        <DatePicker style={{width:"100%"}}/>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Space.Compact style={{width:"100%",marginBottom:16}}>
                                <Select showSearch optionFilterProp="label" value={selected} onChange={setSelected} placeholder="Search raw material" style={{flex:1}} options={materials.map(x=>({value:x.id,label:`${x.code} — ${x.name} (${x.unit})`}))}/>
                                    
                                <Button type="primary" icon={<PlusOutlined/>} onClick={add}>Add item</Button>
                            </Space.Compact>

                            <Table rowKey="key" pagination={false} columns={columns} dataSource={items}/>

                            <Form.Item name="note" label="Purchase note" style={{marginTop:16}}>
                                <Input.TextArea rows={3}/>
                            </Form.Item>
                        </Card>
                    </Col>

                    <Col xs={24} xl={8}>
                        <Card className="purchase-form-card" title="Amount summary">
                            <div className="purchase-summary-row">
                                <span>Subtotal</span>
                                <b>৳ {money(totals.subtotal)}</b>
                            </div>

                            {[
                                ["discount_amount","Discount"],
                                ["vat_amount","VAT"],
                                ["transport_cost","Transport cost"],
                                ["other_cost","Other cost"]
                            ].map(([n,l]) => 
                                <Form.Item key={n} name={n} label={l}>
                                    <InputNumber min={0} prefix="৳" placeholder="0" style={{width:"100%"}}/>
                                </Form.Item>
                            )}
                            
                            <div className="purchase-grand-total">
                                <span>Grand total</span>
                                <strong>৳ {money(totals.grand)}</strong>
                            </div>

                            {values.supplier_id && 
                                <div className="purchase-supplier-reconciliation">
                                    {summaryLoading ? 
                                        <div className="purchase-balance-loading">
                                            Loading supplier balance…
                                        </div> : 
                                        supplierSummary && 
                                        <>
                                            <div className="purchase-balance-title">
                                                <div>
                                                    <strong>Supplier balance reconciliation</strong>
                                                    <span>Live balance after this purchase and payment.</span>
                                                </div>
                                                
                                                <span className={`supplier-balance-badge ${finalType}`}>
                                                    {finalType}
                                                </span>
                                            </div>

                                            <div className="purchase-balance-equation raw-material-balance-equation">
                                                <div>
                                                    <span>Current balance</span>
                                                    <strong>৳ {money(supplierSummary.current_balance)}</strong>
                                                    <small>{supplierSummary.balance_type}</small>
                                                </div>

                                                <b> + </b>

                                                <div>
                                                    <span>This purchase</span>
                                                    <strong>৳ {money(totals.grand)}</strong>
                                                    <small>grand total</small>
                                                </div>

                                                <b> − </b>

                                                <div>
                                                    <span>Payment</span>
                                                    <strong>৳ {money(paidAmount)}</strong>
                                                    <small>entered below</small>
                                                </div>
                                            </div>
                                            
                                            <div className={`raw-material-final-balance ${finalType}`}>
                                                <div>
                                                    <span>Balance after payment</span>
                                                    <small>
                                                        {finalType === "payable" ? "You will owe the supplier" : finalType === "receivable" ? "Supplier will owe you" : "Account will be settled"}
                                                    </small>
                                                </div>

                                                <strong>৳ {money(Math.abs(finalBalance))}</strong><span className={`supplier-balance-badge ${finalType}`}>{finalType}</span>
                                            </div>

                                            {beforePayment > 0 && 
                                                <Button block className="purchase-pay-full-button" onClick={()=>form.setFieldValue("paid_amount",Number(beforePayment.toFixed(2)))}>
                                                    Pay full balance · ৳ {money(beforePayment)}
                                                </Button>
                                            }
                                        </>
                                    }
                                </div>
                            }

                            <Form.Item name="paid_amount" label="Payment at purchase">
                                <InputNumber min={0} prefix="৳" placeholder="0" style={{width:"100%"}}/>
                            </Form.Item>

                            <Form.Item name="payment_account_id" label="Payment account" rules={[({getFieldValue})=>({validator(_,v){ return Number(getFieldValue("paid_amount")||0) <= 0 || v ? Promise.resolve() : Promise.reject(new Error("Select payment account"))}})]}>
                                <Select allowClear options={accounts.map(x => ({value : x.id,label : `${x.code} — ${x.name}`}))}/>
                            </Form.Item>

                            <Form.Item name="payment_date" label="Payment date">
                                <DatePicker showTime style={{width:"100%"}}/>
                            </Form.Item>

                            <Form.Item name="transaction_reference" label="Reference">
                                <Input/>
                            </Form.Item>

                            <Form.Item name="payment_note" label="Payment note">
                                <Input.TextArea rows={2}/>
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>

                <div className="purchase-form-actions">
                    <Button onClick={()=>navigate("/raw-material-purchases")}>
                        Cancel
                    </Button>
                    
                    <Button type="primary" htmlType="submit" loading={saving}>
                        {editing?"Save changes":"Create draft purchase"}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
