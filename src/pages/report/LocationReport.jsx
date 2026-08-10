import { useEffect, useState } from "react";
import { Table, Input, Select, Button, DatePicker, Space, Typography, Divider, Row, Col, Tag, Progress, Tooltip,Badge} from "antd";
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined, PrinterOutlined, CalendarOutlined, SearchOutlined, EnvironmentOutlined, GlobalOutlined, TeamOutlined, ShoppingCartOutlined, DollarOutlined, CheckCircleOutlined,SyncOutlined,CloseCircleOutlined,RollbackOutlined,TagOutlined,CarOutlined,GiftOutlined} from "@ant-design/icons";
import { getDatas } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function LocationReport() {
    // Hook
    useTitle("Order Report by Location");

    // State
    const [localSearch, setLocalSearch]         = useState("");
    const [loading, setLoading]                 = useState(false);
    const [dateFilter, setDateFilter]           = useState("all");
    const [locations, setLocations]             = useState([]);
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
            const res = await getDatas(`/admin/order/reports/by-location?${query}`);
            
            if (res && res?.success) {
                setLocations(res?.result?.locations?.data || []);
                setSummary(res?.result?.summary || null);
                setPagination(prev => ({ 
                    ...prev, 
                    total: res?.result?.locations?.total || 0,
                    current: res?.result?.locations?.current_page || 1,
                    pageSize: res?.result?.locations?.per_page || prev.pageSize
                }));
            }
        } catch (error) {
            console.error("Error fetching location report:", error);
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
        return locations.filter((loc) => {
            if (!localSearch) return true;
            const term = localSearch.toLowerCase();
            return (
                loc.district_name?.toLowerCase().includes(term) ||
                loc.district_slug?.toLowerCase().includes(term) ||
                String(loc.district_id).includes(term)
            );
        });
    };

    const getExportData = () => {
        const filtered = getFilteredData();
        if (selectedRowKeys.length > 0) {
            return filtered.filter(item => selectedRowKeys.includes(item.district_id));
        }
        return filtered;
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF("landscape");
        
        doc.setFontSize(16);
        doc.text("Order Report by Location", 14, 18);
        const dateStr = dayjs().format("YYYY-MM-DD HH:mm:ss");
        doc.setFontSize(9);
        doc.text(`Generated on: ${dateStr} | Total Items: ${dataToExport.length}`, 14, 25);
        
        if (summary) {
            doc.text(`Total Locations: ${summary.total_locations} | Total Payable: ৳${Number(summary.total_payable_price || 0).toLocaleString()} | Success Rate: ${summary.success_rate}%`, 14, 31);
        }

        const tableColumn = [
            "#", 
            "District", 
            "Cust / Orders", 
            "Delivered", 
            "Proc.", 
            "Cancel", 
            "Return", 
            "Payable (৳)", 
            "Net Price (৳)", 
            "Advance (৳)",
            "Del. Fee (৳)",
            "Success %"
        ];
        
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.district_name,
            `${o.unique_customers} / ${o.order_count}`,
            o.delivered_count,
            o.processing_count,
            o.canceled_count,
            o.returned_count,
            Number(o.total_payable_price || 0).toLocaleString(),
            Number(o.total_net_order_price || 0).toLocaleString(),
            Number(o.total_advance_payment || 0).toLocaleString(),
            Number(o.total_delivery_charge || 0).toLocaleString(),
            `${o.location_metrics?.success_rate || 0}%`
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
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'center' },
                6: { halign: 'center' },
                7: { halign: 'right' },
                8: { halign: 'right' },
                9: { halign: 'right' },
                10: { halign: 'right' },
                11: { halign: 'center' },
            }
        });

        doc.save(`Location_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = [
            "SL", 
            "District ID", 
            "District Name", 
            "District Slug", 
            "Unique Customers", 
            "Total Orders", 
            "Delivered Count", 
            "Processing Count", 
            "Canceled Count", 
            "Returned Count", 
            "Total Payable Price (BDT)", 
            "Total Net Order Price (BDT)", 
            "Total Advance Payment (BDT)", 
            "Total Delivery Charge (BDT)", 
            "Total Discount (BDT)", 
            "Total Coupon Value (BDT)", 
            "Average Order Value (BDT)", 
            "Success Rate (%)", 
            "Cancel Rate (%)", 
            "Return Rate (%)"
        ];

        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.district_id,
            `"${o.district_name}"`,
            `"${o.district_slug}"`,
            o.unique_customers,
            o.order_count,
            o.delivered_count,
            o.processing_count,
            o.canceled_count,
            o.returned_count,
            o.total_payable_price,
            o.total_net_order_price,
            o.total_advance_payment,
            o.total_delivery_charge,
            o.total_discount,
            o.total_coupon_value,
            o.location_metrics?.average_order_value || 0,
            o.location_metrics?.success_rate || 0,
            o.location_metrics?.cancel_rate || 0,
            o.location_metrics?.return_rate || 0
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `Location_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
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
            title: "District / Location",
            key: "location",
            width: 175,
            fixed: 'left',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ 
                        width         : 26,
                        height        : 26,
                        borderRadius  : '8px',
                        background    : '#eff6ff',
                        border        : '1px solid #dbeafe',
                        display       : 'flex',
                        alignItems    : 'center',
                        justifyContent: 'center',
                        flexShrink    : 0
                    }}>
                        <EnvironmentOutlined style={{ color: '#2563eb', fontSize: 14 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <Text strong style={{ color: '#0f172a', fontSize: 13, lineHeight: 1.2 }}>
                            {record.district_name}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Client & Orders",
            key: "volume",
            width: 160,
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="cyan" icon={<TeamOutlined />} style={{ margin: 0, borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                            {record.unique_customers} Customers
                        </Tag>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="geekblue" icon={<ShoppingCartOutlined />} style={{ margin: 0, borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                            {record.order_count} Total Orders
                        </Tag>
                    </div>
                </div>
            )
        },
        {
            title: "Order Status Breakdown",
            key: "status_counts",
            width: 230,
            render: (_, record) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <Tooltip title="Delivered Orders">
                        <div style={{ 
                            background: '#f0fdf4', 
                            border: '1px solid #bbf7d0', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: 11, color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircleOutlined style={{ color: '#16a34a' }} /> Delivered
                            </span>
                            <Text strong style={{ color: '#15803d', fontSize: 12 }}>{record.delivered_count}</Text>
                        </div>
                    </Tooltip>

                    <Tooltip title="Processing Orders">
                        <div style={{ 
                            background: '#eff6ff', 
                            border: '1px solid #bfdbfe', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: 11, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <SyncOutlined spin style={{ color: '#2563eb' }} /> Processing
                            </span>
                            <Text strong style={{ color: '#1d4ed8', fontSize: 12 }}>{record.processing_count}</Text>
                        </div>
                    </Tooltip>

                    <Tooltip title="Canceled Orders">
                        <div style={{ 
                            background: '#fef2f2', 
                            border: '1px solid #fecaca', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: 11, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CloseCircleOutlined style={{ color: '#dc2626' }} /> Canceled
                            </span>
                            <Text strong style={{ color: '#b91c1c', fontSize: 12 }}>{record.canceled_count}</Text>
                        </div>
                    </Tooltip>

                    <Tooltip title="Returned Orders">
                        <div style={{ 
                            background: '#fffbeb', 
                            border: '1px solid #fde68a', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <RollbackOutlined style={{ color: '#d97706' }} /> Returned
                            </span>
                            <Text strong style={{ color: '#b45309', fontSize: 12 }}>{record.returned_count}</Text>
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            title: "Performance Rates",
            key: "performance_rates",
            width: 200,
            render: (_, record) => {
                const successRate = record.location_metrics?.success_rate || 0;
                const cancelRate = record.location_metrics?.cancel_rate || 0;
                const returnRate = record.location_metrics?.return_rate || 0;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                                <Text style={{ color: '#475569', fontWeight: 500 }}>Success Rate</Text>
                                <Text strong style={{ color: successRate >= 30 ? '#10b981' : successRate >= 20 ? '#2563eb' : '#f59e0b' }}>
                                    {successRate}%
                                </Text>
                            </div>
                            <Progress 
                                percent={successRate} 
                                size={[180, 6]} 
                                showInfo={false} 
                                strokeColor={successRate >= 30 ? '#10b981' : successRate >= 20 ? '#3b82f6' : '#f59e0b'} 
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Tag color="error" style={{ margin: 0, fontSize: 10, padding: '0 6px', borderRadius: 4 }}>
                                Cancel: {cancelRate}%
                            </Tag>
                            <Tag color="warning" style={{ margin: 0, fontSize: 10, padding: '0 6px', borderRadius: 4 }}>
                                Return: {returnRate}%
                            </Tag>
                        </div>
                    </div>
                );
            }
        },
        {
            title: "Order Values (BDT)",
            key: "revenue_financials",
            width: 210,
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <Tooltip title="Total Payable Price">
                        <div className="payable-pill">
                            <Text strong className="payable-amount">
                                ৳{Number(record.total_payable_price || 0).toLocaleString()}
                            </Text>
                        </div>
                    </Tooltip>
                    
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                        Net Order: <Text strong style={{ color: '#334155' }}>৳{Number(record.total_net_order_price || 0).toLocaleString()}</Text>
                    </div>

                    <div style={{ fontSize: 10, color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', borderRadius: 4, border: '1px solid #ddd6fe' }}>
                        Advance: ৳{Number(record.total_advance_payment || 0).toLocaleString()}
                    </div>
                </div>
            )
        },
        {
            title: "Discounts & Logistics",
            key: "discounts_logistics",
            width: 200,
            align: 'right',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <div style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CarOutlined style={{ color: '#2563eb' }} />
                        <span>Delivery Charge:</span>
                        <Text strong style={{ color: '#0f172a' }}>
                            ৳{Number(record.total_delivery_charge || 0).toLocaleString()}
                        </Text>
                    </div>

                    <div style={{ fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TagOutlined style={{ color: '#dc2626' }} />
                        <span>Discount:</span>
                        <Text strong style={{ color: '#dc2626' }}>
                            ৳{Number(record.total_discount || 0).toLocaleString()}
                        </Text>
                    </div>

                    <div style={{ fontSize: 10, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <GiftOutlined style={{ color: '#d97706' }} />
                        <span>Coupon:</span>
                        <Text strong style={{ color: '#d97706' }}>
                            ৳{Number(record.total_coupon_value || 0).toLocaleString()}
                        </Text>
                    </div>
                </div>
            )
        },
        {
            title: "AOV & Grade",
            key: "aov_grade",
            width: 150,
            align: 'center',
            render: (_, record) => {
                const aov = record.location_metrics?.average_order_value || 0;
                const successRate = record.location_metrics?.success_rate || 0;
                
                let gradeColor = "green";
                let gradeText = "High Grade";
                if (successRate < 20) {
                    gradeColor = "volcano";
                    gradeText = "Low Grade";
                } else if (successRate < 30) {
                    gradeColor = "gold";
                    gradeText = "Medium";
                }

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                            <Text style={{ fontSize: 10, color: '#64748b', display: 'block' }}>Avg Order Value</Text>
                            <Text strong style={{ color: '#0f172a', fontSize: 12 }}>
                                ৳{Number(aov).toLocaleString()}
                            </Text>
                        </div>
                        <Tag color={gradeColor} style={{ margin: 0, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '0 8px' }}>
                            {gradeText}
                        </Tag>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="reportWrapper">
            <div className="topBar no-print flex-between">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                            Order Report by Location
                        </Title>
                        {summary && (
                            <Badge count={`${summary.total_locations?.toLocaleString()} Locations`} style={{ backgroundColor: '#10b981' }}/>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Comprehensive regional sales analytics, location breakdown & financial performance
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
                                        <span className="mini-card-label">Total Payable Revenue</span>
                                        <div className="mini-card-val">
                                            ৳{Number(summary.total_payable_price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">Net ৳{Number(summary.total_net_order_price || 0).toLocaleString()}</span>
                                    <span className="footer-pill">{summary.total_locations} Districts</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card green">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon green">
                                        <TeamOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Locations & Volume</span>
                                            <span className="mini-badge-pill">{summary.total_locations} Districts</span>
                                        </div>
                                        <div className="mini-card-val">
                                            {summary.total_orders?.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Orders</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill green">{summary.unique_customers?.toLocaleString()} Customers</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card purple">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon purple">
                                        <CheckCircleOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mini-card-label">Deliveries & Conversion</span>
                                            <span className="mini-badge-pill">{summary.success_rate}% Rate</span>
                                        </div>
                                        <div className="mini-card-val text-green">
                                            {summary.delivered_count?.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Delivered</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill red">Canc {summary.canceled_count}</span>
                                    <span className="footer-pill">Ret {summary.returned_count}</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="mini-summary-card orange">
                                <div className="mini-card-top">
                                    <div className="mini-card-icon orange">
                                        <ShoppingCartOutlined />
                                    </div>
                                    <div className="mini-card-info">
                                        <span className="mini-card-label">Delivery Charges</span>
                                        <div className="mini-card-val">
                                            ৳{Number(summary.total_delivery_charge || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mini-card-footer">
                                    <span className="footer-pill">Logistics Pool</span>
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
                        placeholder="Search district name, slug, or ID..." 
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
                    rowKey="district_id"
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
                        showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} locations`,
                    }}
                    className="order-intelligence-table"
                />
            </div>
        </div>
    );
}


