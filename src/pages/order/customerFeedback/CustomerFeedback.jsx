import { useEffect, useState } from "react";
import useTitle from "../../../hooks/useTitle"
import { getDatas } from "../../../api/common/common";

export default function CustomerFeedback() {
    // Hooks
    useTitle("All Customer Feedback");

    // States
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);

    const getFeedbacks = async () => {
        try {
            setLoading(true);

            const res = await getDatas("/admin/customer/feedback");

            if(res && res?.success){
                setFeedbacks(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        getFeedbacks();
    }, []);

    return (
        <>
        
        </>
    )
}
