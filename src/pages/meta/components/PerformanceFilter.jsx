import { Row, Col, Card, Input, Select, Button, Space, Dropdown, Menu, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined, CalendarOutlined, DownOutlined, EllipsisOutlined, HistoryOutlined, CheckCircleFilled, GlobalOutlined, TableOutlined, FilterOutlined, DownloadOutlined} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const PerformanceFilter = ({ searchText, setSearchText, statusFilter, setStatusFilter, selectedDateRange, setSelectedDateRange, refreshing, onRefresh }) => {
    
    const dateMenu = (
        <Menu 
            className="date-range-menu"
            onClick={({ key }) => setSelectedDateRange(key)}
            items={[
                { type: 'group', label: 'QUICK SELECT', children: [
                    { key: 'Today', label: 'Today', icon: <HistoryOutlined />, extra: selectedDateRange === 'Today' && <CheckCircleFilled style={{ color: '#10b981' }} /> },
                    { key: 'Yesterday', label: 'Yesterday', icon: <HistoryOutlined /> },
                    { key: 'Last 7 days', label: 'Last 7 days', icon: <CalendarOutlined /> },
                    { key: 'Last 30 days', label: 'Last 30 days', icon: <CalendarOutlined /> },
                ]},
                { type: 'divider' },
                { type: 'group', label: 'EXTENDED RANGE', children: [
                    { key: 'This month', label: 'This month', icon: <CalendarOutlined /> },
                    { key: 'Last month', label: 'Last month', icon: <CalendarOutlined /> },
                    { key: 'This year', label: 'This year', icon: <CalendarOutlined /> },
                    { key: 'Last year', label: 'Last year', icon: <CalendarOutlined /> },
                    { key: 'Lifetime', label: 'Lifetime', icon: <GlobalOutlined /> },
                ]},
                { type: 'divider' },
                { type: 'group', label: 'CUSTOM', children: [
                    { key: 'Select a date', label: 'Select a date', icon: <CalendarOutlined /> },
                    { key: 'Custom range', label: 'Custom range', icon: <TableOutlined /> },
                ]},
            ]}
        />
    );

    const actionMenu = (
        <Menu 
            items={[
                { key: 'export', label: 'Export Data', icon: <DownloadOutlined /> },
                { key: 'sync', label: 'Force Sync', icon: <ReloadOutlined /> },
                { type: 'divider' },
                { key: 'settings', label: 'Table Settings', icon: <FilterOutlined /> },
            ]}
        />
    );

    return (
        <Card className="table-card-premium" style={{ marginBottom: '16px' }} bordered={false}>
            <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={8} lg={6}>
                    <Input placeholder="Search campaigns..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
                </Col>
                <Col xs={12} md={5} lg={4}>
                    <Select defaultValue="ALL" style={{ width: '100%', textAlign: 'left' }} onChange={setStatusFilter} value={statusFilter}>
                        <Option value="ALL">All Status</Option>
                        <Option value="ACTIVE">Active</Option>
                        <Option value="PAUSED">Paused</Option>
                    </Select>
                </Col>
                <Col xs={12} md={4} lg={3}>
                    <Button icon={<ReloadOutlined spin={refreshing} />} onClick={() => onRefresh && onRefresh(true)} block>
                        Refresh
                    </Button>
                </Col>
                <Col xs={24} md={7} lg={11} className="table-actions-col" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Space size={8}>
                        <Dropdown overlay={dateMenu} trigger={['click']} placement="bottomRight">
                            <Button className="date-picker-btn">
                                <Space>
                                    <CalendarOutlined />
                                    {selectedDateRange}
                                    <DownOutlined style={{ fontSize: '10px' }} />
                                </Space>
                            </Button>
                        </Dropdown>
                        
                        <Dropdown overlay={actionMenu} trigger={['click']} placement="bottomRight">
                            <Button className="actions-btn">
                                <Space>
                                    <EllipsisOutlined />
                                    Actions
                                </Space>
                            </Button>
                        </Dropdown>
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default PerformanceFilter;
