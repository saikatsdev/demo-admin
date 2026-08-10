import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Tag, Typography, Divider, Row, Col, Card, Badge, Tabs, Tooltip, Avatar } from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, SearchOutlined, ArrowLeftOutlined, CalendarOutlined, UserOutlined, DollarOutlined, FilterOutlined, AuditOutlined,PieChartOutlined, ShoppingOutlined, PrinterOutlined, ClockCircleOutlined,StarFilled} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function FollowupReport() {
    // Hook
    useTitle("Follow-up Order Report");

    // State
    const [followups, setFollowups]             = useState([]);
    const [summary, setSummary]                 = useState(null);
    const [statusBreakdown, setStatusBreakdown] = useState([]);
    const [stepBreakdown, setStepBreakdown]     = useState({});

    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [localSearch, setLocalSearch]         = useState("");
    const [statusFilter, setStatusFilter]       = useState(null);
    const [stepFilter, setStepFilter]           = useState(null);
    const [dateRange, setDateRange]             = useState([null, null]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination]           = useState({ current: 1, pageSize: 25, total: 0 });
    const [breakdownView, setBreakdownView]     = useState("status");

    const fetchFollowupReport = async () => {
        setLoading(true);
        let params = {
            page         : pagination.current,
            paginate_size: pagination.pageSize,
            search       : localSearch,
            status       : statusFilter,
            step         : stepFilter,
        };

        if (dateFilter !== "all" && dateFilter !== "custom") {
            params.filter = dateFilter;
        } else if (dateFilter === "custom" && dateRange?.[0] && dateRange?.[1]) {
            params.from_date = dateRange[0].format("YYYY-MM-DD");
            params.to_date = dateRange[1].format("YYYY-MM-DD");
        }

        try {
            const query = new URLSearchParams(
                Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ""))
            ).toString();
            const res = await getDatas(`/admin/order/reports/followup?${query}`);

            if (res?.success && res?.result) {
                const resData = res.result;
                setFollowups(resData?.followups?.data || []);
                setSummary(resData?.summary || null);
                setStatusBreakdown(resData?.follow_up_status_breakdown || []);
                setStepBreakdown(resData?.step_breakdown || {});

                setPagination((prev) => ({
                    ...prev,
                    total: resData?.followups?.total || 0,
                    current: resData?.followups?.current_page || 1,
                    pageSize: resData?.followups?.per_page || prev.pageSize
                }));
            }
        } catch (err) {
            console.error("Failed to fetch follow-up report:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowupReport();
    }, [dateFilter, dateRange, pagination.current, pagination.pageSize, statusFilter, stepFilter]);

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchFollowupReport();
    };

    const handleClearFilters = () => {
        setDateFilter("all");
        setLocalSearch("");
        setStatusFilter(null);
        setStepFilter(null);
        setDateRange([null, null]);
        setSelectedRowKeys([]);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const getFilteredData = () => {
        return followups.filter((item) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                item.invoice_number?.toLowerCase().includes(term) ||
                item.new_invoice_number?.toLowerCase().includes(term) ||
                item.customer_name?.toLowerCase().includes(term) ||
                item.phone_number?.toLowerCase().includes(term) ||
                item.employee?.username?.toLowerCase().includes(term) ||
                item.order?.invoice_number?.toLowerCase().includes(term) ||
                item.converted_order?.invoice_number?.toLowerCase().includes(term)
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
            title: "Followup Identity",
            key: "identity",
            fixed: 'left',
            render: (_, record) => (
                <div className="cell-identity">
                    <Text strong className="invoice-title">{record.invoice_number}</Text>
                    <div className="channel-meta">
                        <Tag color="geekblue" style={{ fontSize: 10, margin: 0, padding: '0 6px', borderRadius: 4, fontWeight: 600 }}>
                            ID: #{record.id}
                        </Tag>
                        <Text type="secondary" className="date-text">
                            {dayjs(record.created_at).format('DD MMM YY, hh:mm A')}
                        </Text>
                    </div>
                </div>
            ),
            width: 185
        },
        {
            title: "Customer Profile",
            key: "customer",
            render: (_, record) => (
                <div className="cell-customer">
                    <div className="avatar-circle">
                        <UserOutlined style={{ color: '#475569', fontSize: 13 }} />
                    </div>
                    <div className="customer-info">
                        <Text strong className="customer-name" ellipsis={{ tooltip: record.customer_name }}>
                            {record.customer_name || "N/A"}
                        </Text>
                        <Text type="secondary" className="customer-phone">
                            {record.phone_number || "N/A"}
                        </Text>
                    </div>
                </div>
            ),
            width: 175
        },
        {
            title: "Original Order",
            key: "original_order",
            render: (_, record) => {
                const origOrder = record.order;
                if (!origOrder) return <Text type="secondary">—</Text>;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <Text strong style={{ fontSize: 12.5, color: '#15803d' }}>
                                ৳{Number(origOrder.payable_price || 0).toLocaleString()}
                            </Text>
                            {origOrder.current_status && (
                                <Tag 
                                    style={{ 
                                        margin: 0,
                                        padding: '1px 6px',
                                        fontSize: 10,
                                        fontWeight: 600,
                                        borderRadius: 4,
                                        border: 'none',
                                        background: origOrder.current_status.bg_color || '#4CAF50',
                                        color: origOrder.current_status.text_color || '#ffffff'
                                    }}
                                >
                                    {origOrder.current_status.name}
                                </Tag>
                            )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 10.5, color: '#64748b' }}>
                            Inv: {origOrder.invoice_number}
                        </Text>
                    </div>
                );
            },
            width: 180
        },
        {
            title: "Assigned Agent & Step",
            key: "agent_step",
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar size={22} style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: 11, fontWeight: 700 }}>
                            {(record.employee?.username?.[0] || 'A').toUpperCase()}
                        </Avatar>
                        <Text strong style={{ fontSize: 12, color: '#334155' }} ellipsis={{ tooltip: record.employee?.username }}>
                            {record.employee?.username || 'Unassigned'}
                        </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="cyan" style={{ margin: 0, fontSize: 10, padding: '0 6px', borderRadius: 10, fontWeight: 600 }}>
                            Step {record.current_step} of {record.max_step}
                        </Tag>
                        {record.next_followup_at && (
                            <Tooltip title={`Next Followup: ${dayjs(record.next_followup_at).format('DD MMM YYYY, hh:mm A')}`}>
                                <ClockCircleOutlined style={{ color: '#0284c7', fontSize: 11 }} />
                            </Tooltip>
                        )}
                    </div>
                </div>
            ),
            width: 175
        },
        {
            title: "Latest Interaction & Remarks",
            key: "interaction",
            render: (_, record) => {
                const interaction = record.interactions?.[0];
                if (!interaction) return <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>No interaction recorded</Text>;
                
                const callStatusColor = interaction.call_status === 'answered' ? 'success' : interaction.call_status === 'no_answer' ? 'error' : 'warning';
                
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, background: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Tag color={callStatusColor} style={{ margin: 0, fontSize: 9.5, padding: '0 4px', textTransform: 'capitalize', borderRadius: 3 }}>
                                    {interaction.call_status}
                                </Tag>
                                {interaction.result && (
                                    <Tag color="blue" style={{ margin: 0, fontSize: 9.5, padding: '0 4px', textTransform: 'capitalize', borderRadius: 3 }}>
                                        {interaction.result}
                                    </Tag>
                                )}
                            </div>
                            {interaction.rating && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                                    <StarFilled style={{ fontSize: 10 }} />
                                    <span>{interaction.rating}/5</span>
                                </div>
                            )}
                        </div>
                        {interaction.remarks && (
                            <Text 
                                style={{ fontSize: 11, color: '#475569', margin: 0 }} 
                                ellipsis={{ tooltip: interaction.remarks }}
                            >
                                {interaction.remarks}
                            </Text>
                        )}
                        {record.next_followup_at && (
                            <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ClockCircleOutlined style={{ fontSize: 10, color: '#3b82f6' }} />
                                <span>Next: {dayjs(record.next_followup_at).format('DD MMM YY, hh:mm A')}</span>
                            </div>
                        )}
                    </div>
                );
            },
            width: 270
        },
        {
            title: "Converted Order Intel",
            key: "converted_order",
            render: (_, record) => {
                const convOrder = record.converted_order;
                if (!convOrder && record.status !== 'converted') {
                    return (
                        <Tag style={{ margin: 0, background: '#f1f5f9', color: '#94a3b8', border: 'none', fontSize: 10, borderRadius: 4 }}>
                            Not Converted
                        </Tag>
                    );
                }
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, background: '#f0fdf4', padding: '6px 10px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <Text strong style={{ fontSize: 12, color: '#0f172a' }}>
                                {record.new_invoice_number || convOrder?.invoice_number || 'Converted'}
                            </Text>
                            {convOrder?.current_status && (
                                <Tag 
                                    style={{ 
                                        margin: 0,
                                        padding: '0 5px',
                                        fontSize: 9.5,
                                        fontWeight: 600,
                                        borderRadius: 3,
                                        border: 'none',
                                        background: convOrder.current_status.bg_color || '#ddb063',
                                        color: convOrder.current_status.text_color || '#ffffff'
                                    }}
                                >
                                    {convOrder.current_status.name}
                                </Tag>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 12, color: '#16a34a' }}>
                                ৳{Number(convOrder?.payable_price || 0).toLocaleString()}
                            </Text>
                            {convOrder?.created_at && (
                                <Text type="secondary" style={{ fontSize: 10, color: '#64748b' }}>
                                    {dayjs(convOrder.created_at).format('DD MMM YY')}
                                </Text>
                            )}
                        </div>
                    </div>
                );
            },
            width: 185
        },
        {
            title: "Follow-up Status",
            key: "status",
            align: 'center',
            fixed: 'right',
            render: (_, record) => {
                let bg = '#e0f2fe';
                let color = '#0284c7';

                if (record.status === 'converted') {
                    bg = '#f0fdf4';
                    color = '#15803d';
                } else if (record.status === 'cancelled') {
                    bg = '#fef2f2';
                    color = '#b91c1c';
                } else if (record.status === 'auto_closed') {
                    bg = '#f8fafc';
                    color = '#475569';
                }

                return (
                    <div className="cell-status">
                        <Tag 
                            className="status-pill"
                            style={{ 
                                background: bg,
                                color: color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontWeight: 700,
                                fontSize: 10.5
                            }}
                        >
                            {record.status}
                        </Tag>
                    </div>
                );
            },
            width: 130
        }
    ];

    const handlePrint = () => {
        window.print();
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = [
            "SL", 
            "Invoice Number", 
            "Customer Name", 
            "Phone Number", 
            "Agent", 
            "Current Step", 
            "Original Invoice", 
            "Original Payable Price", 
            "Call Status", 
            "Interaction Result", 
            "Rating", 
            "Interaction Remarks", 
            "Next Followup Date", 
            "Converted Invoice", 
            "Converted Payable Price", 
            "Followup Status", 
            "Created At"
        ];

        const rows = dataToExport.map((item, index) => {
            const interaction = item.interactions?.[0];
            return [
                index + 1,
                `"${item.invoice_number || ''}"`,
                `"${item.customer_name || ''}"`,
                `"${item.phone_number || ''}"`,
                `"${item.employee?.username || 'Unassigned'}"`,
                `Step ${item.current_step || 1}/${item.max_step || 3}`,
                `"${item.order?.invoice_number || ''}"`,
                item.order?.payable_price || 0,
                `"${interaction?.call_status || ''}"`,
                `"${interaction?.result || ''}"`,
                interaction?.rating || '',
                `"${(interaction?.remarks || '').replace(/"/g, '""')}"`,
                `"${item.next_followup_at ? dayjs(item.next_followup_at).format("YYYY-MM-DD HH:mm:ss") : ''}"`,
                `"${item.new_invoice_number || item.converted_order?.invoice_number || ''}"`,
                item.converted_order?.payable_price || 0,
                `"${item.status || ''}"`,
                `"${dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss")}"`
            ];
        });

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Followup_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        
        doc.setFontSize(16);
        doc.text("Follow-up Order Report", 14, 18);
        doc.setFontSize(9);
        doc.text(`Generated on: ${dayjs().format("YYYY-MM-DD HH:mm:ss")} | Total Items: ${dataToExport.length}`, 14, 25);
        
        if (summary) {
            doc.text(`Total Followups: ${summary.total_followup_orders || summary.total_followups} | Converted Revenue: ৳${Number(summary.converted_order_revenue || 0).toLocaleString()} | Conversion Rate: ${summary.conversion_rate ?? summary.converted_rate ?? 0}%`, 14, 31);
        }

        const tableColumn = ["#", "Invoice", "Customer", "Phone", "Agent & Step", "Orig. Payable", "Interaction Summary", "Converted Invoice", "Status"];
        const tableRows = dataToExport.map((item, index) => {
            const interaction = item.interactions?.[0];
            const interactionText = interaction 
                ? `[${interaction.call_status || 'call'}] ${interaction.result || ''} - ${interaction.remarks || ''}`
                : 'No interaction';

            return [
                index + 1,
                item.invoice_number,
                item.customer_name || 'N/A',
                item.phone_number || 'N/A',
                `${item.employee?.username || 'Unassigned'} (Step ${item.current_step}/${item.max_step})`,
                `৳${Number(item.order?.payable_price || 0).toLocaleString()}`,
                interactionText,
                item.new_invoice_number || item.converted_order?.invoice_number || 'N/A',
                (item.status || '').toUpperCase()
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: summary ? 36 : 30,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontWeight: 'bold' },
            styles: { fontSize: 8, cellPadding: 2.5 }
        });

        doc.save(`Followup_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print flex-between">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                            Follow-up Order Report
                        </Title>
                        {summary && (
                            <Badge count={`${(summary.total_followup_orders || summary.total_followups || 0).toLocaleString()} Follow-ups`} style={{ backgroundColor: '#10b981' }}/>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Comprehensive follow-up engagement analytics, step progression & conversion tracking
                    </Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchFollowupReport} loading={loading}>
                        Refresh Data
                    </Button>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} className="back-btn">
                        Back
                    </Button>
                </Space>
            </div>

            <Divider className="no-print" style={{ margin: '14px 0' }} />

            {summary && (
                <div className="no-print" style={{ marginBottom: 16 }}>
                    <Row gutter={[12, 12]}>
                        {/* Card 1: Revenue & Converted Value */}
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card blue">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon blue">
                                        <DollarOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Converted Order Revenue</span>
                                        <div className="mini-card-val">
                                            ৳{Number(summary.converted_order_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">Net ৳{Number(summary.total_net_order_price || 0).toLocaleString()}</span>
                                    <span className="footer-pill green">Delivery ৳{Number(summary.total_delivery_charge || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </Col>

                        {/* Card 2: Total Follow-ups & Conversion Rate */}
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <AuditOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Total Follow-ups</span>
                                            <span className="mini-badge-pill">
                                                {(summary.conversion_rate ?? summary.converted_rate ?? 0)}% Rate
                                            </span>
                                        </div>
                                        <div className="mini-card-val">
                                            {(summary.total_followup_orders || summary.total_followups || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Active {summary.active_count ?? summary.total_active ?? 0}</span>
                                    <span className="footer-pill purple">Converted {summary.converted_count ?? summary.total_converted ?? 0}</span>
                                    <span className="footer-pill red">Canc {summary.cancelled_count ?? summary.total_cancelled ?? 0}</span>
                                    <span className="footer-pill">Closed {summary.auto_closed_count ?? summary.total_auto_closed ?? 0}</span>
                                </div>
                            </div>
                        </Col>

                        {/* Card 3: Avg Converted Order Value */}
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card purple">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon purple">
                                        <ShoppingOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Avg Converted Order Value</span>
                                        <div className="mini-card-val">
                                            ৳{Number(summary.average_converted_order_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">{summary.converted_count ?? summary.total_converted ?? 0} Converted Orders</span>
                                    <span className="footer-pill green">Rev ৳{(Number(summary.converted_order_revenue || 0) / 1000).toFixed(1)}k</span>
                                </div>
                            </div>
                        </Col>

                        {/* Card 4: Step Pipeline Overview */}
                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <ClockCircleOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Initial Step Active</span>
                                        <div className="mini-card-val">
                                            {(stepBreakdown?.step_1 || 0).toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Step 1</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">Step 1: {stepBreakdown?.step_1 || 0}</span>
                                    <span className="footer-pill">Step 2: {stepBreakdown?.step_2 || 0}</span>
                                    <span className="footer-pill">Step 3: {stepBreakdown?.step_3 || 0}</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="no-print breakdown-section" style={{ marginBottom: 14 }}>
                <Card 
                    size="small" 
                    className="breakdown-card-wrapper"
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <Space align="center" size={6}>
                                <PieChartOutlined style={{ color: '#1E50A2', fontSize: 14 }} />
                                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Follow-up Analytics Breakdown</span>
                                {(statusFilter || stepFilter) && (
                                    <Tag color="blue" closable 
                                        onClose={() => {
                                            setStatusFilter(null);
                                            setStepFilter(null);
                                        }}
                                        style={{ fontSize: 10, margin: 0 }}
                                    >
                                        Filter Active
                                    </Tag>
                                )}
                            </Space>
                            <Tabs activeKey={breakdownView} onChange={setBreakdownView} size="small" style={{ marginBottom: -8 }}
                                items={[
                                    { key: 'status', label: `Status Breakdown (${statusBreakdown.length})` },
                                    { key: 'step', label: `Step Breakdown (${Object.keys(stepBreakdown || {}).length})` }
                                ]}
                            />
                        </div>
                    }
                >
                    {breakdownView === 'status' && (
                        <div className="status-chip-ribbon">
                            {statusBreakdown.map((item) => {
                                const isSelected = statusFilter === item.status;
                                return (
                                    <div key={item.status} className={`status-chip ${isSelected ? 'active' : ''}`} onClick={() => setStatusFilter(isSelected ? null : item.status)}>
                                        <span className="chip-name" style={{ textTransform: 'capitalize' }}>{item.status}</span>
                                        <span className="chip-count">{item.count}</span>
                                        <span className="chip-percent">{item.percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {breakdownView === 'step' && (
                        <div className="channel-chip-ribbon">
                            {Object.entries(stepBreakdown || {}).map(([stepKey, count]) => {
                                const stepNum = stepKey.replace("step_", "");
                                const isSelected = stepFilter === stepNum;
                                return (
                                    <div key={stepKey} className={`compact-channel-chip ${isSelected ? 'active' : ''}`} onClick={() => setStepFilter(isSelected ? null : stepNum)}>
                                        <ClockCircleOutlined style={{ color: '#1E50A2', fontSize: 14 }} />
                                        <span className="chip-name">Step {stepNum}</span>
                                        <span className="chip-count">{count} Orders</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            <div className="filter-toolbar no-print">
                <Space wrap size="middle" align="center">
                    <Input 
                        placeholder="Search Invoice, Customer, Phone, Agent..." 
                        allowClear 
                        value={localSearch} 
                        onChange={(e) => setLocalSearch(e.target.value)} 
                        onPressEnter={handleSearch} 
                        className="search-input" 
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    />
                    
                    <Select 
                        placeholder="Follow-up Status" 
                        value={statusFilter} 
                        style={{ width: 160 }} 
                        onChange={setStatusFilter} 
                        allowClear
                        suffixIcon={<FilterOutlined style={{ color: '#94a3b8' }} />}
                    >
                        <Option value="active">Active</Option>
                        <Option value="converted">Converted</Option>
                        <Option value="cancelled">Cancelled</Option>
                        <Option value="auto_closed">Auto Closed</Option>
                    </Select>

                    <Select 
                        placeholder="Follow-up Step" 
                        value={stepFilter} 
                        style={{ width: 140 }} 
                        onChange={setStepFilter} 
                        allowClear
                    >
                        <Option value="1">Step 1</Option>
                        <Option value="2">Step 2</Option>
                        <Option value="3">Step 3</Option>
                        <Option value="4">Step 4</Option>
                        <Option value="5">Step 5</Option>
                    </Select>

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
                        <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} allowClear style={{ width: 240 }} />
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

            {/* Table section without expanded rows */}
            <div className="printable order-table-container">
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    rowKey="id"
                    columns={columns}
                    dataSource={getFilteredData()}
                    loading={loading}
                    scroll={{ x: 1300 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '25', '50', '100'],
                        size: "small",
                        className: "custom-pagination no-print",
                        showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} follow-up orders`,
                    }}
                    className="order-intelligence-table"
                />
            </div>
        </div>
    );
}
