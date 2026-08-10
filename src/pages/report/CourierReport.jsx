import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider, Row, Col, Avatar, Tag, Progress, Tooltip,Badge} from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, RocketOutlined, DollarOutlined, BarChartOutlined, InboxOutlined,CheckCircleOutlined,CloseCircleOutlined,RollbackOutlined,CarOutlined,SendOutlined,CodeSandboxOutlined,TeamOutlined,ShoppingCartOutlined,HistoryOutlined} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CourierReport() {
    // Hook
    useTitle("Courier Analytics Hub");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [couriers, setCouriers]               = useState([]);
    const [summary, setSummary]                 = useState(null);
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

        try {
            setLoading(true);
            const query = new URLSearchParams(params).toString();
            const res = await getDatas(`/admin/order/reports/courier?${query}`);
            if (res && res?.success) {
                setCouriers(res?.result?.couriers?.data || []);
                setSummary(res?.result?.summary || null);
                setPagination(prev => ({ 
                    ...prev, 
                    total: res?.result?.couriers?.total || 0,
                    current: res?.result?.couriers?.current_page || 1,
                    pageSize: res?.result?.couriers?.per_page || prev.pageSize
                }));
            }
        } catch (error) {
            console.error("Failed to fetch courier report:", error);
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

    const handleClearFilters = () => {
        setDateFilter("all");
        setLocalSearch("");
        setDateRange([null, null]);
        setSelectedRowKeys([]);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const getFilteredData = () => {
        return couriers.filter((c) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                c.courier_name?.toLowerCase().includes(term) ||
                c.courier_slug?.toLowerCase().includes(term) ||
                String(c.courier_id).includes(term)
            );
        });
    };

    const getExportData = () => {
        const filtered = getFilteredData();
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.courier_id));
        }
        return filtered;
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        doc.setFontSize(16);
        doc.text("Courier Performance Report", 14, 18);
        const dateStr = dayjs().format("YYYY-MM-DD HH:mm:ss");
        doc.setFontSize(9);
        doc.text(`Generated on: ${dateStr} | Total Partners: ${dataToExport.length}`, 14, 25);
        
        if (summary) {
            doc.text(`Total Orders: ${summary.total_orders} | Total Courier Payable: ৳${Number(summary.total_courier_payable || 0).toLocaleString()} | Success Rate: ${summary.success_rate}%`, 14, 31);
        }

        const tableColumn = [
            "#", 
            "Courier", 
            "Orders", 
            "Delivered", 
            "Transit", 
            "Pending", 
            "Received", 
            "Courier Payable (৳)", 
            "Deliv. Charge (৳)", 
            "Net Price (৳)", 
            "Del. Success %"
        ];
        
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.courier_name,
            o.order_count,
            o.delivered_count,
            o.in_courier_count,
            o.courier_pending_count,
            o.courier_received_count,
            Number(o.total_courier_payable || 0).toLocaleString(),
            Number(o.total_delivery_charge || 0).toLocaleString(),
            Number(o.total_net_order_price || 0).toLocaleString(),
            `${o.courier_metrics?.delivery_success_rate || 0}%`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: summary ? 36 : 30,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontWeight: 'bold' },
            styles: { fontSize: 8, cellPadding: 2.5 },
            columnStyles: {
                0: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'center' },
                6: { halign: 'center' },
                7: { halign: 'right' },
                8: { halign: 'right' },
                9: { halign: 'right' },
                10: { halign: 'center' },
            }
        });
        doc.save(`Courier_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = [
            "SL", 
            "Courier ID", 
            "Courier Name", 
            "Courier Slug", 
            "Total Orders", 
            "Unique Customers", 
            "Delivered Count", 
            "Canceled Count", 
            "Returned Count", 
            "In Courier Count", 
            "Courier Pending Count", 
            "Courier Received Count", 
            "Processing Count", 
            "Total Courier Payable (BDT)", 
            "Total Delivery Charge (BDT)", 
            "Total Net Order Price (BDT)", 
            "Total Payable Price (BDT)", 
            "Total Advance Payment (BDT)", 
            "Avg Item Weight (kg)", 
            "Avg Order Value (BDT)", 
            "Avg Delivery Charge (BDT)", 
            "Delivery Success Rate (%)", 
            "Overall Success Rate (%)", 
            "Cancel Rate (%)", 
            "Return Rate (%)"
        ];

        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.courier_id,
            `"${o.courier_name}"`,
            `"${o.courier_slug}"`,
            o.order_count,
            o.unique_customers,
            o.delivered_count,
            o.canceled_count,
            o.returned_count,
            o.in_courier_count,
            o.courier_pending_count,
            o.courier_received_count,
            o.processing_count,
            o.total_courier_payable,
            o.total_delivery_charge,
            o.total_net_order_price,
            o.total_payable_price,
            o.total_advance_payment,
            o.courier_metrics?.average_item_weight || o.average_item_weight,
            o.courier_metrics?.average_order_value || 0,
            o.courier_metrics?.average_delivery_charge || 0,
            o.courier_metrics?.delivery_success_rate || 0,
            o.courier_metrics?.success_rate || 0,
            o.courier_metrics?.cancel_rate || 0,
            o.courier_metrics?.return_rate || 0
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Courier_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const columns = [
        {
            title: "#",
            key: "sl",
            render: (_, __, index) => (
                <span className="sl-badge">
                    {(pagination.current - 1) * pagination.pageSize + index + 1}
                </span>
            ),
            width: 55,
            align: 'center',
            fixed: 'left'
        },
        {
            title: "Courier Partner",
            key: "courier",
            width: 180,
            fixed: 'left',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar 
                        shape="square" 
                        size={40} 
                        src={record.courier_img_path} 
                        style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}
                        icon={<CarOutlined style={{ color: '#2563eb' }} />}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <Text strong style={{ color: '#0f172a', fontSize: 13, lineHeight: 1.2 }}>
                            {record.courier_name}
                        </Text>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 3 }}>
                            <Tag color="blue" style={{ margin: 0, fontSize: 10, padding: '0 5px', borderRadius: 4 }}>
                                ID: {record.courier_id}
                            </Tag>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Client & Parcel Volume",
            key: "volume",
            width: 170,
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="geekblue" icon={<InboxOutlined />} style={{ margin: 0, borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                            {record.order_count} Orders
                        </Tag>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="cyan" icon={<TeamOutlined />} style={{ margin: 0, borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                            {record.unique_customers} Customers
                        </Tag>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                        Avg Weight: <Text strong style={{ color: '#334155' }}>{Number(record.courier_metrics?.average_item_weight || record.average_item_weight || 0).toFixed(2)} kg</Text>
                    </div>
                </div>
            )
        },
        {
            title: "Parcel Status Pipeline",
            key: "pipeline_status",
            width: 220,
            render: (_, record) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <Tooltip title="Pending Pickup from Merchant">
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <SendOutlined style={{ color: '#2563eb' }} /> Pending
                            </span>
                            <Text strong style={{ color: '#1d4ed8', fontSize: 11 }}>{record.courier_pending_count}</Text>
                        </div>
                    </Tooltip>

                    <Tooltip title="Received at Courier Hub">
                        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '3px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <CodeSandboxOutlined style={{ color: '#7c3aed' }} /> Hub Rec.
                            </span>
                            <Text strong style={{ color: '#6d28d9', fontSize: 11 }}>{record.courier_received_count}</Text>
                        </div>
                    </Tooltip>

                    <Tooltip title="Currently in Courier Transit">
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#92400e', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <RocketOutlined style={{ color: '#d97706' }} /> Transit
                            </span>
                            <Text strong style={{ color: '#b45309', fontSize: 11 }}>{record.in_courier_count}</Text>
                        </div>
                    </Tooltip>

                    <Tooltip title="Total Active Processing">
                        <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                                Processing
                            </span>
                            <Text strong style={{ color: '#0f172a', fontSize: 11 }}>{record.processing_count}</Text>
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            title: "Delivery Status Breakdown",
            key: "delivery_breakdown",
            width: 190,
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircleOutlined style={{ color: '#16a34a' }} /> Delivered
                        </span>
                        <Text strong style={{ color: '#15803d', fontSize: 12 }}>{record.delivered_count}</Text>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#991b1b' }}>Cancel</span>
                            <Text strong style={{ color: '#b91c1c', fontSize: 11 }}>{record.canceled_count}</Text>
                        </div>
                        <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#92400e' }}>Return</span>
                            <Text strong style={{ color: '#b45309', fontSize: 11 }}>{record.returned_count}</Text>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Delivery Health & Conversion",
            key: "performance_rates",
            width: 210,
            render: (_, record) => {
                const delSuccessRate = record.courier_metrics?.delivery_success_rate || 0;
                const overallSuccessRate = record.courier_metrics?.success_rate || 0;
                const cancelRate = record.courier_metrics?.cancel_rate || 0;
                const returnRate = record.courier_metrics?.return_rate || 0;

                let gradeColor = "green";
                let gradeText = "Premium Partner";
                if (delSuccessRate < 40) {
                    gradeColor = "volcano";
                    gradeText = "Action Needed";
                } else if (delSuccessRate < 50) {
                    gradeColor = "blue";
                    gradeText = "Standard Partner";
                }

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                                <Text style={{ color: '#475569', fontWeight: 500 }}>Dispatched Success</Text>
                                <Text strong style={{ color: delSuccessRate >= 50 ? '#10b981' : delSuccessRate >= 40 ? '#2563eb' : '#ef4444' }}>
                                    {delSuccessRate}%
                                </Text>
                            </div>
                            <Progress 
                                percent={delSuccessRate} 
                                size={[180, 6]} 
                                showInfo={false} 
                                strokeColor={delSuccessRate >= 50 ? '#10b981' : delSuccessRate >= 40 ? '#3b82f6' : '#ef4444'} 
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, color: '#64748b' }}>Overall Conversion: <strong>{overallSuccessRate}%</strong></span>
                            <Tag color={gradeColor} style={{ margin: 0, borderRadius: 8, fontSize: 9, fontWeight: 700, padding: '0 6px' }}>
                                {gradeText}
                            </Tag>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <Tag color="error" style={{ margin: 0, fontSize: 9, padding: '0 4px', borderRadius: 4 }}>
                                Cancel: {cancelRate}%
                            </Tag>
                            <Tag color="warning" style={{ margin: 0, fontSize: 9, padding: '0 4px', borderRadius: 4 }}>
                                Return: {returnRate}%
                            </Tag>
                        </div>
                    </div>
                );
            }
        },
        {
            title: "Courier Payable & Settlement",
            key: "courier_payable",
            width: 190,
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <Tooltip title="Courier Payable Balance (Liability)">
                        <div style={{ background: '#fef2f2', padding: '4px 10px', borderRadius: 6, border: '1px solid #fee2e2', display: 'inline-block' }}>
                            <Text style={{ fontSize: 10, color: '#991b1b', marginRight: 4 }}>Payable:</Text>
                            <Text strong style={{ color: '#b91c1c', fontSize: 13 }}>
                                ৳{Number(record.total_courier_payable || 0).toLocaleString()}
                            </Text>
                        </div>
                    </Tooltip>

                    <div style={{ fontSize: 11, color: '#475569' }}>
                        Delivery Charge: <Text strong style={{ color: '#0f172a' }}>৳{Number(record.total_delivery_charge || 0).toLocaleString()}</Text>
                    </div>

                    <div style={{ fontSize: 10, color: '#64748b' }}>
                        Avg Fee/Parcel: ৳{Number(record.courier_metrics?.average_delivery_charge || 0).toFixed(2)}
                    </div>
                </div>
            )
        },
        {
            title: "Sales Revenue & Value",
            key: "sales_value",
            width: 190,
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div className="payable-pill">
                        <Text strong className="payable-amount">
                            ৳{Number(record.total_payable_price || 0).toLocaleString()}
                        </Text>
                    </div>

                    <div style={{ fontSize: 11, color: '#64748b' }}>
                        Net Order: <Text strong style={{ color: '#334155' }}>৳{Number(record.total_net_order_price || 0).toLocaleString()}</Text>
                    </div>

                    <div style={{ fontSize: 10, color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', borderRadius: 4, border: '1px solid #ddd6fe' }}>
                        Advance Rec.: ৳{Number(record.total_advance_payment || 0).toLocaleString()}
                    </div>

                    <div style={{ fontSize: 10, color: '#64748b' }}>
                        AOV: ৳{Number(record.courier_metrics?.average_order_value || 0).toLocaleString()}
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="reportWrapper">
            {/* Header TopBar */}
            <div className="topBar no-print flex-between">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                            Courier Hub Performance Analytics
                        </Title>
                        {summary && (
                            <Badge count={`${summary.total_couriers?.toLocaleString()} Partners`} style={{ backgroundColor: '#10b981' }}/>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Logistics performance metrics, delivery success rates, settlement balances & transit status pipeline
                    </Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={getOrderReport} loading={loading}>
                        Refresh Data
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} className="back-btn">
                        Back
                    </Button>
                </Space>
            </div>

            <Divider className="no-print" style={{ margin: '14px 0' }} />

            {/* Summary Stat Cards */}
            {summary && (
                <div className="no-print" style={{ marginBottom: 16 }}>
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card blue">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon blue">
                                        <DollarOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Courier Liabilities</span>
                                        <div className="mini-card-val text-red">
                                            ৳{Number(summary.total_courier_payable || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">Deliv Charges ৳{Number(summary.total_delivery_charge || 0).toLocaleString()}</span>
                                    <span className="footer-pill">{summary.total_couriers} Partners</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <ShoppingCartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Dispatched Volume</span>
                                            <span className="mini-badge-pill">{summary.unique_customers?.toLocaleString()} Clients</span>
                                        </div>
                                        <div className="mini-card-val">
                                            {summary.total_orders?.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Orders</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Payable ৳{Number(summary.total_payable_price || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card purple">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon purple">
                                        <RocketOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Transit Pipeline</span>
                                            <span className="mini-badge-pill">{summary.in_courier_count} Transit</span>
                                        </div>
                                        <div className="mini-card-val">
                                            {summary.courier_pending_count} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Pending</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">Hub Rec: {summary.courier_received_count}</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <BarChartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Network Health</span>
                                            <span className="mini-badge-pill">{summary.success_rate}% Success</span>
                                        </div>
                                        <div className="mini-card-val text-green">
                                            {summary.delivered_count} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Delivered</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill red">Canc {summary.canceled_count}</span>
                                    <span className="footer-pill">Ret {summary.returned_count}</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            {/* Filter Toolbar */}
            <div className="filter-toolbar no-print">
                <Space wrap size="middle" align="center">
                    <Input 
                        placeholder="Search courier name, slug, or ID..." 
                        allowClear 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        className="search-input"
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    />
                    
                    <Select 
                        value={dateFilter} 
                        style={{ width: 140 }} 
                        onChange={(val) => {
                            setDateFilter(val);
                            if (val !== "custom") setDateRange([null, null]);
                        }}
                        suffixIcon={<CalendarOutlined style={{ color: '#94a3b8' }} />}
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
                        <RangePicker 
                            value={dateRange} 
                            onChange={(dates) => setDateRange(dates)} 
                            allowClear 
                            style={{ width: 240 }} 
                        />
                    )}

                    <Button icon={<ReloadOutlined />} onClick={handleClearFilters} className="reset-btn">
                        Reset
                    </Button>
                </Space>

                <Space size="middle" align="center" className="export-actions">
                    {selectedRowKeys.length > 0 && (
                        <Tag color="blue" className="selected-tag">
                            {selectedRowKeys.length} selected
                        </Tag>
                    )}
                    <Button type="primary" icon={<FileExcelOutlined />} onClick={downloadCSV} className="btn-csv">
                        CSV
                    </Button>
                    <Button type="primary" icon={<FilePdfOutlined />} onClick={downloadPDF} className="btn-pdf">
                        PDF
                    </Button>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint} className="btn-print">
                        Print
                    </Button>
                </Space>
            </div>

            {/* Table Presentation */}
            <div className="printable order-table-container">
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    rowKey="courier_id"
                    columns={columns}
                    dataSource={getFilteredData()}
                    loading={loading}
                    scroll={{ x: 1350 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '25', '50', '100'],
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} couriers`,
                    }}
                    className="order-intelligence-table"
                />
            </div>
        </div>
    );
}

