import { useRoute } from "wouter";
import NotFound from "@/pages/not-found";
import ServiceLandingTemplate from "@/components/ServiceLandingTemplate";
import {
  findEntry,
  type ServiceVertical,
} from "@/data/service-landings";

interface Props {
  vertical: ServiceVertical;
  pattern: string;
}

export default function ServiceLandingPage({ vertical, pattern }: Props) {
  const [, params] = useRoute<{ slug: string }>(pattern);
  const slug = params?.slug;
  const entry = slug ? findEntry(vertical, slug) : undefined;
  if (!entry) return <NotFound />;
  return <ServiceLandingTemplate entry={entry} />;
}
