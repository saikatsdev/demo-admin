"use client";
import { useState } from "react";
import { Input, Select, Button, Breadcrumb } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import "./report.css";
import { Link } from "react-router-dom";

const { Option } = Select;

export default function Report() {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fakeData = [
    {
      id: 1,
      name: "Tom Cooper",
      email: "cooper@gmail.com",
      status: "Active",
      location: "United States",
      phone: "+65 9308 4744",
      group: "Design",
      avatar: "https://i.pravatar.cc/40?img=1",
      category: "Electronics",
    },
    {
      id: 2,
      name: "Leslie Lawson",
      email: "lawson@gmail.com",
      status: "Active",
      location: "Canada",
      phone: "+65 8689 9346",
      group: "Development",
      avatar: "https://i.pravatar.cc/40?img=2",
      category: "Apparel",
    },
    {
      id: 3,
      name: "Kristin Watson",
      email: "watson@gmail.com",
      status: "Inactive",
      location: "Germany",
      phone: "+62-896-5554-32",
      group: "Marketing",
      avatar: "https://i.pravatar.cc/40?img=3",
      category: "Electronics",
    },
    {
      id: 4,
      name: "Annette Black",
      email: "a.black@gmail.com",
      status: "Active",
      location: "United States",
      phone: "+62-838-5558-34",
      group: "Design",
      avatar: "https://i.pravatar.cc/40?img=4",
      category: "Apparel",
    },
    {
      id: 5,
      name: "Floyd Miles",
      email: "miles@gmail.com",
      status: "Inactive",
      location: "United States",
      phone: "+1-555-8701-158",
      group: "Development",
      avatar: "https://i.pravatar.cc/40?img=5",
      category: "Electronics",
    },
    {
      id: 6,
      name: "Cody Fisher",
      email: "fisher@gmail.com",
      status: "Inactive",
      location: "United States",
      phone: "+61480013910",
      group: "Design",
      avatar: "https://i.pravatar.cc/40?img=6",
      category: "Apparel",
    },
    {
      id: 7,
      name: "Theresa Web",
      email: "theresa@gmail.com",
      status: "Active",
      location: "France",
      phone: "+91 9163337392",
      group: "Development",
      avatar: "https://i.pravatar.cc/40?img=7",
      category: "Electronics",
    },
    {
      id: 8,
      name: "Tim Simmons",
      email: "simmons@gmail.com",
      status: "Active",
      location: "United States",
      phone: "+49 1590 12345678",
      group: "Marketing",
      avatar: "https://i.pravatar.cc/40?img=8",
      category: "Apparel",
    },
  ];

  // Filter data
  const filteredData = fakeData.filter(
    (user) =>
      (user.name.toLowerCase().includes(filter.toLowerCase()) ||
        user.status.toLowerCase().includes(filter.toLowerCase()) ||
        user.location.toLowerCase().includes(filter.toLowerCase()) ||
        user.group.toLowerCase().includes(filter.toLowerCase())) &&
      (category === "" || user.category === category)
  );

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
    const headers = [
      "Name",
      "Email",
      "Status",
      "Location",
      "Phone",
      "Group",
      "Category",
    ];
    const rows = filteredData.map((user) => [
      user.name,
      user.email,
      user.status,
      user.location,
      user.phone,
      user.group,
      user.category,
    ]);

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

  return (
    <>
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">All Report</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "Report" },
            ]}
          />
        </div>
      </div>

      <div className="reportWrapper">
        <h5 className="mb-4">All Report</h5>
        <div className="topBar">
          <div className="d-flex gap-3">
            <Input.Search
              placeholder="Search ..."
              allowClear
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Select Category"
              value={category || undefined}
              allowClear
              style={{ width: 180 }}
              onChange={(value) => {
                setCategory(value || "");
                setCurrentPage(1);
              }}
            >
              <Option value="Electronics">Electronics</Option>
              <Option value="Apparel">Apparel</Option>
            </Select>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadCSV}
            style={{ backgroundColor: "#1C558B", borderColor: "#1C558B" }}
          >
            Download CSV
          </Button>
        </div>

        {/* ===== Table ===== */}
        <div className="table-responsive">
          <table className="table align-middle teamTable">
            <thead className="table-light">
              <tr>
                <th scope="col">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th scope="col">User</th>
                <th scope="col">Status</th>
                <th scope="col">Location</th>
                <th scope="col">Phone</th>
                <th scope="col">Group</th>
              </tr>
            </thead>
            <tbody>
              {currentData().map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                  </td>
                  <td className="userCell">
                    <img src={user.avatar} alt={user.name} className="avatar" />
                    <div className="userInfo">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`statusBadge ${user.status.toLowerCase()}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>{user.location}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span className={`groupBadge ${user.group.toLowerCase()}`}>
                      {user.group}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ===== Pagination ===== */}
          <nav aria-label="Page navigation" className="customPagination">
            <ul className="pagination justify-content-end">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  &lt;
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li
                  key={i + 1}
                  className={`page-item ${
                    currentPage === i + 1 ? "active" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  &gt;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
