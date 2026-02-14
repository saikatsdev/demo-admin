import { Select, DatePicker } from "antd";
const { RangePicker } = DatePicker;

const FILTER_OPTIONS = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last7days", label: "Last 7 days" },
    { value: "last30days", label: "Last 30 days" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom" },
];

export default function DateFilter({value,range,onChange,onRangeChange}) {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            <Select size="small" value={value} style={{ width: 130 }} onChange={onChange}>
                {FILTER_OPTIONS.map(opt => (
                    <Select.Option key={opt.value} value={opt.value}>
                        {opt.label}
                    </Select.Option>
                ))}
            </Select>

            {value === "custom" && (
                <RangePicker size="small" value={range} onChange={onRangeChange} allowClear/>
            )}
        </div>
    );
}
