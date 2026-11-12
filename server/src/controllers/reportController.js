const pool = require('../db/pool');

function getDateRanges(selectedDateStr) {
  // Parse YYYY-MM-DD
  const [yearStr, monthStr, dayStr] = selectedDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1 - 12
  const day = parseInt(dayStr, 10);

  // 1. Daily: selectedDate
  const dailyRange = {
    start: selectedDateStr,
    end: selectedDateStr,
    label: selectedDateStr
  };

  // 2. Month-to-date: 1st of month to selected date
  const mtdStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const mtdRange = {
    start: mtdStart,
    end: selectedDateStr,
    label: `${mtdStart} to ${selectedDateStr}`
  };

  // 3. Monthly: Whole previous month
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  // Last day of previous month
  const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevMonthEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;

  const monthlyRange = {
    start: prevMonthStart,
    end: prevMonthEnd,
    label: `${prevMonthStart} to ${prevMonthEnd}`
  };

  return { dailyRange, mtdRange, monthlyRange };
}

async function computeMetricsForRange(userId, startDate, endDate) {
  const query = `
    SELECT
      COUNT(*)::int as count,
      MAX(value)::int as highest,
      MIN(value)::int as lowest,
      ROUND(AVG(value), 1)::float as average
    FROM readings
    WHERE user_id = $1 AND date >= $2 AND date <= $3
  `;
  const metricsRes = await pool.query(query, [userId, startDate, endDate]);
  const row = metricsRes.rows[0];

  const readingsQuery = `
    SELECT id, TO_CHAR(date, 'YYYY-MM-DD') as date, slot, value, notes, created_at
    FROM readings
    WHERE user_id = $1 AND date >= $2 AND date <= $3
    ORDER BY date ASC, id ASC
  `;
  const readingsRes = await pool.query(readingsQuery, [userId, startDate, endDate]);
  const readings = readingsRes.rows;

  // Compute Time In Range stats (Kenpath Dashboard KPI)
  let lowCount = 0;
  let normalCount = 0;
  let highCount = 0;

  readings.forEach((r) => {
    if (r.value < 70) lowCount++;
    else if (r.value <= 140) normalCount++;
    else highCount++;
  });

  const total = row.count || 0;
  const timeInRange = {
    lowPercent: total > 0 ? Math.round((lowCount / total) * 100) : 0,
    inRangePercent: total > 0 ? Math.round((normalCount / total) * 100) : 0,
    highPercent: total > 0 ? Math.round((highCount / total) * 100) : 0,
  };

  return {
    count: total,
    highest: row.highest !== null ? row.highest : null,
    lowest: row.lowest !== null ? row.lowest : null,
    average: row.average !== null ? Number(row.average.toFixed(1)) : null,
    timeInRange,
    readings
  };
}

// GET /api/reports?date=YYYY-MM-DD
// Returns all 3 reports: daily, monthToDate, monthly
async function getReports(req, res) {
  try {
    const userId = req.user.id;
    let selectedDate = req.query.date;

    if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const today = new Date();
      selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    const { dailyRange, mtdRange, monthlyRange } = getDateRanges(selectedDate);

    const [dailyData, mtdData, monthlyData] = await Promise.all([
      computeMetricsForRange(userId, dailyRange.start, dailyRange.end),
      computeMetricsForRange(userId, mtdRange.start, mtdRange.end),
      computeMetricsForRange(userId, monthlyRange.start, monthlyRange.end)
    ]);

    return res.status(200).json({
      selectedDate,
      reports: {
        daily: {
          title: 'Daily Report',
          dateRange: dailyRange.label,
          start: dailyRange.start,
          end: dailyRange.end,
          metrics: {
            count: dailyData.count,
            highest: dailyData.highest,
            lowest: dailyData.lowest,
            average: dailyData.average,
            timeInRange: dailyData.timeInRange
          },
          readings: dailyData.readings
        },
        monthToDate: {
          title: 'Month-to-Date Report',
          dateRange: mtdRange.label,
          start: mtdRange.start,
          end: mtdRange.end,
          metrics: {
            count: mtdData.count,
            highest: mtdData.highest,
            lowest: mtdData.lowest,
            average: mtdData.average,
            timeInRange: mtdData.timeInRange
          },
          readings: mtdData.readings
        },
        monthly: {
          title: 'Monthly Report (Previous Month)',
          dateRange: monthlyRange.label,
          start: monthlyRange.start,
          end: monthlyRange.end,
          metrics: {
            count: monthlyData.count,
            highest: monthlyData.highest,
            lowest: monthlyData.lowest,
            average: monthlyData.average,
            timeInRange: monthlyData.timeInRange
          },
          readings: monthlyData.readings
        }
      }
    });
  } catch (err) {
    console.error('getReports error:', err);
    return res.status(500).json({ error: 'Server error generating reports.' });
  }
}

module.exports = {
  getReports,
  getDateRanges
};
