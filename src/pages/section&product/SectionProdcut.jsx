import { ArrowLeftOutlined, PlusOutlined, MenuOutlined  } from "@ant-design/icons";
import {Breadcrumb,Button,message,Modal,Popconfirm,Radio,Space,Table,Tag,Select} from "antd";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { deleteData, getDatas, postData } from "../../api/common/common";
import useTitle from "../../hooks/useTitle";

export default function SectionProduct() {
  // Hook
  useTitle("Section & Banner List");

  // Variable
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading]             = useState(false);
  const [sectionList, setSectionList]     = useState([]);
  const [messageApi, contextHolder]       = message.useMessage();
  const [isOk, setIsOk]                   = useState(false);
  const [step, setStep]                   = useState(1);
  const [choice, setChoice]               = useState(null);
  const [viewType, setViewType]           = useState(location.state?.viewType || "section");
  const [bannerList, setBannerList]       = useState([]);
  const [bannerLoading, setBannerLoading] = useState(false);

  const updatingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchedSections = async () => {
      setLoading(true);
      try {
        const res = await getDatas("/admin/sections");
        const list = res?.result?.data || [];
        if (isMounted) setSectionList(list);
      } catch (err) {
        console.error("fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchedSections();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewChange = (value) => {
    setViewType(value);

    if (value === "banner") {
      fetchBanners();
    }
  };

  const fetchBanners = async () => {
    try {
      setBannerLoading(true);
      const res = await getDatas("/admin/banners");
      setBannerList(res.result?.data || []);
    } catch (error) {
      console.error("Failed to load banners", error);
    } finally {
      setBannerLoading(false);
    }
  };

  useEffect(() => {
    if (viewType === "banner") {
      fetchBanners();
    }
  }, [viewType]);


  const columns = [
    {
      title: "",
      key: "drag",
      width: 40,
      align: "center",
      render: (_, record) => (
        <span
          className="drag-handle"
          draggable
          onDragStart={(e) => handleDragStart(e, record.id)}
          onDragEnd={handleDragEnd}
          style={{
            cursor: "grab",
            fontSize: 20,
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
          }}
        >
          <MenuOutlined />
        </span>
      ),
    },
    {
      title: "SL",
      key: "sl",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Section Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Section Link",
      dataIndex: "link",
      key: "link",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "active" ? "green" : "red"}
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
          <Popconfirm title="Delete Item?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const bannerColumns = [
    {
      title: "SL",
      key: "sl",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Device Type",
      dataIndex: "device_type",
      key: "device_type",
    },
    {
      title: "Banner Link",
      dataIndex: "link",
      key: "link",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"} style={{ textTransform: "capitalize" }}>
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
          <Button size="small" type="primary" onClick={() => onBannerEdit(record.id)}>
            Edit
          </Button>
          <Popconfirm title="Delete Item?" okText="Yes" cancelText="No" onConfirm={() => onBannerDelete(record.id)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const openCreate = () => setIsOk(true);
  const handleOk = () => setIsOk(false);

  const handleCancel = () => {
    setIsOk(false);
    setStep(1);
    setChoice(null);
  };

  const handleNext = () => {
    if (!choice) {
      alert("Please select one!");
      return;
    }
    setStep(2);
    if (choice === "Section") navigate("/add/section");
    else if (choice === "Banner") navigate("/section-banner");
  };

  const handleFinalOk = () => {
    handleOk();
    setStep(1);
    setChoice(null);
  };

  const onEdit = (id) => navigate(`/edit/section/${id}`);

  const onDelete = async (id) => {
    try {
      const res = await deleteData(`/admin/sections/${id}`);
      if (res?.success) {
        const refreshed = await getDatas("/admin/sections");
        const refreshedList = refreshed?.result?.data || [];
        setSectionList(refreshedList);
        messageApi.open({ type: "success", content: res.msg });
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Delete failed");
    }
  };

  const updatePositions = async (newList) => {
    if (updatingRef.current) {
      console.log("Update already in progress, skipping...");
      return;
    }
    updatingRef.current = true;

    try {
      const payload = newList.map((item, index) => ({
        ...item,
        position: index + 1,
        _method: "PUT",
        product_ids: item.products?.map((p) => p.id) || [],
      }));

      const responses = await Promise.all(payload.map((item) => postData(`/admin/sections/${item.id}`, item)));

      console.log("update responses:", responses);

      const allSuccess = responses.every((res) => res?.success || res?.ok);
      if (allSuccess) {
        messageApi.success("Section order updated successfully!");
      } else {
        messageApi.error("Some sections failed to update. Check console for responses.");
        console.warn("Some responses indicate failure", responses);
      }
    } catch (err) {
      console.error("updatePositions error", err);
      messageApi.error("Failed to update section order!");
    } finally {
      updatingRef.current = false;
    }
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.6";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    e.currentTarget.style.background = "#f5f7fa";
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.background = "";
  };

  const handleDrop = async (e, dropId) => {
    e.preventDefault();
    e.currentTarget.style.background = "";

    const dragId = e.dataTransfer.getData("text/plain");
    if (!dragId) {
      console.warn("no dragId found");
      return;
    }

    const draggedIndex = sectionList.findIndex((it) => String(it.id) === String(dragId));
    const dropIndex = sectionList.findIndex((it) => String(it.id) === String(dropId));

    if (draggedIndex === -1 || dropIndex === -1) {
      console.warn("couldn't find indexes:", { draggedIndex, dropIndex, dragId, dropId });
      return;
    }

    if (draggedIndex === dropIndex) {
      return;
    }

    const newList = [...sectionList];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(dropIndex, 0, draggedItem);

    setSectionList(newList);

    await updatePositions(newList);
  };

  const onBannerEdit = (id) => {
    navigate(`/edit/banner/${id}`);
  }

  const onBannerDelete = async (id) => {
    const res = await deleteData(`/admin/banners/${id}`);

    if(res && res?.success){
      const refreshed = await getDatas("/admin/banners");
        const refreshedList = refreshed?.result?.data || [];
        setBannerList(refreshedList);
        messageApi.open({ type: "success", content: res.msg });
    }
  }

  return (
    <>
      {contextHolder}
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">Section & Banner List</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: "Section & Banner List" },
            ]}
          />
        </div>
      </div>

      <div className="section-product-dis">
        <Select value={viewType} onChange={handleViewChange} style={{ width: 160 }}>
          <Option value="section">Section</Option>
          <Option value="banner">Banner</Option>
        </Select>

        <Space>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Add
          </Button>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => window.history.back()}>
            Back
          </Button>
        </Space>
      </div>


      {viewType === "section" && (
        <Table
          bordered
          loading={loading}
          columns={columns}
          dataSource={sectionList}
          rowKey="id"
          pagination={false}
          components={{
            body: {
              row: (rowProps) => {
                const recordId = rowProps["data-row-key"];
                return (
                  <tr
                    {...rowProps}
                    onDragOver={(e) => handleDragOver(e, recordId)}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, recordId)}
                    style={{ transition: "background 0.15s" }}
                  />
                );
              },
            },
          }}
        />
      )}

      {viewType === "banner" && (
        <Table
          bordered
          loading={bannerLoading}
          rowKey="id"
          dataSource={bannerList}
          pagination={false}
          columns={bannerColumns}
        />
      )}


      <Modal title="Section & Banner" open={isOk} onCancel={() => {handleCancel();}}
        footer={
          step === 1 ? (
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Space>
              <Button onClick={() => { setStep(1); setChoice(null); }}>Back</Button>
              <Button type="primary" onClick={handleFinalOk}>Confirm</Button>
            </Space>
          )
        }
      >
        {step === 1 && (
          <>
            <p>Please select one:</p>
            <Radio.Group onChange={(e) => setChoice(e.target.value)} value={choice}>
              <Space direction="vertical">
                <Radio value="Section">Section</Radio>
                <Radio value="Banner">Banner</Radio>
              </Space>
            </Radio.Group>
          </>
        )}
        {step === 2 && <p>You chose <b>{choice}</b>. Proceed with further work here...</p>}
      </Modal>
    </>
  );
}
