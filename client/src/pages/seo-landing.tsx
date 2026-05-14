import SeoLandingPage from "@/components/SeoLandingPage";
import { SEO_LANDINGS, type SeoLandingSlug } from "@/data/seoLandings";
import NotFound from "@/pages/not-found";

interface Props {
  slug: SeoLandingSlug;
}

export default function SeoLanding({ slug }: Props) {
  const data = SEO_LANDINGS[slug];
  if (!data) return <NotFound />;
  return <SeoLandingPage {...data} />;
}
