/* ══════════════════════════════════════════════════
   MCU — MECHATRONICS COURSE UNION
   events-data.js — Edit this file to add/update events
   ══════════════════════════════════════════════════

   HOW TO ADD AN EVENT:
   Copy one of the objects below and fill in your details.

   FIELDS:
   - id:        unique number (just increment)
   - title:     event name
   - date:      "YYYY-MM-DD"
   - startTime: "HH:MM" 24hr format  (e.g. "14:00" = 2pm)
   - endTime:   "HH:MM" 24hr format  (optional, can be "")
   - location:  room/building or "Online"
   - type:      "social" | "workshop" | "academic" | "study" | "general"
   - desc:      short description shown in the popup

   ══════════════════════════════════════════════════ */

const MCU_EVENTS = [
  {
    id: 1,
    title: "Study Hall",
    date: "2025-06-10",
    startTime: "17:00",
    endTime: "20:00",
    location: "ENG 103, TMU",
    type: "study",
    desc: "Drop-in study session open to all mechatronics students. Bring your assignments, ask questions, help each other out."
  },
  {
    id: 2,
    title: "SolidWorks Workshop",
    date: "2025-06-17",
    startTime: "14:00",
    endTime: "16:00",
    location: "ENG 202, TMU",
    type: "workshop",
    desc: "Hands-on intro to SolidWorks for 3D modelling. No experience needed — just bring your laptop."
  },
  {
    id: 3,
    title: "Marvel Rivals Night",
    date: "2025-06-21",
    startTime: "18:00",
    endTime: "22:00",
    location: "KHW 117, TMU",
    type: "social",
    desc: "MCU gaming night. Come chill, compete, and meet your classmates outside of lecture."
  },
  {
    id: 4,
    title: "Year 1 Exam Review",
    date: "2025-06-24",
    startTime: "16:00",
    endTime: "19:00",
    location: "ENG 103, TMU",
    type: "academic",
    desc: "Peer-led review session covering MTH141, PCS211, and CEN100. TAs and upper years welcome."
  },
  {
    id: 5,
    title: "Study Hall",
    date: "2025-06-27",
    startTime: "17:00",
    endTime: "20:00",
    location: "ENG 103, TMU",
    type: "study",
    desc: "Weekly drop-in study session. All years welcome."
  },
  {
    id: 6,
    title: "General Meeting",
    date: "2025-07-08",
    startTime: "12:00",
    endTime: "13:00",
    location: "ENG 202, TMU",
    type: "general",
    desc: "Monthly MCU general meeting. Updates on upcoming events, initiatives, and open floor for feedback."
  }
];
