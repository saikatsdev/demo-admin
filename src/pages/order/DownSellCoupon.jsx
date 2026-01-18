import { PlusOutlined, BarChartOutlined, ShoppingCartOutlined,CheckCircleOutlined,ThunderboltOutlined,FireOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteData, getDatas } from '../../api/common/common';
import { useDebounce } from '../../hooks/useDebounce';
import useTitle from '../../hooks/useTitle';

const DownSellCoupon = () => {
  // Hook
  useTitle("Down Sell Coupon");

  const navigate = useNavigate();

  // State
  const [rows, setRows]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const dSearch                         = useDebounce(search, 300);
  const [form]                          = Form.useForm();
  const [messageApi, contextHolder]     = message.useMessage();
  const [isModalOpen, setIsModalOpen]   = useState(false);

  async function fetchRows() {
    setLoading(true);
    try {
      const res = await getDatas('/admin/down-sells', { per_page: 50 });
      const list = res?.result?.data || res?.data || [];
      setRows(list);
    } catch (e) {
      console.error(e);
      message.error('Failed to load list');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    const k = (dSearch || '').toLowerCase();
    if (!k) return rows;
    return rows.filter(r => `${r.title} ${r.amount} ${r.status}`.toLowerCase().includes(k));
  }, [rows, dSearch]);

  const columns = [
    { 
      title: 'SL', 
      dataIndex: 'id', 
      render: (v, r, i) => i + 1, width: 60 
    },
    {
      title: 'Image',
      dataIndex: 'image',
      width: 90,
      render: (url) => url ? <img src={url} alt="img" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6 }} /> : '—',
    },
    { 
      title: 'Title', 
      key: 'title' ,
      dataIndex: 'title' 
    },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      width: 100 
    },
    { 
      title: 'Duration', 
      dataIndex: 'duration', 
      width: 100 
    },
    { 
      title: 'Started_at', 
      key: 'started_at',
      dataIndex: 'started_at',
      render: (value) => value ? value.split(" ")[0] : ""
    },
    { 
      title: 'Ended_at', 
      key: 'ended_at',
      dataIndex: 'ended_at',
      render: (value) => value ? value.split(" ")[0] : ""
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (status) => <Tag color={status === 'active' ? 'green' : 'default'} style={{textTransform:"capitalize"}}>{status}</Tag>,
    },
    {
      title: 'Actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record.id)}>Edit</Button>

          <Popconfirm title="Delete Item?" okText="Yes" cancelText="No" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const resetModal = () => {
    form.resetFields();
  };

  const onEdit = (id) => {
    resetModal();

    navigate(`/edit/downsell/${id}`)
  }

  const openCreate = () => {
    navigate("/add/down-sell");
    resetModal();
  }

  const handleDelete = async (id) => {
      const res = await deleteData(`/admin/down-sells/${id}`);
      if (res && res && res?.success) {
          messageApi.open({
            type: "success",
            content: res.msg,
          });
          const refreshed = await getDatas("/admin/down-sells");
          setRows(refreshed?.result?.data || []);
      }
  }

  const [recentActivity, setRecentActivity] = useState([
    { title: "Today", new: 68, converted: 36 },
    { title: "Yesterday", new: 92, converted: 54 },
    { title: "Last 7 Days", new: 480, converted: 260 },
  ]);

  const stats = [
    { key: "total", label: "Total Incomplete Orders", value: 120, icon: <ShoppingCartOutlined /> },
    { key: "recovered", label: "Successfully Recovered", value: 85, icon: <CheckCircleOutlined /> },
    { key: "rate", label: "Recovery Rate", value: "70%", icon: <ThunderboltOutlined /> },
    { key: "revenue", label: "Revenue Recovered", value: "৳50,000", icon: <FireOutlined /> },
  ];

  const handleHover = (e, hover) => {
    e.currentTarget.style.setProperty("background-color", hover ? "#f5f5f5" : "#fff", "important");
    e.currentTarget.style.setProperty("border-color", hover ? "#c9c9c9" : "#d9d9d9", "important");
  };

  const handleStatistics = () => setIsModalOpen(true);

  return (
    <>
      {contextHolder}
      <div style={{ margin: '0 auto', padding: 16 }}>
        <div className="pagehead">
          <div className="head-left">
            <h1 className="title">Down Sell Coupon</h1>
          </div>
          <div className="head-actions">
            <Breadcrumb
              items={[
                { title: <Link to="/dashboard">Dashboard</Link> },
                { title: 'Downsell Coupon' },
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Input placeholder="Search Key ..." allowClear value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360}}/>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
            <Button icon={<BarChartOutlined />} onClick={handleStatistics} style={{ backgroundColor: "#fff", borderColor: "#d9d9d9", color: "#000", marginLeft: 8 }}
            onMouseEnter={(e) => handleHover(e, true)} onMouseLeave={(e) => handleHover(e, false)}>
            Statistics
          </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
          </Space>
        </div>

        <Table rowKey="id" loading={loading} columns={columns} dataSource={filtered} pagination={false} scroll={{ x: true }}/>

        <Modal title="Downsell Product Statistics" open={isModalOpen} onOk={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} width={1000}>
          <div className="io-cards">
            {stats.map((s) => (
              <div key={s.key} className="io-card">
                <div className="io-badge">{s.icon}</div>
                <div className="io-card-body">
                  <div className="io-card-label">{s.label}</div>
                  <div className="io-card-value">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="recent-activity-container">
            <h4><ThunderboltOutlined /> Recent Activity</h4>
            <div className="activity-stats">
              {recentActivity.map((item, index) => (
                <div key={index} className="activity-card">
                  <p>{item.title}</p>
                  <p>New: <span className="new">{item.new}</span></p>
                  <p>Converted: <span className="converted">{item.converted}</span></p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default DownSellCoupon;
