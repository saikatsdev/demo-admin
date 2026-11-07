import { CheckCircleOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, Popconfirm, Result, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { completeRawMaterialPurchase, deleteRawMaterialPurchase, getRawMaterialPurchase, getRawMaterialPurchases } from "../../api/rawMaterialApi";
import RawMaterialPurchaseInvoice from "../../components/raw-material-purchase/RawMaterialPurchaseInvoice";
import "../../styles/purchase.css";
import "../../styles/raw-material-purchase-invoice.css";

export default function RawMaterialPurchase(){
    const {can}                              = usePermission();
    const navigate                           = useNavigate();
    const [rows,setRows]                     = useState([]);
    const [total,setTotal]                   = useState(0);
    const [loading,setLoading]               = useState(false);
    const [search,setSearch]                 = useState("");
    const [page,setPage]                     = useState(1);
    const [invoice,setInvoice]               = useState(null);
    const [invoiceLoading,setInvoiceLoading] = useState(null);
    const [messageApi,contextHolder]         = message.useMessage();

    useTitle("Raw Material Purchases | Inventory & Stock");

    const load = async() => {
        setLoading(true);
        const r = await getRawMaterialPurchases({search_key:search,page,paginate_size:20});

        setLoading(false);

        if(r?.success){
            const list=Array.isArray(r.result)?r.result:(r.result?.data||[]);

            setRows(list);

            setTotal(r.result?.meta?.total??r.result?.total??list.length);
        }
    };

    useEffect(() => { 
        const t = setTimeout(load,300); 
        return()=>clearTimeout(t)
    },[page,search]);
 
    const act = async(fn,id) => { 
        const r = await fn(id);

        if(r?.success){
            messageApi.success(r.msg);
            load()
        }else {
            messageApi.error(r?.msg||"Unable to complete action")
        }
    };


    const viewInvoice = async(record) => {
        setInvoiceLoading(record.id);

        try {
            const r = await getRawMaterialPurchase(record.id);

            if(r?.success){
                setInvoice(r.result);
            }else{
                messageApi.error(r?.msg || r?.message || "Unable to load raw material purchase invoice");
            }
        } catch {
            messageApi.error("Unable to load raw material purchase invoice");
        } finally {
            setInvoiceLoading(null);
        }
    };

    if(!can("raw-material-purchases-read")){
        return <Result status="403" title="Raw material purchase access required"/>;
    }

    const columns = 
    [
        {
            title:"SL",
            width:60,
            render:(_,__,i) => (page-1) * 20 + i + 1
        },
        {
            title:"Purchase",
            dataIndex:"purchase_no",
            render: v => <Typography.Text strong className="purchase-number">{v}</Typography.Text>
        },
        {
            title:"Date",
            dataIndex:"purchase_date",
            render : v=>dayjs(v).format("DD MMM YYYY")
        },
        {
            title:"Supplier",
            render:(_,r) => 
            <div>
                <b>
                    {r.supplier?.name}
                </b>

                <div className="purchase-entity-code">
                    {r.supplier?.code}
                </div>
            </div>
        },
        {
            title:"Warehouse",
            render:(_,r)=>r.warehouse?.name
        },
        {
            title:"Grand total",
            dataIndex:"grand_total",
            align:"right",
            render:v=>`৳ ${Number(v).toFixed(2)}`
        },
        {
            title:"Due",
            dataIndex:"due_amount",
            align:"right",
            render:v=>`৳ ${Number(v).toFixed(2)}`
        },
        {
            title:"Status",
            render:(_,r) => 
            <Space>
                <Tag color={r.status === "completed" ? "green" : "gold"} style={{textTransform:"capitalize"}}>
                    {r.status}
                </Tag>

                <Tag color={r.payment_status==="paid" ? "green" : r.payment_status==="partial" ? "blue" : "red"} style={{textTransform:"capitalize"}}>
                    {r.payment_status}
                </Tag>
            </Space>
        },
        {
            title:"Actions",
            width:135,
            render:(_,r) => 
            <Space>
                <Tooltip title="View invoice">
                    <Button
                        type="text"
                        className="raw-purchase-invoice-action"
                        icon={<FileTextOutlined/>}
                        loading={invoiceLoading === r.id}
                        disabled={invoiceLoading !== null && invoiceLoading !== r.id}
                        onClick={()=>viewInvoice(r)}
                    />
                </Tooltip>
                {r.status === "draft" && can("raw-material-purchases-update") && 
                    <>
                        <Button type="text" icon={<EditOutlined/>} onClick={()=>navigate(`/raw-material-purchases/${r.id}/edit`)}/>
                        <Popconfirm title="Complete this purchase?" description="Stock, supplier ledger and payment will be posted." onConfirm={()=>act(completeRawMaterialPurchase,r.id)}>
                            <Button type="text" className="purchase-complete-action" icon={<CheckCircleOutlined/>}/>
                        </Popconfirm>
                    </>
                }

                {r.status === "draft" && can("raw-material-purchases-delete") && 
                    <Popconfirm title="Delete this draft?" onConfirm={()=>act(deleteRawMaterialPurchase,r.id)}>
                        <Button type="text" danger icon={<DeleteOutlined/>}/>
                    </Popconfirm>
                }
            </Space>
        }
    ];

    return (
        <div className="purchase-page">
            {contextHolder}
            {invoice && <RawMaterialPurchaseInvoice purchase={invoice} onClose={()=>setInvoice(null)} />}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Raw Material Purchases</h1>
                    <p className="purchase-subtitle">Purchase production inputs and post them to warehouse stock.</p>
                </div>
            </div>

            <Card className="purchase-directory" styles={{body:{padding:0}}}>
                <div className="purchase-directory-header">
                    <div>
                        <Typography.Text strong className="purchase-directory-title">
                            Purchase register
                        </Typography.Text>

                        <div>
                            <Typography.Text type="secondary">
                                {total} purchase{total === 1 ? "" : "s"}
                            </Typography.Text>
                        </div>
                    </div>

                    {can("raw-material-purchases-create") && 
                        <Button type="primary" icon={<PlusOutlined/>} onClick={()=>navigate("/raw-material-purchases/create")}>
                            Create Purchase
                        </Button>
                    }
                </div>

                <div className="purchase-toolbar">
                    <Input allowClear prefix={<SearchOutlined/>} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search purchase or supplier" className="purchase-search raw-material-purchase-search"/>
                </div>

                <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} scroll={{x:1150}} pagination={{current:page,pageSize:20,total,onChange:setPage}}/>
            </Card>
        </div>
    );
}
