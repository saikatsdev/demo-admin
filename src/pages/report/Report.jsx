"use client";
import { useState } from "react";
import { Table, Input, Select, Button, Typography, Space, Divider, Avatar, Breadcrumb } from "antd";
import { 
    FilePdfOutlined, 
    FileExcelOutlined, 
    ReloadOutlined, 
    ArrowLeftOutlined, 
    PrinterOutlined,
    SearchOutlined,
    UserOutlined
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import "./report.css";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Report() {
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [filter, setFilter] = useState("");
    const [category, setCategory] = useState("");
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const fakeData = [
        { id: 1, name: "Tom Cooper", email: "cooper@gmail.com", status: "Active", location: "United States", phone: "+65 9308 4744", group: "Design", avatar: "https://i.pravatar.cc/40?img=1", category: "Electronics" },
        { id: 2, name: "Leslie Lawson", email: "lawson@gmail.com", status: "Active", location: "Canada", phone: "+65 8689 9346", group: "Development", avatar: "https://i.pravatar.cc/40?img=2", category: "Apparel" },
        { id: 3, name: "Kristin Watson", email: "watson@gmail.com", status: "Inactive", location: "Germany", phone: "+62-896-5554-32", group: "Marketing", avatar: "https://i.pravatar.cc/40?img=3", category: "Electronics" },
        { id: 4, name: "Annette Black", email: "a.black@gmail.com", status: "Active", location: "United States", phone: "+62-838-5558-34", group: "Design", avatar: "https://i.pravatar.cc/40?img=4", category: "Apparel" },
        { id: 5, name: "Floyd Miles", email: "miles@gmail.com", status: "Inactive", location: "United States", phone: "+1-555-8701-158", group: "Development", avatar: "https://i.pravatar.cc/40?img=5", category: "Electronics" },
        { id: 6, name: "Cody Fisher", email: "fisher@gmail.com", status: "Inactive", location: "United States", phone: "+61480013910", group: "Design", avatar: "https://i.pravatar.cc/40?img=6", category: "Apparel" },
        { id: 7, name: "Theresa Web", email: "theresa@gmail.com", status: "Active", location: "France", phone: "+91 9163337392", group: "Development", avatar: "https://i.pravatar.cc/40?img=7", category: "Electronics" },
        { id: 8, name: "Tim Simmons", email: "simmons@gmail.com", status: "Active", location: "United States", phone: "+49 1590 12345678", group: "Marketing", avatar: "https://i.pravatar.cc/40?img=8", category: "Apparel" },
    ];

    const columns = [
        {
            title: "User",
            key: "user",
            render: (_, record) => (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    <div>
                        <Text strong>{record.name}</Text><br/>
                        <Text type="secondary" size="small">{record.email}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <span className={`statusBadge ${status.toLowerCase()}`}>
                    {status}
                </span>
            ),
        },
        { title: "Location", dataIndex: "location", key: "location" },
        { title: "Phone", dataIndex: "phone", key: "phone" },
        {
            title: "Group",
            dataIndex: "group",
            key: "group",
            render: (group) => (
                <span className={`groupBadge ${group.toLowerCase()}`}>
                    {group}
                </span>
            ),
        },
    ];

    const filteredData = fakeData.filter((user) =>
        (user.name.toLowerCase().includes(filter.toLowerCase()) ||
            user.status.toLowerCase().includes(filter.toLowerCase()) ||
            user.location.toLowerCase().includes(filter.toLowerCase()) ||
            user.group.toLowerCase().includes(filter.toLowerCase())) &&
        (category === "" || user.category === category)
    );

    const handlePrint = () => {
        window.print();
    };

    const getExportData = () => {
        if (selectedRowKeys.length > 0) {
            return filteredData.filter(item => selectedRowKeys.includes(item.id));
        }
        return filteredData;
    };

    const downloadPDF = () => {
        const dataToExport = getExportData();
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("All Report Summary", 14, 22);
        const dateStr = dayjs().format("YYYY-MM-DD");
        doc.setFontSize(11);
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
        const tableColumn = ["#", "Name", "Status", "Location", "Phone", "Group"];
        const tableRows = dataToExport.map((o, i) => [
            i + 1,
            o.name,
            o.status,
            o.location,
            o.phone,
            o.group
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [28, 85, 139], textColor: 255 },
            styles: { fontSize: 9 }
        });
        doc.save(`All_Report_${dateStr}.pdf`);
    };

    const downloadCSV = () => {
        const dataToExport = getExportData();
        const headers = ["SL", "Name", "Email", "Status", "Location", "Phone", "Group"];
        const rows = dataToExport.map((o, i) => [
            i + 1,
            o.name,
            o.email,
            o.status,
            o.location,
            o.phone,
            o.group
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `All_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    return (
        <div className="reportWrapper">
            <div className="topBar no-print">
                <Title level={4} style={{ margin: 0 }}>All Report Dashboard</Title>
                <Space size="large">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Report" },
                        ]}
                    />
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                </Space>
            </div>

            <Divider className="no-print" style={{ margin: '12px 0' }} />

            <div className="topBar no-print">
                <Space wrap size="middle">
                    <Input 
                        placeholder="Search users..." 
                        allowClear 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)} 
                        style={{ width: 250 }}
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    />
                    
                    <Select 
                        placeholder="Select Category"
                        value={category || undefined}
                        allowClear
                        style={{ width: 180 }}
                        onChange={(value) => setCategory(value || "")}
                    >
                        <Option value="Electronics">Electronics</Option>
                        <Option value="Apparel">Apparel</Option>
                    </Select>

                    <Button icon={<ReloadOutlined />} onClick={() => {
                        setFilter("");
                        setCategory("");
                        setSelectedRowKeys([]);
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
                    dataSource={filteredData}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: filteredData.length,
                        onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
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
