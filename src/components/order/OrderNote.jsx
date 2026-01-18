import {Button,Card,Col,Form,Input,Popconfirm,Row,Space,Typography} from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

export default function OrderNote({noteList = [],note,setNote,noteLoading,noteId,onSubmit,onEdit,onDelete,formatDateTime}) {
    return (
        <Card title="Office Notes">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {noteList.length > 0 ? (noteList.map((noteItem) => (
                    <Card key={noteItem.id} size="small" style={{ backgroundColor: '#f5f5f5' }}>
                        <Typography.Paragraph style={{ marginBottom: 8 }}>
                            {noteItem.note}
                        </Typography.Paragraph>

                        <Row justify="space-between" align="middle">
                            <Col>
                                <Space size="small">
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        By: {noteItem?.created_by?.username}
                                    </Typography.Text>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        | {formatDateTime(noteItem.updated_at)}
                                    </Typography.Text>
                                </Space>
                            </Col>

                            <Col>
                                <Space size="small">
                                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(noteItem)}>
                                        Edit
                                    </Button>

                                    <Popconfirm title="Delete this note?" onConfirm={() => onDelete(noteItem.id)}>
                                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                                            Delete
                                        </Button>
                                    </Popconfirm>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                ))
                ) : (
                    <Typography.Text type="secondary">
                        No notes added yet.
                    </Typography.Text>
                )}

                <Card size="small">
                    <Form.Item label="Add Note:" style={{ marginBottom: 8 }}>
                        <Input.TextArea rows={3} placeholder="Write Note" value={note} onChange={(e) => setNote(e.target.value)}/>
                    </Form.Item>

                    <Button type="primary" loading={noteLoading} onClick={onSubmit}>
                        {noteId ? 'Update Note' : 'Submit Note'}
                    </Button>
                </Card>
            </Space>
        </Card>
    )
}
