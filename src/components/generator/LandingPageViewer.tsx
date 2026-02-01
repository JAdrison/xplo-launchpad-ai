import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Copy,
  Sparkles,
  Target,
  Shield,
  Gift,
  MessageSquare,
  AlertCircle,
  Zap,
  HelpCircle,
  ArrowRight,
  Star,
  CheckCircle,
  Trophy,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { PDFExportButton } from "@/components/export/PDFExportButton";

interface HeroSection {
  headline?: string;
  subheadline?: string;
  hero_text?: string;
  cta_button?: string;
  cta_subtext?: string;
}

interface ProblemSection {
  title?: string;
  problems?: string[];
  emotional_text?: string;
}

interface SolutionSection {
  title?: string;
  description?: string;
  unique_mechanism?: string;
}

interface BenefitItem {
  icon?: string;
  title?: string;
  description?: string;
}

interface HowItWorksSection {
  title?: string;
  steps?: Array<{
    number?: number;
    title?: string;
    description?: string;
  }>;
}

interface Testimonial {
  name?: string;
  role?: string;
  text?: string;
  result?: string;
}

interface Stat {
  number?: string;
  label?: string;
}

interface SocialProofSection {
  title?: string;
  testimonials?: Testimonial[];
  stats?: Stat[];
}

interface GuaranteeSection {
  title?: string;
  description?: string;
  duration?: string;
  conditions?: string;
}

interface ValueStackItem {
  name?: string;
  value?: string;
}

interface ValueStackSection {
  title?: string;
  items?: ValueStackItem[];
  total_value?: string;
  actual_price?: string;
  discount_text?: string;
}

interface FAQItem {
  question?: string;
  answer?: string;
}

interface FinalCTASection {
  headline?: string;
  subtext?: string;
  button_text?: string;
  urgency_text?: string;
}

// Legacy format
interface LegacySections {
  headline?: string;
  subheadline?: string;
  hero_text?: string;
  benefits?: string[];
  social_proof?: string;
  cta_text?: string;
  cta_subtext?: string;
}

// New complete format
interface CompleteLPSections {
  hero?: HeroSection;
  problem_agitation?: ProblemSection;
  solution?: SolutionSection;
  benefits?: BenefitItem[];
  how_it_works?: HowItWorksSection;
  social_proof?: SocialProofSection;
  guarantee?: GuaranteeSection;
  value_stack?: ValueStackSection;
  faq?: FAQItem[];
  final_cta?: FinalCTASection;
}

type LPSections = CompleteLPSections | LegacySections;

interface LandingPageViewerProps {
  sections: LPSections;
  variant: string;
  clientName?: string;
  createdAt?: string;
  showPDFButton?: boolean;
}

const iconMap: Record<string, typeof CheckCircle> = {
  check: CheckCircle,
  star: Star,
  zap: Zap,
  shield: Shield,
  trophy: Trophy,
  gift: Gift,
  target: Target,
};

