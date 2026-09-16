import { notFound } from "next/navigation";
import { properties } from "@/data/properties";
import ImmersivePropertyView from "@/components/property/ImmersivePropertyView";

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }) {
  const property = properties.find((p) => p.id === params.id);
  if (!property) return { title: "Property not found — Hi Pando" };
  return { title: `${property.title} — Hi Pando` };
}

export default function PropertyDetailsPage({ params }) {
  const property = properties.find((p) => p.id === params.id);
  if (!property) notFound();

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden", margin: 0, padding: 0, position: "relative" }}>
      <ImmersivePropertyView property={property} />
    </main>
  );
}
