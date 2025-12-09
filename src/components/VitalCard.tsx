interface VitalCardProps {
  label: string;
  value: number;
  unit: string;
  threshold: number;
  lowIsBad?: boolean;
}

export default function VitalCard({
  label,
  value,
  unit,
  threshold,
  lowIsBad = false,
}: VitalCardProps) {
  const isAbnormal = lowIsBad ? value < threshold : value > threshold;
  const cardColor = isAbnormal
    ? "bg-red-100 border-red-300"
    : "bg-white border-gray-200";
  const textColor = isAbnormal ? "text-red-700" : "text-green-700";

  return (
    <div className={`border p-4 rounded-lg shadow-sm ${cardColor}`}>
      <h3 className="text-lg font-semibold text-gray-700">{label}</h3>
      <p className={`text-4xl font-bold ${textColor}`}>
        {value} {unit}
      </p>
      {isAbnormal && <p className="text-red-500 mt-2">⚠ Out of Range</p>}
    </div>
  );
}
