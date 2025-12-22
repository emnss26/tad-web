import { Link } from "react-router-dom"
import { Linkedin, Instagram, Mail, Box } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-950 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Box className="w-8 h-8 text-primary" />
              <h3 className="text-xl font-bold text-white">TAD HUB</h3>
            </div>
            <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
              Empowering BIM & VDC workflows with cutting-edge technology, automation, and real-time cloud integration.
            </p>
            <div className="flex gap-4 pt-2">
              <SocialIcon href="#" icon={<Linkedin size={20} />} />
              <SocialIcon href="#" icon={<Instagram size={20} />} />
              <SocialIcon href="mailto:contact@tadhub.com" icon={<Mail size={20} />} />
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><FooterLink to="/solutions">Solutions</FooterLink></li>
              <li><FooterLink to="/pricing">Pricing</FooterLink></li>
              <li><FooterLink to="/docs">Documentation</FooterLink></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><FooterLink to="/about">About Us</FooterLink></li>
              <li><FooterLink to="/contact">Contact</FooterLink></li>
              <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>&copy; {currentYear} TAD HUB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// Pequeños componentes auxiliares para limpiar el código
const SocialIcon = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="bg-slate-800 p-2 rounded-full hover:bg-primary hover:text-white transition-all"
  >
    {icon}
  </a>
)

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link to={to} className="text-slate-400 hover:text-primary transition-colors block">
    {children}
  </Link>
)