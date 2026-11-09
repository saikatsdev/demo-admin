import { Row, Col, Card, Input, Select, Button, Space, Dropdown } from 'antd';
import {SearchOutlined,ReloadOutlined,CalendarOutlined,DownOutlined,HistoryOutlined,CheckCircleFilled,GlobalOutlined} from '@ant-design/icons';

const { Option } = Select;

const PerformanceFilter = ({searchText,setSearchText,statusFilter,setStatusFilter,selectedDateRange,setSelectedDateRange,refreshing,onRefresh}) => {
    const presets = [
        ['Today', <HistoryOutlined />],
        ['Yesterday', <HistoryOutlined />],
        ['Last 7 days', <CalendarOutlined />],
        ['Last 30 days', <CalendarOutlined />],
        ['This month', <CalendarOutlined />],
        ['Last month', <CalendarOutlined />],
        ['This year', <CalendarOutlined />],
        ['Last year', <CalendarOutlined />],
        ['Lifetime', <GlobalOutlined />],
    ];

    const dateMenu = {
        items: presets.map(([key, icon]) => ({
            key,
            label: key,
            icon,
            extra: selectedDateRange === key ? <CheckCircleFilled style={{ color: '#10b981' }} /> : null,
        })),
        onClick: ({ key }) => setSelectedDateRange(key),
    };

    return (
        <Card className="table-card-premium" style={{ marginBottom: '16px' }} bordered={false}>
            <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={8} lg={6}>
                    <Input
                        placeholder="Search campaigns..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                </Col>

                <Col xs={12} md={5} lg={4}>
                    <Select style={{ width: '100%', textAlign: 'left' }} onChange={setStatusFilter} value={statusFilter}>
                        <Option value="ALL">All Status</Option>
                        <Option value="ACTIVE">Active</Option>
                        <Option value="PAUSED">Paused</Option>
                    </Select>
                </Col>

                <Col xs={12} md={4} lg={3}>
                    <Button icon={<ReloadOutlined spin={refreshing} />} onClick={() => onRefresh?.(true)} block>
                        Refresh
                    </Button>
                </Col>

                <Col xs={24} md={7} lg={11} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Dropdown menu={dateMenu} trigger={['click']} placement="bottomRight">
                        <Button className="date-picker-btn">
                            <Space>
                                <CalendarOutlined />
                                {selectedDateRange}
                                <DownOutlined style={{ fontSize: '10px' }} />
                            </Space>
                        </Button>
                    </Dropdown>
                </Col>
            </Row>
        </Card>
    );
};

export default PerformanceFilter;
