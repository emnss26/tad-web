import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import {
  ArrowRight,
  Blocks,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Hammer,
  Scale,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type SolutionItem = {
  id: string
  title: string
  description: string
  icon: ReactNode
  tools: string[]
}

const mcpRevitForClaude: SolutionItem[] = [
  {
    id: "mcp-revit-architectural",
    title: "MCP+Revit - For Claude - Architectural Tools",
    description: "Automate architectural workflows in Revit with model-aware commands and checks.",
    icon: <Building2 className="h-5 w-5" />,
    tools: ["Architecture analysis", "Model context automation", "Discipline-focused actions"],
  },
  {
    id: "mcp-revit-structural",
    title: "MCP+Revit - For Claude - Structural Tools",
    description: "Connect structural logic and QA workflows to Claude agents in Revit.",
    icon: <Hammer className="h-5 w-5" />,
    tools: ["Structural model checks", "Element validation", "Faster coordination cycles"],
  },
  {
    id: "mcp-revit-mechanical",
    title: "MCP+Revit - For Claude - Mechanical Tools",
    description: "Enable mechanical system support for data extraction and model operations.",
    icon: <Wrench className="h-5 w-5" />,
    tools: ["Mechanical workflows", "Model queries", "Targeted automation"],
  },
  {
    id: "mcp-revit-quality",
    title: "MCP+Revit - For Claude - Model Quality Tools",
    description: "Run model quality checks and compliance-oriented validation directly from agents.",
    icon: <ShieldCheck className="h-5 w-5" />,
    tools: ["Quality control", "Rule-based checks", "Compliance visibility"],
  },
  {
    id: "mcp-revit-quantification",
    title: "MCP+Revit - For Claude - Model Quantification Tools",
    description: "Generate quantity intelligence and automate repetitive model quantification tasks.",
    icon: <Scale className="h-5 w-5" />,
    tools: ["Quantity takeoff support", "Automated counting", "Data export workflows"],
  },
]

const mcpAccForClaude: SolutionItem[] = [
  {
    id: "mcp-acc-issues",
    title: "MCP+ACC - For Claude - Issues Tools",
    description: "Automate issue tracking and resolution workflows in Autodesk Construction Cloud.",
    icon: <ClipboardCheck className="h-5 w-5" />,
    tools: ["Issue automation", "Status updates", "Coordination tracking"],
  },
  {
    id: "mcp-acc-rfis",
    title: "MCP+ACC - For Claude - RFIs Tools",
    description: "Streamline RFI generation, analysis, and follow-up actions from Claude agents.",
    icon: <Blocks className="h-5 w-5" />,
    tools: ["RFI workflows", "Context-driven answers", "Faster turnaround"],
  },
  {
    id: "mcp-acc-submittals",
    title: "MCP+ACC - For Claude - Submittals Tools",
    description: "Manage submittal pipelines with automation-ready integrations for teams.",
    icon: <Sparkles className="h-5 w-5" />,
    tools: ["Submittal tracking", "Workflow automation", "Review visibility"],
  },
  {
    id: "mcp-acc-quality",
    title: "MCP+ACC - For Claude - Model Quality Tools",
    description: "Bring model quality checks into ACC collaboration and project controls.",
    icon: <ShieldCheck className="h-5 w-5" />,
    tools: ["Model QA in ACC", "Cross-team alignment", "Actionable quality data"],
  },
  {
    id: "mcp-acc-quantification",
    title: "MCP+ACC - For Claude - Model Quantification Tools",
    description: "Connect quantification processes with ACC data flows for better planning.",
    icon: <Scale className="h-5 w-5" />,
    tools: ["Quantification pipelines", "Project metrics", "Cost/planning readiness"],
  },
]

const gptRevitForAgents: SolutionItem[] = [
  {
    id: "gpt-revit-architectural",
    title: "GPT+Revit - For GPT Agents - Architectural Tools",
    description: "Power GPT agents with architectural commands connected to Revit model context.",
    icon: <Building2 className="h-5 w-5" />,
    tools: ["Architectural assistants", "Context-aware model actions", "Automation templates"],
  },
  {
    id: "gpt-revit-structural",
    title: "GPT+Revit - For GPT Agents - Structural Tools",
    description: "Enable structural-focused GPT agents for model interrogation and validation.",
    icon: <Hammer className="h-5 w-5" />,
    tools: ["Structural checks", "Model data extraction", "Discipline AI support"],
  },
  {
    id: "gpt-revit-mechanical",
    title: "GPT+Revit - For GPT Agents - Mechanical Tools",
    description: "Support mechanical workflows with GPT agents connected to Revit operations.",
    icon: <Wrench className="h-5 w-5" />,
    tools: ["Mechanical automation", "Workflow acceleration", "Agent operations"],
  },
  {
    id: "gpt-revit-quality",
    title: "GPT+Revit - For GPT Agents - Model Quality Tools",
    description: "Use GPT agents for repeatable model quality and standards checks.",
    icon: <ShieldCheck className="h-5 w-5" />,
    tools: ["Quality analysis", "Rule validation", "Automated review support"],
  },
  {
    id: "gpt-revit-quantification",
    title: "GPT+Revit - For GPT Agents - Model Quantification Tools",
    description: "Scale quantity workflows through GPT-driven extraction and reporting.",
    icon: <Scale className="h-5 w-5" />,
    tools: ["Model quantification", "Automated reports", "Data consistency"],
  },
]

export default function McpSolutionsPage() {
  return (
    <div className="relative overflow-hidden w-full animate-in fade-in duration-500">
      <section className="relative px-6 lg:px-8 py-20 md:py-28 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            MCP <span className="text-primary">Solutions</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Production-ready MCP and GPT integrations for Revit and ACC workflows. Pick a package by platform and toolset,
            or request a fully tailored implementation for your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Button size="lg" asChild>
              <Link to="/contact">
                Ask for a quotation <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/solutions">Back to Solutions</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-base md:text-lg font-medium">
            Pricing for all packages: <span className="text-primary font-semibold">Ask for a quotation</span>
          </p>
        </div>
      </section>

      <section className="py-14 max-w-7xl mx-auto px-6">
        <Tabs defaultValue="mcp-revit" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="h-auto flex-wrap gap-2 bg-muted/60 p-2">
              <TabsTrigger value="mcp-revit">MCP + Revit (Claude)</TabsTrigger>
              <TabsTrigger value="mcp-acc">MCP + ACC (Claude)</TabsTrigger>
              <TabsTrigger value="gpt-revit">GPT + Revit (GPT Agents)</TabsTrigger>
              <TabsTrigger value="custom">Custom MCP</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="mcp-revit">
            <SolutionGrid items={mcpRevitForClaude} />
          </TabsContent>

          <TabsContent value="mcp-acc">
            <SolutionGrid items={mcpAccForClaude} />
          </TabsContent>

          <TabsContent value="gpt-revit">
            <SolutionGrid items={gptRevitForAgents} />
          </TabsContent>

          <TabsContent value="custom">
            <Card className="relative overflow-hidden border-primary/20 bg-primary/5 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">Custom MCP for Claude, Copilot or GPT</h2>
                  <p className="text-muted-foreground mb-5 leading-relaxed">
                    We design and build custom MCP capabilities aligned with your exact tool stack, discipline scope, and
                    internal workflows.
                  </p>
                  <p className="text-sm text-muted-foreground">Pricing: Ask for a quotation</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-6">
                  <h3 className="font-semibold mb-4">Typical deliverables</h3>
                  <ul className="space-y-3">
                    <FeatureItem text="Custom tool catalog based on your process map" />
                    <FeatureItem text="Integration with Revit, ACC, and internal endpoints" />
                    <FeatureItem text="Role-based prompts and guardrails for agents" />
                    <FeatureItem text="Deployment, documentation, and onboarding support" />
                  </ul>
                  <Button className="mt-6 w-full" asChild>
                    <Link to="/contact">Request custom proposal</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

function SolutionGrid({ items }: { items: SolutionItem[] }) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item) => (
        <Card key={item.id} className="p-6 border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
            {item.icon}
          </div>
          <h3 className="text-lg font-bold leading-tight mb-2">{item.title}</h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{item.description}</p>
          <ul className="space-y-2 mb-6">
            {item.tools.map((tool) => (
              <FeatureItem key={tool} text={tool} />
            ))}
          </ul>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm font-medium text-primary">Ask for a quotation</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/contact">Get quote</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
      <span>{text}</span>
    </li>
  )
}
