import { Card, Collapse, Empty, Skeleton, Statistic, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { getDatas } from "../../../api/common/common";

export default function MyPayslips() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    useEffect(() => {
        getDatas("/admin/employee-self/payslips")
            .then((r) => setRows(r?.result || []))
            .finally(() => setLoading(false));
    }, []);
    if (loading)
        return (
            <Card>
                <Skeleton active />
            </Card>
        );
    return (
        <div className="payroll-page">
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">My Payslips</h1>
                    <p className="subtitle">
                        Review your approved salary, earnings, deductions and payments.
                    </p>
                </div>
            </div>
            {!rows.length ? (
                <Card>
                    <Empty description="No published payslips yet" />
                </Card>
            ) : (
                <Collapse
                    items={rows.map((row) => ({
                        key: row.id,
                        label: (
                            <div>
                                <strong>{row.period?.name}</strong>{" "}
                                <Tag color={row.status === "paid" ? "green" : "blue"}>
                                    {row.status}
                                </Tag>
                            </div>
                        ),
                        children: (
                            <>
                                <div className="payslip-summary">
                                    <Statistic
                                        title="Basic Salary"
                                        value={Number(row.basic_salary)}
                                        prefix="৳"
                                    />
                                    <Statistic
                                        title="Gross Earnings"
                                        value={Number(row.gross_earnings)}
                                        prefix="৳"
                                    />
                                    <Statistic
                                        title="Deductions"
                                        value={Number(row.total_deductions)}
                                        prefix="৳"
                                    />
                                    <Statistic
                                        title="Net Salary"
                                        value={Number(row.net_salary)}
                                        prefix="৳"
                                    />
                                </div>
                                <Table
                                    size="small"
                                    rowKey="id"
                                    pagination={false}
                                    dataSource={row.items || []}
                                    columns={[
                                        {
                                            title: "Type",
                                            dataIndex: "type",
                                            render: (v) => (
                                                <Tag color={v === "earning" ? "green" : "red"}>
                                                    {v}
                                                </Tag>
                                            ),
                                        },
                                        { title: "Description", dataIndex: "label" },
                                        {
                                            title: "Amount",
                                            render: (_, i) =>
                                                `৳${Number(i.amount).toLocaleString()}`,
                                        },
                                    ]}
                                />
                            </>
                        ),
                    }))}
                />
            )}
        </div>
    );
}
