import { Link } from "react-router-dom"
import { ArrowRight, Box, Layers, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button" // Shadcn import
import { Card } from "@/components/ui/card"     // Shadcn import

export default function HomePage() {
  return (
    <div className="relative overflow-hidden w-full">
      
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="text-left space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
              BIM <span className="text-primary block mt-2">Reimagined</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              TAD bridges the gap between BIM and all project teams. Connect your data, automate your workflows, and access
              powerful tools in one unified platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base shadow-lg hover:shadow-xl transition-all" asChild>
                <Link to="/solutions">
                  Explore Solutions <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>

          {/* Hero Image / Placeholder */}
          <div className="relative lg:h-[500px] h-[350px] rounded-2xl overflow-hidden border border-border shadow-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
             {/* Descomenta esto cuando tengas la imagen en /public */}
             {/* <img src="/dashboard-preview.jpg" alt="Platform" className="w-full h-full object-cover" /> */}
             <div className="text-center p-6">
                <Box className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Dashboard Preview</p>
             </div>
          </div>

        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard number="10K+" label="Projects Managed" />
          <StatCard number="50+" label="Enterprise Clients" />
          <StatCard number="99.9%" label="Uptime SLA" />
          <StatCard number="40%" label="Time Saved" />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need for modern construction
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your BIM and VDC workflows
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Box className="h-8 w-8" />}
            title="Centralized Data"
            description="Access all your project files from Autodesk Construction Cloud in one place."
            features={["Single source of truth", "Real-time synchronization", "Cloud-based storage"]}
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Automation"
            description="Run complex scripts and update parameters across models in seconds."
            features={["Batch processing", "Custom workflows", "API integrations"]}
          />
          <FeatureCard
            icon={<Layers className="h-8 w-8" />}
            title="VDC Integration"
            description="Seamlessly connect BIM models with construction workflows."
            features={["Model coordination", "Clash detection", "4D scheduling"]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
            <div className="relative p-12 md:p-16 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ready to transform your workflow?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of construction professionals who trust TAD HUB for their digital construction needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="shadow-lg" asChild>
                  <Link to="/login">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-background" asChild>
                  <Link to="/contact">Request a Demo</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

// --- Sub-components (limpios) ---

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center space-y-1">
      <div className="text-3xl md:text-4xl font-bold text-primary">{number}</div>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description, features }: any) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
      <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6 leading-relaxed text-sm">{description}</p>
      <ul className="space-y-3">
        {features.map((feature: string, index: number) => (
          <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}