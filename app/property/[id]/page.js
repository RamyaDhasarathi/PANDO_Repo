import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Listing from "@/lib/models/Listing";
import ImmersivePropertyView from "@/components/property/ImmersivePropertyView";

export async function generateMetadata({ params }) {
  await dbConnect();
  
  // Try to find by originalId (e.g. prop-1) or ObjectId
  let property = await Listing.findOne({ originalId: params.id }).lean();
  if (!property && params.id.length === 24) {
    property = await Listing.findById(params.id).lean();
  }

  if (!property) return { title: "Property not found — Hi Pando" };
  return { title: `${property.title} — Hi Pando` };
}

export default async function PropertyDetailsPage({ params }) {
  await dbConnect();
  
  // Try to find by originalId (e.g. prop-1) or ObjectId
  let dbProperty = await Listing.findOne({ originalId: params.id }).lean();
  
  if (!dbProperty && params.id.length === 24) {
    try {
      dbProperty = await Listing.findById(params.id).lean();
    } catch (e) {
      // invalid object id format
    }
  }

  if (!dbProperty) notFound();
  
  const mappedProperty = {
    id: dbProperty._id.toString(),
    title: dbProperty.title,
    purpose: dbProperty.purpose || "sale",
    type: dbProperty.propertyType || "Apartment",
    price: dbProperty.price,
    community: dbProperty.community || "Dubai",
    city: dbProperty.city || "Dubai",
    bedrooms: dbProperty.bedrooms || 0,
    bathrooms: dbProperty.bathrooms || 0,
    areaSqft: dbProperty.areaSqft || 0,
    furnishing: dbProperty.furnishing || "Furnished",
    amenities: dbProperty.amenities || [],
    images: Array.isArray(dbProperty.images) && dbProperty.images.filter(Boolean).length > 0 
      ? dbProperty.images.filter(Boolean)
      : ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80"],
    description: dbProperty.description || "",
  };

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden", margin: 0, padding: 0, position: "relative" }}>
      <ImmersivePropertyView property={mappedProperty} />
    </main>
  );
}
