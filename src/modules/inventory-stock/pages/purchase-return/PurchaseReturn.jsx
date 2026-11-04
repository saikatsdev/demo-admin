import {CheckCircleOutlined,DeleteOutlined,EditOutlined,PlusOutlined,SearchOutlined} from "@ant-design/icons";

import {Button,Card,Input,Popconfirm,Result,Select,Space,Table,Tag,message} from "antd";

import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";

import {completePurchaseReturn,deletePurchaseReturn,getPurchaseReturns} from "../../api/purchaseReturnApi";

import "../../styles/stock-adjustment.css";

const msg = (r, f) => Object.values(r?.errors || {}).flat()[0] || r?.message || r?.msg || f;

export default function PurchaseReturn() {
    const { can }               = usePermission();
    const nav                   = useNavigate();
    const ok                    = can("purchase-returns-read");
    const [data, setData]       = useState([]);
    const [meta, setMeta]       = useState({});
    const [q, setQ]             = useState("");
    const [type, setType]       = useState();
    const [loading, setLoading] = useState(false);
    const [api, holder]         = message.useMessage();

    useTitle("Purchase Returns | Inventory & Stock");

    const load = useCallback(async (page = 1, size = 25) => {
        if (!ok) return;

        setLoading(true);

        const r = await getPurchaseReturns({
            search_key: q,
            return_type: type,
            page,
            paginate_size: size,
        });

        setLoading(false);

        if (r?.success) {
            setData(r.result?.data || []);
            setMeta(r.result?.meta || {});
        }
    }, [ok, q, type]);

    useEffect(() => {
        const t = setTimeout(() => load(), 350);

        return () => clearTimeout(t);
    }, [load]);

    const act = async (fn, id) => {
        const r = await fn(id);

        if (!r?.success) {
            return api.error(msg(r, "Action failed"));
        }

        api.success(msg(r, "Return updated"));
        load(meta.current_page, meta.per_page);
    };

    if (!ok) {
        return <Result status="403" title="Purchase return access required" />;
    }

    const cols = 
    [
        {
            title: "SL",
            width: 60,
            render: (_, __, i) =>
                (meta.current_page - 1) * meta.per_page + i + 1,
        },
        {
            title: "Return",
            dataIndex: "return_no",
        },
        {
            title: "Date",
            dataIndex: "return_date",
            render: (v) => dayjs(v).format("DD MMM YYYY"),
        },
        {
            title: "Original purchase",
            render: (_, r) => r.source_purchase?.purchase_no,
        },
        {
            title: "Supplier",
            render: (_, r) => r.supplier?.name,
        },
        {
            title: "Warehouse",
            render: (_, r) => r.warehouse?.name,
        },
        {
            title: "Type",
            dataIndex: "return_type",
            render: (v) => (
                <Tag color={v === "product" ? "blue" : "purple"} style={{textTransform: "capitalize"}}>
                    {v.replace("_", " ")}
                </Tag>
            ),
        },
        {
            title: "Amount",
            dataIndex: "grand_total",
            render: (v) =>
                `৳ ${Number(v || 0).toLocaleString("en-BD", {
                    maximumFractionDigits: 2,
                })}`,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (v) => (
                <Tag color={v === "completed" ? "green" : "gold"} style={{textTransform: "capitalize"}}>
                    {v}
                </Tag>
            ),
        },
        {
            title: "Actions",
            width: 130,
            render: (_, r) => (
                <Space>
                    {r.status === "draft" && can("purchase-returns-update") && (
                        <>
                            <Button type="text" icon={<EditOutlined />} onClick={() => nav(`/purchase-returns/${r.id}/edit`)}/>

                            <Popconfirm title="Complete this purchase return?" description="Stock will decrease and supplier balance will be adjusted." onConfirm={() => act(completePurchaseReturn, r.id)}>
                                <Button type="text" icon={<CheckCircleOutlined />}/>
                            </Popconfirm>
                        </>
                    )}

                    {r.status === "draft" && can("purchase-returns-delete") && (
                        <Popconfirm title="Delete this draft?" onConfirm={() => act(deletePurchaseReturn, r.id)}>
                            <Button type="text" danger icon={<DeleteOutlined />}/>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="stock-adjustment-page">
            {holder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Purchase Returns</h1>

                    <p className="stock-subtitle">
                        Return purchased products or raw materials to suppliers.
                    </p>
                </div>
            </div>

            <Card className="stock-shell" styles={{ body: { padding: 0 } }}>
                <div className="stock-adjustment-head">
                    <Space>
                        <Input prefix={<SearchOutlined />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search return number"/>

                        <Select
                            allowClear
                            value={type}
                            onChange={setType}
                            placeholder="All types"
                            options={[
                                { value: "product", label: "Product" },
                                { value: "raw_material", label: "Raw material" },
                            ]}
                        />
                    </Space>

                    {can("purchase-returns-create") && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => nav("/purchase-returns/create")}
                        >
                            Create return
                        </Button>
                    )}
                </div>

                <Table
                    rowKey="id"
                    columns={cols}
                    dataSource={data}
                    loading={loading}
                    scroll={{ x: 1250 }}
                    pagination={{
                        current: meta.current_page || 1,
                        pageSize: meta.per_page || 25,
                        total: meta.total || 0,
                        onChange: load,
                    }}
                />
            </Card>
        </div>
    );
}