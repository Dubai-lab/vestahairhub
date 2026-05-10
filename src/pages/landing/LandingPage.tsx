import { HeroSection }         from './sections/HeroSection'
import { StatsSection }        from './sections/StatsSection'
import { BannerSliderSection } from './sections/BannerSliderSection'
import { CategoriesSection }   from './sections/CategoriesSection'
import { HowItWorksSection }   from './sections/HowItWorksSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { PricingSection }      from './sections/PricingSection'
import { CTASection }          from './sections/CTASection'

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <StatsSection />
      <BannerSliderSection />
      <CategoriesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </div>
  )
}
