import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Input as AntInput, Breadcrumb, Button, Checkbox, Form, message, Modal, Popconfirm, Space, Tabs, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteData, getDatas, postData } from '../../api/common/common'
import useTitle from '../../hooks/useTitle'
import './role.css'

const ACTION_ORDER = ['Create', 'Read', 'Update', 'Delete']
const actionIndex = (label) => ACTION_ORDER.indexOf(label) === -1 ? 999 : ACTION_ORDER.indexOf(label)

const extractPermIds = (roleOrPayload) => {
  if (!roleOrPayload) return []
  const perms =
    roleOrPayload?.permissions?.data ??
    roleOrPayload?.permissions ??
    roleOrPayload?.data?.permissions?.data ??
    []
  return Array.isArray(perms) ? perms.map(p => Number(p.id)) : []
}

const findRolePermIdsFromLocalStorage = (roleId) => {
  const rid = Number(roleId)
  try {
    const candidateKeys = ['auth', 'user', 'authUser', 'currentUser']
    for (const k of candidateKeys) {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      try {
        const obj = JSON.parse(raw)
        const roles = obj?.user?.roles || obj?.roles || []
        const match = Array.isArray(roles) ? roles.find(r => Number(r.id) === rid) : null
        if (match?.permissions?.length) {
          return match.permissions.map(p => Number(p.id))
        }
      } catch {
        console.log();
      }
    }
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const obj = JSON.parse(raw)
        const roles = obj?.user?.roles || obj?.roles || []
        const match = Array.isArray(roles) ? roles.find(r => Number(r.id) === rid) : null
        if (match?.permissions?.length) {
          return match.permissions.map(p => Number(p.id))
        }
      } catch {
        console.log();
      }
    }
  } catch {
    console.log();
  }
  return []
}

const getInitialRoleIdFromLocalStorage = () => {
  try {
    const candidateKeys = ['auth', 'user', 'authUser', 'currentUser']
    for (const k of candidateKeys) {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const obj = JSON.parse(raw)
      const roles = obj?.user?.roles || obj?.roles
      if (Array.isArray(roles) && roles.length) {
        return Number(roles[0].id)
      }
    }
  } catch {
    console.log();
  }
  return null
}

