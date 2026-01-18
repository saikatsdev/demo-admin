import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Button, Popconfirm, Space, Table, Tag,Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import dayjs from "dayjs";

export default function Customer() {
    // Hook
    useTitle("All Customer");

    // State
    const [query, setQuery]                     = useState("");
    const [users, setUsers]                     = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [pagination, setPagination]           = useState({current: 1,pageSize: 10,total: 0});
    const { current, pageSize }                 = pagination;
    const [debouncedQuery, setDebouncedQuery]   = useState("");
    const [customerSummary, setCustomerSummary] = useState(null);

    // Variable
    const navigate = useNavigate();

    const columns = 
    [
        {
            title: "SL",
            dataIndex: "sl",
            key: "sl",
            render: (_,__,index) => (pagination.current - 1) * pagination.pageSize + (index + 1)
        },
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 70,
            render: (src, record) => (
                <img src="https://static.vecteezy.com/system/resources/previews/024/983/914/non_2x/simple-user-default-icon-free-png.png" alt={record.username} style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}/>
            ),
        },
        {
            title: "Username",
            dataIndex: "customer_name",
            key: "customer_name",
            width:300,
            render: (text) => (
                <p style={{textTransform:"capitalize"}}>{text}</p>
            )
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            render: (value) => value ? value : "N/A"
        },
        {
            title: "Phone",
            dataIndex: "phone_number",
            key: "phone_number",
        },
        {
            title: "Total Orders",
            dataIndex: "total_orders",
            key: "total_orders",
        },
        {
            title: "Total Amount",
            dataIndex: "total_spent",
            key: "total_spent",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
            const value = status || "active";
                return (
                    <Tag color={value === "active" ? "green" : "red"} style={{ textTransform: "capitalize" }}>
                        {value}
                    </Tag>
                );
            }
        },
        {
            title: "Last Order",
            key: "last_order",
            render: (record) => {
                const date = record.last_order_date ? dayjs(record.last_order_date).format("DD-MM-YYYY hh:mm A"): "N/A";

                const invoice = record.last_invoice_number || "N/A";

                return (
                    <div>
                        <div>{date}</div>
                        <div>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Invoice: <Tag color="blue">{invoice}</Tag>
                            </Typography.Text>
                        </div>
                    </div>
                );
            }
        },
        {
            title: "Action",
            key: "operation",
            width: 160,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="primary" onClick={() => onEdit(record)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete user?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
                        <Button size="small" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }));
    }, [debouncedQuery]);

    useEffect(() => {
        let isMounted = true;

        const fetchUsers = async () => {
            setLoading(true);

            const params = {user_category_id: 1,page: current,per_page: pageSize,...(debouncedQuery ? { search_key: debouncedQuery } : {})};

            const res = await getDatas("/admin/customers", params);

            const result = res?.result || {};
            const list = result?.data || [];

            if (isMounted) {
                setUsers(list);

                setPagination((p) => {
                    const next = {
                    ...p,
                        current: result.current_page ?? p.current,
                        pageSize: result.per_page ?? p.pageSize,
                        total: result.total ?? p.total,
                    };

                    const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total;

                    return unchanged ? p : next;
                });
            }

            setLoading(false);
        };

        fetchUsers();

        return () => {
            isMounted = false;
        };
    }, [current, pageSize, debouncedQuery]);

    const filteredData = useMemo(() => {
        if (!debouncedQuery) return users;
        return users.filter(u =>
            u.customer_name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            u.phone_number.includes(debouncedQuery)
        );
    }, [users, debouncedQuery]);

    const openCreate = () => {
        navigate("/add/customer")
    };

    const onEdit = (record) => {
        navigate(`/edit/customer/${record.id}`);
    };

    const onDelete = async (id) => {
        const res = await deleteData(`/admin/users/${id}`);
        if (res?.success) {
            const params = {
                user_category_id: 1,
                page            : current,
                per_page        : pageSize,
                search_key      : debouncedQuery || undefined,
            };
            const refreshed = await getDatas("/admin/users", params);
            setUsers(refreshed?.result?.data || []);
            const meta = refreshed?.result?.meta;
            if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }));
        }
    };

    // Get Customer Summary
    useEffect(() => {
        let isMounted = true;

        const getCustomerSummary = async () => {
            setLoading(true);
            const res = await getDatas("/admin/customers/summary");

            if(res && res.success){
                if(isMounted){
                    setCustomerSummary(res?.result || []);

                    setLoading(false);
                }
            }
        };

        getCustomerSummary();

        return () => {
            isMounted = false;
        }
    }, []);

    return (
        <>
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Customers</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Customers" },
                        ]}
                    />
                </div>
            </div>

            <div style={{display: "flex", justifyContent: "space-between", alignItems: "*", marginBottom: 16}}>
                <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                        Add
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <div class="customer-stats">
                <div>
                    <p>
                        Total Customers
                    </p>
                    <h2>{Number(customerSummary?.total_customers) > 0 ? customerSummary?.total_customers : 0}</h2>
                </div>
                <div>
                    <p>
                        New Customers
                    </p>
                    <h2 class="blue">{Number(customerSummary?.current_month_customers) > 0 ? customerSummary?.current_month_customers : 0}</h2>
                </div>
                <div>
                    <p>
                        Active Customers
                    </p>
                    <h2 class="green">{Number(customerSummary?.active_customers) > 0 ? customerSummary?.active_customers : 0}</h2>
                </div>
            </div>

            <Table rowKey="id" loading={loading} 
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {setPagination((p) => ({ ...p, current: page, pageSize }));},
                    }} columns={columns} dataSource={filteredData} scroll={{ x: "max-content" }}/>
        </>
    )
}
