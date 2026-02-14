import { useState } from "react";

export default function useDateFilter(defaultValue = "today") {
    const [filter, setFilter] = useState(defaultValue);
    const [range, setRange]   = useState(null);

    const buildParams = () => {
        if (filter !== "custom") {
            return { filter };
        }

        if (!range) return { filter };

        return {filter,from_date: range[0].format("YYYY-MM-DD"),to_date  : range[1].format("YYYY-MM-DD"),};
    };

    return {filter,range,setFilter,setRange,buildParams,};
}
