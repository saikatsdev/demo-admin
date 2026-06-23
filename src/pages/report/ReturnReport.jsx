import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Typography, Divider, Image } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, UserOutlined, ShoppingOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ReturnReport() {
    // Hooks
    useTitle("Return Order Report");

    // States
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [orders, setOrders]                   = useState([]);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });

    const getOrderReport = async () => {
        let params = {};
        
        if (dateFilter && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange[0] && dateRange[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date = dateRange[1].format("YYYY-MM-DD");
        }

        params.page = pagination.current;
        params.paginate_size = pagination.pageSize;

        const query = new URLSearchParams(params).toString();

        try {
            setLoading(true);
            const res = await getDatas(`/admin/order/reports/return?${query}`);
            if(res && res?.success){
                const result = res?.result;
                setOrders(result?.data || []);
                setPagination(prev => ({ 
                    ...prev, 
                    total: result?.total || 0,
                    current: result?.current_page || 1
                }));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getOrderReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize]);

    const handlePrint = () => {
        window.print();
    };

    const getFilteredData = () => {
        return orders.filter((order) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                order.phone_number?.toLowerCase().includes(term) || 
                order.customer_name?.toLowerCase().includes(term)
            );
        });
    };

    const getExportData = () => {
        const filtered = getFilteredData();
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.id));
        }
        return filtered;
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Return Order Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.text(`Generated on: ${dateStr} | Filter: ${dateFilter}`, 14, 30);
        
        const tableColumn = ["#", "Phone", "Customer", "Return Date", "Net Total", "Payable"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.phone_number,
            o.customer_name,
            dayjs(o.created_at).format("DD MMM YYYY"),
            o.net_order_price,
            o.payable_price
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 9 }
        });
        doc.save(`Return_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Phone Number", "Customer Name", "Return Date", "Net Amount", "Advance", "Payable"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.phone_number,
            o.customer_name,
            dayjs(o.created_at).format("DD MMM YYYY"),
            o.net_order_price,
            o.advance_payment,
            o.payable_price
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Return_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const columns = [
        {
            title: "#",
            key: "sl",
            render: (_, __, index) => (
                <span style={{ fontWeight: 600, color: '#94a3b8' }}>
                    {(pagination.current - 1) * pagination.pageSize + index + 1}
                </span>
            ),
            width: 60,
            align: 'center'
        },
        {
            title: "Customer Profile",
            key: "profile",
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserOutlined style={{ color: '#64748b' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>{record.customer_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.phone_number}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Return Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (value) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontSize: 13 }}>{dayjs(value).format("DD MMM YYYY")}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(value).format("hh:mm A")}</Text>
                </div>
            ),
        },
        {
            title: "Returned Items",
            key: "items_count",
            align: "center",
            render: (_, record) => (
                <Tag color="blue" icon={<ShoppingOutlined />} style={{ borderRadius: 4, padding: '0 8px' }}>
                    {record.details?.length || 0} Items
                </Tag>
            ),
        },
        {
            title: "Net Amount",
            dataIndex: "net_order_price",
            key: "net_order_price",
            align: 'right',
            render: (val) => <Text strong style={{ color: '#0f172a' }}>৳{Number(val || 0).toLocaleString()}</Text>
        },
        {
            title: "Advance",
            dataIndex: "advance_payment",
            key: "advance_payment",
            align: 'right',
            render: (val) => Number(val) > 0 
                ? <Text style={{ color: '#10b981', fontWeight: 500 }}>৳{Number(val).toLocaleString()}</Text> 
                : <Text type="secondary">৳0</Text>
        },
        {
            title: "Payable",
            key: "payable_price",
            align: 'right',
            render: (_, record) => (
                <div style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: 4, border: '1px solid #e2e8f0', display: 'inline-block' }}>
                    <Text strong style={{ color: '#1e293b' }}>৳{Number(record.payable_price || 0).toLocaleString()}</Text>
                </div>
            ),
        }
    ];

    const expandedRowRender = (record) => {
        const detailColumns = [
            {
                title: "Product Item",
                key: "product",
                render: (_, item) => (
                    <Space size="middle">
                        <Image
                            src={item.product?.img_path}
                            alt={item.product_name}
                            width={40}
                            height={40}
                            style={{ borderRadius: 6, objectFit: 'cover' }}
                            fallback="https://via.placeholder.com/40"
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text strong style={{ fontSize: 13 }}>{item.product_name}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>SKU: {item.product_id}</Text>
                        </div>
                    </Space>
                )
            },
            {
                title: "Unit Price",
                dataIndex: "sell_price",
                key: "sell_price",
                align: 'right',
                render: (val) => <Text>৳{Number(val).toLocaleString()}</Text>
            },
            {
                title: "Qty",
                dataIndex: "quantity",
                key: "quantity",
                align: 'center',
                render: (qty) => <Tag color="default">{qty}</Tag>
            },
            {
                title: "Total",
                key: "total",
                align: 'right',
                render: (_, item) => <Text strong>৳{(Number(item.sell_price) * Number(item.quantity)).toLocaleString()}</Text>
            }
        ];

        return (
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                <Title level={5} style={{ margin: '0 0 16px 0', fontSize: 14, color: '#64748b' }}>Item Details for Return ID #{record.id}</Title>
                <Table
                    columns={detailColumns}
                    dataSource={record.details || []}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    bordered={false}
                    className="nested-table"
                    style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}
                />
            </div>
        );
    };


    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>Return Order Report</Title>
                <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search phone or name..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        style={{ width: 250 }}
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    />
                    
                    <Select 
                        value={dateFilter} 
                        style={{ width: 140 }} 
                        onChange={(val) => {
                            setDateFilter(val);
                            if (val !== "custom") setDateRange([null, null]);
                        }}
                        suffixIcon={<CalendarOutlined style={{ color: '#bfbfbf' }} />}
                    >
                        <Option value="all">All Time</Option>
                        <Option value="today">Today</Option>
                        <Option value="yesterday">Yesterday</Option>
                        <Option value="week">This Week</Option>
                        <Option value="month">This Month</Option>
                        <Option value="year">This Year</Option>
                        <Option value="custom">Custom Range</Option>
                    </Select>

                    {dateFilter === "custom" && (
                        <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} allowClear style={{ width: 250 }} />
                    )}

                    <Button icon={<ReloadOutlined />} onClick={() => {
                        setDateFilter("all");
                        setLocalSearch("");
                        setDateRange([null, null]);
                        setSelectedRowKeys([]);
                        setPagination(prev => ({ ...prev, current: 1 }));
                    }}>
                        Reset
                    </Button>
                </Space>

                <Space size="middle">
                    {selectedRowKeys.length > 0 && (
                        <Text strong style={{ color: '#1677ff' }}>
                            {selectedRowKeys.length} selected
                        </Text>
                    )}
                    <Button type="primary" icon={<FileExcelOutlined />} onClick={downloadCSV}>
                        CSV
                    </Button>
                    <Button type="primary" icon={<FilePdfOutlined />} style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }} onClick={downloadPDF}>
                        PDF
                    </Button>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                        Print
                    </Button>
                </Space>
            </div>

            <div className="printable">
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    rowKey="id"
                    columns={columns}
                    dataSource={getFilteredData()}
                    loading={loading}
                    expandable={{
                        expandedRowRender,
                        rowExpandable: (record) => record.details?.length > 0,
                    }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                        showSizeChanger: true,
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total) => `Total ${total} entries`,
                    }}
                />
            </div>
        </div>
    );
}
