import { Link } from "react-router-dom"
import { CheckCircle, ArrowRight, Quote, Wrench, Package } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type PricingOption = {
  id: string
  title: string
  price: string
  description: string
  features: string[]
  ctaLabel: string
  ctaPath: string
  highlight?: boolean
}

const pricingOptions: PricingOption[] = [
  {
    id: "monthly-subscription",
    title: "Monthly Subscription",
    price: "USD $60 / month",
    description: "Full access to the platform with continuous updates and support.",
    features: [
      "Access to core TAD HUB modules",
      "Cloud-based workflow tools",
      "Ongoing platform improvements",
    ],
    ctaLabel: "Start Subscription",
    ctaPath: "/contact",
    highlight: true,
  },
  {
    id: "custom-development",
    title: "Custom Development",
    price: "Custom Quote",
    description: "Tailored development based on your project scope and technical requirements.",
    features: [
      "Discovery and scope definition",
      "Architecture and implementation plan",
      "Quote based on deliverables",
    ],
    ctaLabel: "Request Quote",
    ctaPath: "/contact",
  },
  {
    id: "plugins-mcps-development",
    title: "Plugins and MCPs Development",
    price: "Custom Quote",
    description: "Design and development of plugins and/or MCPs aligned with your workflows.",
    features: [
      "Technical feasibility review",
      "Plugin and MCP development",
      "Quote according to complexity",
    ],
    ctaLabel: "Discuss Project",
    ctaPath: "/contact",
  },
  {
    id: "released-plugins-mcps",
    title: "Released Plugins and MCPs",
    price: "Listed Per Card",
    description: "Publicly released plugins and MCPs have their own price shown in each card.",
    features: [
      "Transparent pricing by product",
      "Pay only for what you need",
      "Product-specific scope and details",
    ],
    ctaLabel: "View Solutions",
    ctaPath: "/solutions",
  },
]

const optionIcons: Record<string, React.ReactNode> = {
  "monthly-subscription": <CheckCircle className="h-5 w-5" />,
  "custom-development": <Quote className="h-5 w-5" />,
  "plugins-mcps-development": <Wrench className="h-5 w-5" />,
  "released-plugins-mcps": <Package className="h-5 w-5" />,
}

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden w-full animate-in fade-in duration-500">
      <section className="relative px-6 lg:px-8 py-20 md:py-28 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Simple <span className="text-primary">Pricing</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Choose the model that matches your team: fixed monthly access, custom development, or product-based pricing for released plugins and MCPs.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {pricingOptions.map((option) => (
            <Card
              key={option.id}
              className={`p-6 flex flex-col h-full transition-all duration-300 ${
                option.highlight
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border hover:shadow-lg"
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {optionIcons[option.id]}
                </div>
                {option.highlight && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold mb-2">{option.title}</h2>
              <p className="text-2xl font-extrabold text-primary mb-3">{option.price}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{option.description}</p>

              <ul className="space-y-3 mb-8">
                {option.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-auto w-full" variant={option.highlight ? "default" : "outline"} asChild>
                <Link to={option.ctaPath}>
                  {option.ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
