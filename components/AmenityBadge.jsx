import styles from "./AmenityBadge.module.css";

const ICONS = {
  Pool: "🏊",
  Gym: "🏋️",
  Parking: "🅿️",
  Balcony: "🌇",
  "Pet-friendly": "🐾",
  Furnished: "🛋️",
  Garden: "🌿",
  "Private Beach": "🏖️",
};

export default function AmenityBadge({ label }) {
  return (
    <span className={styles.badge}>
      <span className={styles.icon}>{ICONS[label] || "✔"}</span>
      {label}
    </span>
  );
}
