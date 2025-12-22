import React from "react"
import { Link } from "react-router-dom"
import { Cuboid, Terminal, ShoppingBag, ArrowRight, CheckCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Solution {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  path: string
  status: "active" | "coming-soon"
  colorClass: string
  features: string[]
}

const solutions: Solution[] = [
  {
    id: "viewer",
    title: "APS Viewer",
    description:
      "Visualize, inspect, and analyze your BIM models directly in the browser with advanced metadata tools.",
    icon: <Cuboid className="h-6 w-6" />,
    path: "/hub/login",
    status: "active",
    colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    features: ["3D model visualization", "Metadata inspection", "Real-time collaboration"],
  },
  {
    id: "mcp",
    title: "MCP Connection",
    description: "Real-time bridge between Revit and the Cloud. Execute python scripts and automate parameters.",
    icon: <Terminal className="h-6 w-6" />,
    path: "/mcp",
    status: "active",
    colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    features: ["Python script execution", "Parameter automation", "Cloud synchronization"],
  },
  {
    id: "store",
    title: "App Store",
    description: "Browse and download custom plugins, scripts, and families for your architectural projects.",
    icon: <ShoppingBag className="h-6 w-6" />,
    path: "/store",
    status: "coming-soon",
    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    features: ["Custom plugins", "Revit families", "Community scripts"],
  },
]

export default function SolutionsPage() {
  return (
    <div className="relative overflow-hidden w-full animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Our <span className="text-primary">Solutions</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Choose the tool that fits your workflow. From 3D visualization to automation, we have everything you need to
            supercharge your BIM projects.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-12 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {solutions.map((sol) => (
            <SolutionCard key={sol.id} solution={sol} />
          ))}
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why choose TAD HUB Solutions?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by architects and engineers, for architects and engineers
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <BenefitCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Cloud Native"
              description="Access your tools from anywhere, on any device."
            />
            <BenefitCard
              icon={<CheckCircle className="h-5 w-5" />}
              title="Seamless Integration"
              description="Works directly with Autodesk products and ACC."
            />
            <BenefitCard
              icon={<Terminal className="h-5 w-5" />}
              title="Automation Ready"
              description="Script and automate repetitive tasks easily."
            />
            <BenefitCard
              icon={<Cuboid className="h-5 w-5" />}
              title="Real-time Sync"
              description="Changes reflect instantly across all platforms."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="relative p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Not sure which solution is right for you?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team can help you find the perfect tools for your specific workflow and project needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="shadow-lg" asChild>
                <Link to="/contact">
                  Schedule a Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-background" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

// Sub-components
function SolutionCard({ solution }: { solution: Solution }) {
  const isActive = solution.status === "active"

  return (
    <Card
      className={cn(
        "relative p-6 transition-all duration-300 group flex flex-col border-border",
        isActive 
            ? "hover:shadow-xl hover:-translate-y-1 hover:border-primary/50" 
            : "opacity-60 grayscale cursor-not-allowed"
      )}
    >
      {!isActive && (
        <div className="absolute top-4 right-4">
          <span className="text-xs uppercase tracking-wider bg-secondary px-3 py-1 rounded-full text-secondary-foreground font-bold">
            Coming Soon
          </span>
        </div>
      )}

      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300",
          solution.colorClass,
        )}
      >
        {solution.icon}
      </div>

      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{solution.title}</h3>

      <p className="text-muted-foreground mb-6 text-sm leading-relaxed flex-grow">{solution.description}</p>

      <ul className="space-y-3 mb-8">
        {solution.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isActive ? (
        <Button className="w-full mt-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
          <Link to={solution.path}>
            Launch Module <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button className="w-full mt-auto" variant="secondary" disabled>
          Coming Soon
        </Button>
      )}
    </Card>
  )
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center p-4 rounded-lg hover:bg-background/50 transition-colors">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}