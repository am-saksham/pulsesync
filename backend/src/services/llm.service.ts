import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generatePreVisitSummary = async (symptoms: string) => {
  const prompt = `
    Analyse these symptoms and return: urgency level (LOW / MEDIUM / HIGH), chief complaint, and three suggested questions for the doctor.
    Symptoms: ${symptoms}
    
    Output strictly in JSON format:
    {
      "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",
      "chiefComplaint": "string",
      "suggestedQuestions": ["q1", "q2", "q3"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // In a production app, we would use more robust parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse LLM output');
  } catch (error) {
    console.error('LLM Pre-Visit Error:', error);
    // Graceful fallback
    return {
      urgencyLevel: 'MEDIUM',
      chiefComplaint: symptoms.substring(0, 50) + '...',
      suggestedQuestions: ['Can you elaborate on your symptoms?', 'How long has this been occurring?']
    };
  }
};

export const generatePostVisitSummary = async (notes: string) => {
  const prompt = `
    Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps.
    Clinical notes: ${notes}
    
    Output strictly in JSON format:
    {
      "patientSummary": "string",
      "medications": ["med1 schedule", "med2 schedule"],
      "followUp": "string"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse LLM output');
  } catch (error) {
    console.error('LLM Post-Visit Error:', error);
    // Graceful fallback
    return {
      patientSummary: "Please refer to your doctor's raw notes or contact the clinic for clarification.",
      medications: [],
      followUp: "As advised by the doctor."
    };
  }
};