const Role = () => {
  // Hook
  useTitle('Roles & Permissions')

  // ---- state ----
  const [roles, setRoles]                                 = useState([]);
  const [selectedRoleId, setSelectedRoleId]               = useState(null);
  const [permTree, setPermTree]                           = useState([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [saving, setSaving]                               = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen]             = useState(false);
  const [editingRole, setEditingRole]                     = useState(null);
  const [form]                                            = Form.useForm();
  const [filterQ, setFilterQ]                             = useState('');
  const [messageApi, contextHolder]                       = message.useMessage();

  // ---- load roles + permissions list ----
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const roleRes = await getDatas('/admin/roles', { per_page: 1000, include: 'permissions' })
        const roleList = roleRes?.result?.data || []

        const listRes = await getDatas('/admin/permissions/list', {})
        const raw = listRes?.result || {}

        const tree = []
        Object.entries(raw).forEach(([section, resources]) => {
          const items = []
          let sectionIds = []
          Object.entries(resources || {}).forEach(([resource, actions]) => {
            const sorted = [...(actions || [])].sort(
              (a, b) => actionIndex(a.display_name) - actionIndex(b.display_name)
            )
            const ids = sorted.map(a => Number(a.id))
            sectionIds = sectionIds.concat(ids)
            items.push({ resource, actions: sorted, ids })
          })
          items.sort((a, b) => a.resource.localeCompare(b.resource))
          tree.push({ section, items, ids: sectionIds })
        })
        tree.sort((a, b) => a.section.localeCompare(b.section))

        if (!alive) return
        setRoles(roleList)
        setPermTree(tree)

        setSelectedRoleId(prev => {
          if (prev != null) return prev
          const fromLS = getInitialRoleIdFromLocalStorage()
          return fromLS ?? (roleList[0]?.id ?? null)
        })
      } catch (e) {
        console.error(e)
        message.error('Failed to load roles/permissions')
      }
    }
    load()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let alive = true

    const apply = (idsArr) => {
      const ids = (idsArr || []).map(Number)
      setSelectedPermissionIds(new Set(ids))
    }

    const run = async () => {
      const role = roles.find(r => Number(r.id) === Number(selectedRoleId))
      if (!role) { apply([]); return }

      const direct = extractPermIds(role)
      if (direct.length) { apply(direct); return }

      const fromLS = findRolePermIdsFromLocalStorage(selectedRoleId)
      if (fromLS.length) { apply(fromLS); return }

      try {
        const res = await getDatas(`/admin/roles/${selectedRoleId}`, { include: 'permissions' })
        if (!alive) return
        apply(extractPermIds(res?.result))
      } catch {
        if (alive) apply([])
      }
    }

    run()
    return () => { alive = false }
  }, [selectedRoleId, roles])

  const allPermissionIds = useMemo(() => {
    const arr = []
    for (const sec of permTree) arr.push(...sec.ids)
    return arr
  }, [permTree])

  const filteredTree = useMemo(() => {
    const q = filterQ.trim().toLowerCase()
    if (!q) return permTree
    return permTree
      .map(sec => {
        const items = sec.items.filter(it => it.resource.toLowerCase().includes(q))
        if (!items.length) return null
        return { ...sec, items, ids: items.flatMap(i => i.ids) }
      })
      .filter(Boolean)
  }, [filterQ, permTree])

  const toggleIds = (ids = [], checked) => {
    const next = new Set(selectedPermissionIds)
    if (checked) ids.forEach(id => next.add(Number(id)))
    else ids.forEach(id => next.delete(Number(id)))
    setSelectedPermissionIds(next)
  }

  const openCreateRole = () => {
    setEditingRole(null)
    form.resetFields()
    setIsRoleModalOpen(true)
  }

  const onEditRole = (role) => {
    setEditingRole(role)
    form.setFieldsValue({
      display_name: role.display_name,
      name: role.name,
      description: role.description,
      status: role.status || 'active'
    })
    setIsRoleModalOpen(true)
  }

  const saveRole = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        name: values.name,
        display_name: values.display_name,
        description: values.description,
        status: values.status
      }
      let res
      if (editingRole?.id) res = await postData(`/admin/roles/${editingRole.id}`, payload)
      else res = await postData('/admin/roles', payload)

      if (res?.success) {
        message.success(editingRole ? 'Role updated' : 'Role created')
        setIsRoleModalOpen(false)
        form.resetFields()
        const refreshed = await getDatas('/admin/roles', { per_page: 1000, include: 'permissions' })
        const list = refreshed?.result?.data || []
        setRoles(list)
        if (!editingRole?.id && list.length > 0) setSelectedRoleId(list[list.length - 1].id)
      } else {
        message.error('Failed to save role')
      }
    } catch {
      console.log();
    }
  }

  const deleteRole = async (id) => {
    const res = await deleteData(`/admin/roles/${id}`)
    if (res?.success) {
      message.success('Role deleted')
      const refreshed = await getDatas('/admin/roles', { per_page: 1000, include: 'permissions' })
      const list = refreshed?.result?.data || []
      setRoles(list)
      if (Number(selectedRoleId) === Number(id)) setSelectedRoleId(list[0]?.id || null)
    } else {
      message.error('Failed to delete role')
    }
  }

  const savePermissions = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    try {
      const currentRole = roles.find(r => Number(r.id) === Number(selectedRoleId))
      if (!currentRole) {
        messageApi.open({
          type: "success",
          content: res.msg,
        });
        return
      }

      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('display_name', currentRole.display_name || currentRole.name);

      Array.from(selectedPermissionIds).forEach(id => {
        formData.append('permission_ids[]', String(id));
      })

      const res = await postData(`/admin/roles/${selectedRoleId}`, formData);
      
      if (res && res?.success) {
        messageApi.open({
          type: "success",
          content: res.msg,
        });

        const refreshed = await getDatas('/admin/roles', { per_page: 1000, include: 'permissions' });
        const list = refreshed?.result?.data || [];

        setRoles(list);

        const updated = list.find(r => Number(r.id) === Number(selectedRoleId));

        const ids = extractPermIds(updated);

        setSelectedPermissionIds(new Set(ids));
      } else {
        message.error('Failed to update permissions');
      }
    } finally {
      setSaving(false)
    }
  }
  

  // ---- Tabs for roles ----
  const tabItems = roles.map(role => ({
    key: String(role.id),
    label: (
      <div className="tab-label">
        <span className="tab-text">{role.display_name || role.name}</span>
        <Space size={6} className="tab-actions">
          <Tag color={role.status === 'inactive' ? 'red' : 'green'}>{role.status || 'Active'}</Tag>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); onEditRole(role) }} />
          <Popconfirm title="Delete role?" okText="Yes" cancelText="No" onConfirm={(e) => { e?.stopPropagation?.(); deleteRole(role.id) }} onCancel={(e) => e?.stopPropagation?.()}>
            <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      </div>
    ),
    children: (
      <>
        {/* action bar */}
        <div className="role-bar">
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
            <Button type="primary" loading={saving} onClick={savePermissions}>Update Permission</Button>
            <Checkbox
              style={{ marginLeft: 8 }}
              indeterminate={
                allPermissionIds.some(id => selectedPermissionIds.has(Number(id))) &&
                !allPermissionIds.every(id => selectedPermissionIds.has(Number(id)))
              }
              checked={allPermissionIds.length > 0 && allPermissionIds.every(id => selectedPermissionIds.has(Number(id)))}
              onChange={(e) => toggleIds(allPermissionIds, e.target.checked)}
            >
              Select all
            </Checkbox>
          </Space>
          <Space>
            <AntInput
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Filter resources..."
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              style={{ width: 320 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => setFilterQ('')}>Reset</Button>
          </Space>
        </div>

        {/* permission sections */}
        <div className="section-wrap">
          {filteredTree.length === 0 && (
            <div className="empty-hint">No permission groups matched.</div>
          )}
          {filteredTree.map((sec) => {
            const sectionChecked = sec.ids.length > 0 && sec.ids.every(id => selectedPermissionIds.has(Number(id)))
            const sectionInd =
              sec.ids.some(id => selectedPermissionIds.has(Number(id))) && !sectionChecked
            return (
              <div key={sec.section} className="section-block">
                <div className="section-head">
                  <Checkbox
                    indeterminate={sectionInd}
                    checked={sectionChecked}
                    onChange={(e) => toggleIds(sec.ids, e.target.checked)}
                  />
                  <span className="section-title">{sec.section}</span>
                </div>

                <div className="card-grid">
                  {sec.items.map((it) => {
                    const rowChecked = it.ids.length > 0 && it.ids.every(id => selectedPermissionIds.has(Number(id)))
                    const rowInd = it.ids.some(id => selectedPermissionIds.has(Number(id))) && !rowChecked
                    return (
                      <div key={sec.section + '-' + it.resource} className="perm-card">
                        <div className="perm-card-head">
                          <Checkbox
                            indeterminate={rowInd}
                            checked={rowChecked}
                            onChange={(e) => toggleIds(it.ids, e.target.checked)}
                          />
                          <span className="perm-title">{it.resource}</span>
                        </div>
                        <div className="perm-actions">
                          {it.actions.map((a) => (
                            <label key={a.id} className="action-item">
                              <Checkbox
                                checked={selectedPermissionIds.has(Number(a.id))}
                                onChange={(e) => toggleIds([Number(a.id)], e.target.checked)}
                              />
                              <span>{a.display_name.toLowerCase()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }))

  return (
    <>
      {contextHolder}
      <div className="role-page">
        <div className="pagehead">
          <div className="head-left">
            <h1 className="title">Roles & Permissions</h1>
          </div>
          <div className="head-actions">
            <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: 'Roles' }]} />
          </div>
        </div>

        <div className="tabs-card">
          <Tabs type="card" items={tabItems} activeKey={selectedRoleId ? String(selectedRoleId) : undefined} onChange={(key) => setSelectedRoleId(Number(key))}
            tabBarExtraContent={
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRole}>New Role</Button>
              </Space>
            }
            destroyInactiveTabPane animated
          />
          {!roles?.length && (
            <div className="empty-hint">
              কোনো রোল নেই। উপরের <b>New Role</b> ক্লিক করে তৈরি করুন।
            </div>
          )}
        </div>

        {/* Create/Edit Role */}
        <Modal open={isRoleModalOpen} onCancel={() => setIsRoleModalOpen(false)} title={editingRole ? 'Edit Role' : 'Create Role'} onOk={saveRole} okText={editingRole ? 'Update' : 'Create'} destroyOnClose>
          <Form form={form} layout="vertical">
            <div className="grid-2">
              <Form.Item name="display_name" label="Display Name" rules={[{ required: true }]}>
                <AntInput placeholder="e.g. Super Admin" />
              </Form.Item>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <AntInput placeholder="e.g. super-admin" />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <AntInput placeholder="Short description" />
              </Form.Item>
              <Form.Item name="status" label="Status" initialValue="active" rules={[{ required: true }]}>
                <AntInput placeholder="active / inactive" />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </>
  )
}

export default Role
