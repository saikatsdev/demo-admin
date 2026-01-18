import { Input,Row, Col, Button, Space,Select,Table,Tag,DatePicker,message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useEffect, useState } from 'react'
import useTitle from '../../hooks/useTitle'
import { deleteData, getDatas, postData } from '../../api/common/common';
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

export default function TrashList() {
    // Hook
    useTitle("Order Trash List");

    // Variable
    const navigate = useNavigate();

    // State
    const [trashList, setTrashList]       = useState([]);
    const [loading, setLoading]           = useState(false);
    const [paginateSize, setPaginateSize] = useState(25);
    const [currentPage, setCurrentPage]   = useState(1);
    const [totalItems, setTotalItems]     = useState(0);
    const [orderStatus, setOrderStatus]   = useState([]);
    const [messageApi, contextHolder]     = message.useMessage();

    const [filters, setFilters] = useState({
        paginate_size: 25,
        current_status_id: null,
        paid_status: null,
        start_date: null,
        end_date: null,
        search_key: null,
    });


    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            render: (_, __, index) => {
                return (currentPage - 1) * paginateSize + index + 1;
            },
        },
        {
            title: "Order Info",
            key: "order_info",
            render: (_, record) => (
                <div style={{ lineHeight: 1.6 }}>
                    <div><strong>Invoice:</strong> {record.invoice_number}</div>
                    <div><strong>Customer:</strong> {record.customer_name}</div>
                    <div><strong>Phone:</strong> {record.phone_number}</div>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: ["current_status", "name"],
            key: "current_status",
            render: (text, record) => (
                <span style={{backgroundColor: record.current_status?.bg_color || "#ddd", color: record.current_status?.text_color || "#000", padding: "2px 6px",borderRadius: 4}}>
                    {record.current_status?.name || "N/A"}
                </span>
            ),
        },
        { 
            title: "Net Price", 
            dataIndex: "net_order_price", 
            key: "net_order_price" 
        },
        {
            title: "Paid Status",
            dataIndex: "paid_status",
            key: "paid_status",
            width: 120,
            render: (status) => {
                if (!status) return "N/A";

                const color = status.toLowerCase() === "paid" ? "green" : "red";

                return (
                    <Tag color={color} style={{ fontWeight: 600, textTransform: "capitalize" }}>
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: "Payment Gateway",
            dataIndex: ["payment_gateway", "name"],
            key: "payment_gateway",
            width: 160,
            render: (gatewayName) => {
                if (!gatewayName) return "N/A";

                let color = "blue";
                if (gatewayName.toLowerCase().includes("cash_on_delivery")) color = "gold";
                else if (gatewayName.toLowerCase().includes("card")) color = "green";
                else if (gatewayName.toLowerCase().includes("bkash")) color = "purple";

                return (
                    <Tag color={color} style={{ fontWeight: 600 }}>
                        {gatewayName}
                    </Tag>
                );
            },
        },
        {
            title: "Deleted At",
            dataIndex: "deleted_at",
            key: "deleted_at",
            render: (text) => {
                if (!text) return "N/A";
                return dayjs(text).format("YYYY-MM-DD hh:mm:ss A");
            },
        },
        {
            title: "Actions",
            key: "actions",
            width: 180,
            render: (_, record) => (
                <Space>
                    <Button size="small" type="default" onClick={() => handleRestore(record.id)}>
                        Restore
                    </Button>

                    <Button size="small" danger onClick={() => handlePermanentDelete(record.id)}>
                        Delete
                    </Button>
                </Space>
            ),
        }
    ]

    const fetchedTrashList = async (page = 1, extra = {}) => {
        setLoading(true);
        
        try {

            const finalFilters = {
                ...filters,
                ...extra,
                page,
            };

            const res = await getDatas("/admin/orders/trash", finalFilters);

            if(res && res?.success){
                setTrashList(res.result?.data || []);
                setTotalItems(res.result?.data?.length);
                setCurrentPage(page);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchedTrashList(1);
    }, [paginateSize]);

    useEffect(() => {
        const fetchedOrderStatus = async () => {
            const res = await getDatas("/admin/statuses/list");

            if(res && res?.success){
                setOrderStatus(res?.result);
            }
        }

        fetchedOrderStatus();
    }, [])

    const handlePermanentDelete = async (id) => {
        const res = await deleteData(`/admin/orders/${id}/permanent-delete`);

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            fetchedTrashList();
        }
    }

    const handleRestore = async (id) => {
        const res = await postData(`/admin/orders/${id}/restore`, {_method:"PUT"});

        if(res && res?.success){
            messageApi.open({
                type: "success",
                content: res.msg,
            });

            fetchedTrashList();
        }
    }

    return (
        <>
            {contextHolder}
            <Row style={{ marginBottom: 25 }}>
                <Col xs={24} md={16} style={{ display: "flex", justifyContent: "flex-start" }}>
                    <h2>Trash Orders</h2>
                </Col>

                <Col xs={24} md={8} style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                            Back
                        </Button>

                        <Button onClick={() => navigate("/orders")}>
                            Back to List
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={24}>
                    <div className="filter-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        <div className="filter-item">
                            <label className="filter-label">Paginate Size</label>
                            <Select value={filters.paginate_size} onChange={(value) => {setFilters(prev => ({ ...prev, paginate_size: value })); fetchedTrashList(1, { paginate_size: value });}} style={{ width: 120, height: 40 }}>
                                <Option value="25">25</Option>
                                <Option value="50">50</Option>
                                <Option value="100">100</Option>
                                <Option value="250">250</Option>
                                <Option value="500">500</Option>
                            </Select>
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Status</label>
                            <Select value={filters.current_status_id} onChange={(value) => {setFilters(prev => ({ ...prev, current_status_id: value })); fetchedTrashList(1, { current_status_id: value });}} placeholder="Select Status" style={{ width: 170, height: 40 }} allowClear>
                                {orderStatus?.map((item) => (
                                    <Option key={item.id} value={item.id}>
                                        {item.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Paid Status</label>
                            <Select value={filters.paid_status} onChange={(value) => {setFilters(prev => ({ ...prev, paid_status: value }));fetchedTrashList(1, { paid_status: value });}} placeholder="Paid Status" style={{ width: 150, height: 40 }}allowClear>
                                <Option value="paid">Paid</Option>
                                <Option value="unpaid">Unpaid</Option>
                            </Select>
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Start Date</label>
                            <DatePicker value={filters.start_date ? dayjs(filters.start_date) : null}
                                onChange={(date) => {
                                    const formatted = date ? dayjs(date).format("YYYY-MM-DD") : null;
                                    setFilters(prev => ({ ...prev, start_date: formatted }));
                                    fetchedTrashList(1, { start_date: formatted });
                                }}
                            />
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">End Date</label>
                            <DatePicker value={filters.end_date ? dayjs(filters.end_date) : null}
                                onChange={(date) => {
                                    const formatted = date ? dayjs(date).format("YYYY-MM-DD") : null;
                                    setFilters(prev => ({ ...prev, end_date: formatted }));
                                    fetchedTrashList(1, { end_date: formatted });
                                }}
                            />
                        </div>

                        <div className="filter-item">
                            <label className="filter-label">Search</label>
                            <Input placeholder="Invoice / Phone / Name / ID"
                                onPressEnter={(e) => {
                                    const val = e.target.value || null;
                                    setFilters(prev => ({ ...prev, search_key: val }));
                                    fetchedTrashList(1, { search_key: val });
                                }}
                                allowClear
                            />
                        </div>
                    </div>
                </Col>
            </Row>

            <div style={{ marginBottom: 20 }}>
                <Button type="primary">
                    All Trash {totalItems}
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={trashList}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: paginateSize,
                    total: totalItems,
                    onChange: (page, size) => {
                        setPaginateSize(size);
                        fetchedTrashList(page, { paginate_size: size });
                    },
                    showSizeChanger: true,
                    pageSizeOptions: ["25", "50", "100", "250", "500"],
                    showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} items`,
                }}
            />
        </>
    )
}
