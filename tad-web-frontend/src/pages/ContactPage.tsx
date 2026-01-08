import { Mail, MapPin, Phone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
// Si no has instalado textarea: npx shadcn@latest add textarea
// Si no, usa Input por ahora. Asumiré que podemos usar Input o HTML textarea simple con clases tailwind.
import { Label } from "@/components/ui/label" // npx shadcn@latest add label

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden w-full animate-in fade-in duration-500">
      
      {/* Header Section */}
      <section className="relative px-6 lg:px-8 py-16 md:py-24 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Get in <span className="text-primary">Touch</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question about our solutions? Want to request a demo? We'd love to hear from you.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Contact Info Side */}
          <div className="space-y-8">
            <Card className="p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Email Us</h3>
                <p className="text-muted-foreground mb-2">For general inquiries and support</p>
                <a href="mailto:contact@tadhub.com" className="text-primary font-medium hover:underline">
                  taller.arq.dgtl@gmail.com
                </a>
              </div>
            </Card>

            <Card className="p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Visit Us</h3>
                <p className="text-muted-foreground mb-2">Come say hello at our office</p>
                <p className="text-foreground">Mexico City, Mexico</p>
              </div>
            </Card>

          </div>

          {/* Form Side */}
          <Card className="p-8 shadow-lg border-t-4 border-t-primary">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" placeholder="Doe" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="I need help with..." required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea 
                  id="message" 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                  placeholder="Tell us more about your project..." 
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base">
                Send Message <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Card>

        </div>
      </section>
    </div>
  )
}