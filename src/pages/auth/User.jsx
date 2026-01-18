import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { Input as AntInput, Breadcrumb, Button, Form, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteData, getDatas, postData } from '../../api/common/common'
import useTitle from '../../hooks/useTitle'

const User = () => {
  // Hook
  useTitle("All Users");
  
  const [query, setQuery]                     = useState('')
  const [users, setUsers]                     = useState([])
  const [loading, setLoading]                 = useState(false)
  const [pagination, setPagination]           = useState({ current: 1, pageSize: 10, total: 0 })
  const { current, pageSize }                 = pagination
  const [debouncedQuery, setDebouncedQuery]   = useState('')
  const [isModalOpen, setIsModalOpen]         = useState(false)
  const [editingUser, setEditingUser]         = useState(null)
  const [form]                                = Form.useForm()
  const [roleOptions, setRoleOptions]         = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [managerOptions, setManagerOptions]   = useState([])

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 70,
      render: (src, record) => (
        <img src={src} alt={record.username} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone_number',
      key: 'phone_number',
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category',
      render: (_, record) => record?.category?.name || '',
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => (
        <Space size={[4, 4]} wrap>
          {(roles || []).map((r) => (
            <Tag key={r.id}>{r.display_name || r.name || "Customer"}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'active' ? 'green' : 'red'} style={{textTransform:"capitalize"}}>{status}</Tag>,
    },
    {
      title: 'Last Login',
      dataIndex: 'login_at',
      key: 'login_at',
    },
    {
      title: 'Action',
      key: 'operation',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary" onClick={() => onEdit(record)}>Edit</Button>
          <Popconfirm title="Delete user?" okText="Yes" cancelText="No" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    setPagination((p) => (p.current === 1 ? p : { ...p, current: 1 }))
  }, [debouncedQuery])

  useEffect(() => {
    let isMounted = true
    const fetchUsers = async () => {
      setLoading(true)
      const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
      const res = await getDatas('/admin/users', params)
      const list = res?.result?.data || []
      const meta = res?.result?.meta
      if (isMounted) {
        setUsers(list)
        setManagerOptions(list.map((u) => ({ label: u.username, value: u.id })))
        if (meta) {
          setPagination((p) => {
            const next = {
              ...p,
              current: meta.current_page || p.current,
              pageSize: meta.per_page || p.pageSize,
              total: meta.total || p.total,
            }
            const unchanged = p.current === next.current && p.pageSize === next.pageSize && p.total === next.total
            return unchanged ? p : next
          })
        }
      }
      setLoading(false)
    }
    fetchUsers()
    return () => {
      isMounted = false
    }
  }, [current, pageSize, debouncedQuery])

  useEffect(() => {
    let active = true
    const loadOptions = async () => {
      const [rolesRes, catsRes] = await Promise.all([
        getDatas('/admin/roles'),
        getDatas('/admin/user-categories'),
      ])
      if (!active) return
      const roleList = rolesRes?.result?.data || []
      const catList = catsRes?.result?.data || []
      const roles = roleList.map((r) => ({ label: r.display_name || r.name, value: r.id }))
      const cats = catList.map((c) => ({ label: c.name, value: c.id }))
      setRoleOptions(roles)
      setCategoryOptions(cats)
    }
    loadOptions()
    return () => { active = false }
  }, [])

  const filteredData = useMemo(() => users, [users])

  const openCreate = () => {
    setEditingUser(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const onEdit = (record) => {
    setEditingUser(record)
    form.setFieldsValue({
      username: record.username,
      phone_number: record.phone_number,
      password: undefined,
      email: record.email,
      salary: record.salary,
      user_category_id: record.category?.id,
      role_id: (record.roles || [])[0]?.id !== undefined ? Number((record.roles || [])[0]?.id) : undefined,
      status: record.status,
      manager_id: record.manager?.id || undefined,
      type: record.type,
      team_lead_id: record.team_lead_id,
    })
    setIsModalOpen(true)
  }

  const onDelete = async (id) => {
    const res = await deleteData(`/admin/users/${id}`)
    if (res?.success) {
      const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
      const refreshed = await getDatas('/admin/users', params)
      setUsers(refreshed?.result?.data || [])
      const meta = refreshed?.result?.meta
      if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }))
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const formData = new FormData()
    formData.append('username', values.username)
    formData.append('phone_number', values.phone_number)
    if (!editingUser) formData.append('password', values.password)
    if (values.email) formData.append('email', values.email)
    if (values.salary) formData.append('salary', values.salary)
    if (values.user_category_id !== undefined) formData.append('user_category_id', String(values.user_category_id))
    if (values.role_id !== undefined) formData.append('role_ids[]', String(values.role_id))
    if (values.status) formData.append('status', values.status)
    if (values.manager_id) formData.append('manager_id', String(values.manager_id))
    if (values.type) formData.append('type', values.type)
    if (values.team_lead_id) formData.append('team_lead_id', String(values.team_lead_id))
    if (values.image) formData.append('image', values.image)
    if (editingUser?.id) formData.append('_method', 'PUT')

    let res
    if (editingUser?.id) {
      res = await postData(`/admin/users/${editingUser.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    } else {
      res = await postData('/admin/users', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    if (res?.success) {
      setIsModalOpen(false)
      form.resetFields()
      // refresh list
      const params = { params: { page: current, per_page: pageSize, search_key: debouncedQuery || undefined } }
      const refreshed = await getDatas('/admin/users', params)
      setUsers(refreshed?.result?.data || [])
      const meta = refreshed?.result?.meta
      if (meta) setPagination((p) => ({ ...p, total: meta.total || p.total }))
    }
  }

  return (
    <>
      <div className="pagehead">
        <div className="head-left">
          <h1 className="title">All Users</h1>
        </div>
        <div className="head-actions">
          <Breadcrumb
            items={[
              { title: <Link to="/dashboard">Dashboard</Link> },
              { title: 'All Users' },
            ]}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <AntInput.Search allowClear placeholder="Search Key ..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 300 }}/>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add</Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
        </Space>
      </div>
      <Table rowKey="id" loading={loading} pagination={{current: pagination.current,pageSize: pagination.pageSize,total: pagination.total,showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPagination((p) => ({ ...p, current: page, pageSize }))
          },
        }} columns={columns} dataSource={filteredData} scroll={{ x: 'max-content' }}
      />

      <Modal open={isModalOpen} onCancel={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'} onOk={handleSubmit} okText={editingUser ? 'Update' : 'Create'}>
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="username" label="User Name" rules={[{ required: true }]}>
              <AntInput placeholder="Enter User Name" />
            </Form.Item>
            <Form.Item name="phone_number" label="Phone Number" rules={[{ required: true }]}>
              <AntInput placeholder="Enter Phone Number" />
            </Form.Item>

            <Form.Item name="salary" label="Salary" rules={[{ required: false }]}>
              <AntInput placeholder="Enter Salary Amount" />
            </Form.Item>
            <Form.Item name="email" label="User Email" rules={[{ type: 'email', required: false }]}>
              <AntInput placeholder="Enter Email" />
            </Form.Item>

            <Form.Item name="role_id" label="User Role" rules={[{ required: true }]}>
              <Select placeholder="Select One" options={roleOptions} />
            </Form.Item>
            <Form.Item name="manager_id" label="Manager">
              <Select allowClear placeholder="Select One" options={managerOptions} />
            </Form.Item>

            <Form.Item name="user_category_id" label="User Category" rules={[{ required: true }]}>
              <Select placeholder="Select One" options={categoryOptions} />
            </Form.Item>

            <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="active">
              <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </Form.Item>

            <Form.Item name="image" label="Profile Image"
              getValueFromEvent={(e) => {
                const file = e?.target?.files?.[0]
                return file || undefined
              }}
              valuePropName="file"
            >
              <AntInput type="file" id="image" />
            </Form.Item>
            {!editingUser && (
              <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                <AntInput.Password placeholder="Set Password" />
              </Form.Item>
            )}
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default User
