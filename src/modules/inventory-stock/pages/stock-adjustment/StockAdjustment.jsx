import {CheckCircleOutlined,DeleteOutlined,EditOutlined,PlusOutlined,ReloadOutlined,SearchOutlined} from "@ant-design/icons";
import {Alert,Button,Card,Input,Popconfirm,Result,Select,Space,Table,Tag,Typography,message} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import {completeStockAdjustment,deleteStockAdjustment,getStockAdjustments} from "../../api/stockAdjustmentApi";
import "../../styles/stock-adjustment.css";

export default function StockAdjustment() {
    const { can }                     = usePermission();
    const navigate                    = useNavigate();
    const allowed                     = can("stock-adjustments-read");
    const [rows, setRows]             = useState([]);
    const [meta, setMeta]             = useState({current_page: 1,per_page: 25,total: 0});
    const [query, setQuery]           = useState("");
    const [search, setSearch]         = useState("");
    const [type, setType]             = useState();
    const [status, setStatus]         = useState();
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");
    const [messageApi, contextHolder] = message.useMessage();

    useTitle("Stock Adjustments | Inventory & Stock");

    useEffect(() => {
        const t = setTimeout(() => setSearch(query.trim()), 350);

        return () => clearTimeout(t);
    }, [query]);

    const load = useCallback(async (page = 1, size = 25) => {
        if (!allowed) return;

        setLoading(true);
        setError("");

        const r = await getStockAdjustments({
            search_key: search || undefined,
            item_type: type,
            status,
            page,
            paginate_size: size,
        });

        setLoading(false);

        if (!r?.success) {
            setError(r?.msg || "Unable to load adjustments");
            return;
        }

        setRows(r.result?.data || []);
        setMeta(r.result?.meta || {});
    }, [allowed, search, status, type]);

    useEffect(() => {
        load();
    }, [load]);

    const act = async (fn, id) => {
        const r = await fn(id);

        if (r?.success) {
            messageApi.success(r.msg);
            load(meta.current_page, meta.per_page);
        } else {
            messageApi.error(r?.msg || "Unable to complete action");
        }
    };

    if (!allowed) {
        return <Result status="403" title="Stock adjustment access required" />;
    }

    const columns = 
    [
        {
            title: "SL",
            width: 64,
            align: "center",
            render: (_, __, i) => (meta.current_page - 1) * meta.per_page + i + 1,
        },
        {
            title: "Adjustment",
            width: 170,
            render: (_, r) => (
                <Typography.Text strong className="purchase-number">
                    {r.adjustment_no}
                </Typography.Text>
            ),
        },
        {
            title: "Date",
            width: 130,
            dataIndex: "adjustment_date",
            render: (v) => dayjs(v).format("DD MMM YYYY"),
        },
        {
            title: "Warehouse",
            width: 220,
            render: (_, r) => (
                <div>
                    <b>{r.warehouse?.name}</b>
                    <div className="stock-muted">{r.warehouse?.code}</div>
                </div>
            ),
        },
        {
            title: "Item type",
            width: 150,
            dataIndex: "item_type",
            render: (v) => (
                <Tag color={v === "product" ? "blue" : "purple"} style={{textTransform:"capitalize"}}>
                    {v.replace("_", " ")}
                </Tag>
            ),
        },
        {
            title: "Reason",
            dataIndex: "reason",
            render: (v) => v || "—",
        },
        {
            title: "Status",
            width: 120,
            dataIndex: "status",
            render: (v) => (
                <Tag color = {v === "completed" ? "green" : "gold"} style={{textTransform:"capitalize"}}>
                    {v}
                </Tag>
            ),
        },
        {
            title: "Actions",
            fixed: "right",
            width: 135,
            render: (_, r) => (
                <Space>
                    {r.status === "draft" && can("stock-adjustments-update") && (
                        <>
                            <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/stock-adjustments/${r.id}/edit`)}/>

                            <Popconfirm title="Complete this stock adjustment?" description="Warehouse stock and movement history will be updated. This cannot be edited afterward."
                                onConfirm={() => act(completeStockAdjustment, r.id)}
                            >
                                <Button type="text" className="purchase-complete-action" icon={<CheckCircleOutlined />}/>
                            </Popconfirm>
                        </>
                    )}

                    {r.status === "draft" && can("stock-adjustments-delete") && (
                        <Popconfirm title="Delete this draft adjustment?" onConfirm={() => act(deleteStockAdjustment, r.id)}>
                            <Button type="text" danger icon={<DeleteOutlined />}/>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="stock-adjustment-page">
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Stock Adjustments</h1>

                    <p className="stock-subtitle">
                        Correct physical stock differences with a complete audit trail.
                    </p>
                </div>
            </div>

            <Card className="stock-shell" styles={{ body: { padding: 0 } }}>
                <div className="stock-adjustment-head">
                    <div>
                        <b>Adjustment Register</b>
                        <span>
                            {meta.total || 0} Adjustment{meta.total === 1 ? "" : "s"}
                        </span>
                    </div>

                    {can("stock-adjustments-create") && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/stock-adjustments/create")}>
                            Create Adjustment
                        </Button>
                    )}
                </div>

                <div className="stock-toolbar">
                    <Space wrap>
                        <Input allowClear prefix={<SearchOutlined />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search adjustment number" className="stock-search"/>

                        <Select
                            allowClear
                            value={type}
                            onChange={setType}
                            placeholder="All item types"
                            className="stock-filter"
                            options={[
                                { value: "product", label: "Product" },
                                { value: "raw_material", label: "Raw material" },
                            ]}
                        />

                        <Select
                            allowClear
                            value={status}
                            onChange={setStatus}
                            placeholder="All statuses"
                            className="stock-filter"
                            options={[
                                { value: "draft", label: "Draft" },
                                { value: "completed", label: "Completed" },
                            ]}
                        />

                        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => load(meta.current_page, meta.per_page)}/>
                    </Space>
                </div>

                {error && (
                    <Alert type="error" showIcon message={error} className="stock-error"/>
                )}

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    scroll={{ x: 1100 }}
                    pagination={{
                        current: meta.current_page || 1,
                        pageSize: meta.per_page || 25,
                        total: meta.total || 0,
                        showSizeChanger: true,
                        onChange: load,
                    }}
                />
            </Card>
        </div>
    );
}