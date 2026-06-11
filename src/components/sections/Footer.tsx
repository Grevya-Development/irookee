import { Facebook, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const companyEmail = "kavin@irookee.com";

const socialLinks: Array<{
  label: string;
  href: string;
  Icon: typeof Facebook;
}> = [];

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-bold mb-4">irookee</h3>
            <p className="text-lg font-semibold text-purple-400 mb-4">People for People</p>
            <p className="text-gray-400 mb-4">
              Connecting exceptional experts with amazing events worldwide.
            </p>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">For inquiries:</p>
              <a href={`mailto:${companyEmail}`} className="text-purple-400 hover:text-purple-300 transition-colors">
                {companyEmail}
              </a>
            </div>
            {socialLinks.length > 0 && (
              <div className="flex space-x-4">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><a href={`mailto:${companyEmail}`} className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">For Experts</h4>
            <ul className="space-y-4">
              <li><Link to="/expert/onboarding" className="text-gray-400 hover:text-white transition-colors">Become an Expert</Link></li>
              <li><Link to="/profile-setup" className="text-gray-400 hover:text-white transition-colors">Complete Profile</Link></li>
              <li><Link to="/search" className="text-gray-400 hover:text-white transition-colors">Find Experts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Newsletter</h4>
            <p className="text-gray-400 mb-4">
              Stay updated with the latest speaking opportunities and industry insights.
            </p>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
              />
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 irookee. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
