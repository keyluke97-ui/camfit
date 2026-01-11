import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID || ''
);

export async function saveAnalysisResult(data: any) {
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        console.warn("Airtable credentials missing. Skipping save.");
        return null;
    }

    try {
        const records = await base(process.env.AIRTABLE_TABLE_NAME || 'AnalysisResults').create([
            {
                fields: {
                    "Camping Name": data.campingName,
                    "Total Score": data.totalScore,
                    "Vibe Score": data.metrics.vibe.score,
                    "Hygiene Score": data.metrics.hygiene.score,
                    "Contents Score": data.metrics.contents.score,
                    "Season Score": data.metrics.season.score,
                    "Report JSON": JSON.stringify(data),
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
