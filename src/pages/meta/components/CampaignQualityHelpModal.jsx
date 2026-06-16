import { Modal, Tabs, Button } from 'antd';
import { InfoCircleOutlined, CloseCircleOutlined, StarOutlined, ApartmentOutlined, FilterOutlined, FolderOutlined } from '@ant-design/icons';

const featuresEn = [
    { 
        icon: <ApartmentOutlined style={{ color: '#3b82f6' }} />, 
        title: 'Hierarchical View', 
        desc: 'See performance breakdown from Campaign → Ad Set → Ad level' 
    },
    { 
        icon: <FilterOutlined style={{ color: '#8b5cf6' }} />, 
        title: 'Quality Details Toggle', 
        desc: 'Show/hide individual cancel reason columns' 
    },
    { 
        icon: <FolderOutlined style={{ color: '#06b6d4' }} />, 
        title: 'Source Filter', 
        desc: 'Filter by traffic source (Facebook, Instagram, Google, etc.)' 
    },
    { 
        icon: <CloseCircleOutlined style={{ color: '#ef4444' }} />, 
        title: 'Cancel Rate Indicator', 
        desc: 'Color-coded badges showing cancel percentage' 
    },
];

const featuresBn = [
    { 
        icon: <ApartmentOutlined style={{ color: '#3b82f6' }} />, 
        title: 'হায়ারার্কিক্যাল ভিউ', 
        desc: 'ক্যাম্পেইন → অ্যাড সেট → অ্যাড লেভেলে পারফরম্যান্স দেখুন' 
    },
    { 
        icon: <FilterOutlined style={{ color: '#8b5cf6' }} />, 
        title: 'কোয়ালিটি ডিটেইলস টগল', 
        desc: 'ক্যান্সেলের কারণের কলাম দেখান/লুকান' 
    },
    { 
        icon: <FolderOutlined style={{ color: '#06b6d4' }} />, 
        title: 'সোর্স ফিল্টার', 
        desc: 'ট্রাফিক সোর্স অনুযায়ী ফিল্টার করুন (Facebook, Instagram, Google ইত্যাদি)' 
    },
    { 
        icon: <CloseCircleOutlined style={{ color: '#ef4444' }} />, 
        title: 'ক্যান্সেল রেট ইন্ডিকেটর', 
        desc: 'রঙ-কোডেড ব্যাজ যা ক্যান্সেল শতাংশ দেখায়' 
    },
];

const FeatureCard = ({ icon, title, desc }) => (
    <div style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}>
            {icon}
        </div>
        <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{desc}</div>
        </div>
    </div>
);

const EnglishTab = () => (
    <div style={{ padding: '4px 0 20px' }}>
        <div style={{ background: '#f0f9ff', borderLeft: '3px solid #3b82f6', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
            <p style={{ color: '#1e40af', margin: 0, fontSize: 13, lineHeight: 1.7 }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                The Campaign Quality Report helps you identify which Meta (Facebook/Instagram)
                ad campaigns are bringing genuine customers vs. fake or problematic orders.
                By analyzing cancel reasons at the campaign, ad set, and ad level, you can
                optimize your ad spend and stop wasting money on campaigns that attract
                low-quality leads.
            </p>
        </div>

        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarOutlined style={{ color: '#f59e0b' }} /> Key Features
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {featuresEn.map((item, i) => <FeatureCard key={i} {...item} />)}
        </div>
    </div>
);

const BanglaTab = () => (
    <div style={{ padding: '4px 0 20px' }}>
        <div style={{ background: '#fefce8', borderLeft: '3px solid #eab308', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
            <p style={{ color: '#713f12', margin: 0, fontSize: 13, lineHeight: 1.7 }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                ক্যাম্পেইন কোয়ালিটি রিপোর্ট আপনাকে বুঝতে সাহায্য করে যে কোন Meta (Facebook/Instagram)
                অ্যাড ক্যাম্পেইন থেকে আসল কাস্টমার আসছে আর কোনটা থেকে ভুয়া বা সমস্যাযুক্ত অর্ডার
                আসছে। ক্যান্সেলের কারণ বিশ্লেষণ করে আপনি বুঝতে পারবেন কোন অ্যাডে টাকা নষ্ট হচ্ছে
                এবং কোনটায় বিনিয়োগ বাড়ানো উচিত।
            </p>
        </div>

        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarOutlined style={{ color: '#f59e0b' }} /> মূল ফিচারসমূহ
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {featuresBn.map((item, i) => <FeatureCard key={i} {...item} />)}
        </div>
    </div>
);

const CampaignQualityHelpModal = ({ open, onClose }) => (
    <Modal title={null} open={open} onCancel={onClose} footer={null} width={680} closable={false} styles={{ body: { padding: 0, borderRadius: 12, overflow: 'hidden' } }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '32px 32px 24px', position: 'relative' }}>
            <Button type="text" icon={<CloseCircleOutlined />} onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.6)', fontSize: 18 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    <InfoCircleOutlined style={{ color: '#60a5fa' }} />
                </div>
                <div>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Campaign Quality Report</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Understand your ad performance at a glance</div>
                </div>
            </div>
        </div>

        <Tabs
            defaultActiveKey="en"
            style={{ padding: '0 24px' }}
            items={[
                { key: 'en', label: <span><span style={{ marginRight: 4 }}>🇬🇧</span> English</span>, children: <EnglishTab /> },
                { key: 'bn', label: <span><span style={{ marginRight: 4 }}>🇧🇩</span> Bangla</span>, children: <BanglaTab /> },
            ]}
        />
    </Modal>
);

export default CampaignQualityHelpModal;
