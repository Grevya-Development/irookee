import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-2">irookee</h3>
            <p className="text-lg font-semibold text-purple-400 mb-3">People for People</p>
            <p className="text-gray-400 text-sm mb-4">
              Democratizing the way people connect with each other. The right person, for any situation, available to everyone.
            </p>
            <div className="mb-4">
              <a href="mailto:kavin@irookee.com" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
                kavin@irookee.com
              </a>
            </div>
            <div className="flex space-x-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-5">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/speakers" className="text-gray-400 hover:text-white transition-colors">Browse Experts</Link></li>
              <li><Link to="/search" className="text-gray-400 hover:text-white transition-colors">Search</Link></li>
              <li><Link to="/leaderboard" className="text-gray-400 hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* For Experts */}
          <div>
            <h4 className="font-semibold mb-5">For Experts</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/expert/onboarding" className="text-gray-400 hover:text-white transition-colors">Become an Expert</Link></li>
              <li><Link to="/expert/dashboard" className="text-gray-400 hover:text-white transition-colors">Expert Dashboard</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">My Dashboard</Link></li>
              <li><Link to="/settings" className="text-gray-400 hover:text-white transition-colors">Settings</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-5">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><a href="mailto:kavin@irookee.com" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-sm">
              &copy; 2026 irookee. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
