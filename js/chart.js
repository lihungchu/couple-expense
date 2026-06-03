export const chartColors = [
  "#0f766e",
  "#e11d48",
  "#2563eb",
  "#ca8a04",
  "#7c3aed",
  "#16a34a",
  "#db2777",
  "#475569"
];

export function drawPieChart(canvas, categories) {
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const size = 280;
  const radius = 104;
  const center = size / 2;

  canvas.width = size * ratio;
  canvas.height = size * ratio;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, size, size);

  if (!categories.length) {
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--line").trim() || "#eadfd3";
    context.lineWidth = 22;
    context.stroke();
    return;
  }

  let startAngle = -Math.PI / 2;

  categories.forEach((category, index) => {
    const sliceAngle = category.percent * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = chartColors[index % chartColors.length];
    context.fill();

    startAngle = endAngle;
  });

  context.beginPath();
  context.arc(center, center, 56, 0, Math.PI * 2);
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--panel").trim() || "#ffffff";
  context.fill();
}
