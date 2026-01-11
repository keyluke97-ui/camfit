import Airtable from 'airtable';
import { AnalysisReport } from './types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID || ''
);

export async function saveAnalysisResult(data: AnalysisReport) {
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        console.warn("Airtable credentials missing. Skipping save.");
        return null;
    }

    try {
        const records = await base(process.env.AIRTABLE_TABLE_NAME || 'AnalysisResults').create([
            {
                fields: {
                    "Camping Name": data.campingName || "Unknown",
                    "Total Score": data.total_score,
                    "Upsell Needed": data.upsell_needed,
                    "Marketing Comment": data.marketing_comment,
                    // Storing complex objects as JSON string
                    "Tags": JSON.stringify(data.tags),
                    "Ranking": JSON.stringify(data.ranking),
                    "Evaluation": JSON.stringify(data.evaluation),
                    "Full JSON": JSON.stringify(data),
                    "Created At": new Date().toISOString()
                }
            }
        ]);
        return records[0].getId();
    } catch (error) {
        console.error("Error saving to Airtable:", error);
        return null;
    }
}
