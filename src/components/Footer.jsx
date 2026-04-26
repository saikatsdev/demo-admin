import { useAppSettings } from "../contexts/useAppSettings";

const Footer = () => {
    const { settings } = useAppSettings();

    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300 mt-10">
            <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">

                <div>
                    <h2 className="text-xl font-semibold text-white">
                        {settings?.title || "Your Company"}
                    </h2>
                    <p className="mt-3 text-sm text-gray-400">
                        Your trusted destination for quality products at the best prices.
                    </p>
                </div>

                <div>
                    <h3 className="text-white font-medium mb-3">Quick Links</h3>
                    <ul className="space-y-2 text-sm">
                        <li><a href="/" className="hover:text-white">Home</a></li>
                        <li><a href="/shop" className="hover:text-white">Shop</a></li>
                        <li><a href="/about" className="hover:text-white">About</a></li>
                        <li><a href="/contact" className="hover:text-white">Contact</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-medium mb-3">Contact</h3>
                    <p className="text-sm text-gray-400">
                        Email: support@example.com
                    </p>
                    <p className="text-sm text-gray-400">
                        Phone: +880 1234-567890
                    </p>
                    <p className="text-sm text-gray-400">
                        Address: Dhaka, Bangladesh
                    </p>
                </div>
            </div>

            <div className="border-t border-gray-800 text-center py-4 text-sm text-gray-500">
                © {currentYear} {settings?.title || "Your Company"}. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;