import { useEffect, useState } from "react";
import { Input, Select, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import "./report.css";
import useTitle from "../../hooks/useTitle";
import { getDatas } from "../../api/common/common";
import { downloadTablePdf } from "../../utils/downloadTablePdf";
const { Option } = Select;

export default function StockReport() {
    // Hook
    useTitle("Stock Report");

    // State
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(25);
    const [stocks, setStocks] = useState([]);
    const itemsPerPage = 5;

    useEffect(() => {
        const getOrderReport = async () => {
            const res = await getDatas("/admin/products/stock/report");

            if(res && res?.success){
                setStocks(res?.result?.data);
            }
        }

        getOrderReport();
    }, []);

    const filteredData = stocks.filter((item) => (item.name.toLowerCase().includes(filter.toLowerCase())));

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

    const downloadPdf = () => {
        downloadTablePdf({
            title: "Stock Report",
            tableSelector: "#stock-report-table",
            fileName: "stock-report.pdf",
            orientation: "portrait",
        });
    }

    return (
        <>
            <div className="reportWrapper">
                <h5 className="mb-4">Stock Report</h5>
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
                    <table id="stock-report-table" className="table align-middle teamTable">
                        <thead className="table-light">
                            <tr>
                                <th scope="col">
                                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll}/>
                                </th>
                                <th scope="col">Image</th>
                                <th scope="col">Name</th>
                                <th scope="col">Total Sell</th>
                                <th scope="col">Current Stock</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <input type="checkbox" checked={selectedUsers.includes(item.id)} onChange={() => toggleUser(item.id)}/>
                                    </td>
                                    <td className="userCell">
                                        <img src={item.image} alt="User Image" className="avatar" />
                                    </td>
                                    <td>{item.name}</td>
                                    <td>{item.total_sell_qty}</td>
                                    <td>{item.current_stock}</td>
                                    <td>
                                        <span className={`stock-status-badge stock-status-${item.status.toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </td>
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
