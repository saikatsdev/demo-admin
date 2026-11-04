import{CheckCircleOutlined,DeleteOutlined,EditOutlined,PlusOutlined,SearchOutlined}from"@ant-design/icons";
import{Button,Card,Input,Popconfirm,Result,Space,Table,Tag,message}from"antd";
import dayjs from"dayjs";
import{useCallback,useEffect,useState}from"react";
import{useNavigate}from"react-router-dom";
import{usePermission}from"../../../../hooks/usePermission";
import useTitle from"../../../../hooks/useTitle";
import{completeStockTransfer,deleteStockTransfer,getStockTransfers}from"../../api/stockTransferApi";
import"../../styles/stock-adjustment.css";

const responseMessage = (response, fallback) => Object.values(response?.errors || {}).flat()[0] || response?.message || response?.msg || fallback;

export default function StockTransfer(){
    const {can}                = usePermission()
    const nav                  = useNavigate()
    const ok                   = can("stock-transfers-read")
    const [data,setData]       = useState([])
    const [meta,setMeta]       = useState({})
    const [q,setQ]             = useState("")
    const [loading,setLoading] = useState(false)
    const [api,holder]         = message.useMessage();
    
    useTitle("Warehouse Transfers | Inventory & Stock");

    const load = useCallback(async(page=1,size=25) => {
        if(!ok)return;
        setLoading(true);

        const r = await getStockTransfers({search_key:q,page,paginate_size:size});
        setLoading(false);
        if(r?.success){
            setData(r.result?.data||[]);
            setMeta(r.result?.meta||{})
        }
    },[ok,q]);

    useEffect(() => {
        const t = setTimeout(()=>load(),350);
        return() => clearTimeout(t)
    },[load]);

    const act = async(fn,id) => {
        const r = await fn(id);
        if (!r?.success) {
            api.error(responseMessage(r, "Action failed"));
            return;
        }

        api.success(responseMessage(r, "Transfer updated successfully"));
        await load(meta.current_page,meta.per_page);
    };
    
    if(!ok) return <Result status="403" title="Stock transfer access required"/>;
    
    const cols = 
    [
        {
            title:"SL",
            width:60,
            render:(_,__,i)=>(meta.current_page-1)*meta.per_page+i+1
        },
        {
            title:"Transfer",
            dataIndex:"transfer_no"
        },
        {
            title:"Date",
            dataIndex:"transfer_date",
            render:v=>dayjs(v).format("DD MMM YYYY")
        },
        {
            title:"From",
            render:(_,r)=>r.source_warehouse?.name
        },
        {
            title:"To",
            render:(_,r)=>r.destination_warehouse?.name
        },
        {
            title    : "Item type",
            dataIndex: "item_type",
            render   : v => <Tag style={{textTransform:"capitalize"}} color = {v === "product"?"blue":"purple"}>{v.replace("_"," ")}</Tag>
        },
        {
            title:"Status",
            dataIndex:"status",
            render: v => <Tag style={{textTransform:"capitalize"}} color={v === "completed"?"green":"gold"}>{v}</Tag>
        },
        {
            title:"Actions",
            width:130,render:(_,r) => 
            <Space>
                {r.status === "draft" && can("stock-transfers-update") && 
                    <>
                        <Button type="text" icon={<EditOutlined/>} onClick={()=>nav(`/stock-transfers/${r.id}/edit`)}/>

                        <Popconfirm title="Complete this transfer?" description="Source stock will decrease and destination stock will increase." onConfirm={()=>act(completeStockTransfer,r.id)}>
                            <Button type="text" icon={<CheckCircleOutlined/>}/>
                        </Popconfirm>
                    </>
                }
                {r.status === "draft" && can("stock-transfers-delete") && 
                    <Popconfirm title="Delete this draft?" onConfirm={() => act(deleteStockTransfer,r.id)}>
                        <Button type="text" danger icon={<DeleteOutlined/>}/>
                    </Popconfirm>
                }
            </Space>
        }

    ];
    return (
        <div className="stock-adjustment-page">
            {holder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Warehouse Transfers</h1>
                    <p className="stock-subtitle">Move product or raw material stock safely between warehouses.</p>
                </div>
            </div>

            <Card className="stock-shell" styles={{body:{padding:0}}}>
                <div className="stock-adjustment-head">
                    <Input prefix={<SearchOutlined/>} allowClear value={q} onChange={e=>setQ(e.target.value)} placeholder="Search transfer number" className="stock-search"/>
                    {can("stock-transfers-create") && 
                        <Button type="primary" icon={<PlusOutlined/>} onClick={()=>nav("/stock-transfers/create")}>
                            Create transfer
                        </Button>
                    }
                </div>

                <Table rowKey="id" columns={cols} dataSource={data} loading={loading} scroll={{x:1000}} pagination={{
                    current : meta.current_page||1,
                    pageSize: meta.per_page||25,
                    total   : meta.total||0,
                    onChange: load
                }}/>
            </Card>
        </div>
    );
}
