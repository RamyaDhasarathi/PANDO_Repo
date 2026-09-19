import { Suspense } from "react";
import SearchResults from "./SearchResults";

export const metadata = {
  title: "Search Properties — Hi Pando",
  description: "Browse Dubai properties. Find apartments, villas, penthouses, and townhouses.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
