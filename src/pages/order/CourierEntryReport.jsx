import { ArrowLeftOutlined, HomeOutlined, PhoneOutlined, PrinterOutlined, ReloadOutlined, UndoOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Card, DatePicker, Input, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function CourierEntryReport() {
    // Hook
    useTitle("Courier Entry Report");
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(25);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    
    // Filter States
    const [searchInputValue, setSearchInputValue] = useState("");
    const [appliedSearchKey, setAppliedSearchKey] = useState("");
    const [appliedDates, setAppliedDates] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Columns
    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: 'center',
            render: (_, __, index) => (currentPage - 1) * perPage + index + 1
        },
        {
            title: "Order Details",
            key: "order_details",
            width: 160,
            render: (record) => (
                <Space direction="vertical" size={2}>
                    <Text copyable={{ text: record.invoice_number }} strong style={{ color: '#1677ff', fontSize: '15px' }}>
                        {record.invoice_number}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Date: {record.order_date?.split(' ')[0]}
                    </Text>
                    {record.entry_by && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Entry By: <Tag color="blue" style={{ marginLeft: 4, border: 'none' }}>{record.entry_by.username}</Tag>
                        </Text>
                    )}
                </Space>
            )
        },
        {
            title: "Customer Info",
            key: "customer_info",
            width: 250,
            render: (record) => (
                <Space direction="vertical" size={2}>
                    <Text strong><UserOutlined style={{ color: '#8c8c8c' }} /> {record.customer_name}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PhoneOutlined style={{ color: '#8c8c8c' }} />
                        <Text copyable={{ text: record.phone_number }}>{record.phone_number}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'normal' }}><HomeOutlined style={{ color: '#8c8c8c' }} /> {record.address_details}</Text>
                </Space>
            )
        },
        {
            title: "Products",
            key: "products",
            width: 260,
            render: (record) => (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {record.order?.details?.map(detail => (
                        <Space key={detail.id} align="start" style={{ width: '100%' }}>
                            <Avatar src={detail.product?.img_path} shape="square" size="small" />
                            <Tooltip title={detail.product?.name}>
                                <div style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    <Text style={{ fontSize: '13px' }}>{detail.product?.name}</Text>
                                </div>
                            </Tooltip>
                        </Space>
                    ))}
                </Space>
            )
        },
        {
            title: "Pricing Breakdown",
            key: "pricing",
            width: 180,
            render: (record) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: '4px', columnGap: '8px', fontSize: '13px' }}>
                    <Text type="secondary">Sell Price:</Text>
                    <Text>{record.sell_price}</Text>
                    
                    <Text type="secondary">Delivery:</Text>
                    <Text>+{record.delivery_charge}</Text>
                    
                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px dashed #f0f0f0', margin: '2px 0' }}></div>
                    
                    <Text strong>Payable:</Text>
                    <Text strong style={{ color: '#1677ff' }}>{record.payable_price}</Text>
                </div>
            )
        },
        {
            title: "Due Amount",
            dataIndex: "due",
            key: "due",
            width: 120,
            align: 'center',
            render: (due) => {
                const isDue = parseFloat(due) > 0;
                return (
                    <Tag color={isDue ? 'error' : 'success'} style={{ fontSize: '14px', padding: '4px 12px', margin: 0, borderRadius: '4px' }}>
                        {parseFloat(due).toFixed(2)}
                    </Tag>
                );
            }
        }
    ];

    useEffect(() => {
        let isMounted = true;
        
        const fetchCourierEntries = async () => {
            setLoading(true);
            try {
                let url = `/admin/courier/entry?page=${currentPage}&paginate_size=${perPage}`;
                
                if (appliedSearchKey) {
                    url += `&search_key=${encodeURIComponent(appliedSearchKey)}`;
                }
                
                if (appliedDates) {
                    if (appliedDates[0]) url += `&start_date=${appliedDates[0].format('YYYY-MM-DD')}`;
                    if (appliedDates[1]) url += `&end_date=${appliedDates[1].format('YYYY-MM-DD')}`;
                }

                const res = await getDatas(url);
                
                if (isMounted && res?.success && res?.result) {
                    setData(res.result.data);
                    setCurrentPage(res.result.meta?.current_page || 1);
                    setTotal(res.result.meta?.total || 0);
                    setPerPage(res.result.meta?.per_page || 25);
                }
            } catch (error) {
                console.error("Failed to fetch courier entries", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCourierEntries();
        
        return () => {
            isMounted = false;
        };
    }, [currentPage, perPage, appliedSearchKey, appliedDates, refreshTrigger]);

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPerPage(pagination.pageSize);
    };

    const handleSearch = (value) => {
        setAppliedSearchKey(value);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleDateChange = (dates) => {
        setAppliedDates(dates);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleReset = () => {
        setSearchInputValue("");
        setAppliedSearchKey("");
        setAppliedDates(null);
        setCurrentPage(1); // Reset filters will automatically trigger the fetch via useEffect
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1); // Trigger the fetch via useEffect
    };

    const rowSelection = {
        selectedRowKeys: selectedOrderIds,
        onChange: (newSelectedRowKeys) => {
            setSelectedOrderIds(newSelectedRowKeys);
        },
        preserveSelectedRowKeys: true,
    };

    return (
        <>
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Courier Entry Report</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Courier Entry Report" },
                        ]}
                    />
                </div>
            </div>

            <Card 
                bordered={false} 
                className="criclebox tablespace mb-24"
                title="Courier Entries List"
                extra={
                    <Space wrap>
                        {selectedOrderIds.length > 0 && (
                            <Button 
                                type="primary" 
                                icon={<PrinterOutlined />}
                                onClick={() => navigate(`/admin/multi-invoice?orders=${selectedOrderIds.join(",")}`)}
                            >
                                Print Invoice ({selectedOrderIds.length})
                            </Button>
                        )}
                        <Input.Search 
                            placeholder="Search by Invoice or Name..." 
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            onSearch={handleSearch} 
                            allowClear 
                            style={{ width: 250 }} 
                        />
                        <RangePicker 
                            value={appliedDates} 
                            onChange={handleDateChange} 
                            allowClear 
                        />
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>Refresh</Button>
                        <Button icon={<UndoOutlined />} onClick={handleReset}>Reset</Button>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                    </Space>
                }
            >
                <Table 
                    bordered
                    rowSelection={rowSelection}
                    loading={loading} 
                    columns={columns} 
                    dataSource={data}
                    rowKey="order_id"
                    pagination={{
                        current: currentPage,
                        pageSize: perPage,
                        total: total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '25', '50', '100', '200'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                    size="middle"
                />
            </Card>
        </>
    );
}
