/** Etiquetas legibles para el informe interno de encuesta */
export const SURVEY_LABELS = {
  q1_channels: "Canales de entrada de clientes",
  q2_repetitive_task: "Tarea repetitiva a liberar",
  q3_quote_time: "Tiempo en enviar presupuesto",
  q4_calendar: "Gestión de agenda",
  q5_ai_maturity: "Madurez IA actual",
  q6_lost_hours: "Horas perdidas en tareas repetitivas",
  q7_tools: "Herramientas que usáis",
  q8_first_delegate: "Primera responsabilidad del asistente digital",
  q9_priority_area: "Área de mayor impacto (3 meses)",
  q10_investment: "Rango de inversión mensual viable",
};

export const Q3_OPTIONS = {
  under_1h: "Menos de 1 hora",
  same_day: "Unas pocas horas el mismo día",
  "24_48h": "Entre 24 y 48 horas",
  over_48h: "Más de 48 horas",
};

export const Q4_OPTIONS = {
  paper: "Métodos físicos (agenda, notas…)",
  excel: "Excel o Google Sheets",
  cloud_calendar: "Calendarios en la nube",
  sector_software: "Software del sector con calendario",
};

export const Q5_OPTIONS = {
  none: "Terreno virgen — sin IA",
  basic_chatgpt: "Uso básico de ChatGPT puntual",
  advanced: "Automatizaciones o software con IA",
};

export const Q6_OPTIONS = {
  under_2h: "Menos de 2 horas al día",
  "2_5h": "Entre 2 y 5 horas al día",
  over_5h: "Más de 5 horas al día",
};

export const Q9_OPTIONS = {
  capture: "Atención y captación",
  operations: "Operaciones y finanzas",
  data_sync: "Sincronización de datos",
};

export const Q10_OPTIONS = {
  under_300: "Menos de 300 €/mes",
  "300_800": "Entre 300 € y 800 €/mes",
  over_800: "Más de 800 €/mes",
};

export const Q1_CHANNELS = {
  whatsapp: "WhatsApp",
  email: "Correo electrónico",
  web_form: "Formulario web",
  phone: "Llamadas / presencial",
  social_dm: "Redes sociales (DM)",
};

export function formatSurveyAnswers(answers) {
  const lines = [];
  const channels = answers.q1_channels || [];
  if (channels.length) {
    lines.push(
      `${SURVEY_LABELS.q1_channels}: ${channels.map((c) => Q1_CHANNELS[c] || c).join(", ")}`
    );
  }
  if (answers.q2_repetitive_task) {
    lines.push(`${SURVEY_LABELS.q2_repetitive_task}: ${answers.q2_repetitive_task}`);
  }
  if (answers.q3_quote_time) {
    lines.push(`${SURVEY_LABELS.q3_quote_time}: ${Q3_OPTIONS[answers.q3_quote_time] || answers.q3_quote_time}`);
  }
  if (answers.q4_calendar) {
    lines.push(`${SURVEY_LABELS.q4_calendar}: ${Q4_OPTIONS[answers.q4_calendar] || answers.q4_calendar}`);
  }
  if (answers.q5_ai_maturity) {
    lines.push(`${SURVEY_LABELS.q5_ai_maturity}: ${Q5_OPTIONS[answers.q5_ai_maturity] || answers.q5_ai_maturity}`);
  }
  if (answers.q6_lost_hours) {
    lines.push(`${SURVEY_LABELS.q6_lost_hours}: ${Q6_OPTIONS[answers.q6_lost_hours] || answers.q6_lost_hours}`);
  }
  if (answers.q7_tools) {
    lines.push(`${SURVEY_LABELS.q7_tools}: ${answers.q7_tools}`);
  }
  if (answers.q8_first_delegate) {
    lines.push(`${SURVEY_LABELS.q8_first_delegate}: ${answers.q8_first_delegate}`);
  }
  if (answers.q9_priority_area) {
    lines.push(`${SURVEY_LABELS.q9_priority_area}: ${Q9_OPTIONS[answers.q9_priority_area] || answers.q9_priority_area}`);
  }
  if (answers.q10_investment) {
    lines.push(`${SURVEY_LABELS.q10_investment}: ${Q10_OPTIONS[answers.q10_investment] || answers.q10_investment}`);
  }
  return lines;
}

export function validSurvey(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  const channels = Array.isArray(body.q1_channels)
    ? body.q1_channels.map(String).slice(0, 8)
    : body.q1_channels
      ? [String(body.q1_channels)]
      : [];

  return {
    name,
    email,
    company: String(body.company || "").trim().slice(0, 120),
    q1_channels: channels,
    q2_repetitive_task: String(body.q2_repetitive_task || "").trim().slice(0, 500),
    q3_quote_time: String(body.q3_quote_time || "").trim().slice(0, 40),
    q4_calendar: String(body.q4_calendar || "").trim().slice(0, 40),
    q5_ai_maturity: String(body.q5_ai_maturity || "").trim().slice(0, 40),
    q6_lost_hours: String(body.q6_lost_hours || "").trim().slice(0, 40),
    q7_tools: String(body.q7_tools || "").trim().slice(0, 500),
    q8_first_delegate: String(body.q8_first_delegate || "").trim().slice(0, 500),
    q9_priority_area: String(body.q9_priority_area || "").trim().slice(0, 40),
    q10_investment: String(body.q10_investment || "").trim().slice(0, 40),
  };
}
