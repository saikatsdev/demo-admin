import {ArrowLeftOutlined, CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {Input as AntInput,Breadcrumb,Button,message,Popconfirm,Space,Table,Tag} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./ProductCatelog.css";

export default function ProductCatelog() {
    //Hook
    useTitle("All Products Catelogs");

    // Variable
    const navigate = useNavigate();

    // State
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [catelogs, setItems] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [filteredData, setFilteredData] = useState(catelogs);

    const handleCopyLink = (url) => {
        navigator.clipboard
        .writeText(url)
        .then(() => {
            messageApi.open({
                type: "success",
                content: "Copy Link Successfully " + url,
            });
        })
        .catch(() => {
            message.error("Failed to copy link!");
        });
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 10,
            render: (_, __, index) => index + 1,
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Number Of Products",
            dataIndex: "number_of_products",
            key: "number_of_products",
        },
        {
            title: "Url",
            dataIndex: "url",
            key: "url",
            render: (url) => (
                <Space>
                    {url}
                    <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyLink(url)}
                    />
                </Space>
            ),
        },
        {
            title: "Catalog Type",
            dataIndex: "catalog_type",
            key: "catalog_type",
            render: (catelog) => catelog.name,
        },
        {
            title: "Categories",
            dataIndex: "categories",
            key: "categories",
            render: (categories) => {
                if (!Array.isArray(categories) || !categories.length) return "N/A";

                const names = categories
                    .map((item) => item?.category?.name)
                    .filter(Boolean);

                if (!names.length) return "N/A";

                return (
                    <div>
                        {names.map((name, i) => (
                            <div key={i} style={{ marginBottom: 4 }}>
                                <Tag>{name}</Tag>
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "active" ? "green" : "danger"} style={{ textTransform: "capitalize" }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Action",
            key: "operation",
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record.id)}
                    />
                    <Popconfirm title="Delete Item?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                    <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyLink(record.url)}
                    />
                </Space>
            ),
        },
    ];

    const openCreate = () => {
        navigate("/add/prodcut/catelog");
    };

    const onEdit = (id) => {
        navigate(`/edit/prodcut/catelog/${id}`);
    };

    useEffect(() => {
        if (!query) {
            setFilteredData(catelogs);
        }

        const lowerQuery = query.toLowerCase();

        const filtered = catelogs?.filter((item) => item.name?.toLowerCase().includes(lowerQuery) || item.status?.toLowerCase().includes(lowerQuery));

        setFilteredData(filtered);
    }, [query, catelogs]);

    useEffect(() => {
        let isMounted = true;

        const fetchContactList = async () => {
            setLoading(true);

            const res = await getDatas("/admin/product/catalogs");

            const list = res?.result?.data;

            if (isMounted) {
                setItems(list);
            }

            setLoading(false);
        };

        fetchContactList();

        return () => {
            isMounted = false;
        };
    }, []);

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/product/catalogs/${id}`);

        if (res?.success) {
            const refreshed = await getDatas("/admin/product/catalogs");

            setItems(refreshed?.result?.data);

            messageApi.open({
                type: "success",
                content: res.msg,
            });
        }else{
            messageApi.open({
                type: "error",
                content: "Something Went Wrong",
            });
        }
    };

    return (
        <>
            {contextHolder}

            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Product Catelogs</h1>
                </div>

                <div className="head-actions">
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> },{ title: "All Product Catelogs" }]}/>
                </div>
            </div>

            <div className="catelog-actions-desktop">
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}/>

                <Space>
                    <Button size="small" icon={<DeleteOutlined />}>
                        Trash
                    </Button>

                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
                        Add
                    </Button>

                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <div className="catelog-actions-mobile">
                <AntInput.Search allowClear placeholder="Search Key ..." style={{ width: "100%" }} value={query} onChange={(e) => setQuery(e.target.value)}/>

                <Space style={{ width: "100%" }} wrap>
                    <Button size="small" icon={<DeleteOutlined />}>
                        Trash
                    </Button>

                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
                        Add
                    </Button>

                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <div className="catelog-table-desktop">
                <Table
                    bordered
                    loading={loading}
                    columns={columns}
                    dataSource={filteredData}
                    pagination={false}
                    size="middle"
                    tableLayout="auto"
                    scroll={{ x: "max-content" }}
                />
            </div>

            <div className="catelog-table-mobile">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
                ) : filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                        <div key={item.id} className="catelog-mobile-card">
                            <div className="catelog-mobile-top">
                                <div className="catelog-mobile-info">
                                    <h4>{item.name}</h4>
                                    <p><strong>SL:</strong> {index + 1}</p>
                                    <p><strong>Products:</strong> {item.number_of_products ?? "N/A"}</p>
                                    <p><strong>Type:</strong> {item.catalog_type?.name || "N/A"}</p>

                                    <div className="catelog-info-pairs">
                                        <div className="catelog-pair-left">
                                            <p><strong>Categories:</strong>{" "}
                                                {(() => {
                                                    if (!Array.isArray(item.categories) || !item.categories.length) return "N/A";
                                                    const names = item.categories.map((c) => c?.category?.name).filter(Boolean);
                                                    return names.length ? names.join(", ") : "N/A";
                                                })()}
                                            </p>
                                        </div>
                                        <div className="catelog-divider"></div>
                                        <div className="catelog-pair-right">
                                            <p><strong>Status:</strong>{" "}
                                                <Tag color={item.status === "active" ? "green" : "danger"} style={{ textTransform: "capitalize" }}>
                                                    {item.status}
                                                </Tag>
                                            </p>
                                        </div>
                                    </div>

                                    {item.url && (
                                        <div className="catelog-mobile-url">
                                            <CopyOutlined style={{ cursor: "pointer" }} onClick={() => handleCopyLink(item.url)} />
                                            <span>{item.url}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="catelog-mobile-bottom">
                                <div className="catelog-mobile-actions">
                                    <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => onEdit(item.id)} />
                                    <Popconfirm title="Delete Item?" okText="Yes" cancelText="No" onConfirm={() => onDelete(item.id)}>
                                        <Button size="small" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyLink(item.url)} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>No data found</div>
                )}
            </div>
        </>
    )
}
