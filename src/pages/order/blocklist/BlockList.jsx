import { ArrowLeftOutlined, PlusOutlined, SearchOutlined, SafetyCertificateOutlined, UnlockOutlined, StopOutlined } from "@ant-design/icons";
import { Input as AntInput, Breadcrumb, Table, Button, Space, message, Tag, Tooltip, Card } from "antd";
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./css/block-list.css";

export default function BlockList() {
    // Hooks
    useTitle("All Block List");

    // Variable
    const navigate = useNavigate();

    // State
    const [loading, setLoading]         = useState(false);
    const [blockData, setBlockData]     = useState([]);
    const [total, setTotal]             = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize]       = useState(20);
    const [query, setQuery]             = useState("");
    const [messageApi, contextHolder]   = message.useMessage();

    const fetchedBlockUsers = useCallback(async (page = 1, size = 20, search = "") => {
        setLoading(true);
        try {
            const params = {
                page: page,
                paginate_size: size,
                phone_number: search,
            };
            const res = await getDatas("/admin/block-users", params);

            if (res?.success) {
                setBlockData(res?.result?.data || []);
                setTotal(res?.result?.meta?.total || 0);
                setCurrentPage(res?.result?.meta?.current_page || 1);
            } else {
                messageApi.error(res?.msg || "Failed to fetch data");
            }
        } catch (error) {
            console.error(error);
            messageApi.error("An error occurred while fetching data");
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        fetchedBlockUsers(currentPage, pageSize, query);
    }, [currentPage, pageSize, query, fetchedBlockUsers]);

    const onSearch = (value) => {
        setQuery(value);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setQuery(e.target.value);
        setCurrentPage(1);
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 70,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: "User Token",
            dataIndex: "user_token",
            key: "user_token",
            render: (value) => (
                <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                    {value ? value : "N/A"}
                </code>
            ),
        },
        {
            title: "User Details",
            key: "details",
            render: (_, record) => (
                <div className="details-container">
                    {record.details?.map((item) => (
                        <div key={item.id} className="detail-item">
                            <div><strong><SearchOutlined /> Phone:</strong> {item.phone_number}</div>
                            <div><strong><SafetyCertificateOutlined /> IP:</strong> {item.ip_address}</div>
                            {item.device_type && (
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                    {item.platform} • {item.browser} • {item.device_type}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "is_block",
            key: "is_block",
            width: 120,
            render: (value) => (
                <Tag color={value ? "error" : "success"} className="status-tag">
                    {value ? "BLOCKED" : "ACTIVE"}
                </Tag>
            ),
        },
        {
            title: "Restrictions",
            key: "restrictions",
            width: 100,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Tooltip title={record.is_permanent_block ? "Remove Permanent Block" : "Block Permanently"}>
                        <Button size="small" type="text" danger style={{ backgroundColor: record.is_permanent_block ? '#fff1f0' : '#fff', color: '#ff4d4f' }}
                            icon={<StopOutlined />} onClick={() => handlePermanentBlock(record)}/>
                    </Tooltip>
                    <Tooltip title={record.is_permanent_unblock ? "Fully Unblocked" : "Unblock All"}>
                        <Button size="small" type="text" style={{ backgroundColor: record.is_permanent_unblock ? '#f6ffed' : '#fff', color: '#52c41a' }}
                            icon={<UnlockOutlined />} onClick={() => handlePermanentUnBlock(record)}/>
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: "Created At",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
    ];

    const handlePermanentBlock = (record) => {
        const payload = {
            is_block            : 1,
            is_permanent_block  : 1,
            is_permanent_unblock: 0,
        };
        updateUserBlock(record.id, payload);
    };

    const handlePermanentUnBlock = (record) => {
        const payload = {
            is_block            : 0,
            is_permanent_block  : 0,
            is_permanent_unblock: 1,
        };
        updateUserBlock(record.id, payload);
    };

    const updateUserBlock = async (id, payload) => {
        const res = await postData(`/admin/block-users/${id}`, { ...payload, _method: "PUT" });
        if (res?.success) {
            messageApi.success(res.msg);
            fetchedBlockUsers(currentPage, pageSize, query);
        }
    };

    const openCreate = () => {
        navigate("/add-block-user");
    }

    return (
        <div className="block-list-container">
            {contextHolder}
            
            <div className="page-header-white">
                <div>
                    <h1 className="title">Block Management</h1>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Block User List" },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Space>
                        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate} style={{ fontWeight: 600 }}>
                            Add Block User
                        </Button>
                        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                            Back
                        </Button>
                    </Space>
                </div>
            </div>

            <Card className="premium-card">
                <div className="search-filter-wrapper">
                    <div className="custom-search">
                        <AntInput.Search 
                            allowClear 
                            placeholder="Search by token, phone or IP..." 
                            onSearch={onSearch} 
                            onChange={handleSearchChange}
                            style={{ width: 400 }} 
                            enterButton
                        />
                    </div>
                    <div className="stats-indicator">
                        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                            Total Records: <strong>{total}</strong>
                        </Tag>
                    </div>
                </div>

                <Table 
                    className="custom-table"
                    bordered 
                    loading={loading} 
                    columns={columns} 
                    dataSource={blockData}
                    rowKey="id"
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        }
                    }}
                />
            </Card>
        </div>
    )
}

