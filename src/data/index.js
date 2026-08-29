// Illinois seasonal produce reference — general agricultural info, not tied to any specific farm.
// Each item is a real date window (month/day) so the calendar can draw a bar that starts and
// stops mid-month, the way a multi-day event does on a real calendar.
export const seasonalWindows = [
  { name: 'Storage Onions',     start: { month: 1, day: 1 },  end: { month: 4, day: 5 } },
  { name: 'Root Vegetables',    start: { month: 1, day: 1 },  end: { month: 3, day: 20 } },
  { name: 'Maple Syrup',        start: { month: 2, day: 15 }, end: { month: 3, day: 25 } },
  { name: 'Ramps',              start: { month: 4, day: 1 },  end: { month: 4, day: 25 } },
  { name: 'Morel Mushrooms',    start: { month: 4, day: 10 }, end: { month: 5, day: 20 } },
  { name: 'Asparagus',          start: { month: 4, day: 20 }, end: { month: 6, day: 5 } },
  { name: 'Radishes',           start: { month: 5, day: 1 },  end: { month: 6, day: 15 } },
  { name: 'Strawberries',       start: { month: 6, day: 1 },  end: { month: 7, day: 10 } },
  { name: 'Snap Peas',          start: { month: 5, day: 20 }, end: { month: 7, day: 5 } },
  { name: 'Zucchini',           start: { month: 6, day: 20 }, end: { month: 9, day: 10 } },
  { name: 'Sweet Corn',         start: { month: 7, day: 10 }, end: { month: 9, day: 15 } },
  { name: 'Heirloom Tomatoes',  start: { month: 7, day: 15 }, end: { month: 9, day: 30 } },
  { name: 'Peaches',            start: { month: 7, day: 20 }, end: { month: 8, day: 25 } },
  { name: 'Peppers',            start: { month: 7, day: 25 }, end: { month: 10, day: 5 } },
  { name: 'Apples',             start: { month: 9, day: 1 },  end: { month: 11, day: 10 } },
  { name: 'Grapes',             start: { month: 9, day: 5 },  end: { month: 10, day: 10 } },
  { name: 'Winter Squash',      start: { month: 9, day: 15 }, end: { month: 12, day: 20 } },
  { name: 'Brussels Sprouts',   start: { month: 10, day: 1 }, end: { month: 12, day: 15 } },
  { name: 'Sweet Potatoes',     start: { month: 10, day: 1 }, end: { month: 12, day: 1 } },
  { name: 'Honey & Preserves',  start: { month: 11, day: 1 }, end: { month: 12, day: 31 } },
]
