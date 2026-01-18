import { useEffect, useState } from "react";
import { Input, Select, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import "./report.css";
import useTitle from "../../hooks/useTitle";
import { getDatas } from "../../api/common/common";
const { Option } = Select;
export default function CancelReport() {
    // Hook
    useTitle("Cancel Report");

    // State
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(25);
    const [orders, setOrders] = useState([]);
    const itemsPerPage = 5;

    useEffect(() => {
        const getOrderReport = async () => {
            const res = await getDatas("/admin/order/reports/cancel");

            if(res && res?.success){
                setOrders(res?.result || []);
            }
        }

        getOrderReport();
    }, []);

    const filteredData = orders.filter((item) => (item.phone_number.toLowerCase().includes(filter.toLowerCase()) || item.customer_name.toLowerCase().includes(filter.toLowerCase())));

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const currentData = () => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    };

    const isAllSelected = selectedUsers.length === currentData().length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(currentData().map((user) => user.id));
        }
    };

    const toggleUser = (id) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter((userId) => userId !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const downloadCSV = () => {
        const headers = ["Name","Email","Status","Location","Phone","Group","Category",];
        const rows = filteredData.map((user) => [user.name,user.email,user.status,user.location,user.phone,user.group,user.category]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="reportWrapper">
                <h5 className="mb-4">Cancel Report</h5>
                <div className="topBar">
                    <div className="d-flex gap-3">
                        <Input.Search placeholder="Search ..." allowClear value={filter} onChange={(e) => {setFilter(e.target.value);setCurrentPage(1);}}style={{ width: 250 }}/>
                        <Select placeholder="Select Pagination" value={currentPage} allowClear style={{ width: 180 }} onChange={(value) => setCurrentPage(value)}>
                            <Option value="25">25</Option>
                            <Option value="50">50</Option>
                            <Option value="100">100</Option>
                            <Option value="250">250</Option>
                        </Select>
                    </div>
                    
                    <div>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={downloadCSV} style={{ backgroundColor: "#DC3545", borderColor: "#DC3545", marginRight:"5px"}}>
                            PDF
                        </Button>

                        <Button type="primary" icon={<DownloadOutlined />} onClick={downloadCSV} style={{ backgroundColor: "#1C558B", borderColor: "#1C558B" }}>
                            CSV
                        </Button>
                    </div>

                </div>

                {/* ===== Table ===== */}
                <div className="table-responsive">
                    <table className="table align-middle teamTable">
                        <thead className="table-light">
                            <tr>
                                <th scope="col">
                                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll}/>
                                </th>
                                <th scope="col">Customer</th>
                                <th scope="col">Phone Number</th>
                                <th scope="col">Payable Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <input type="checkbox" checked={selectedUsers.includes(item.id)} onChange={() => toggleUser(item.id)}/>
                                    </td>
                                    <td className="userCell">
                                        <img src="https://www.shareicon.net/data/256x256/2016/09/15/829472_man_512x512.png" alt="User Image" className="avatar" />
                                        <div className="userInfo">
                                            <strong>{item.customer_name}</strong>
                                        </div>
                                    </td>
                                    <td>{item.phone_number}</td>
                                    <td>{item.payable_price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <nav aria-label="Page navigation" className="customPagination">
                        <ul className="pagination justify-content-end">
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                                    &lt;
                                </button>
                            </li>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <li key={i + 1} className={`page-item ${ currentPage === i + 1 ? "active" : ""}`}>
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
