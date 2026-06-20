export const chartColors = [
  "#00e5ff",
  "#2563ff",
  "#8b5cf6",
  "#22f59d",
  "#ff2bd6",
  "#f8d748",
  "#00a3ff",
  "#64748b"
];

export function drawPieChart(canvas, categories) {
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const size = 280;
  const radius = 112;
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
    context.lineWidth = 2;
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
}
