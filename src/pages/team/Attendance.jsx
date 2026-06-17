import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle";
import { getDatas } from "../../api/common/common";
import { Table, Tag, Card, Typography, Space, Breadcrumb, Input, DatePicker, Button, Tooltip, Badge, Select, Popconfirm } from "antd";
import {SearchOutlined, CalendarOutlined, ClockCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FilterOutlined, FileExcelOutlined, ReloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function Attendance() {
    // Hook
    useTitle("Attendance Log");
    const navigate = useNavigate();

    // States
    const [loading, setLoading]       = useState(false);
    const [data, setData]             = useState([]);
    const [pagination, setPagination] = useState({current: 1, paginate_size: 20, total: 0});
    const [params, setParams]         = useState({search: "", date_range: null,status: null,});

    // Functions
    const fetchAttendance = async (page = 1, pageSize = 20) => {
        setLoading(true);
        try {
            const res = await getDatas("/admin/attendance", {
                page,
                paginate_size: pageSize,
                search       : params.search,
                status       : params.status,
                start_date   : params.date_range?.[0]?.format("YYYY-MM-DD"),
                end_date     : params.date_range?.[1]?.format("YYYY-MM-DD"),
            });
            
            if (res?.success) {
                setData(res.result.data);
                setPagination({
                    current      : res.result.current_page,
                    paginate_size: res.result.per_page,
                    total        : res.result.total,
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const handleTableChange = (pagination) => {
        fetchAttendance(pagination.current, pagination.pageSize);
    };

    const columns = 
    [
        {
            title: "SL",
            key: "sl",
            width: 60,
            align: 'center',
            render: (_, __, index) => (
                <Text type="secondary">
                    {(pagination.current - 1) * pagination.paginate_size + index + 1}
                </Text>
            ),
        },
        {
            title: "Employee",
            key: "user",
            width: 250,
            render: (_, record) => (
                <Space size="middle">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px', textTransform: 'capitalize' }}>{record.user?.username}</Text>
                        <Text type="secondary" size="small" style={{ fontSize: '12px' }}>{record.user?.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "Log Date",
            dataIndex: "attendance_date",
            key: "attendance_date",
            render: (date) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarOutlined style={{ color: '#8c8c8c' }} />
                    <Text>{dayjs(date).format("DD MMM, YYYY")}</Text>
                </div>
            ),
        },
        {
            title: "Check In",
            dataIndex: "check_in_at",
            key: "check_in_at",
            render: (time) => time ? (
                <Space>
                    <Badge status="success" />
                    <Text>{dayjs(time).format("hh:mm A")}</Text>
                </Space>
            ) : <Text type="secondary" italic>No Record</Text>,
        },
        {
            title: "Check Out",
            dataIndex: "check_out_at",
            key: "check_out_at",
            render: (time) => time ? (
                <Space>
                    <Badge status="error" />
                    <Text>{dayjs(time).format("hh:mm A")}</Text>
                </Space>
            ) : <Text type="secondary" italic>Pending</Text>,
        },
        {
            title: "Duration",
            dataIndex: "working_minutes",
            key: "working_minutes",
            render: (mins) => {
                if(!mins) return <Tag bordered={false}>-</Tag>
                const hours = Math.floor(mins / 60);
                const minutes = mins % 60;
                return (
                    <Space>
                        <ClockCircleOutlined style={{ color: '#1890ff' }} />
                        <Text>{hours}h {minutes}m</Text>
                    </Space>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            align: 'center',
            render: (status) => {
                let color = "default";
                if (status === "present") color = "success";
                if (status === "absent") color = "error";
                if (status === "late") color = "warning";
                if (status === "half_day") color = "processing";
                
                return (
                    <Tag color={color} style={{ textTransform: 'capitalize', minWidth: '70px', textAlign: 'center' }}>
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: "Actions",
            key: "action",
            align: 'center',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Record">
                        <Button type="text" size="small" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
                    </Tooltip>
                    <Tooltip title="Edit Record">
                        <Button type="text" size="small" icon={<EditOutlined style={{ color: '#1890ff' }} />} />
                    </Tooltip>
                    <Tooltip title="Delete Record">
                        <Popconfirm title="Delete entry" description="Are you sure you want to delete this record?" onConfirm={() => console.log('Delete', record.id)} okText="Yes" cancelText="No" icon={<DeleteOutlined style={{ color: 'red' }} />}
                        >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '4px' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <Space align="start" size="middle">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginTop: 8 }} />
                    <div>
                        <Breadcrumb items={[
                                { title: <Link to="/">Dashboard</Link> },
                                { title: 'Team Management' },
                                { title: 'Attendance' },
                            ]}
                            style={{ marginBottom: 4 }}
                        />
                        <Title level={3} style={{ margin: 0 }}>Attendance Log</Title>
                    </div>
                </Space>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchAttendance(pagination.current)}>
                        Refresh Data
                    </Button>
                    <Button type="primary" icon={<FileExcelOutlined />}>
                        Export Excel
                    </Button>
                </Space>
            </div>

            <Card style={{ marginBottom: 24, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Search Employee</Text>
                        <Input placeholder="Name or Email..." prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} allowClear value={params.search} onChange={(e) => setParams({ ...params, search: e.target.value })} onPressEnter={() => fetchAttendance(1)} />
                    </div>
                    <div style={{ width: '180px' }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Status</Text>
                        <Select placeholder="All Status" style={{ width: '100%' }} allowClear value={params.status} onChange={(val) => setParams({ ...params, status: val })} options={[
                                { label: 'Present', value: 'present' },
                                { label: 'Late', value: 'late' },
                                { label: 'Absent', value: 'absent' },
                                { label: 'Half Day', value: 'half_day' },
                            ]}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Date Range</Text>
                        <RangePicker style={{ width: '100%' }} value={params.date_range} onChange={(dates) => setParams({ ...params, date_range: dates })} />
                    </div>
                    <div style={{ alignSelf: 'end' }}>
                        <Space>
                            <Button type="primary" icon={<FilterOutlined />} onClick={() => fetchAttendance(1)} style={{ borderRadius: '6px' }}>
                                Apply Filters
                            </Button>
                            <Button onClick={() => { setParams({ search: "", date_range: null, status: null }); fetchAttendance(1, 20); }} style={{ borderRadius: '6px' }}>
                                Reset
                            </Button>
                        </Space>
                    </div>
                </div>
            </Card>

            <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => (
                            <Text type="secondary">
                                Showing {range[0]}-{range[1]} of {total} records
                            </Text>
                        ),
                        position: ['bottomRight']
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                    style={{ borderRadius: '0px' }}
                />
            </Card>
        </div>
    );
}

export default Attendance;

