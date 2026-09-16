export function formatAED(value) {
  return `AED ${Number(value).toLocaleString("en-AE")}`;
}

export function formatPrice(property) {
  const amount = formatAED(property.price);
  return property.purpose === "rent" ? `${amount}/yr` : amount;
}

export function bedroomLabel(bedrooms) {
  if (!bedrooms || bedrooms === 0) return "Studio";
  return `${bedrooms} BHK`;
}
