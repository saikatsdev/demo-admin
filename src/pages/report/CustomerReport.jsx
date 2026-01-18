import useTitle from "../../hooks/useTitle"
import { DownloadOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { Input, Select, Button, Breadcrumb } from "antd";
import { useEffect, useState } from "react";
import { getDatas } from "../../api/common/common";
import { downloadTablePdf } from "../../utils/downloadTablePdf";

export default function CustomerReport() {
    // Hook
    useTitle("All Customer Report");

    // State
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [customerData, setCustomerData] = useState([]);

    const itemsPerPage = 5;

    useEffect(() => {
        let isMounted = true;

        const getCustomerReport = async () => {
            const res = await getDatas("/admin/order/reports/by-customer");

            if(res && res.success){
                if(isMounted){
                    setCustomerData(res?.result || []);
                }
            }
        }

        getCustomerReport();

        return () => {
            isMounted = false;
        }
    }, []);

    // Filter data
    const filteredData = customerData.filter(
        (user) =>
        (user?.customer_name.toLowerCase().includes(filter.toLowerCase()) ||
            user?.location.toLowerCase().includes(filter.toLowerCase()) ||
            user?.group.toLowerCase().includes(filter.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const currentData = () => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    };

    const downloadCSV = () => {
        const headers = ["Name","Email","Status","Location","Phone","Group","Category"];

        const rows = filteredData.map((user) => [user?.name,user?.email,user?.location,user?.phone,user?.group,user?.category]);

        let csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPdf = () => {
        downloadTablePdf({
            title: "Customer Report",
            tableSelector: "#customer-report-table",
            fileName: "customer-report.pdf",
            orientation: "portrait",
        });
    }

    return (
        <>
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Customer Report</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Customer Report" },
                        ]}
                    />
                </div>
            </div>

            <div className="reportWrapper">
                <h5 className="mb-4">All Report</h5>
                <div className="topBar">
                    <div className="d-flex gap-3">
                        <Input.Search placeholder="Search ..." allowClear value={filter} onChange={(e) => {setFilter(e.target.value);setCurrentPage(1);}} style={{ width: 250 }}/>
                        <Select placeholder="Select Category" value="" allowClear style={{ width: 180 }}>
                            <Option value="Electronics">Electronics</Option>
                            <Option value="Apparel">Apparel</Option>
                        </Select>
                    </div>

                    <div>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={downloadPdf} style={{ backgroundColor: "#DC3545", borderColor: "#DC3545", marginRight:"5px"}}>
                            PDF
                        </Button>

                        <Button type="primary" icon={<DownloadOutlined />} onClick={downloadCSV} style={{ backgroundColor: "#1C558B", borderColor: "#1C558B" }}>
                            CSV
                        </Button>
                    </div>
                </div>

                {/* ===== Table ===== */}
                <div className="table-responsive">
                    <table id="customer-report-table" className="table align-middle teamTable">
                        <thead className="table-light">
                        <tr>
                            <th scope="col">
                                <input type="checkbox" checked="" onChange=""/>
                            </th>
                            <th scope="col">Customer Name</th>
                            <th scope="col">Phone Number</th>
                            <th scope="col">Order Count</th>
                            <th scope="col">Order Value</th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentData().map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <input type="checkbox" checked=""/>
                                </td>
                                <td className="userCell">
                                    <img src="https://cdn-icons-png.flaticon.com/512/1177/1177568.png" alt={user.customer_name} className="avatar" />
                                    <div className="userInfo">
                                        <strong>{user.customer_name}</strong>
                                    </div>
                                </td>
                                <td>{user.phone_number}</td>
                                <td>{user.order_count}</td>
                                <td>{user.order_value}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* ===== Pagination ===== */}
                    <nav aria-label="Page navigation" className="customPagination">
                        <ul className="pagination justify-content-end">
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                                    &lt;
                                </button>
                            </li>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                        {i + 1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                                    &gt;
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </>
    )
}
