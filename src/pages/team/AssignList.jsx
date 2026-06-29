import { ClockCircleOutlined, UserOutlined, InfoCircleOutlined,DownloadOutlined,DollarCircleOutlined, FileTextOutlined,FilePdfOutlined,DownOutlined,PrinterOutlined,CheckCircleOutlined,WarningOutlined} from "@ant-design/icons";
import {Breadcrumb, message, Select,Table, Tag,Button, Dropdown,Row, Col, Card, Space, Typography, Tooltip} from "antd";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle"
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../api/common/common";
import dayjs from "dayjs";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Text, Title } = Typography;

export default function AssignList() {
    // Hook
    useTitle("Assigned Order List");

    // States
    const [loading, setLoading]                 = useState(false);
    const [orders, setOrders]                   = useState([]);
    const [summary, setSummary]                 = useState({orders_count: 0,duplicate_orders_count: 0,total_amount: "0.00"});
    const [pagination, setPagination]           = useState({current: 1,pageSize: 25,total: 0});
    const [messageApi, contextHolder]           = message.useMessage();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [employees, setEmployees] = useState([]);

    const getEmployees = async () => {
        try {
            const res = await getDatas("/admin/users/list", { user_category_id: 3 });
            if (res?.success) {
                setEmployees(res.result.data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getAssignedOrders = async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, paginate_size: pagination.pageSize };
            if (selectedUserId) params.user_id = selectedUserId;
            const res = await getDatas('/admin/team/assign-by-list', params);

            if (res && res?.success) {
                setOrders(res?.result?.data || []);
                setSummary({
                    orders_count          : res?.result?.orders_count || 0,
                    duplicate_orders_count: res?.result?.duplicate_orders_count || 0,
                    total_amount          : res?.result?.total_amount || "0.00"
                });
                setPagination({
                    current : res?.result?.meta?.current_page || 1,
                    pageSize: res?.result?.meta?.per_page || 25,
                    total   : res?.result?.meta?.total || 0,
                });
            }
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to fetch assigned orders");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getEmployees();
        getAssignedOrders();
    }, [selectedUserId]);

    const handleTableChange = (pagination) => {
        getAssignedOrders(pagination.current);
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleBatchAction = async (value) => {
        if (!selectedRowKeys.length) {
            messageApi.warning("Please select at least one order");
            return;
        }

        if (value === 'remove_assign') {
            try {
                setLoading(true);
                const res = await postData('/admin/team/assign/removed', {
                    order_ids: selectedRowKeys,
                    _method: "PUT"
                });

                if (res && res?.success) {
                    messageApi.success(res?.message || "Orders removed from assign");
                    setSelectedRowKeys([])
                    getAssignedOrders(pagination.current, pagination.pageSize);
                } else {
                    messageApi.error(res?.message || "Failed to remove orders");
                }
            } catch (error) {
                console.error(error);
                messageApi.error("An error occurred during assignment");
            } finally {
                setLoading(false);
            }
        }
    }

    const handlePrintAction = ({ key }) => {
        if (!selectedRowKeys.length) {
            messageApi.warning("Please select orders first");
            return;
        }

        const selectedOrders = orders.filter(o => selectedRowKeys.includes(o.id));

        if (key === 'csv') {
            const dataToExport = selectedOrders.map(o => ({
                "Invoice Number": o.invoice_number,
                "Date"          : dayjs(o.created_at).format("DD MMM YYYY"),
                "Customer"      : o.customer_name,
                "Phone"         : o.phone_number,
                "Net Price"     : o.net_order_price,
                "Payable"       : o.payable_price,
                "Status"        : o.paid_status
            }));
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Assigned_Orders");
            XLSX.writeFile(wb, `Assigned_Orders_${dayjs().format('YYYY-MM-DD')}.csv`);
            messageApi.success("CSV file downloaded");
        } else if (key === 'pdf') {
            const doc = new jsPDF();
            const tableColumn = ["Invoice", "Date", "Customer", "Phone", "Net", "Payable"];
            const tableRows = selectedOrders.map(o => [
                o.invoice_number,
                dayjs(o.created_at).format("DD MMM YYYY"),
                o.customer_name,
                o.phone_number,
                o.net_order_price,
                o.payable_price
            ]);
            doc.text("Assigned Orders Report", 14, 15);
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
            });
            doc.save(`Assigned_Orders_${dayjs().format('YYYY-MM-DD')}.pdf`);
            messageApi.success("PDF file downloaded");
        } else if (key === 'print') {
            const selectedOrders = orders.filter(o => selectedRowKeys.includes(o.id));
            const printWindow = window.open('', '_blank', 'width=1000,height=750');
            const printDate = dayjs().format('DD MMM YYYY, hh:mm A');

            const rows = selectedOrders.map((o, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${o.invoice_number}</td>
                    <td>${dayjs(o.created_at).format('DD MMM YYYY')}</td>
                    <td>${o.customer_name}</td>
                    <td>${o.phone_number}</td>
                    <td style="font-size:10px">${o.address_details || '-'}</td>
                    <td>&#2547;${parseFloat(o.net_order_price).toLocaleString()}</td>
                    <td>&#2547;${parseFloat(o.payable_price).toLocaleString()}</td>
                    <td>${o.paid_status}</td>
                </tr>
            `).join('');

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Assigned Orders List</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
                        h2 { text-align: center; margin-bottom: 4px; font-size: 18px; font-weight: bold; }
                        .meta { text-align: center; color: #555; margin-bottom: 20px; font-size: 11px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th { background: #263238; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
                        td { border: 1px solid #ccc; padding: 6px 10px; font-size: 11px; vertical-align: top; }
                        tr:nth-child(even) td { background: #f9f9f9; }
                        @media print {
                            body { padding: 5mm; }
                            @page { margin: 10mm; size: landscape; }
                        }
                    </style>
                </head>
                <body>
                    <h2>Assigned Orders List</h2>
                    <p class="meta">Printed: ${printDate} &nbsp;|&nbsp; Total Orders: ${selectedOrders.length}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Invoice</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Address</th>
                                <th>Net Price</th>
                                <th>Payable</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const printMenu = {
        items: [
            {
                key: 'csv',
                label: 'Download CSV',
                icon: <DownloadOutlined />,
            },
            {
                key: 'pdf',
                label: 'Download PDF',
                icon: <FilePdfOutlined />,
            },
            {
                key: 'print',
                label: 'Print Selected',
                icon: <PrinterOutlined />,
            },
        ],
        onClick: handlePrintAction,
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: "center",
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: "Invoice & Date",
            key: "invoice",
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: "#1C558B" }}>{record.invoice_number}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(record.created_at).toLocaleString()}
                    </Text>
                </Space>
            )
        },
        {
            title: "Customer",
            key: "customer",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.customer_name}</Text>
                    <Text type="secondary">{record.phone_number}</Text>
                </Space>
            )
        },
        {
            title: "Prices",
            key: "prices",
            align: "right",
            render: (_, record) => (
                <Space direction="vertical" align="end" size={0}>
                    <Text>MRP: ৳{record.mrp}</Text>
                    <Text strong type="success">Payable: ৳{record.payable_price}</Text>
                </Space>
            )
        },
        {
            title: "Status",
            key: "status",
            align: "center",
            render: (_, record) => (
                <Space direction="vertical" size={4}>
                    <Tag color={record.paid_status === 'paid' ? 'success' : 'error'}>
                        {record.paid_status?.toUpperCase()}
                    </Tag>
                    {record.current_status && (
                        <Tag 
                            style={{ 
                                backgroundColor: record.current_status.bg_color + '1A',
                                color          : record.current_status.bg_color,
                                borderColor    : record.current_status.bg_color
                            }}
                        >
                            {record.current_status.name}
                        </Tag>
                    )}
                </Space>
            )
        },
        {
            title: "Prepared By",
            key: "prepared_by",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space size={4}>
                        <UserOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                        <Text>{record.prepared_by?.username}</Text>
                    </Space>

                    <Space size={4}>
                        <ClockCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
                        <Text type="secondary" style={{ fontSize: '11px' }}>{record.prepared_at}</Text>
                    </Space>
                </Space>
            )
        },
        {
            title: "Other",
            key: "other",
            render: (_, record) => (
                <Space size={8}>
                    {record.is_duplicate === 1 && (
                        <Tooltip title="Duplicate Order">
                            <Tag color="warning" icon={<WarningOutlined />}>DUP</Tag>
                        </Tooltip>
                    )}
                    
                    {record.is_invoice_printed === 1 && (
                        <Tooltip title="Invoice Printed">
                            <Tag color="blue" icon={<CheckCircleOutlined />}>Printed</Tag>
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    return (
        <>
            {contextHolder}
            <div className="pagehead" style={{ marginBottom: '24px' }}>
                <div className="head-left">
                    <Title level={3} style={{ margin: 0, fontWeight: "600" }}>
                        Assigned Order List
                    </Title>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Assigned Order List" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Text strong>Filter by Employee:</Text>
                    <Select
                        placeholder="All Employees"
                        style={{ width: 250 }}
                        value={selectedUserId}
                        onChange={(value) => { setSelectedUserId(value); setPagination(p => ({...p, current: 1})); }}
                        allowClear
                        showSearch
                        optionFilterProp="children"
                    >
                        {employees.map(emp => (
                            <Select.Option key={emp.id} value={emp.id}>
                                {emp.username || emp.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Space>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Space align="start">
                            <div style={{ backgroundColor: '#e6f7ff', padding: '12px', borderRadius: '10px' }}>
                                <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                            </div>
                            <div>
                                <Text type="secondary">Total Orders</Text>
                                <Title level={4} style={{ margin: 0 }}>{summary.orders_count}</Title>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Space align="start">
                            <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '10px' }}>
                                <WarningOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                            </div>
                            <div>
                                <Text type="secondary">Duplicates</Text>
                                <Title level={4} style={{ margin: 0 }}>{summary.duplicate_orders_count}</Title>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="summary-card" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Space align="start">
                            <div style={{ backgroundColor: '#f6ffed', padding: '12px', borderRadius: '10px' }}>
                                <DollarCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                            </div>
                            <div>
                                <Text type="secondary">Total Amount</Text>
                                <Title level={4} style={{ margin: 0 }}>৳ {Number(summary.total_amount).toLocaleString()}</Title>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
                {selectedRowKeys.length > 0 && (
                    <Space style={{ backgroundColor: '#e6f7ff', padding: '12px 20px', borderRadius: '12px', border: '1px solid #91d5ff', width: '100%', justifyContent: 'space-between' }}>
                        <Space size="large">
                            <Text strong><InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />{selectedRowKeys.length} orders selected</Text>
                            <Select placeholder="Bulk Actions" style={{ width: 220 }} onChange={handleBatchAction} size="middle">
                                <Select.Option value="remove_assign">Remove Assign</Select.Option>
                            </Select>
                        </Space>
                        <Space>
                            <Dropdown menu={printMenu} trigger={['click']}>
                                <Button type="primary" size="middle" ghost icon={<PrinterOutlined />}>
                                    Print Selected <DownOutlined style={{ fontSize: '12px' }} />
                                </Button>
                            </Dropdown>
                            <Button type="link" size="small" danger onClick={() => setSelectedRowKeys([])}>Clear Selection</Button>
                        </Space>
                    </Space>
                )}
            </div>

            <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: 0 }}>
                <Table 
                    rowSelection={rowSelection}
                    columns={columns} 
                    dataSource={orders} 
                    rowKey="id" 
                    loading={loading} 
                    pagination={{...pagination,showSizeChanger: true,
                        pageSizeOptions: ['15','25', '50', '100', '200'],
                        showTotal: (total, range) => (
                            <Text type="secondary">
                                Showing {range[0]}-{range[1]} of {total} orders
                            </Text>
                        ),
                        position: ['bottomRight']
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    style={{ borderRadius: 0 }}
                />
            </Card>
        </>
    )
}
