import { Suspense } from "react";
import MapExploreWrapper from "@/app/search/MapExploreWrapper";

export const metadata = {
  title: "Explore Properties Map — Hi Pando",
  description: "Browse Dubai properties on an interactive satellite map with Pando AI.",
};

export default function ExploreMapPage() {
  return (
    <Suspense fallback={null}>
      <MapExploreWrapper />
    </Suspense>
  );
}
