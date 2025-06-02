import { CHART_COLORS } from '../../core/constants.js';
import { getActivityByDay } from '../../services/statsService.js';

/**
 * Initialize activity chart
 * @param {HTMLElement} ctx - Canvas element for the chart
 */
export function initActivityChart(ctx) {
  if (!ctx) return null;
  
  // Get activity data for the last 7 days
  const activityData = getActivityByDay(7);
  
  // Chart colors
  const colors = {
    learned: {
      bg: CHART_COLORS.primary,
      border: 'rgba(67, 97, 238, 1)'
    },
    reviewed: {
      bg: CHART_COLORS.success,
      border: 'rgba(40, 167, 69, 1)'
    },
    mastered: {
      bg: CHART_COLORS.warning,
      border: 'rgba(255, 193, 7, 1)'
    }
  };
  
  // Create chart
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: activityData.map(d => d.day),
      datasets: [
        {
          label: 'Đã học',
          data: activityData.map(d => d.learned),
          backgroundColor: colors.learned.bg,
          borderColor: colors.learned.border,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          categoryPercentage: 0.8,
          barPercentage: 0.8
        },
        {
          label: 'Đã ôn tập',
          data: activityData.map(d => d.reviewed),
          backgroundColor: colors.reviewed.bg,
          borderColor: colors.reviewed.border,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          categoryPercentage: 0.8,
          barPercentage: 0.8
        },
        {
          label: 'Đã thành thạo',
          data: activityData.map(d => d.mastered),
          backgroundColor: colors.mastered.bg,
          borderColor: colors.mastered.border,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          categoryPercentage: 0.8,
          barPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 13,
            weight: '600'
          },
          bodyFont: {
            size: 13
          },
          footerFont: {
            size: 11,
            style: 'italic'
          },
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value} từ`;
            },
            footer: function(tooltipItems) {
              const data = activityData[tooltipItems[0].dataIndex];
              return `Ngày: ${data.date}`;
            }
          },
          displayColors: true,
          usePointStyle: true,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12,
              weight: 500
            },
            color: '#6c757d'
          }
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false,
            borderDash: [3, 3],
            drawTicks: false
          },
          ticks: {
            stepSize: 5,
            padding: 8,
            font: {
              size: 11,
              lineHeight: 1.2
            },
            color: '#6c757d',
            callback: function(value) {
              const maxValue = Math.max(
                ...activityData.map(d => Math.max(d.learned, d.reviewed, d.mastered))
              );
              return value % 5 === 0 && value <= Math.ceil(maxValue / 5) * 5 ? value : '';
            }
          }
        }
      }
    }
  });
}
