import { useState, useEffect } from 'react'
import { DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;

export default function OrderByStatus({statuses, onFilterChange}) {
    // Hooks
    const navigate = useNavigate();

    // State
    const [activeFilter, setActiveFilter] = useState("today");
    const [dateRange, setDateRange]       = useState(null);

    useEffect(() => {
        if (onFilterChange) {
            onFilterChange(activeFilter, dateRange);
        }
    }, [activeFilter, dateRange, onFilterChange]);

    const handleFilterChange = (val) => {
        setActiveFilter(val);
    }

    const handleDateRangeChange = (values) => {
        setDateRange(values);
    }

    return (
        <>
            <div className="pipe-header">
                <div className="sec-label" style={{ margin: 0 }}>
                    Order pipeline
                </div>

                <div className="pipe-filters" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeFilter === 'custom' && (
                        <RangePicker 
                            size="small"
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            style={{
                                borderRadius: "6px",
                                border: "1px solid var(--border-md)",
                                background: "var(--bg-card)",
                                height: "32px",
                                fontSize: "12px"
                            }}
                            placeholder={['Start', 'End']}
                        />
                    )}
                    <select className="pf-select" value={activeFilter} onChange={(e) => handleFilterChange(e.target.value)}
                        style={{ 
                            padding     : "6px 12px",
                            borderRadius: "6px",
                            border      : "1px solid var(--border-md)",
                            background  : "var(--bg-card)",
                            fontSize    : "12px",
                            color       : "var(--text-2)",
                            outline     : "none",
                            cursor      : "pointer",
                            fontFamily  : "inherit",
                            height      : "32px"
                        }}
                    >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                        <option value="year">This year</option>
                        <option value="custom">Custom...</option>
                    </select>
                </div>
            </div>

            <div className="pipe-grid">
                {statuses.map((item, index) => (
                    <div className="pc" key={index} 
                        onClick={() => navigate('/orders', { state: { statusId: item.id } })}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="pc-icon" style={{ backgroundColor: item.bg_color, color: item.text_color }}>
                            <i className={`ti ${item.icon}`}></i>
                        </div>
                        <div className="pc-body">
                            <div className="pc-label">{item.name}</div>
                            <div className="pc-val">{item.orders_count}</div>
                            <div className="pc-sub">{item.total_amount}</div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
