import { bedroomLabel, formatPrice } from "@/lib/format";

export function propertySummaryLine(property) {
  const bd = property.bedrooms === 0 ? "a studio layout" : `${property.bedrooms} bedroom${property.bedrooms > 1 ? "s" : ""}`;
  return `${property.title} in ${property.community}, ${property.city} — ${formatPrice(
    property
  )}${property.purpose === "rent" ? "/year" : ""}, offering ${bd} across ${property.areaSqft.toLocaleString()} sq. ft.`;
}

export function explainProperty(property) {
  const purpose = property.purpose === "sale" ? "available for sale" : "available for rent";
  const bd = property.bedrooms === 0 ? "a studio layout" : `${property.bedrooms} bedroom${property.bedrooms > 1 ? "s" : ""}`;
  const price = `${formatPrice(property)}${property.purpose === "rent" ? " per year" : ""}`;
  
  // Extract key sentence from description or build a concise punchy summary
  const descSnippet = property.description ? property.description.split(". ")[0] + "." : "";
  
  return `This ${property.type.toLowerCase()} is ${purpose} in ${property.community}, ${property.city}. It offers ${bd}, ${property.bathrooms} bathroom${property.bathrooms === 1 ? "" : "s"}, ${property.areaSqft.toLocaleString()} sq.ft. of space and ${property.furnishing.toLowerCase()} interiors. ${descSnippet}`;
}

export function answerPropertyQuestion(property, question) {
  const q = question.toLowerCase().trim();
  const bd = property.bedrooms === 0 ? "a studio layout" : `${property.bedrooms} bedroom${property.bedrooms > 1 ? "s" : ""}`;
  const price = `${formatPrice(property)}${property.purpose === "rent" ? " per year" : ""}`;

  if (/everything|tell me all|full overview|all detail|walkthrough|describe/.test(q)) {
    const amenities = property.amenities?.length ? ` Key amenities include ${property.amenities.join(", ")}.` : "";
    return `${property.title} is a ${property.type.toLowerCase()} ${property.purpose === "sale" ? "for sale" : "for rent"} in ${property.community}, ${property.city}, priced at ${price}. It features ${bd}, ${property.bathrooms} bathroom${property.bathrooms === 1 ? "" : "s"}, ${property.areaSqft.toLocaleString()} sq.ft. of ${property.furnishing.toLowerCase()} living space. ${property.description}${amenities}`;
  }

  if (/price|cost|how much|aed|budget|rent|payment|cheque|rate/.test(q)) {
    return `${property.title} is listed at ${price} (${property.purpose === "sale" ? "for sale" : "annual rent"}).`;
  }

  if (/bedroom|bhk|room|bed|studio/.test(q)) {
    return `This property features ${bd} and ${property.bathrooms} bathroom${
      property.bathrooms === 1 ? "" : "s"
    } over ${property.areaSqft.toLocaleString()} sq. ft.`;
  }

  if (/bathroom|bath|washroom|toilet/.test(q)) {
    return `It has ${property.bathrooms} fully fitted bathroom${property.bathrooms === 1 ? "" : "s"}.`;
  }

  if (/amenit|feature|facility|facilities|pool|gym|garden|beach|balcony|perk/.test(q)) {
    if (property.amenities && property.amenities.length > 0) {
      return `Amenities for this property include: ${property.amenities.join(", ")}.`;
    }
    return `This property includes standard luxury building amenities in ${property.community}.`;
  }

  if (/sq ?ft|square feet|size|area|built.?up|dimension|floor area/.test(q)) {
    return `The built-up area is ${property.areaSqft.toLocaleString()} sq. ft.`;
  }

  if (/location|where|address|community|area|city|neighbourhood|neighborhood/.test(q)) {
    return `It is located in ${property.community}, ${property.city}. ${property.description ? property.description.split(". ")[0] + "." : ""}`;
  }

  if (/furnish|furniture|fitted|interior/.test(q)) {
    return `This property is offered as ${property.furnishing.toLowerCase()}.`;
  }

  if (/park|garage|car/.test(q)) {
    const hasParking = property.amenities?.some(a => /parking|garage/i.test(a));
    return hasParking 
      ? `Yes, dedicated covered parking is included with this ${property.type.toLowerCase()}.`
      : `Parking arrangements can be confirmed directly with our verified agent.`;
  }

  if (/metro|transport|tram|bus|commute|station|near|close/.test(q)) {
    return `Situated in ${property.community}, it offers convenient access to Dubai's major transit routes and local amenities.`;
  }

  if (/type|villa|apartment|townhouse|penthouse|what kind/.test(q)) {
    return `This is a ${property.type} available ${property.purpose === "sale" ? "for sale" : "for rent"}.`;
  }

  if (/special|unique|why|highlight|view|views/.test(q)) {
    return property.description;
  }

  if (/agent|contact|call|whatsapp|reach|vip|viewing|tour|schedule/.test(q)) {
    return "You can use the 'Contact Agent' button to connect directly on WhatsApp, or click 'VIP Viewing' to schedule a private in-person viewing.";
  }

  if (/spec|detail|summary|overview/.test(q)) {
    return propertySummaryLine(property);
  }

  if (/photo|image|picture|gallery/.test(q)) {
    return `This listing features ${property.images.length} verified photo${
      property.images.length === 1 ? "" : "s"
    }. You can navigate through them using the arrows on the screen.`;
  }

  if (/available|status|posted|when|vacant/.test(q)) {
    const posted = new Date(property.postedOn).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `This listing was verified and listed on ${posted} and is currently active for ${
      property.purpose === "sale" ? "sale" : "rent"
    }.`;
  }

  return `For ${property.title} in ${property.community}: It offers ${bd}, ${property.bathrooms} bath, ${property.areaSqft.toLocaleString()} sq.ft., priced at ${price}. Feel free to ask about amenities, location, price, or booking a viewing!`;
}

