import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, Popconfirm, Result, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { deleteRawMaterial, getRawMaterials } from "../../api/rawMaterialApi";

export default function RawMaterial() {
    const { can }=usePermission(); 
    const navigate=useNavigate(); 
    const [rows,setRows]=useState([]); 
    const [total,setTotal]=useState(0); 
    const [loading,setLoading]=useState(false); 
    const [search,setSearch]=useState(""); 
    const [page,setPage]=useState(1); 
    const [messageApi,contextHolder]=message.useMessage(); 
    useTitle("Raw Materials | Inventory & Stock");

    const load = async()=>{
        setLoading(true);

        const r = await getRawMaterials({
            search_key:search,
            page,paginate_size:20
        });

        setLoading(false);

        if(r?.success){
            const list = Array.isArray(r.result) ? r.result:(r.result?.data||[]);
            setRows(list);
            setTotal(r.result?.meta?.total ?? r.result?.total ?? list.length);
        }
    };

    useEffect(()=>{
        const t = setTimeout(load,300); 
        return() => clearTimeout(t);
    },[page,search]);

    if(!can("raw-materials-read")){
        return <Result status="403" title="Raw material access required"/>;
    }

    const columns = 
    [
        {
            title : "SL",
            width : 60,
            render: (_,__,i) => (page-1)*20+i+1
        },
        {
            title:"Material",
            render:(_,r) => 
            <div>
                <Typography.Text strong>
                    {r.name}
                </Typography.Text>

                <div className="purchase-entity-code">
                    {r.code}
                </div>
            </div>
        },
        {
            title:"Unit",
            dataIndex:"unit"
        },
        {
            title:"Buy price",
            dataIndex:"buy_price",
            render: v => `৳ ${Number(v).toFixed(2)}`
        },
        {
            title:"Current stock",
            render:(_,r) => 
            <Typography.Text strong>
                {Number(r.current_stock||0).toLocaleString()} {r.unit}
            </Typography.Text>
        },
        {
            title:"Alert at",
            render:(_,r) => r.alert_quantity ? `${r.alert_quantity} ${r.unit}` : "—"
        },
        {
            title:"Status",
            dataIndex:"status",
            render : v => <Tag style={{textTransform: "capitalize"}} color={v==="active"?"green":"default"}>{v}</Tag>
        },
        {
            title:"Actions",
            width:110,
            render:(_,r) => 
            <Space>
                <Button type="text" icon={<EditOutlined/>} disabled={!can("raw-materials-update")} onClick={()=>navigate(`/raw-materials/${r.id}/edit`)}/>

                <Popconfirm title="Delete this raw material?" onConfirm = {async()=>{const x = await deleteRawMaterial(r.id);x?.success?(messageApi.success(x.msg),load()):messageApi.error(x?.msg)}}>
                    <Button type="text" danger icon={<DeleteOutlined/>} disabled={!can("raw-materials-delete")}/>
                </Popconfirm>
            </Space>
        }
    ];

    return (
        <div className="purchase-page">
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Raw Materials</h1>
                    <p className="purchase-subtitle">Manage production inputs and their warehouse stock identity.</p>
                </div>
            </div>

            <Card className="purchase-directory" styles={{body:{padding:0}}}>
                <div className="purchase-directory-header">
                    <Input allowClear prefix={<SearchOutlined/>} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search code or material" className="purchase-search"/>

                    {can("raw-materials-create")&&
                        <Button type="primary" icon={<PlusOutlined/>} onClick={() => navigate("/raw-materials/create")}>
                            Add raw material
                        </Button>
                    }
                </div>

                <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{current:page,pageSize:20,total,onChange:setPage}} scroll={{x:1000}}/>
            </Card>
        </div>
    );
}