export function LandingPageViewer({ 
  sections, 
  variant, 
  clientName = "Cliente",
  createdAt = new Date().toISOString(),
  showPDFButton = false
}: LandingPageViewerProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const copyAllSections = () => {
    const text = JSON.stringify(sections, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("Todas as seções copiadas!");
  };

  // Check if it's the new complete format
  const isCompleteFormat = 'hero' in sections && sections.hero;
  
  if (!isCompleteFormat) {
    // Legacy format rendering
    const legacy = sections as LegacySections;
    return (
      <div className="space-y-3">
        {legacy.headline && (
          <div>
            <p className="text-xs text-muted-foreground">Headline</p>
            <p className="font-semibold">{legacy.headline}</p>
          </div>
        )}
        {legacy.subheadline && (
          <div>
            <p className="text-xs text-muted-foreground">Subheadline</p>
            <p className="text-sm">{legacy.subheadline}</p>
          </div>
        )}
        {legacy.benefits && legacy.benefits.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Benefícios</p>
            <ul className="text-sm list-disc list-inside">
              {legacy.benefits.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}
        {legacy.cta_text && (
          <div>
            <p className="text-xs text-muted-foreground">CTA</p>
            <p className="text-sm font-medium text-primary">{legacy.cta_text}</p>
          </div>
        )}
      </div>
    );
  }

  const complete = sections as CompleteLPSections;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={copyAllSections}>
          <Copy className="h-3 w-3 mr-1" />
          Copiar tudo
        </Button>
        {showPDFButton && (
          <PDFExportButton
            type="landing-page"
            clientName={clientName}
            content={{ sections }}
            variant={variant}
            createdAt={createdAt}
          />
        )}
      </div>

      <Accordion type="multiple" className="w-full">
        {/* Hero Section */}
        {complete.hero && (
          <AccordionItem value="hero">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">Hero</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Headline</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(complete.hero?.headline || '', 'Headline')}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-bold text-lg">{complete.hero.headline}</p>
              
              {complete.hero.subheadline && (
                <>
                  <p className="text-xs text-muted-foreground">Subheadline</p>
                  <p className="text-sm">{complete.hero.subheadline}</p>
                </>
              )}
              
              {complete.hero.hero_text && (
                <>
                  <p className="text-xs text-muted-foreground">Texto de abertura</p>
                  <p className="text-sm text-muted-foreground">{complete.hero.hero_text}</p>
                </>
              )}
              
              {complete.hero.cta_button && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="font-medium text-primary">{complete.hero.cta_button}</p>
                  {complete.hero.cta_subtext && (
                    <p className="text-xs text-muted-foreground">{complete.hero.cta_subtext}</p>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Problem Agitation */}
        {complete.problem_agitation && (
          <AccordionItem value="problem">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium">Problemas e Dores</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              {complete.problem_agitation.title && (
                <p className="font-semibold">{complete.problem_agitation.title}</p>
              )}
              {complete.problem_agitation.problems && (
                <ul className="space-y-2">
                  {complete.problem_agitation.problems.map((problem, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-destructive">•</span>
                      {problem}
                    </li>
                  ))}
                </ul>
              )}
              {complete.problem_agitation.emotional_text && (
                <p className="text-sm text-muted-foreground italic">{complete.problem_agitation.emotional_text}</p>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Solution */}
        {complete.solution && (
          <AccordionItem value="solution">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">Solução</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              {complete.solution.title && (
                <p className="font-semibold">{complete.solution.title}</p>
              )}
              {complete.solution.description && (
                <p className="text-sm">{complete.solution.description}</p>
              )}
              {complete.solution.unique_mechanism && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Mecanismo Único</p>
                  <p className="text-sm font-medium">{complete.solution.unique_mechanism}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Benefits */}
        {complete.benefits && complete.benefits.length > 0 && (
          <AccordionItem value="benefits">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Benefícios ({complete.benefits.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {complete.benefits.map((benefit, i) => {
                const IconComponent = iconMap[benefit.icon || 'check'] || CheckCircle;
                return (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <IconComponent className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{benefit.title}</p>
                      {benefit.description && (
                        <p className="text-xs text-muted-foreground">{benefit.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* How It Works */}
        {complete.how_it_works && complete.how_it_works.steps && (
          <AccordionItem value="how_it_works">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="font-medium">Como Funciona</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              {complete.how_it_works.title && (
                <p className="font-semibold">{complete.how_it_works.title}</p>
              )}
              <div className="space-y-3">
                {complete.how_it_works.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {step.number || i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{step.title}</p>
                      {step.description && (
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Social Proof */}
        {complete.social_proof && (
          <AccordionItem value="social_proof">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-medium">Prova Social</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {complete.social_proof.title && (
                <p className="font-semibold">{complete.social_proof.title}</p>
              )}
              
              {/* Stats */}
              {complete.social_proof.stats && complete.social_proof.stats.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {complete.social_proof.stats.map((stat, i) => (
                    <div key={i} className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="font-bold text-primary">{stat.number}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Testimonials */}
              {complete.social_proof.testimonials && complete.social_proof.testimonials.length > 0 && (
                <div className="space-y-3">
                  {complete.social_proof.testimonials.map((testimonial, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <p className="text-sm italic">"{testimonial.text}"</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                        {testimonial.result && (
                          <Badge variant="secondary" className="text-xs">{testimonial.result}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Guarantee */}
        {complete.guarantee && (
          <AccordionItem value="guarantee">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Garantia</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {complete.guarantee.title && (
                <p className="font-semibold">{complete.guarantee.title}</p>
              )}
              {complete.guarantee.description && (
                <p className="text-sm">{complete.guarantee.description}</p>
              )}
              <div className="flex gap-4 text-sm">
                {complete.guarantee.duration && (
                  <Badge variant="outline">{complete.guarantee.duration}</Badge>
                )}
                {complete.guarantee.conditions && (
                  <span className="text-muted-foreground">{complete.guarantee.conditions}</span>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Value Stack */}
        {complete.value_stack && (
          <AccordionItem value="value_stack">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="font-medium">Pilha de Valor</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              {complete.value_stack.title && (
                <p className="font-semibold">{complete.value_stack.title}</p>
              )}
              {complete.value_stack.items && (
                <div className="space-y-2">
                  {complete.value_stack.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <span className="text-sm">{item.name}</span>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {(complete.value_stack.total_value || complete.value_stack.actual_price) && (
                <div className="border-t pt-3 space-y-1">
                  {complete.value_stack.total_value && (
                    <div className="flex justify-between text-sm">
                      <span>Valor total:</span>
                      <span className="line-through text-muted-foreground">{complete.value_stack.total_value}</span>
                    </div>
                  )}
                  {complete.value_stack.actual_price && (
                    <div className="flex justify-between font-bold text-primary">
                      <span>Hoje por apenas:</span>
                      <span>{complete.value_stack.actual_price}</span>
                    </div>
                  )}
                  {complete.value_stack.discount_text && (
                    <p className="text-xs text-center text-muted-foreground">{complete.value_stack.discount_text}</p>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* FAQ */}
        {complete.faq && complete.faq.length > 0 && (
          <AccordionItem value="faq">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">FAQ ({complete.faq.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              {complete.faq.map((item, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">{item.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Final CTA */}
        {complete.final_cta && (
          <AccordionItem value="final_cta">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">CTA Final</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {complete.final_cta.headline && (
                <p className="font-bold">{complete.final_cta.headline}</p>
              )}
              {complete.final_cta.subtext && (
                <p className="text-sm text-muted-foreground">{complete.final_cta.subtext}</p>
              )}
              {complete.final_cta.button_text && (
                <div className="bg-primary/10 p-3 rounded-lg text-center">
                  <p className="font-bold text-primary">{complete.final_cta.button_text}</p>
                  {complete.final_cta.urgency_text && (
                    <p className="text-xs text-destructive/80 mt-1">{complete.final_cta.urgency_text}</p>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
