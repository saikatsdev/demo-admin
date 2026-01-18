import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Input as AntInput,
  Breadcrumb,
  Button,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";

export default function ProductCatelog() {
  //Hook
  useTitle("All Products Catelogs");

  // Variable
  const navigate = useNavigate();

  // State
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [catelogs, setItems] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [filteredData, setFilteredData] = useState(catelogs);
  const [copyLink, setCopyLink] = useState(null);

  const handleCopyLink = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopyLink(url);
        messageApi.open({
          type: "success",
          content: "Copy Link Successfully " + copyLink,
        });
      })
      .catch(() => {
        message.error("Failed to copy link!");
      });
  };

  //Table Columns
  const columns = [
    {
      title: "SL",
      key: "sl",
      width: 10,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Number Of Products",
      dataIndex: "number_of_products",
      key: "number_of_products",
    },
    {
      title: "Url",
      dataIndex: "url",
      key: "url",
    },
    {
      title: "Catalog Type",
      dataIndex: "catalog_type",
      key: "catalog_type",
      render: (catelog) => catelog.name,
    },
    {
      title: "Categories",
      dataIndex: "categories",
      key: "categories",
      render: (categories) => {
        if (!Array.isArray(categories) || !categories.length) return "N/A";

        const names = categories
          .map((item) => item?.category?.name)
          .filter(Boolean);

        return names.length ? names.join(", ") : "N/A";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "active" ? "green" : "danger"}
          style={{ textTransform: "capitalize" }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "operation",
      width: 170,
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary" onClick={() => onEdit(record.id)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete Item?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => onDelete(record.id)}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
          <Button size="small" onClick={() => handleCopyLink(record.url)}>
            Copy Link
          </Button>
        </Space>
      ),
    },
  ];

  //Method
  const openCreate = () => {
    navigate("/add/prodcut/catelog");
  };

  const onEdit = (id) => {
    navigate(`/edit/prodcut/catelog/${id}`);
  };

  useEffect(() => {
    if (!query) {
      setFilteredData(catelogs);
    }

    const lowerQuery = query.toLowerCase();

    const filtered = catelogs?.filter(
      (item) =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.status?.toLowerCase().includes(lowerQuery)
    );

    setFilteredData(filtered);
  }, [query, catelogs]);

  useEffect(() => {
    let isMounted = true;

    const fetchContactList = async () => {
      setLoading(true);

      const res = await getDatas("/admin/product/catalogs");

      const list = res?.result?.data;

      if (isMounted) {
        setItems(list);
      }

      setLoading(false);
    };

    fetchContactList();

    return () => {
      isMounted = false;
    };
  }, []);

  const onDelete = async (id) => {
    const res = await deleteData(`/admin/product/catalogs/${id}`);

    if (res?.success) {
      const refreshed = await getDatas("/admin/product/catalogs");

      setItems(refreshed?.result?.data);

      messageApi.open({
        type: "success",
        content: res.msg,
      });
    }
  };

  return (
    <>
      {contextHolder}
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">All Product Catelogs</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "All Product Catelogs" },
            ]}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <AntInput.Search
          allowClear
          placeholder="Search Key ..."
          style={{ width: 300 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Space>
          <Button size="small" icon={<DeleteOutlined />}>
            Trash
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            Add
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            size="small"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </Space>
      </div>

      <Table
        bordered
        loading={loading}
        columns={columns}
        dataSource={filteredData}
      />
    </>
  );
}
