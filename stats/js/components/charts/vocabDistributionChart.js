import { CHART_COLORS } from '../../core/constants.js';
import { calculateVocabStats } from '../../services/statsService.js';

/**
 * Initialize vocabulary distribution chart
 * @param {HTMLElement} ctx - Canvas element for the chart
 */
export function initVocabDistributionChart(ctx) {
  if (!ctx) return null;
  
  const stats = calculateVocabStats();
  
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Đã học', 'Thành thạo', 'Chưa học'],
      datasets: [{
        data: [stats.learned, stats.mastered, stats.notLearned],
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.success,
          CHART_COLORS.warning
        ],
        borderWidth: 0,
        cutout: '70%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} từ (${percentage}%)`;
            }
          }
        }
      },
      cutout: '70%',
      radius: '90%'
    }
  });
}

/**
 * Update vocabulary distribution chart with new data
 * @param {Chart} chart - Chart instance to update
 */
export function updateVocabDistributionChart(chart) {
  if (!chart) return;
  
  const stats = calculateVocabStats();
  
  chart.data.datasets[0].data = [
    stats.learned,
    stats.mastered,
    stats.notLearned
  ];
  
  chart.update();
}
