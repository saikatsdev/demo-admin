import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../../api/common/common";
import useTitle from "../../../../hooks/useTitle";
import { Badge, Breadcrumb, Button, DatePicker, Input, message, Modal, Select, Table, Tag } from "antd";
import { CloseCircleOutlined, SearchOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

export default function OrderList() {
    useTitle('UnAssign Order List');

    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 25,
        total: 0,
    });
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [searchKey, setSearchKey]             = useState("");
    const [dateRange, setDateRange]             = useState(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [employees, setEmployees]             = useState([]);
    const [employeeLoading, setEmployeeLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [assignLoading, setAssignLoading]     = useState(false);

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 80,
            render: (_, __, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: "Invoice",
            dataIndex: "invoice_number",
            key: "invoice_number",
            width: 180,
        },
        {
            title: "Customer",
            dataIndex: "customer_name",
            key: "customer_name",
            width: 150,
        },
        {
            title: "Phone",
            dataIndex: "phone_number",
            key: "phone_number",
            width: 140,
        },
        {
            title: "Address",
            dataIndex: "address_details",
            key: "address_details",
            width: 200,
            ellipsis: true,
        },
        {
            title: "Payable",
            dataIndex: "payable_price",
            key: "payable_price",
            width: 120,
            render: (val) => `৳${parseFloat(val).toLocaleString()}`,
        },
        {
            title: "Due",
            dataIndex: "due",
            key: "due",
            width: 100,
            render: (val) => {
                const due = parseFloat(val);
                return (
                    <Tag color={due > 0 ? "red" : "green"}>
                        ৳{due.toLocaleString()}
                    </Tag>
                );
            },
        },
        {
            title: "Paid Status",
            dataIndex: "paid_status",
            key: "paid_status",
            width: 110,
            render: (val) => (
                <Tag color={val === "paid" ? "green" : "red"}>
                    {val?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            width: 160,
            render: (val) => dayjs(val).format("DD MMM YYYY, hh:mm A"),
        },
    ];

    const getOrders = async (page = 1, pageSize = 25, filters = {}) => {
        try {
            setLoading(true);

            const params = {
                page,
                paginate_size: pageSize,
            };

            if (filters.search_key) params.search_key = filters.search_key;
            if (filters.from_date)  params.from_date  = filters.from_date;
            if (filters.to_date)    params.to_date     = filters.to_date;

            const res = await getDatas("/admin/followup/list", params);

            if (res && res?.success) {
                setOrders(res?.result?.data || []);
                setPagination({
                    current: res?.result?.current_page || page,
                    pageSize: pageSize,
                    total: res?.result?.total || 0,
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const buildFilters = () => {
        const filters = {};
        if (searchKey.trim()) filters.search_key = searchKey.trim();
        if (dateRange && dateRange[0]) filters.from_date = dateRange[0].format("YYYY-MM-DD");
        if (dateRange && dateRange[1]) filters.to_date   = dateRange[1].format("YYYY-MM-DD");
        return filters;
    };

    const handleSearch = () => {
        getOrders(1, pagination.pageSize, buildFilters());
    };

    const handleReset = () => {
        setSearchKey("");
        setDateRange(null);
        getOrders(1, pagination.pageSize, {});
    };

    const handleTableChange = (pag) => {
        setSelectedRowKeys([]);
        getOrders(pag.current, pag.pageSize, buildFilters());
    };

    const fetchEmployees = async () => {
        try {
            setEmployeeLoading(true);
            const res = await getDatas("/admin/users/list");
            if (res?.success) {
                setEmployees(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setEmployeeLoading(false);
        }
    };

    const handleAssignOpen = () => {
        setSelectedEmployee(null);
        setAssignModalOpen(true);
        fetchEmployees();
    };

    const handleAssignSubmit = async () => {
        if (!selectedEmployee) {
            message.warning("Please select an employee");
            return;
        }

        try {
            setAssignLoading(true);
            const res = await postData("/admin/followup/assign", {
                order_ids: selectedRowKeys,
                user_id: selectedEmployee,
            });

            if (res?.success) {
                message.success(res?.msg || "Orders assigned successfully");
                setSelectedRowKeys([]);
                setAssignModalOpen(false);
                getOrders(pagination.current, pagination.pageSize);
            } else {
                message.error(res?.msg || "Failed to assign orders");
            }
        } catch (error) {
            console.log(error)
        } finally {
            setAssignLoading(false);
        }
    };

    useEffect(() => {
        getOrders(pagination.current, pagination.pageSize);
    }, []);

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All UnAssign Order List</h1>
                    <p className="subtitle">Manage orders for followup</p>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Categories" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ padding: "0 16px" }}>
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    marginBottom: 16,
                    background: "#fafafa",
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                }}>
                    <Input
                        placeholder="Search name, phone, invoice..."
                        prefix={<SearchOutlined style={{ color: "#bbb" }} />}
                        value={searchKey}
                        onChange={(e) => setSearchKey(e.target.value)}
                        onPressEnter={handleSearch}
                        allowClear
                        style={{ width: 280 }}
                    />
                    <DatePicker.RangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        format="DD MMM YYYY"
                        style={{ width: 280 }}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        Search
                    </Button>
                    <Button onClick={handleReset}>
                        Reset
                    </Button>
                </div>

                {selectedRowKeys.length > 0 && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        marginBottom: 16,
                        background: "#e6f4ff",
                        border: "1px solid #91caff",
                        borderRadius: 8,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Badge
                                count={selectedRowKeys.length}
                                style={{
                                    backgroundColor: "#1677ff",
                                    boxShadow: "none",
                                }}
                            />
                            <span style={{ fontSize: 14, color: "#1d1d1d" }}>
                                {selectedRowKeys.length > 1
                                    ? `${selectedRowKeys.length} rows selected`
                                    : "1 row selected"}
                            </span>
                            <Button type="primary" size="small" icon={<UserSwitchOutlined />} onClick={handleAssignOpen} style={{ marginLeft: 12 }}>
                                Assign to Employee
                            </Button>
                        </div>
                        <Button type="link" size="small" icon={<CloseCircleOutlined />} onClick={() => setSelectedRowKeys([])} style={{ color: "#1677ff", padding: 0 }}>
                            Clear selection
                        </Button>
                    </div>
                )}
                <Table
                    rowKey="id"
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} orders`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                />
            </div>

            <Modal
                title="Assign Orders to Employee"
                open={assignModalOpen}
                onOk={handleAssignSubmit}
                onCancel={() => setAssignModalOpen(false)}
                confirmLoading={assignLoading}
                okText="Assign"
                destroyOnClose
            >
                <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#666" }}>
                        {selectedRowKeys.length} order(s) will be assigned
                    </span>
                </div>
                <Select
                    showSearch
                    placeholder="Search and select an employee"
                    style={{ width: "100%" }}
                    loading={employeeLoading}
                    value={selectedEmployee}
                    onChange={setSelectedEmployee}
                    optionFilterProp="label"
                    options={employees.map((emp) => ({
                        value: emp.id,
                        label: `${emp.username} (${emp.phone_number})`,
                    }))}
                />
            </Modal>
        </>
    );
}
